import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { db, getS3Url } from "@kineDao.com/db";
import {
	adminAuditLog,
	productImages,
	products,
	productReviews,
	reviewReplies,
	user,
	vendors,
} from "@kineDao.com/db/schema";
import {
	type AdminReviewAnalyticsDTO,
	type AdminReviewListItemDTO,
	type AdminReviewListResponseDTO,
	adminModerateReviewSchema,
	adminReviewAnalyticsQuerySchema,
	adminReviewListQuerySchema,
} from "@kineDao.com/api-types/reviews";
import {
	and,
	asc,
	desc,
	eq,
	gte,
	inArray,
	ilike,
	or,
	sql,
} from "drizzle-orm";
import {
	type AdminEnv,
	adminAuthMiddleware,
} from "../middleware/admin-auth";
import { syncReviewAggregatesByProduct } from "../lib/review-service";
import { notifyVendor } from "../lib/notification-service";

const reviewIdParamSchema = z.object({ reviewId: z.string().uuid() });

export const adminReviewsRouter = new Hono<AdminEnv>()
	.use("*", adminAuthMiddleware)
	.get(
		"/reviews/analytics",
		describeRoute({
			tags: ["Admin Reviews"],
			summary: "Get review analytics",
			description: "Platform-wide review analytics for admin dashboard.",
			responses: {
				200: {
					description: "Analytics data",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
			},
		}),
		zValidator("query", adminReviewAnalyticsQuerySchema),
		async (c) => {
			const { days } = c.req.valid("query");
			const since = new Date();
			since.setDate(since.getDate() - days);

			const [summary] = await db
				.select({
					totalReviews: sql<number>`count(*)::int`,
					publishedReviews:
						sql<number>`sum(case when ${productReviews.status} = 'published' then 1 else 0 end)::int`,
					hiddenOrRemovedReviews:
						sql<number>`sum(case when ${productReviews.status} in ('hidden', 'removed') then 1 else 0 end)::int`,
					averageRating:
						sql<number>`coalesce(avg(case when ${productReviews.status} = 'published' then ${productReviews.rating} end)::float, 0)::float`,
				})
				.from(productReviews)
				.where(gte(productReviews.createdAt, since));

			const distributionRows = await db
				.select({
					rating: productReviews.rating,
					count: sql<number>`count(*)::int`,
				})
				.from(productReviews)
				.where(
					and(
						gte(productReviews.createdAt, since),
						eq(productReviews.status, "published"),
					),
				)
				.groupBy(productReviews.rating);

			const totalPublished = Number(summary?.publishedReviews ?? 0);
			const distributionMap = new Map(
				distributionRows.map((row) => [row.rating, Number(row.count)]),
			);

			const topRows = await db
				.select({
					productId: products.id,
					productTitle: products.title,
					vendorId: vendors.id,
					vendorName: vendors.name,
					averageRating:
						sql<number>`coalesce(avg(${productReviews.rating})::float, 0)::float`,
					reviewCount: sql<number>`count(*)::int`,
				})
				.from(productReviews)
				.innerJoin(products, eq(productReviews.productId, products.id))
				.innerJoin(vendors, eq(productReviews.vendorId, vendors.id))
				.where(
					and(
						gte(productReviews.createdAt, since),
						eq(productReviews.status, "published"),
					),
				)
				.groupBy(products.id, products.title, vendors.id, vendors.name)
				.having(sql`count(*) >= 3`)
				.orderBy(desc(sql`avg(${productReviews.rating})`), desc(sql`count(*)`))
				.limit(8);

			const lowRows = await db
				.select({
					productId: products.id,
					productTitle: products.title,
					vendorId: vendors.id,
					vendorName: vendors.name,
					averageRating:
						sql<number>`coalesce(avg(${productReviews.rating})::float, 0)::float`,
					reviewCount: sql<number>`count(*)::int`,
				})
				.from(productReviews)
				.innerJoin(products, eq(productReviews.productId, products.id))
				.innerJoin(vendors, eq(productReviews.vendorId, vendors.id))
				.where(
					and(
						gte(productReviews.createdAt, since),
						eq(productReviews.status, "published"),
					),
				)
				.groupBy(products.id, products.title, vendors.id, vendors.name)
				.having(sql`count(*) >= 3`)
				.orderBy(asc(sql`avg(${productReviews.rating})`), desc(sql`count(*)`))
				.limit(8);

			const response: AdminReviewAnalyticsDTO = {
				timeRangeDays: days,
				totalReviews: Number(summary?.totalReviews ?? 0),
				publishedReviews: totalPublished,
				hiddenOrRemovedReviews: Number(summary?.hiddenOrRemovedReviews ?? 0),
				averageRating: Number(summary?.averageRating ?? 0),
				distribution: [5, 4, 3, 2, 1].map((stars) => {
					const count = distributionMap.get(stars) ?? 0;
					return {
						stars,
						count,
						percentage:
							totalPublished > 0
								? Math.round((count / totalPublished) * 100)
								: 0,
					};
				}),
				topRatedProducts: topRows.map((row) => ({
					productId: row.productId,
					productTitle: row.productTitle,
					vendorId: row.vendorId,
					vendorName: row.vendorName,
					averageRating: Number(row.averageRating),
					reviewCount: Number(row.reviewCount),
				})),
				lowestRatedProducts: lowRows.map((row) => ({
					productId: row.productId,
					productTitle: row.productTitle,
					vendorId: row.vendorId,
					vendorName: row.vendorName,
					averageRating: Number(row.averageRating),
					reviewCount: Number(row.reviewCount),
				})),
			};

			return c.json(response, 200);
		},
	)
	.get(
		"/reviews",
		describeRoute({
			tags: ["Admin Reviews"],
			summary: "Get global review list",
			description: "Returns paginated review list across all vendors/products.",
			responses: {
				200: {
					description: "Review list",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
			},
		}),
		zValidator("query", adminReviewListQuerySchema),
		async (c) => {
			const { page, limit, sort, status, rating, vendorId, productId, search } =
				c.req.valid("query");
			const offset = (page - 1) * limit;

			const whereConditions = [] as any[];
			if (status !== "all") whereConditions.push(eq(productReviews.status, status));
			if (rating !== undefined) whereConditions.push(eq(productReviews.rating, rating));
			if (vendorId) whereConditions.push(eq(productReviews.vendorId, vendorId));
			if (productId) whereConditions.push(eq(productReviews.productId, productId));
			if (search && search.trim().length > 0) {
				const pattern = `%${search.trim()}%`;
				whereConditions.push(
					or(
						ilike(productReviews.content, pattern),
						ilike(products.title, pattern),
						ilike(vendors.name, pattern),
						ilike(user.name, pattern),
					),
				);
			}

			const [countRow] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(productReviews)
				.innerJoin(products, eq(productReviews.productId, products.id))
				.innerJoin(vendors, eq(productReviews.vendorId, vendors.id))
				.innerJoin(user, eq(productReviews.userId, user.id))
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

			const total = Number(countRow?.count ?? 0);
			const totalPages = Math.ceil(total / limit);

			let orderByClause: any[] = [desc(productReviews.createdAt)];
			if (sort === "highest") {
				orderByClause = [desc(productReviews.rating), desc(productReviews.createdAt)];
			} else if (sort === "lowest") {
				orderByClause = [asc(productReviews.rating), desc(productReviews.createdAt)];
			} else if (sort === "helpful") {
				orderByClause = [
					desc(productReviews.helpfulCount),
					desc(productReviews.createdAt),
				];
			}

			const rows = await db
				.select({
					reviewId: productReviews.id,
					productId: productReviews.productId,
					productTitle: products.title,
					productSlug: products.slug,
					vendorId: productReviews.vendorId,
					vendorName: vendors.name,
					userId: productReviews.userId,
					rating: productReviews.rating,
					title: productReviews.title,
					content: productReviews.content,
					status: productReviews.status,
					helpfulCount: productReviews.helpfulCount,
					notHelpfulCount: productReviews.notHelpfulCount,
					isVerifiedPurchase: productReviews.isVerifiedPurchase,
					createdAt: productReviews.createdAt,
					updatedAt: productReviews.updatedAt,
					authorName: user.name,
					authorEmail: user.email,
					authorAvatar: user.image,
					replyId: reviewReplies.id,
					replyContent: reviewReplies.content,
					replyCreatedAt: reviewReplies.createdAt,
					moderationReason: productReviews.moderationReason,
					moderationNote: productReviews.moderationNote,
					moderatedAt: productReviews.moderatedAt,
					moderatedBy: productReviews.moderatedBy,
				})
				.from(productReviews)
				.innerJoin(products, eq(productReviews.productId, products.id))
				.innerJoin(vendors, eq(productReviews.vendorId, vendors.id))
				.innerJoin(user, eq(productReviews.userId, user.id))
				.leftJoin(reviewReplies, eq(reviewReplies.reviewId, productReviews.id))
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
				.orderBy(...orderByClause)
				.limit(limit)
				.offset(offset);

			const productIds = Array.from(new Set(rows.map((row) => row.productId)));
			const images =
				productIds.length > 0
					? await db
							.select({
								productId: productImages.productId,
								s3Key: productImages.s3Key,
							})
							.from(productImages)
							.where(inArray(productImages.productId, productIds))
							.orderBy(asc(productImages.sortOrder))
					: [];

			const imageMap = new Map<string, string>();
			for (const image of images) {
				if (!imageMap.has(image.productId)) {
					imageMap.set(image.productId, getS3Url(image.s3Key));
				}
			}

			const reviews: AdminReviewListItemDTO[] = rows.map((row) => ({
				id: row.reviewId,
				productId: row.productId,
				productTitle: row.productTitle,
				productSlug: row.productSlug,
				vendorId: row.vendorId,
				vendorName: row.vendorName,
				userId: row.userId,
				rating: row.rating,
				title: row.title,
				content: row.content,
				status: row.status,
				helpfulCount: row.helpfulCount,
				notHelpfulCount: row.notHelpfulCount,
				isVerifiedPurchase: row.isVerifiedPurchase,
				createdAt: row.createdAt.toISOString(),
				updatedAt: row.updatedAt.toISOString(),
				author: {
					userId: row.userId,
					name: row.authorName,
					email: row.authorEmail,
					avatar: row.authorAvatar,
				},
				reply: row.replyId
					? {
						id: row.replyId,
						vendorId: row.vendorId,
						vendorName: row.vendorName,
						content: row.replyContent || "",
						createdAt: row.replyCreatedAt?.toISOString() ?? row.createdAt.toISOString(),
					}
					: null,
				viewerVote: null,
				productImageUrl: imageMap.get(row.productId) ?? null,
				moderationReason: row.moderationReason,
				moderationNote: row.moderationNote,
				moderatedAt: row.moderatedAt?.toISOString() ?? null,
				moderatedBy: row.moderatedBy,
			}));

			const response: AdminReviewListResponseDTO = {
				reviews,
				total,
				page,
				limit,
				totalPages,
			};

			return c.json(response, 200);
		},
	)
	.patch(
		"/reviews/:reviewId/moderate",
		describeRoute({
			tags: ["Admin Reviews"],
			summary: "Moderate review",
			description:
				"Updates review status (published/hidden/removed) and stores moderation reason.",
			responses: {
				200: {
					description: "Moderation updated",
					content: {
						"application/json": {
							schema: resolver(z.object({ success: z.boolean() })),
						},
					},
				},
			},
		}),
		zValidator("param", reviewIdParamSchema),
		zValidator("json", adminModerateReviewSchema),
		async (c) => {
			const adminUserId = c.var.adminUserId;
			const { reviewId } = c.req.valid("param");
			const payload = c.req.valid("json");

			const [review] = await db
				.select({
					id: productReviews.id,
					productId: productReviews.productId,
					vendorId: productReviews.vendorId,
					status: productReviews.status,
					productTitle: products.title,
				})
				.from(productReviews)
				.innerJoin(products, eq(productReviews.productId, products.id))
				.where(eq(productReviews.id, reviewId))
				.limit(1);

			if (!review) {
				return c.json({ error: "Review not found" }, 404);
			}

			await db.transaction(async (tx) => {
				await tx
					.update(productReviews)
					.set({
						status: payload.status,
						moderationReason: payload.moderationReason ?? null,
						moderationNote: payload.moderationNote ?? null,
						moderatedAt: new Date(),
						moderatedBy: adminUserId,
					})
					.where(eq(productReviews.id, reviewId));

				await tx.insert(adminAuditLog).values({
					adminUserId,
					action: "moderate_review",
					entityType: "product_review",
					entityId: reviewId,
					details: {
						fromStatus: review.status,
						toStatus: payload.status,
						moderationReason: payload.moderationReason ?? null,
					},
				});

				if (review.status !== payload.status) {
					await syncReviewAggregatesByProduct(review.productId, tx);
				}
			});

			if (review.status !== payload.status && payload.status !== "published") {
				void notifyVendor(review.vendorId, {
					type: "review_moderated",
					title: "Review moderated",
					body: `A review on ${review.productTitle} was ${payload.status} by admin`,
					data: {
						reviewId,
						productId: review.productId,
						status: payload.status,
					},
				});
			}

			return c.json({ success: true }, 200);
		},
	);
