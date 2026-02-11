import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { db, getS3Url } from "@kineDao.com/db";
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
	orderListQuerySchema,
	type OrderListResponseDTO,
	type OrderListItemDTO,
	orderIdParamSchema,
	type OrderDetailDTO,
	cancelOrderSchema,
} from "@kineDao.com/api-types/checkout";
import type { AppEnv } from "../index";
import { sendOrderConfirmationEmail } from "../lib/order-email";
import { notify, notifyVendor } from "../lib/notification-service";

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
					skuId: cartItems.skuId,
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
					sku: string | null;
					price_amount: number;
					stock_qty: number;
					is_available: boolean;
					option_values: Record<string, string> | null;
				}>(
					sql.raw(`SELECT ps.id, ps.product_id, ps.sku, ps.price_amount, ps.stock_qty, ps.is_available, ps.option_values
            FROM product_skus ps
            WHERE ps.product_id = ANY(ARRAY[${productIds.map((id) => `'${id}'`).join(", ")}]::uuid[])
            ORDER BY ps.product_id, ps.price_amount ASC
            FOR UPDATE`),
				);

				// Build SKU map by ID for direct lookup + fallback stock map
				const allSkuMap = new Map<
					string,
					{ skuId: string; skuCode: string | null; stockQty: number; priceAmount: number; optionValues: Record<string, string> | null }
				>();
				const stockMap = new Map<
					string,
					{ skuId: string; skuCode: string | null; stockQty: number; priceAmount: number; optionValues: Record<string, string> | null }
				>();
				for (const row of skuLockRows.rows) {
					allSkuMap.set(row.id, {
						skuId: row.id,
						skuCode: row.sku,
						stockQty: row.stock_qty,
						priceAmount: row.price_amount,
						optionValues: row.option_values,
					});
					const pid = row.product_id;
					if (!stockMap.has(pid) && row.is_available && row.stock_qty > 0) {
						stockMap.set(pid, {
							skuId: row.id,
							skuCode: row.sku,
							stockQty: row.stock_qty,
							priceAmount: row.price_amount,
							optionValues: row.option_values,
						});
					}
				}

				// 3b. Resolve which SKU each cart item uses (prefer cart's skuId, fallback to cheapest available)
				const resolvedSkuMap = new Map<string, typeof stockMap extends Map<string, infer V> ? V : never>();
				for (const item of cartItemRows) {
					const specific = item.skuId ? allSkuMap.get(item.skuId) : null;
					const fallback = stockMap.get(item.productId);
					const resolved = (specific && specific.stockQty > 0) ? specific : fallback;
					if (!resolved || resolved.stockQty < item.quantity) {
						const [prod] = await tx
							.select({ title: products.title })
							.from(products)
							.where(eq(products.id, item.productId))
							.limit(1);
						throw new Error(
							`Insufficient stock for product: ${prod?.title ?? item.productId}`,
						);
					}
					resolvedSkuMap.set(item.itemId, resolved);
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
						s3Key: productImages.s3Key,
					})
					.from(productImages)
					.where(inArray(productImages.productId, productIds))
					.orderBy(asc(productImages.sortOrder));

				const imageMap = new Map<string, string>();
				for (const img of imageRows) {
					if (!imageMap.has(img.productId)) {
						imageMap.set(img.productId, getS3Url(img.s3Key));
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
						const resolvedSku = resolvedSkuMap.get(item.itemId)!;

						const productSnapshot: OrderItemProductSnapshot = {
							title: product.title,
							titleBn: product.titleBn,
							slug: product.slug,
							image,
							ageRange: product.ageRange,
							isBpaFree: product.isBpaFree,
							isOrganic: product.isOrganic,
							isHypoallergenic: product.isHypoallergenic,
							selectedOptions: resolvedSku.optionValues ?? null,
							skuCode: resolvedSku.skuCode ?? null,
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

						// 3j. Decrement stock from the resolved SKU
						await tx.execute(
							sql`UPDATE product_skus
                SET stock_qty = stock_qty - ${item.quantity}
                WHERE id = ${resolvedSku.skuId} AND stock_qty >= ${item.quantity}`,
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

			// 5. Send notifications to customer and vendors (fire-and-forget)
			// Customer notification (order_placed email already sent above)
			notify({
				userId,
				type: "order_placed",
				title: "Order Placed Successfully",
				titleBn: "অর্ডার সফলভাবে সম্পন্ন হয়েছে",
				body: `Your order ${result.orders.map(o => o.orderNumber).join(", ")} has been placed`,
				bodyBn: `আপনার অর্ডার ${result.orders.map(o => o.orderNumber).join(", ")} সম্পন্ন হয়েছে`,
				data: { groupId: result.groupId, orderNumbers: result.orders.map(o => o.orderNumber) },
				channel: "customer",
				// Email already sent by sendOrderConfirmationEmail above
			}).catch((error) => {
				console.error("[ORDER] Failed to send customer notification:", error);
			});

			// Vendor notifications - one per order/vendor
			for (const order of result.orders) {
				notifyVendor(order.vendorId, {
					type: "new_order",
					title: `New COD Order ${order.orderNumber}`,
					titleBn: `নতুন COD অর্ডার ${order.orderNumber}`,
					body: `You have received a new order worth ৳${(order.total / 100).toFixed(2)}`,
					bodyBn: `আপনি ${(order.total / 100).toFixed(2)} টাকার একটি নতুন অর্ডার পেয়েছেন`,
					data: {
						orderId: order.id,
						orderNumber: order.orderNumber,
						total: order.total,
						itemCount: order.items.length,
					},
					emailData: {
						userEmail: c.var.user.email,
						userName: order.vendorName,
						orderNumber: order.orderNumber,
						total: order.total,
						itemCount: order.items.length,
					},
				}).catch((error) => {
					console.error(`[ORDER] Failed to send vendor notification for ${order.vendorId}:`, error);
				});
			}

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

	// List user's orders with filtering and pagination
	.get(
		"/",
		describeRoute({
			tags: ["Orders"],
			summary: "List user's orders",
			description: "Get paginated, filtered list of user's orders for order history page",
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
		zValidator("query", orderListQuerySchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { status, dateRange, page, limit } = c.req.valid("query");

			// Build WHERE conditions
			const conditions = [eq(orders.userId, userId)];

			// Filter by status (skip if "all")
			if (status !== "all") {
				conditions.push(eq(orders.status, status));
			}

			// Filter by date range
			if (dateRange === "30d") {
				const thirtyDaysAgo = new Date();
				thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
				conditions.push(sql`${orders.createdAt} >= ${thirtyDaysAgo.toISOString()}`);
			} else if (dateRange === "6mo") {
				const sixMonthsAgo = new Date();
				sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
				conditions.push(sql`${orders.createdAt} >= ${sixMonthsAgo.toISOString()}`);
			}

			// Count total orders
			const countResult = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(orders)
				.where(and(...conditions));

			const total = countResult[0]?.count || 0;
			const totalPages = Math.ceil(total / limit);
			const offset = (page - 1) * limit;

			// Fetch paginated orders
			const orderRows = await db
				.select()
				.from(orders)
				.where(and(...conditions))
				.orderBy(sql`${orders.createdAt} DESC`)
				.limit(limit)
				.offset(offset);

			if (orderRows.length === 0) {
				const response: OrderListResponseDTO = {
					orders: [],
					total: 0,
					page,
					totalPages: 0,
				};
				return c.json(response, 200);
			}

			// Get vendor names
			const vendorIds = orderRows.map((o) => o.vendorId);
			const vendorRows = await db
				.select({ id: vendors.id, name: vendors.name })
				.from(vendors)
				.where(inArray(vendors.id, vendorIds));
			const vendorMap = new Map(vendorRows.map((v) => [v.id, v.name]));

			// Get order items for preview (first 2 per order)
			const orderIds = orderRows.map((o) => o.id);
			const allItems = await db
				.select()
				.from(orderItems)
				.where(inArray(orderItems.orderId, orderIds));

			// Group items by orderId
			const itemsByOrder = new Map<string, typeof allItems>();
			for (const item of allItems) {
				if (!itemsByOrder.has(item.orderId)) {
					itemsByOrder.set(item.orderId, []);
				}
				itemsByOrder.get(item.orderId)!.push(item);
			}

			// Build OrderListItemDTOs
			const orderListItems: OrderListItemDTO[] = orderRows.map((order) => {
				const items = itemsByOrder.get(order.id) || [];
				const itemCount = items.length;
				const itemDTOs = items.map((item) => {
					const snapshot = item.productSnapshot as OrderItemProductSnapshot;
					return {
						id: item.id,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						lineTotal: item.lineTotal,
						productSnapshot: {
							title: snapshot.title,
							titleBn: snapshot.titleBn,
							image: snapshot.image,
							ageRange: snapshot.ageRange,
							selectedOptions: snapshot.selectedOptions ?? null,
						},
					};
				});

				return {
					id: order.id,
					orderNumber: order.orderNumber,
					groupId: order.groupId,
					vendorName: vendorMap.get(order.vendorId) ?? "Unknown",
					status: order.status,
					total: order.total,
					itemCount,
					items: itemDTOs,
					createdAt: order.createdAt.toISOString(),
				};
			});

			const response: OrderListResponseDTO = {
				orders: orderListItems,
				total,
				page,
				totalPages,
			};

			return c.json(response, 200);
		},
	)

	// Get single order detail
	.get(
		"/:orderId",
		describeRoute({
			tags: ["Orders"],
			summary: "Get order detail",
			description: "Get full details of a single order by ID",
			responses: {
				200: {
					description: "Order retrieved",
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
				403: {
					description: "Forbidden - order belongs to different user",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
				404: {
					description: "Order not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("param", orderIdParamSchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { orderId } = c.req.valid("param");

			// Fetch order
			const [order] = await db
				.select()
				.from(orders)
				.where(eq(orders.id, orderId))
				.limit(1);

			if (!order) {
				return c.json({ error: "Order not found" }, 404);
			}

			// Check if order belongs to current user
			if (order.userId !== userId) {
				return c.json({ error: "Forbidden" }, 403);
			}

			// Fetch vendor name
			const [vendor] = await db
				.select({ name: vendors.name })
				.from(vendors)
				.where(eq(vendors.id, order.vendorId))
				.limit(1);

			const vendorName = vendor?.name ?? "Unknown";

			// Fetch all order items
			const items = await db
				.select()
				.from(orderItems)
				.where(eq(orderItems.orderId, order.id));

			const itemDTOs: OrderItemDTO[] = items.map((item) => ({
				id: item.id,
				productId: item.productId,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				lineTotal: item.lineTotal,
				productSnapshot: item.productSnapshot as OrderItemProductSnapshot,
			}));

			// Calculate estimated delivery from shipping address district
			const shippingCostInfo = calculateShippingCost(
				(order.shippingAddress as ShippingAddressSnapshot).district,
			);

			// Build OrderDetailDTO
			const orderDetail: OrderDetailDTO = {
				id: order.id,
				orderNumber: order.orderNumber,
				groupId: order.groupId,
				vendorId: order.vendorId,
				vendorName,
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
				confirmedAt: order.confirmedAt?.toISOString() ?? null,
				shippedAt: order.shippedAt?.toISOString() ?? null,
				deliveredAt: order.deliveredAt?.toISOString() ?? null,
				cancelledAt: order.cancelledAt?.toISOString() ?? null,
				codVerifiedAt: order.codVerifiedAt?.toISOString() ?? null,
				estimatedDelivery: `${shippingCostInfo.estimatedDays} days`,
			};

			return c.json(orderDetail, 200);
		},
	)

	// Cancel order
	.post(
		"/:orderId/cancel",
		describeRoute({
			tags: ["Orders"],
			summary: "Cancel order",
			description:
				"Cancel a pending order and restore stock. Only pending orders can be cancelled.",
			responses: {
				200: {
					description: "Order cancelled successfully",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
				400: {
					description: "Bad request - only pending orders can be cancelled",
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
				403: {
					description: "Forbidden",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
				404: {
					description: "Order not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("param", orderIdParamSchema),
		zValidator("json", cancelOrderSchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { orderId } = c.req.valid("param");
			const { reason } = c.req.valid("json");

			// Fetch order
			const [order] = await db
				.select()
				.from(orders)
				.where(eq(orders.id, orderId))
				.limit(1);

			if (!order) {
				return c.json({ error: "Order not found" }, 404);
			}

			// Check if order belongs to current user
			if (order.userId !== userId) {
				return c.json({ error: "Forbidden" }, 403);
			}

			// Check if order is pending
			if (order.status !== "pending") {
				return c.json(
					{ error: "Only pending orders can be cancelled" },
					400,
				);
			}

			// Cancel order and restore stock in transaction
			await db.transaction(async (tx) => {
				// Update order status
				await tx
					.update(orders)
					.set({
						status: "cancelled",
						cancelledAt: new Date(),
						// Optionally store cancellation reason in customer notes if it was empty
						customerNotes: reason
							? order.customerNotes
								? `${order.customerNotes}\n\nCancellation reason: ${reason}`
								: `Cancellation reason: ${reason}`
							: order.customerNotes,
					})
					.where(eq(orders.id, orderId));

				// Get order items to restore stock
				const items = await tx
					.select()
					.from(orderItems)
					.where(eq(orderItems.orderId, orderId));

				// For each item, restore stock
				// We need to find the SKU that was used - we'll use the same logic as order placement
				// (select cheapest available SKU for the product)
				for (const item of items) {
					// Lock and update SKU stock
					await tx.execute(
						sql`UPDATE product_skus
              SET stock_qty = stock_qty + ${item.quantity}
              WHERE product_id = ${item.productId}
              AND id = (
                SELECT id FROM product_skus
                WHERE product_id = ${item.productId}
                AND is_available = true
                ORDER BY price_amount ASC
                LIMIT 1
                FOR UPDATE
              )`,
					);
				}
			});

			// Fetch updated order and return as OrderDetailDTO
			const [updatedOrder] = await db
				.select()
				.from(orders)
				.where(eq(orders.id, orderId))
				.limit(1);

			const [vendor] = await db
				.select({ name: vendors.name })
				.from(vendors)
				.where(eq(vendors.id, updatedOrder!.vendorId))
				.limit(1);

			const items = await db
				.select()
				.from(orderItems)
				.where(eq(orderItems.orderId, orderId));

			const itemDTOs: OrderItemDTO[] = items.map((item) => ({
				id: item.id,
				productId: item.productId,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				lineTotal: item.lineTotal,
				productSnapshot: item.productSnapshot as OrderItemProductSnapshot,
			}));

			const shippingCostInfo = calculateShippingCost(
				(updatedOrder!.shippingAddress as ShippingAddressSnapshot).district,
			);

			const orderDetail: OrderDetailDTO = {
				id: updatedOrder!.id,
				orderNumber: updatedOrder!.orderNumber,
				groupId: updatedOrder!.groupId,
				vendorId: updatedOrder!.vendorId,
				vendorName: vendor?.name ?? "Unknown",
				status: updatedOrder!.status,
				paymentMethod: updatedOrder!.paymentMethod,
				subtotal: updatedOrder!.subtotal,
				shippingCost: updatedOrder!.shippingCost,
				codFee: updatedOrder!.codFee,
				total: updatedOrder!.total,
				shippingAddress:
					updatedOrder!.shippingAddress as ShippingAddressSnapshot,
				customerNotes: updatedOrder!.customerNotes,
				items: itemDTOs,
				createdAt: updatedOrder!.createdAt.toISOString(),
				confirmedAt: updatedOrder!.confirmedAt?.toISOString() ?? null,
				shippedAt: updatedOrder!.shippedAt?.toISOString() ?? null,
				deliveredAt: updatedOrder!.deliveredAt?.toISOString() ?? null,
				cancelledAt: updatedOrder!.cancelledAt?.toISOString() ?? null,
				codVerifiedAt: updatedOrder!.codVerifiedAt?.toISOString() ?? null,
				estimatedDelivery: `${shippingCostInfo.estimatedDays} days`,
			};

			return c.json(orderDetail, 200);
		},
	)

	// Verify COD
	.patch(
		"/:orderId/verify-cod",
		describeRoute({
			tags: ["Orders"],
			summary: "Verify COD readiness",
			description: "Customer confirms they have cash ready for COD order",
			responses: {
				200: {
					description: "COD verified",
					content: {
						"application/json": {
							schema: resolver(z.object({ success: z.boolean() })),
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
				403: {
					description: "Forbidden",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
				404: {
					description: "Order not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("param", z.object({ orderId: z.string().uuid() })),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { orderId } = c.req.valid("param");

			// Fetch order
			const [order] = await db
				.select()
				.from(orders)
				.where(eq(orders.id, orderId))
				.limit(1);

			if (!order) {
				return c.json({ error: "Order not found" }, 404);
			}

			// Check if order belongs to current user
			if (order.userId !== userId) {
				return c.json({ error: "Forbidden" }, 403);
			}

			// Set COD verification timestamp
			await db
				.update(orders)
				.set({ codVerifiedAt: new Date() })
				.where(eq(orders.id, orderId));

			// Notify vendor that customer verified COD (fire-and-forget)
			notifyVendor(order.vendorId, {
				type: "cod_verified",
				title: "Customer Verified COD",
				titleBn: "গ্রাহক COD যাচাই করেছে",
				body: `Customer confirmed cash readiness for order ${order.orderNumber}`,
				bodyBn: `গ্রাহক অর্ডার ${order.orderNumber} এর জন্য নগদ প্রস্তুতি নিশ্চিত করেছে`,
				data: {
					orderId: order.id,
					orderNumber: order.orderNumber,
				},
			}).catch((error) => {
				console.error(`[ORDER] Failed to send COD verification notification:`, error);
			});

			return c.json({ success: true }, 200);
		},
	);

export type OrdersRouterType = typeof ordersRouter;
