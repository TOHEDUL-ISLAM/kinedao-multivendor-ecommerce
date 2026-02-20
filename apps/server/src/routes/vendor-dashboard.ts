import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { db, getS3Url } from "@kineDao.com/db";
import {
	user,
	vendors,
	products,
	productImages,
	productOptions,
	productSkus,
	categories,
	orders,
	orderItems,
	transactions,
	type ShippingAddressSnapshot,
	type OrderItemProductSnapshot,
} from "@kineDao.com/db/schema";
import { and, asc, desc, eq, gte, ilike, inArray, sql } from "drizzle-orm";
import { notify } from "../lib/notification-service";
import {
	vendorProductListQuerySchema,
	vendorProductFormSchema,
	vendorOrderListQuerySchema,
	vendorOrderStatusUpdateSchema,
	VENDOR_STATUS_TRANSITIONS,
	type VendorDashboardOverviewDTO,
	type VendorProductListResponseDTO,
	type VendorProductListItemDTO,
	type VendorProductDetailDTO,
	type VendorOrderListResponseDTO,
	type VendorOrderListItemDTO,
	type VendorOrderDetailDTO,
	type VendorEarningsSummaryDTO,
	type VendorWalletSummaryDTO,
	type VendorTransactionsResponseDTO,
	vendorTransactionsQuerySchema,
	type VendorRecentOrderDTO,
	type VendorLowStockProductDTO,
} from "@kineDao.com/api-types/vendor-dashboard";
import {
	vendorAuthMiddleware,
	type VendorEnv,
} from "../middleware/vendor-auth";

// Helper: generate slug from title
function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 200);
}

export const vendorDashboardRouter = new Hono<VendorEnv>()
	// Apply vendor auth to all routes
	.use("*", vendorAuthMiddleware)

	// =====================
	// GET /overview - Dashboard stats, recent orders, low stock
	// =====================
	.get(
		"/overview",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "Get vendor dashboard overview",
			description:
				"Returns dashboard stats, recent orders, and low stock alerts for the authenticated vendor",
			responses: {
				200: {
					description: "Dashboard overview data",
					content: {
						"application/json": { schema: resolver(z.any()) },
					},
				},
			},
		}),
		async (c) => {
			const vendorId = c.var.vendorId;

			// Run independent queries in parallel to reduce overview latency.
			const [
				vendorRows,
				totalOrdersResult,
				pendingOrdersResult,
				totalEarningsResult,
				totalPaidOutResult,
				productsListedResult,
				productsPendingResult,
				recentOrderRows,
				lowStockRows,
			] = await Promise.all([
				db
					.select({
						id: vendors.id,
						name: vendors.name,
						slug: vendors.slug,
						logoUrl: vendors.logoUrl,
						isVerified: vendors.isVerified,
					})
					.from(vendors)
					.where(eq(vendors.id, vendorId))
					.limit(1),
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(orders)
					.where(eq(orders.vendorId, vendorId)),
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(orders)
					.where(
						and(
							eq(orders.vendorId, vendorId),
							sql`${orders.status} IN ('pending', 'confirmed', 'processing')`,
						),
					),
				// Total net earnings from ledger (sale - commission - delivery - returns)
				db
					.select({
						total: sql<number>`coalesce(sum(${transactions.amountPaisa}), 0)::int`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.vendorId, vendorId),
							inArray(transactions.type, [
								"sale",
								"commission_deduction",
								"delivery_charge",
								"return_fee",
								"adjustment",
							]),
						),
					),
				// Total paid out from ledger
				db
					.select({
						total: sql<number>`coalesce(sum(abs(${transactions.amountPaisa})), 0)::int`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.vendorId, vendorId),
							inArray(transactions.type, ["payout", "payout_fee"]),
						),
					),
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(products)
					.where(
						and(
							eq(products.vendorId, vendorId),
							eq(products.isActive, true),
						),
					),
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(products)
					.where(
						and(
							eq(products.vendorId, vendorId),
							eq(products.status, "pending"),
							eq(products.isActive, true),
						),
					),
				db
					.select({
						id: orders.id,
						orderNumber: orders.orderNumber,
						status: orders.status,
						total: orders.total,
						createdAt: orders.createdAt,
						shippingAddress: orders.shippingAddress,
					})
					.from(orders)
					.where(eq(orders.vendorId, vendorId))
					.orderBy(desc(orders.createdAt))
					.limit(5),
				db
					.select({
						productId: products.id,
						title: products.title,
						slug: products.slug,
						skuId: productSkus.id,
						sku: productSkus.sku,
						stockQty: productSkus.stockQty,
					})
					.from(productSkus)
					.innerJoin(products, eq(productSkus.productId, products.id))
					.where(
						and(
							eq(products.vendorId, vendorId),
							eq(products.isActive, true),
							eq(productSkus.isAvailable, true),
							sql`${productSkus.stockQty} <= 5`,
						),
					)
					.orderBy(asc(productSkus.stockQty))
					.limit(10),
			]);

			const vendor = vendorRows[0];

			if (!vendor) {
				return c.json({ error: "Vendor not found" }, 404);
			}

			const totalEarnings = totalEarningsResult[0]?.total ?? 0;
			const totalPaidOut = totalPaidOutResult[0]?.total ?? 0;

			const recentOrderIds = recentOrderRows.map((o) => o.id);
			const lowStockProductIds = [
				...new Set(lowStockRows.map((r) => r.productId)),
			];

			const [itemCounts, images] = await Promise.all([
				recentOrderIds.length > 0
					? db
							.select({
								orderId: orderItems.orderId,
								count: sql<number>`count(*)::int`,
							})
							.from(orderItems)
							.where(inArray(orderItems.orderId, recentOrderIds))
							.groupBy(orderItems.orderId)
					: Promise.resolve([] as Array<{ orderId: string; count: number }>),
				lowStockProductIds.length > 0
					? db
							.select({
								productId: productImages.productId,
								s3Key: productImages.s3Key,
							})
							.from(productImages)
							.where(inArray(productImages.productId, lowStockProductIds))
							.orderBy(asc(productImages.sortOrder))
					: Promise.resolve([] as Array<{ productId: string; s3Key: string }>),
			]);

			const itemCountMap = new Map(
				itemCounts.map((itemCount) => [itemCount.orderId, itemCount.count]),
			);

			const imageMap = new Map<string, string>();
			for (const img of images) {
				if (!imageMap.has(img.productId)) {
					// Generate URL from S3 key
					imageMap.set(img.productId, getS3Url(img.s3Key));
				}
			}

			const recentOrders: VendorRecentOrderDTO[] = recentOrderRows.map(
				(order) => ({
					id: order.id,
					orderNumber: order.orderNumber,
					customerName: (order.shippingAddress as ShippingAddressSnapshot)
						.fullName,
					status: order.status,
					total: order.total,
					itemCount: itemCountMap.get(order.id) ?? 0,
					createdAt: order.createdAt.toISOString(),
				}),
			);

			const lowStockProducts: VendorLowStockProductDTO[] =
				lowStockRows.map((row) => ({
					id: row.productId,
					title: row.title,
					slug: row.slug,
					imageUrl: imageMap.get(row.productId) ?? null,
					skuId: row.skuId,
					sku: row.sku,
					stockQty: row.stockQty,
				}));

			const response: VendorDashboardOverviewDTO = {
				vendor: {
					vendorId: vendor.id,
					vendorName: vendor.name,
					vendorSlug: vendor.slug,
					vendorLogo: vendor.logoUrl,
					isVerified: vendor.isVerified ?? false,
				},
				stats: {
					totalOrders: totalOrdersResult[0]?.count ?? 0,
					pendingOrders: pendingOrdersResult[0]?.count ?? 0,
					totalEarnings,
					pendingPayout: totalEarnings - totalPaidOut,
					productsListed: productsListedResult[0]?.count ?? 0,
					productsPendingApproval: productsPendingResult[0]?.count ?? 0,
				},
				recentOrders,
				lowStockProducts,
			};

			return c.json(response, 200);
		},
	)

	// =====================
	// GET /products - Vendor product list
	// =====================
	.get(
		"/products",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "List vendor's products",
			description: "Paginated, filterable list of vendor's products",
			responses: {
				200: {
					description: "Product list",
					content: {
						"application/json": { schema: resolver(z.any()) },
					},
				},
			},
		}),
		zValidator("query", vendorProductListQuerySchema),
		async (c) => {
			const vendorId = c.var.vendorId;
			const { page, limit, status, active, search, categoryId, sort } =
				c.req.valid("query");

			// Build conditions
			const conditions = [eq(products.vendorId, vendorId)];

			if (active === "active") {
				conditions.push(eq(products.isActive, true));
			} else if (active === "inactive") {
				conditions.push(eq(products.isActive, false));
			}

			if (status !== "all") {
				conditions.push(eq(products.status, status));
			}
			if (search) {
				conditions.push(ilike(products.title, `%${search}%`));
			}
			if (categoryId) {
				conditions.push(eq(products.categoryId, categoryId));
			}

			const offset = (page - 1) * limit;

			// Sort
			let orderBy;
			switch (sort) {
				case "oldest":
					orderBy = asc(products.createdAt);
					break;
				case "newest":
				default:
					orderBy = desc(products.createdAt);
					break;
			}

			const [countRows, productRows] = await Promise.all([
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(products)
					.where(and(...conditions)),
				db
					.select({
						id: products.id,
						title: products.title,
						titleBn: products.titleBn,
						slug: products.slug,
						status: products.status,
						categoryId: products.categoryId,
						isActive: products.isActive,
						createdAt: products.createdAt,
						updatedAt: products.updatedAt,
					})
					.from(products)
					.where(and(...conditions))
					.orderBy(orderBy)
					.limit(limit)
					.offset(offset),
			]);

			const total = countRows[0]?.count ?? 0;
			const totalPages = Math.ceil(total / limit);

			if (productRows.length === 0) {
				const emptyResponse: VendorProductListResponseDTO = {
					products: [],
					total: 0,
					page,
					limit,
					totalPages: 0,
				};
				return c.json(emptyResponse, 200);
			}

			const productIds = productRows.map((p) => p.id);

			// Batch fetch: images, skus, category names
			const [imageRows, skuRows, categoryRows] = await Promise.all([
				db
					.select({
						productId: productImages.productId,
						s3Key: productImages.s3Key,
					})
					.from(productImages)
					.where(inArray(productImages.productId, productIds))
					.orderBy(asc(productImages.sortOrder)),
				db
					.select({
						productId: productSkus.productId,
						priceAmount: productSkus.priceAmount,
						stockQty: productSkus.stockQty,
					})
					.from(productSkus)
					.where(inArray(productSkus.productId, productIds)),
				db
					.select({
						id: categories.id,
						name: categories.name,
					})
					.from(categories)
					.where(
						inArray(
							categories.id,
							productRows.map((p) => p.categoryId),
						),
					),
			]);

			// Build maps
			const firstImageMap = new Map<string, string>();
			for (const img of imageRows) {
				if (!firstImageMap.has(img.productId)) {
					// Generate URL from S3 key
					firstImageMap.set(img.productId, getS3Url(img.s3Key));
				}
			}

			const skuStatsMap = new Map<
				string,
				{ minPrice: number; totalStock: number }
			>();
			for (const sku of skuRows) {
				const existing = skuStatsMap.get(sku.productId);
				if (existing) {
					existing.minPrice = Math.min(existing.minPrice, sku.priceAmount);
					existing.totalStock += sku.stockQty;
				} else {
					skuStatsMap.set(sku.productId, {
						minPrice: sku.priceAmount,
						totalStock: sku.stockQty,
					});
				}
			}

			const categoryMap = new Map(
				categoryRows.map((c) => [c.id, c.name]),
			);

			// Build response
			const productList: VendorProductListItemDTO[] = productRows.map(
				(p) => {
					const skuStats = skuStatsMap.get(p.id);
					return {
						id: p.id,
						title: p.title,
						titleBn: p.titleBn,
						slug: p.slug,
						status: p.status,
						imageUrl: firstImageMap.get(p.id) ?? null,
						categoryName: categoryMap.get(p.categoryId) ?? "Unknown",
						categoryId: p.categoryId,
						priceAmount: skuStats?.minPrice ?? 0,
						totalStock: skuStats?.totalStock ?? 0,
						isActive: p.isActive ?? true,
						createdAt: p.createdAt.toISOString(),
						updatedAt: p.updatedAt.toISOString(),
					};
				},
			);

			const response: VendorProductListResponseDTO = {
				products: productList,
				total,
				page,
				limit,
				totalPages,
			};

			return c.json(response, 200);
		},
	)

	// =====================
	// GET /products/:productId - Product detail for edit
	// =====================
	.get(
		"/products/:productId",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "Get product detail for editing",
			description:
				"Returns full product detail including images, options, and SKUs",
			responses: {
				200: {
					description: "Product detail",
					content: {
						"application/json": { schema: resolver(z.any()) },
					},
				},
				404: {
					description: "Product not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("param", z.object({ productId: z.string().uuid() })),
		async (c) => {
			const vendorId = c.var.vendorId;
			const { productId } = c.req.valid("param");

			const [product] = await db
				.select()
				.from(products)
				.where(
					and(
						eq(products.id, productId),
						eq(products.vendorId, vendorId),
					),
				)
				.limit(1);

			if (!product) {
				return c.json({ error: "Product not found" }, 404);
			}

			// Fetch related data
			const [images, options, skus, [category]] = await Promise.all([
				db
					.select()
					.from(productImages)
					.where(eq(productImages.productId, productId))
					.orderBy(asc(productImages.sortOrder)),
				db
					.select()
					.from(productOptions)
					.where(eq(productOptions.productId, productId))
					.orderBy(asc(productOptions.sortOrder)),
				db
					.select()
					.from(productSkus)
					.where(eq(productSkus.productId, productId)),
				db
					.select({ name: categories.name })
					.from(categories)
					.where(eq(categories.id, product.categoryId))
					.limit(1),
			]);

			const response: VendorProductDetailDTO = {
				id: product.id,
				title: product.title,
				titleBn: product.titleBn,
				slug: product.slug,
				categoryId: product.categoryId,
				categoryName: category?.name ?? "Unknown",
				brand: product.brand,
				shortDescription: product.shortDescription,
				shortDescriptionBn: product.shortDescriptionBn,
				description: product.description,
				descriptionBn: product.descriptionBn,
				ageRange: product.ageRange,
				ageRangeMin: product.ageRangeMin,
				ageRangeMax: product.ageRangeMax,
				isBpaFree: product.isBpaFree,
				isOrganic: product.isOrganic,
				isHypoallergenic: product.isHypoallergenic,
				hasSmallParts: product.hasSmallParts,
				safetyWarningEn: product.safetyWarningEn,
				safetyWarningBn: product.safetyWarningBn,
				safetyCertifications: product.safetyCertifications,
				weightLimitKg: product.weightLimitKg,
				expiryDate: product.expiryDate?.toISOString() ?? null,
				status: product.status,
				isActive: product.isActive ?? true,
				images: images.map((img) => ({
					id: img.id,
					s3Key: img.s3Key,
					variant: img.variant,
					isPrimary: img.isPrimary ?? false,
					sortOrder: img.sortOrder,
				})),
				options: options.map((opt) => ({
					id: opt.id,
					name: opt.name,
					nameBn: opt.nameBn,
					values: opt.values,
					valuesBn: opt.valuesBn,
					sortOrder: opt.sortOrder,
				})),
				skus: skus.map((sku) => ({
					id: sku.id,
					sku: sku.sku,
					optionValues: sku.optionValues as Record<string, string> | null,
					priceAmount: sku.priceAmount,
					compareAtAmount: sku.compareAtAmount,
					stockQty: sku.stockQty,
					isAvailable: sku.isAvailable,
				})),
				createdAt: product.createdAt.toISOString(),
				updatedAt: product.updatedAt.toISOString(),
			};

			return c.json(response, 200);
		},
	)

	// =====================
	// POST /products - Create product
	// =====================
	.post(
		"/products",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "Create a new product",
			description:
				"Creates a product with images, options, and SKUs in a single transaction",
			responses: {
				201: {
					description: "Product created",
					content: {
						"application/json": { schema: resolver(z.any()) },
					},
				},
				400: {
					description: "Validation error",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("json", vendorProductFormSchema),
		async (c) => {
			const vendorId = c.var.vendorId;
			const input = c.req.valid("json");
			const normalizedImages = input.images ?? [];
			const normalizedOptions = input.options ?? [];
			const normalizedSkus = input.isDraft
				? input.skus.filter((sku) => sku.sku.trim().length > 0)
				: input.skus;

			// Generate unique slug
			let slug = generateSlug(input.title);
			const [existing] = await db
				.select({ id: products.id })
				.from(products)
				.where(eq(products.slug, slug))
				.limit(1);

			if (existing) {
				slug = `${slug}-${Date.now().toString(36)}`;
			}

			// Determine status - draft if saving draft, otherwise pending for admin approval
			const productStatus = input.isDraft ? "draft" : "pending";

			// Create in transaction
			const result = await db.transaction(async (tx) => {
				// Insert product
				const [product] = await tx
					.insert(products)
					.values({
						title: input.title,
						titleBn: input.titleBn || null,
						slug,
						vendorId,
						categoryId: input.categoryId,
						brand: input.brand || null,
						shortDescription: input.shortDescription || null,
						shortDescriptionBn: input.shortDescriptionBn || null,
						description: input.description || null,
						descriptionBn: input.descriptionBn || null,
						ageRange: input.ageRange || null,
						ageRangeMin: input.ageRangeMin ?? null,
						ageRangeMax: input.ageRangeMax ?? null,
						isBpaFree: input.isBpaFree,
						isOrganic: input.isOrganic,
						isHypoallergenic: input.isHypoallergenic,
						hasSmallParts: input.hasSmallParts,
						safetyWarningEn: input.safetyWarningEn || null,
						safetyWarningBn: input.safetyWarningBn || null,
						safetyCertifications: input.safetyCertifications || null,
						weightLimitKg: input.weightLimitKg ?? null,
						expiryDate: input.expiryDate
							? new Date(input.expiryDate)
							: null,
						status: productStatus,
						pendingReason: input.isDraft
							? null
							: "new_submission",
						submittedAt: input.isDraft ? null : new Date(),
						isActive: true,
					})
					.returning();

				if (!product) throw new Error("Failed to create product");

				// Insert images
				if (normalizedImages.length > 0) {
					await tx.insert(productImages).values(
						normalizedImages.map((img, idx) => ({
							productId: product.id,
							s3Key: img.s3Key,
							variant: img.variant || "original",
							isPrimary: idx === 0, // First image is primary
							sortOrder: img.sortOrder,
						})),
					);
				}

				// Insert options
				if (normalizedOptions.length > 0) {
					await tx.insert(productOptions).values(
						normalizedOptions.map((opt, idx) => ({
							productId: product.id,
							name: opt.name,
							nameBn: opt.nameBn || null,
							values: opt.values,
							valuesBn: opt.valuesBn || null,
							sortOrder: idx,
						})),
					);
				}

				// Insert SKUs
				if (normalizedSkus.length > 0) {
					await tx.insert(productSkus).values(
						normalizedSkus.map((sku) => ({
							productId: product.id,
							sku: sku.sku.trim(),
							optionValues: sku.optionValues || null,
							priceAmount: sku.priceAmount,
							compareAtAmount: sku.compareAtAmount ?? null,
							stockQty: sku.stockQty,
							isAvailable: sku.isAvailable,
						})),
					);
				}

				return product;
			});

			return c.json(
				{ id: result.id, slug: result.slug, status: result.status },
				201,
			);
		},
	)

	// =====================
	// PUT /products/:productId - Update product
	// =====================
	.put(
		"/products/:productId",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "Update a product",
			description:
				"Updates product, replaces images/options/SKUs in a transaction",
			responses: {
				200: {
					description: "Product updated",
					content: {
						"application/json": { schema: resolver(z.any()) },
					},
				},
				404: {
					description: "Product not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("param", z.object({ productId: z.string().uuid() })),
		zValidator("json", vendorProductFormSchema),
		async (c) => {
			const vendorId = c.var.vendorId;
			const { productId } = c.req.valid("param");
			const input = c.req.valid("json");
			const normalizedImages = input.images ?? [];
			const normalizedOptions = input.options ?? [];
			const normalizedSkus = input.isDraft
				? input.skus.filter((sku) => sku.sku.trim().length > 0)
				: input.skus;

			// Verify ownership
			const [existing] = await db
				.select({ id: products.id })
				.from(products)
				.where(
					and(
						eq(products.id, productId),
						eq(products.vendorId, vendorId),
					),
				)
				.limit(1);

			if (!existing) {
				return c.json({ error: "Product not found" }, 404);
			}

			// Determine status: draft if saving draft, otherwise pending for approval
			const updateStatus = input.isDraft ? "draft" : "pending";

			await db.transaction(async (tx) => {
				// Update product - status based on isDraft flag
				await tx
					.update(products)
					.set({
						title: input.title,
						titleBn: input.titleBn || null,
						categoryId: input.categoryId,
						brand: input.brand || null,
						shortDescription: input.shortDescription || null,
						shortDescriptionBn: input.shortDescriptionBn || null,
						description: input.description || null,
						descriptionBn: input.descriptionBn || null,
						ageRange: input.ageRange || null,
						ageRangeMin: input.ageRangeMin ?? null,
						ageRangeMax: input.ageRangeMax ?? null,
						isBpaFree: input.isBpaFree,
						isOrganic: input.isOrganic,
						isHypoallergenic: input.isHypoallergenic,
						hasSmallParts: input.hasSmallParts,
						safetyWarningEn: input.safetyWarningEn || null,
						safetyWarningBn: input.safetyWarningBn || null,
						safetyCertifications: input.safetyCertifications || null,
						weightLimitKg: input.weightLimitKg ?? null,
						expiryDate: input.expiryDate
							? new Date(input.expiryDate)
							: null,
						status: updateStatus,
						pendingReason: input.isDraft ? null : "vendor_update",
						submittedAt: input.isDraft ? null : new Date(),
					})
					.where(eq(products.id, productId));

				// Replace images: delete old, insert new
				await tx
					.delete(productImages)
					.where(eq(productImages.productId, productId));
				if (normalizedImages.length > 0) {
					await tx.insert(productImages).values(
						normalizedImages.map((img, idx) => ({
							productId,
							s3Key: img.s3Key,
							variant: img.variant || "original",
							isPrimary: idx === 0, // First image is primary
							sortOrder: img.sortOrder,
						})),
					);
				}

				// Replace options
				await tx
					.delete(productOptions)
					.where(eq(productOptions.productId, productId));
				if (normalizedOptions.length > 0) {
					await tx.insert(productOptions).values(
						normalizedOptions.map((opt, idx) => ({
							productId,
							name: opt.name,
							nameBn: opt.nameBn || null,
							values: opt.values,
							valuesBn: opt.valuesBn || null,
							sortOrder: idx,
						})),
					);
				}

				// Replace SKUs
				await tx
					.delete(productSkus)
					.where(eq(productSkus.productId, productId));
				if (normalizedSkus.length > 0) {
					await tx.insert(productSkus).values(
						normalizedSkus.map((sku) => ({
							productId,
							sku: sku.sku.trim(),
							optionValues: sku.optionValues || null,
							priceAmount: sku.priceAmount,
							compareAtAmount: sku.compareAtAmount ?? null,
							stockQty: sku.stockQty,
							isAvailable: sku.isAvailable,
						})),
					);
				}
			});

			return c.json({ id: productId, status: updateStatus }, 200);
		},
	)

	// =====================
	// DELETE /products/:productId - Soft delete
	// =====================
	.delete(
		"/products/:productId",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "Deactivate a product",
			description: "Soft-deletes a product by setting isActive to false",
			responses: {
				200: {
					description: "Product deactivated",
					content: {
						"application/json": { schema: resolver(z.any()) },
					},
				},
				404: {
					description: "Product not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("param", z.object({ productId: z.string().uuid() })),
		async (c) => {
			const vendorId = c.var.vendorId;
			const { productId } = c.req.valid("param");

			const [existing] = await db
				.select({ id: products.id })
				.from(products)
				.where(
					and(
						eq(products.id, productId),
						eq(products.vendorId, vendorId),
					),
				)
				.limit(1);

			if (!existing) {
				return c.json({ error: "Product not found" }, 404);
			}

			await db
				.update(products)
				.set({ isActive: false })
				.where(eq(products.id, productId));

			return c.json({ id: productId, isActive: false }, 200);
		},
	)

	// =====================
	// PATCH /products/:productId/reactivate - Reactivate product
	// =====================
	.patch(
		"/products/:productId/reactivate",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "Reactivate a product",
			description: "Sets isActive to true for a vendor-owned product",
			responses: {
				200: {
					description: "Product reactivated",
					content: {
						"application/json": { schema: resolver(z.any()) },
					},
				},
				404: {
					description: "Product not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("param", z.object({ productId: z.string().uuid() })),
		async (c) => {
			const vendorId = c.var.vendorId;
			const { productId } = c.req.valid("param");

			const [existing] = await db
				.select({ id: products.id })
				.from(products)
				.where(
					and(
						eq(products.id, productId),
						eq(products.vendorId, vendorId),
					),
				)
				.limit(1);

			if (!existing) {
				return c.json({ error: "Product not found" }, 404);
			}

			await db
				.update(products)
				.set({ isActive: true })
				.where(eq(products.id, productId));

			return c.json({ id: productId, isActive: true }, 200);
		},
	)

	// =====================
	// GET /orders - Vendor order list
	// =====================
	.get(
		"/orders",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "List vendor's orders",
			description:
				"Paginated, filterable list of orders for this vendor",
			responses: {
				200: {
					description: "Order list",
					content: {
						"application/json": { schema: resolver(z.any()) },
					},
				},
			},
		}),
		zValidator("query", vendorOrderListQuerySchema),
		async (c) => {
			const vendorId = c.var.vendorId;
			const { page, limit, status, search, sort } = c.req.valid("query");

			const conditions = [eq(orders.vendorId, vendorId)];

			if (status !== "all") {
				conditions.push(eq(orders.status, status));
			}
			if (search) {
				conditions.push(ilike(orders.orderNumber, `%${search}%`));
			}

			// Count
			const [countResult] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(orders)
				.where(and(...conditions));

			const total = countResult?.count ?? 0;
			const totalPages = Math.ceil(total / limit);
			const offset = (page - 1) * limit;

			const orderBy =
				sort === "oldest"
					? asc(orders.createdAt)
					: desc(orders.createdAt);

			const orderRows = await db
				.select({
					id: orders.id,
					orderNumber: orders.orderNumber,
					status: orders.status,
					total: orders.total,
					paymentMethod: orders.paymentMethod,
					shippingAddress: orders.shippingAddress,
					createdAt: orders.createdAt,
				})
				.from(orders)
				.where(and(...conditions))
				.orderBy(orderBy)
				.limit(limit)
				.offset(offset);

			// Get item counts
			const orderIds = orderRows.map((o) => o.id);
			let itemCountMap = new Map<string, number>();
			if (orderIds.length > 0) {
				const itemCounts = await db
					.select({
						orderId: orderItems.orderId,
						count: sql<number>`count(*)::int`,
					})
					.from(orderItems)
					.where(inArray(orderItems.orderId, orderIds))
					.groupBy(orderItems.orderId);
				itemCountMap = new Map(
					itemCounts.map((ic) => [ic.orderId, ic.count]),
				);
			}

			const orderList: VendorOrderListItemDTO[] = orderRows.map(
				(order) => {
					const addr =
						order.shippingAddress as ShippingAddressSnapshot;
					return {
						id: order.id,
						orderNumber: order.orderNumber,
						customerName: addr.fullName,
						customerPhone: addr.phone,
						status: order.status,
						total: order.total,
						itemCount: itemCountMap.get(order.id) ?? 0,
						paymentMethod: order.paymentMethod,
						createdAt: order.createdAt.toISOString(),
					};
				},
			);

			const response: VendorOrderListResponseDTO = {
				orders: orderList,
				total,
				page,
				limit,
				totalPages,
			};

			return c.json(response, 200);
		},
	)

	// =====================
	// GET /orders/:orderId - Order detail
	// =====================
	.get(
		"/orders/:orderId",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "Get order detail",
			description: "Full order detail for vendor's order",
			responses: {
				200: {
					description: "Order detail",
					content: {
						"application/json": { schema: resolver(z.any()) },
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
			const vendorId = c.var.vendorId;
			const { orderId } = c.req.valid("param");

			const [order] = await db
				.select()
				.from(orders)
				.where(
					and(
						eq(orders.id, orderId),
						eq(orders.vendorId, vendorId),
					),
				)
				.limit(1);

			if (!order) {
				return c.json({ error: "Order not found" }, 404);
			}

			const items = await db
				.select()
				.from(orderItems)
				.where(eq(orderItems.orderId, orderId));

			const addr = order.shippingAddress as ShippingAddressSnapshot;

			const response: VendorOrderDetailDTO = {
				id: order.id,
				orderNumber: order.orderNumber,
				status: order.status,
				paymentMethod: order.paymentMethod,
				subtotal: order.subtotal,
				shippingCost: order.shippingCost,
				codFee: order.codFee,
				total: order.total,
				customerNotes: order.customerNotes,
				trackingNumber: order.trackingNumber,
				trackingCarrier: order.trackingCarrier,
				shippingAddress: addr,
				items: items.map((item) => {
					const snapshot =
						item.productSnapshot as OrderItemProductSnapshot;
					return {
						id: item.id,
						productId: item.productId,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						lineTotal: item.lineTotal,
						productSnapshot: {
							title: snapshot.title,
							titleBn: snapshot.titleBn,
							slug: snapshot.slug,
							image: snapshot.image,
							selectedOptions: snapshot.selectedOptions ?? null,
							skuCode: snapshot.skuCode ?? null,
						},
					};
				}),
				createdAt: order.createdAt.toISOString(),
				confirmedAt: order.confirmedAt?.toISOString() ?? null,
				processingAt: order.processingAt?.toISOString() ?? null,
				shippedAt: order.shippedAt?.toISOString() ?? null,
				deliveredAt: order.deliveredAt?.toISOString() ?? null,
				cancelledAt: order.cancelledAt?.toISOString() ?? null,
			};

			return c.json(response, 200);
		},
	)

	// =====================
	// PATCH /orders/:orderId/status - Update order status
	// =====================
	.patch(
		"/orders/:orderId/status",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "Update order status",
			description:
				"Update order status with valid transitions. Tracking required for shipped.",
			responses: {
				200: {
					description: "Status updated",
					content: {
						"application/json": { schema: resolver(z.any()) },
					},
				},
				400: {
					description: "Invalid status transition",
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
		zValidator("json", vendorOrderStatusUpdateSchema),
		async (c) => {
			const vendorId = c.var.vendorId;
			const { orderId } = c.req.valid("param");
			const { status: newStatus, trackingNumber, trackingCarrier } =
				c.req.valid("json");

			const [order] = await db
				.select({
					id: orders.id,
					orderNumber: orders.orderNumber,
					status: orders.status,
					userId: orders.userId,
					trackingNumber: orders.trackingNumber,
					trackingCarrier: orders.trackingCarrier,
				})
				.from(orders)
				.where(
					and(
						eq(orders.id, orderId),
						eq(orders.vendorId, vendorId),
					),
				)
				.limit(1);

			if (!order) {
				return c.json({ error: "Order not found" }, 404);
			}

			// Validate transition
			const allowedTransitions =
				VENDOR_STATUS_TRANSITIONS[order.status] ?? [];
			if (!allowedTransitions.includes(newStatus)) {
				return c.json(
					{
						error: `Cannot transition from '${order.status}' to '${newStatus}'`,
					},
					400,
				);
			}

			// Build update
			const updateData: Record<string, unknown> = {
				status: newStatus,
			};

			if (newStatus === "confirmed") {
				updateData.confirmedAt = new Date();
			} else if (newStatus === "processing") {
				updateData.processingAt = new Date();
			} else if (newStatus === "shipped") {
				updateData.shippedAt = new Date();
				updateData.trackingNumber = trackingNumber;
				updateData.trackingCarrier = trackingCarrier || null;
			} else if (newStatus === "delivered") {
				updateData.deliveredAt = new Date();
			} else if (newStatus === "cancelled") {
				updateData.cancelledAt = new Date();
			}

			await db
				.update(orders)
				.set(updateData)
				.where(
					and(
						eq(orders.id, orderId),
						eq(orders.status, order.status), // Optimistic lock
					),
				);

			// Send customer notification (fire-and-forget)
			const [customer] = await db
				.select({ email: user.email, name: user.name })
				.from(user)
				.where(eq(user.id, order.userId))
				.limit(1);

			if (customer) {
				const notificationMap: Record<string, {
					type: "order_confirmed" | "order_processing" | "order_shipped" | "order_delivered" | "order_cancelled";
					title: string;
					titleBn: string;
					body: string;
					bodyBn: string;
				}> = {
					confirmed: {
						type: "order_confirmed",
						title: "Order Confirmed",
						titleBn: "অর্ডার নিশ্চিত করা হয়েছে",
						body: `Your order ${order.orderNumber} has been confirmed`,
						bodyBn: `আপনার অর্ডার ${order.orderNumber} নিশ্চিত করা হয়েছে`,
					},
					processing: {
						type: "order_processing",
						title: "Order is Being Prepared",
						titleBn: "অর্ডার প্রস্তুত করা হচ্ছে",
						body: `Your order ${order.orderNumber} is being prepared`,
						bodyBn: `আপনার অর্ডার ${order.orderNumber} প্রস্তুত করা হচ্ছে`,
					},
					shipped: {
						type: "order_shipped",
						title: "Order Shipped",
						titleBn: "অর্ডার পাঠানো হয়েছে",
						body: trackingNumber
							? `Your order ${order.orderNumber} is on the way (Tracking: ${trackingNumber})`
							: `Your order ${order.orderNumber} is on the way`,
						bodyBn: trackingNumber
							? `আপনার অর্ডার ${order.orderNumber} পথে আছে (ট্র্যাকিং: ${trackingNumber})`
							: `আপনার অর্ডার ${order.orderNumber} পথে আছে`,
					},
					delivered: {
						type: "order_delivered",
						title: "Order Delivered",
						titleBn: "অর্ডার সরবরাহ করা হয়েছে",
						body: `Your order ${order.orderNumber} has been delivered`,
						bodyBn: `আপনার অর্ডার ${order.orderNumber} সরবরাহ করা হয়েছে`,
					},
					cancelled: {
						type: "order_cancelled",
						title: "Order Cancelled",
						titleBn: "অর্ডার বাতিল করা হয়েছে",
						body: `Your order ${order.orderNumber} has been cancelled`,
						bodyBn: `আপনার অর্ডার ${order.orderNumber} বাতিল করা হয়েছে`,
					},
				};

				const notificationData = notificationMap[newStatus];
				if (notificationData) {
					notify({
						userId: order.userId,
						type: notificationData.type,
						title: notificationData.title,
						titleBn: notificationData.titleBn,
						body: notificationData.body,
						bodyBn: notificationData.bodyBn,
						data: {
							orderId: order.id,
							orderNumber: order.orderNumber,
							trackingNumber: trackingNumber ?? order.trackingNumber,
							trackingCarrier: trackingCarrier ?? order.trackingCarrier,
						},
						channel: "customer",
						emailData: {
							userEmail: customer.email,
							userName: customer.name,
							orderNumber: order.orderNumber,
							trackingNumber: trackingNumber ?? order.trackingNumber,
							trackingCarrier: trackingCarrier ?? order.trackingCarrier,
						},
					}).catch((error) => {
						console.error(`[VENDOR] Failed to send notification for ${order.orderNumber}:`, error);
					});
				}
			}

			return c.json({ id: orderId, status: newStatus }, 200);
		},
	)

	// =====================
	// GET /earnings - Earnings summary
	// =====================
	.get(
		"/earnings",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "Get vendor earnings summary",
			description:
				"Returns earnings summary from delivered orders and payouts",
			responses: {
				200: {
					description: "Earnings summary",
					content: {
						"application/json": { schema: resolver(z.any()) },
					},
				},
			},
		}),
		async (c) => {
			const vendorId = c.var.vendorId;

			const now = new Date();
			const startOfMonth = new Date(
				now.getFullYear(),
				now.getMonth(),
				1,
			);

			const [
				ledgerBalanceResult,
				totalNetResult,
				thisMonthNetResult,
				totalPaidOutResult,
				orderCountResult,
			] = await Promise.all([
				// Real-time balances from ledger (not stale vendor cache)
				db
					.select({
						availableBalance: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'cleared' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
						pendingBalance: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'pending' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
					})
					.from(transactions)
					.where(eq(transactions.vendorId, vendorId)),
				db
					.select({
						total: sql<number>`coalesce(sum(${transactions.amountPaisa}), 0)::int`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.vendorId, vendorId),
							inArray(transactions.type, [
								"sale",
								"commission_deduction",
								"delivery_charge",
								"return_fee",
								"adjustment",
							]),
						),
					),
				db
					.select({
						total: sql<number>`coalesce(sum(${transactions.amountPaisa}), 0)::int`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.vendorId, vendorId),
							inArray(transactions.type, [
								"sale",
								"commission_deduction",
								"delivery_charge",
								"return_fee",
								"adjustment",
							]),
							gte(transactions.createdAt, startOfMonth),
						),
					),
				db
					.select({
						total: sql<number>`coalesce(sum(abs(${transactions.amountPaisa})), 0)::int`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.vendorId, vendorId),
							inArray(transactions.type, ["payout", "payout_fee"]),
						),
					),
				db
					.select({
						count: sql<number>`count(*)::int`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.vendorId, vendorId),
							eq(transactions.type, "sale"),
						),
					),
			]);

			const totalEarnings = totalNetResult[0]?.total ?? 0;
			const totalPaidOut = totalPaidOutResult[0]?.total ?? 0;
			const availableBalance = ledgerBalanceResult[0]?.availableBalance ?? 0;
			const pendingBalance = ledgerBalanceResult[0]?.pendingBalance ?? 0;

			const response: VendorEarningsSummaryDTO = {
				totalEarnings,
				pendingPayout: availableBalance,
				totalPaidOut,
				thisMonthEarnings: thisMonthNetResult[0]?.total ?? 0,
				orderCount: orderCountResult[0]?.count ?? 0,
				availableBalance,
				pendingBalance,
			};

			return c.json(response, 200);
		},
	)

	// =====================
	// GET /wallet - Wallet summary
	// =====================
	.get(
		"/wallet",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "Get wallet summary",
			description:
				"Returns available and pending wallet balances with total paid out.",
			responses: {
				200: {
					description: "Wallet summary",
					content: {
						"application/json": { schema: resolver(z.any()) },
					},
				},
			},
		}),
		async (c) => {
			const vendorId = c.var.vendorId;

			const [ledgerResult, paidOutResult] = await Promise.all([
				// Real-time balances from ledger
				db
					.select({
						availableBalance: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'cleared' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
						pendingBalance: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'pending' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
					})
					.from(transactions)
					.where(eq(transactions.vendorId, vendorId)),
				db
					.select({
						total: sql<number>`coalesce(sum(abs(${transactions.amountPaisa})), 0)::int`,
					})
					.from(transactions)
					.where(
						and(
							eq(transactions.vendorId, vendorId),
							inArray(transactions.type, ["payout", "payout_fee"]),
						),
					),
			]);

			const response: VendorWalletSummaryDTO = {
				availableBalance: ledgerResult[0]?.availableBalance ?? 0,
				pendingBalance: ledgerResult[0]?.pendingBalance ?? 0,
				totalPaidOut: paidOutResult[0]?.total ?? 0,
			};

			return c.json(response, 200);
		},
	)

	// =====================
	// GET /transactions - Ledger statement
	// =====================
	.get(
		"/transactions",
		describeRoute({
			tags: ["Vendor Dashboard"],
			summary: "Get vendor ledger statement",
			description: "Returns paginated wallet transactions for the vendor.",
			responses: {
				200: {
					description: "Transaction statement",
					content: {
						"application/json": { schema: resolver(z.any()) },
					},
				},
			},
		}),
		zValidator("query", vendorTransactionsQuerySchema),
		async (c) => {
			const vendorId = c.var.vendorId;
			const query = c.req.valid("query");
			const offset = (query.page - 1) * query.limit;

			const whereClause =
				query.status === "all"
					? eq(transactions.vendorId, vendorId)
					: and(
						eq(transactions.vendorId, vendorId),
						eq(transactions.status, query.status),
					);

			const [totalResult, rows] = await Promise.all([
				db
					.select({ count: sql<number>`count(*)::int` })
					.from(transactions)
					.where(whereClause),
				db
					.select({
						id: transactions.id,
						orderId: transactions.orderId,
						payoutId: transactions.payoutId,
						type: transactions.type,
						status: transactions.status,
						amountPaisa: transactions.amountPaisa,
						description: transactions.description,
						referenceId: transactions.referenceId,
						referenceType: transactions.referenceType,
						createdAt: transactions.createdAt,
					})
					.from(transactions)
					.where(whereClause)
					.orderBy(desc(transactions.createdAt))
					.limit(query.limit)
					.offset(offset),
			]);

			const total = totalResult[0]?.count ?? 0;
			const totalPages = Math.ceil(total / query.limit);
			const response: VendorTransactionsResponseDTO = {
				transactions: rows.map((row) => ({
					id: row.id,
					orderId: row.orderId,
					payoutId: row.payoutId,
					type: row.type,
					status: row.status,
					amountPaisa: row.amountPaisa,
					description: row.description,
					referenceId: row.referenceId,
					referenceType: row.referenceType,
					createdAt: row.createdAt.toISOString(),
				})),
				total,
				page: query.page,
				limit: query.limit,
				totalPages,
			};

			return c.json(response, 200);
		},
	);

export type VendorDashboardRouterType = typeof vendorDashboardRouter;
