import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { db } from "@kineDao.com/db";
import {
	shippingAddresses,
	carts,
	cartItems,
	products,
	productImages,
	vendors,
	orders,
	orderItems,
	type OrderItemProductSnapshot,
	type ShippingAddressSnapshot,
} from "@kineDao.com/db/schema";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
	placeOrderSchema,
	SHIPPING_ZONES,
	type PlaceOrderResponseDTO,
	type OrderDTO,
	type OrderItemDTO,
	type OrderGroupDTO,
	type ShippingCostDTO,
	type ShippingZone,
} from "@kineDao.com/api-types/checkout";
import type { AppEnv } from "../index";
import { sendOrderConfirmationEmail } from "../lib/order-email";

// Helper function to calculate shipping cost
function calculateShippingCost(district: string): ShippingCostDTO {
	for (const [zone, config] of Object.entries(SHIPPING_ZONES) as Array<[ShippingZone, typeof SHIPPING_ZONES[keyof typeof SHIPPING_ZONES]]>) {
		if ((config.districts as readonly string[]).includes(district)) {
			return {
				zone: zone,
				costPaisa: config.costPaisa,
				estimatedDays: config.estimatedDays,
				labelEn: config.labelEn,
				labelBn: config.labelBn,
			};
		}
	}
	return {
		zone: "other",
		costPaisa: SHIPPING_ZONES.other.costPaisa,
		estimatedDays: SHIPPING_ZONES.other.estimatedDays,
		labelEn: SHIPPING_ZONES.other.labelEn,
		labelBn: SHIPPING_ZONES.other.labelBn,
	};
}

export const ordersRouter = new Hono<AppEnv>()
	// Place order
	.post(
		"/place",
		describeRoute({
			tags: ["Orders"],
			summary: "Place order",
			description:
				"Place order with items from cart. Creates separate orders per vendor. Uses transaction with stock locking to prevent race conditions.",
			responses: {
				201: {
					description: "Order(s) created successfully",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
				400: {
					description: "Bad request (cart empty, stock insufficient, etc.)",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
				401: {
					description: "Unauthorized",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
				404: {
					description: "Address not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("json", placeOrderSchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { shippingAddressId, customerNotes } = c.req.valid("json");

			// 1. Verify shipping address belongs to user
			const [address] = await db
				.select()
				.from(shippingAddresses)
				.where(
					and(
						eq(shippingAddresses.id, shippingAddressId),
						eq(shippingAddresses.userId, userId),
					),
				)
				.limit(1);

			if (!address) {
				return c.json({ error: "Shipping address not found" }, 404);
			}

			// 2. Get user's cart with items
			const [cart] = await db
				.select()
				.from(carts)
				.where(eq(carts.userId, userId))
				.limit(1);

			if (!cart) {
				return c.json({ error: "Cart is empty" }, 400);
			}

			const cartItemRows = await db
				.select({
					itemId: cartItems.id,
					productId: cartItems.productId,
					quantity: cartItems.quantity,
					unitPrice: cartItems.unitPrice,
				})
				.from(cartItems)
				.where(eq(cartItems.cartId, cart.id));

			if (cartItemRows.length === 0) {
				return c.json({ error: "Cart is empty" }, 400);
			}

			// 3. BEGIN TRANSACTION
			const result = await db.transaction(async (tx) => {
				const groupId = crypto.randomUUID();

				const productIds = cartItemRows.map((item) => item.productId);

				// 3a. Lock product SKUs rows with SELECT FOR UPDATE
				// This prevents race conditions on stock
				const skuLockRows = await tx.execute<{
					id: string;
					product_id: string;
					price_amount: number;
					stock_qty: number;
					is_available: boolean;
				}>(
					sql.raw(`SELECT ps.id, ps.product_id, ps.price_amount, ps.stock_qty, ps.is_available
            FROM product_skus ps
            WHERE ps.product_id = ANY(ARRAY[${productIds.map((id) => `'${id}'`).join(", ")}]::uuid[])
            ORDER BY ps.product_id, ps.price_amount ASC
            FOR UPDATE`),
				);

				// Build stock map: productId -> { skuId, stockQty, priceAmount }
				const stockMap = new Map<
					string,
					{ skuId: string; stockQty: number; priceAmount: number }
				>();
				for (const row of skuLockRows.rows) {
					const pid = row.product_id;
					if (!stockMap.has(pid) && row.is_available && row.stock_qty > 0) {
						stockMap.set(pid, {
							skuId: row.id,
							stockQty: row.stock_qty,
							priceAmount: row.price_amount,
						});
					}
				}

				// 3b. Validate stock for each cart item
				for (const item of cartItemRows) {
					const stock = stockMap.get(item.productId);
					if (!stock || stock.stockQty < item.quantity) {
						// Get product name for error message
						const [prod] = await tx
							.select({ title: products.title })
							.from(products)
							.where(eq(products.id, item.productId))
							.limit(1);
						throw new Error(
							`Insufficient stock for product: ${prod?.title ?? item.productId}`,
						);
					}
				}

				// 3c. Fetch product details for snapshots
				const productDetails = await tx
					.select({
						id: products.id,
						title: products.title,
						titleBn: products.titleBn,
						slug: products.slug,
						vendorId: products.vendorId,
						ageRange: products.ageRange,
						isBpaFree: products.isBpaFree,
						isOrganic: products.isOrganic,
						isHypoallergenic: products.isHypoallergenic,
					})
					.from(products)
					.where(inArray(products.id, productIds));

				const productDetailsMap = new Map(
					productDetails.map((p) => [p.id, p]),
				);

				// 3d. Fetch first image per product
				const imageRows = await tx
					.select({
						productId: productImages.productId,
						url: productImages.url,
					})
					.from(productImages)
					.where(inArray(productImages.productId, productIds))
					.orderBy(asc(productImages.sortOrder));

				const imageMap = new Map<string, string>();
				for (const img of imageRows) {
					if (!imageMap.has(img.productId)) {
						imageMap.set(img.productId, img.url);
					}
				}

				// 3e. Group cart items by vendorId
				const vendorGroups = new Map<
					string,
					Array<{
						itemId: string;
						productId: string;
						quantity: number;
						unitPrice: number;
					}>
				>();

				for (const item of cartItemRows) {
					const product = productDetailsMap.get(item.productId);
					if (!product) continue;
					const vendorId = product.vendorId;
					if (!vendorGroups.has(vendorId)) {
						vendorGroups.set(vendorId, []);
					}
					vendorGroups.get(vendorId)!.push(item);
				}

				// 3f. Get vendor names
				const vendorIds = Array.from(vendorGroups.keys());
				const vendorRows = await tx
					.select({ id: vendors.id, name: vendors.name })
					.from(vendors)
					.where(inArray(vendors.id, vendorIds));

				const vendorMap = new Map(vendorRows.map((v) => [v.id, v.name]));

				// 3g. Generate order numbers atomically
				const orderCount = vendorGroups.size;
				const seqResult = await tx.execute<{ last_number: number }>(
					sql`UPDATE order_number_sequence
            SET last_number = last_number + ${orderCount}
            WHERE id = 1
            RETURNING last_number`,
				);

				if (!seqResult.rows[0]) {
					throw new Error("Failed to generate order number");
				}
				const lastNumber = seqResult.rows[0].last_number;
				const year = new Date().getFullYear();

				// 3h. Calculate shipping cost
				const shippingCostInfo = calculateShippingCost(address.district);

				// 3i. Create order + order_items for each vendor
				const createdOrders: OrderDTO[] = [];
				let orderIndex = 0;

				for (const [vendorId, items] of vendorGroups) {
					const orderNum = lastNumber - orderCount + 1 + orderIndex;
					const orderNumber = `KD-${year}-${String(orderNum).padStart(5, "0")}`;

					const subtotal = items.reduce(
						(sum, item) => sum + item.unitPrice * item.quantity,
						0,
					);
					const total = subtotal + shippingCostInfo.costPaisa;

					// Freeze address snapshot
					const addressSnapshot: ShippingAddressSnapshot = {
						fullName: address.fullName,
						phone: address.phone,
						alternatePhone: address.alternatePhone,
						addressLine1: address.addressLine1,
						addressLine2: address.addressLine2,
						city: address.city,
						district: address.district,
						postalCode: address.postalCode,
						deliveryInstructions: address.deliveryInstructions,
					};

					// Insert order
					const [order] = await tx
						.insert(orders)
						.values({
							orderNumber,
							groupId,
							userId,
							vendorId,
							status: "pending",
							paymentMethod: "cod",
							subtotal,
							shippingCost: shippingCostInfo.costPaisa,
							codFee: 0,
							total,
							shippingAddress: addressSnapshot,
							customerNotes: customerNotes || null,
						})
						.returning();

					if (!order) throw new Error("Failed to create order");

					// Insert order items
					const orderItemDTOs: OrderItemDTO[] = [];

					for (const item of items) {
						const product = productDetailsMap.get(item.productId)!;
						const image = imageMap.get(item.productId) ?? null;

						const productSnapshot: OrderItemProductSnapshot = {
							title: product.title,
							titleBn: product.titleBn,
							slug: product.slug,
							image,
							ageRange: product.ageRange,
							isBpaFree: product.isBpaFree,
							isOrganic: product.isOrganic,
							isHypoallergenic: product.isHypoallergenic,
						};

						const [orderItem] = await tx
							.insert(orderItems)
							.values({
								orderId: order.id,
								productId: item.productId,
								quantity: item.quantity,
								unitPrice: item.unitPrice,
								lineTotal: item.unitPrice * item.quantity,
								productSnapshot,
							})
							.returning();

						if (!orderItem) throw new Error("Failed to create order item");

						orderItemDTOs.push({
							id: orderItem.id,
							productId: orderItem.productId,
							quantity: orderItem.quantity,
							unitPrice: orderItem.unitPrice,
							lineTotal: orderItem.lineTotal,
							productSnapshot,
						});

						// 3j. Decrement stock
						const stock = stockMap.get(item.productId)!;
						await tx.execute(
							sql`UPDATE product_skus
                SET stock_qty = stock_qty - ${item.quantity}
                WHERE id = ${stock.skuId} AND stock_qty >= ${item.quantity}`,
						);
					}

					// Build OrderDTO
					createdOrders.push({
						id: order.id,
						orderNumber: order.orderNumber,
						groupId: order.groupId,
						vendorId: order.vendorId,
						vendorName: vendorMap.get(vendorId) ?? "Unknown",
						status: order.status,
						paymentMethod: order.paymentMethod,
						subtotal: order.subtotal,
						shippingCost: order.shippingCost,
						codFee: order.codFee,
						total: order.total,
						shippingAddress: addressSnapshot,
						customerNotes: order.customerNotes,
						items: orderItemDTOs,
						createdAt: order.createdAt.toISOString(),
					});

					orderIndex++;
				}

				// 3k. Clear cart
				await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));

				return { groupId, orders: createdOrders };
			});

			// 4. Send order confirmation email (fire-and-forget, outside transaction)
			const grandTotal = result.orders.reduce((sum, o) => sum + o.total, 0);

			// Fire and forget - don't await, don't fail order if email fails
			sendOrderConfirmationEmail(
				c.var.user.email,
				c.var.user.name || "Customer",
				result.groupId,
				result.orders,
				grandTotal,
			).catch((error) => {
				console.error("[ORDER] Failed to send confirmation email:", error);
			});

			const response: PlaceOrderResponseDTO = {
				success: true,
				groupId: result.groupId,
				orders: result.orders,
				grandTotal,
			};

			return c.json(response, 201);
		},
	)

	// Get order group by groupId
	.get(
		"/group/:groupId",
		describeRoute({
			tags: ["Orders"],
			summary: "Get order group",
			description:
				"Get all orders in a group (from same checkout). For order confirmation page.",
			responses: {
				200: {
					description: "Order group retrieved",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
				401: {
					description: "Unauthorized",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
				404: {
					description: "Order group not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("param", z.object({ groupId: z.string().uuid() })),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { groupId } = c.req.valid("param");

			// Get all orders in group
			const orderRows = await db
				.select()
				.from(orders)
				.where(
					and(eq(orders.groupId, groupId), eq(orders.userId, userId)),
				)
				.orderBy(asc(orders.createdAt));

			if (orderRows.length === 0) {
				return c.json({ error: "Order group not found" }, 404);
			}

			// Get vendor names
			const vendorIds = orderRows.map((o) => o.vendorId);
			const vendorRows = await db
				.select({ id: vendors.id, name: vendors.name })
				.from(vendors)
				.where(inArray(vendors.id, vendorIds));
			const vendorMap = new Map(vendorRows.map((v) => [v.id, v.name]));

			// Get order items for all orders
			const orderIds = orderRows.map((o) => o.id);
			const itemRows = await db
				.select()
				.from(orderItems)
				.where(inArray(orderItems.orderId, orderIds));

			// Group items by orderId
			const itemsByOrder = new Map<string, typeof itemRows>();
			for (const item of itemRows) {
				if (!itemsByOrder.has(item.orderId)) {
					itemsByOrder.set(item.orderId, []);
				}
				itemsByOrder.get(item.orderId)!.push(item);
			}

			// Build OrderDTOs
			const orderDTOs: OrderDTO[] = orderRows.map((order) => {
				const items = itemsByOrder.get(order.id) ?? [];
				const itemDTOs: OrderItemDTO[] = items.map((item) => ({
					id: item.id,
					productId: item.productId,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					lineTotal: item.lineTotal,
					productSnapshot: item.productSnapshot as OrderItemProductSnapshot,
				}));

				return {
					id: order.id,
					orderNumber: order.orderNumber,
					groupId: order.groupId,
					vendorId: order.vendorId,
					vendorName: vendorMap.get(order.vendorId) ?? "Unknown",
					status: order.status,
					paymentMethod: order.paymentMethod,
					subtotal: order.subtotal,
					shippingCost: order.shippingCost,
					codFee: order.codFee,
					total: order.total,
					shippingAddress: order.shippingAddress as ShippingAddressSnapshot,
					customerNotes: order.customerNotes,
					items: itemDTOs,
					createdAt: order.createdAt.toISOString(),
				};
			});

			const grandTotal = orderDTOs.reduce((sum, o) => sum + o.total, 0);

			const response: OrderGroupDTO = {
				groupId,
				orders: orderDTOs,
				grandTotal,
				createdAt: orderRows[0]?.createdAt.toISOString() || new Date().toISOString(),
			};

			return c.json(response, 200);
		},
	)

	// List user's orders (for future order history page)
	.get(
		"/",
		describeRoute({
			tags: ["Orders"],
			summary: "List user's orders",
			description: "Get paginated list of user's orders",
			responses: {
				200: {
					description: "Orders retrieved",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
				401: {
					description: "Unauthorized",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// Simple list for now (can add pagination later)
			const orderRows = await db
				.select()
				.from(orders)
				.where(eq(orders.userId, userId))
				.orderBy(sql`${orders.createdAt} DESC`)
				.limit(50);

			return c.json({ orders: orderRows }, 200);
		},
	);

export type OrdersRouterType = typeof ordersRouter;
