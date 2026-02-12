import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { db, getS3Url } from "@kineDao.com/db";
import {
	productImages,
	products,
	productReviews,
	reviewReplies,
	vendors,
	user,
} from "@kineDao.com/db/schema";
import {
	type VendorReviewListItemDTO,
	type VendorReviewListResponseDTO,
	type VendorReviewOverviewDTO,
	vendorReplySchema,
	vendorReviewListQuerySchema,
} from "@kineDao.com/api-types/reviews";
import {
	and,
	asc,
	desc,
	eq,
	inArray,
	ilike,
	or,
	sql,
} from "drizzle-orm";
import {
	type VendorEnv,
	vendorAuthMiddleware,
} from "../middleware/vendor-auth";

const reviewIdParamSchema = z.object({ reviewId: z.string().uuid() });

export const vendorDashboardReviewsRouter = new Hono<VendorEnv>()
	.use("*", vendorAuthMiddleware)
	.get(
		"/reviews/overview",
		describeRoute({
			tags: ["Vendor Dashboard Reviews"],
			summary: "Get vendor review dashboard overview",
			description:
				"Returns review score, customer segments, and star distribution for the current vendor.",
			responses: {
				200: {
					description: "Vendor review overview",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
			},
		}),
		async (c) => {
			const vendorId = c.var.vendorId;
			const cutoff = new Date();
			cutoff.setDate(cutoff.getDate() - 30);

			const [summary] = await db
				.select({
					averageRating:
						sql<number>`coalesce(avg(${productReviews.rating})::float, 0)::float`,
					totalReviews: sql<number>`count(*)::int`,
				})
				.from(productReviews)
				.where(
					and(
						eq(productReviews.vendorId, vendorId),
						eq(productReviews.status, "published"),
					),
				);

			const customerRows = await db
				.select({
					userId: productReviews.userId,
					firstReviewAt: sql<Date>`min(${productReviews.createdAt})`,
				})
				.from(productReviews)
				.where(
					and(
						eq(productReviews.vendorId, vendorId),
						eq(productReviews.status, "published"),
					),
				)
				.groupBy(productReviews.userId);

			const totalCustomers = customerRows.length;
			const newCustomers = customerRows.filter(
				(row) => row.firstReviewAt && new Date(row.firstReviewAt) >= cutoff,
			).length;
			const regularCustomers = Math.max(0, totalCustomers - newCustomers);

			const distributionRows = await db
				.select({
					rating: productReviews.rating,
					count: sql<number>`count(*)::int`,
				})
				.from(productReviews)
				.where(
					and(
						eq(productReviews.vendorId, vendorId),
						eq(productReviews.status, "published"),
					),
				)
				.groupBy(productReviews.rating);

			const totalReviews = Number(summary?.totalReviews ?? 0);
			const countByStar = new Map(
				distributionRows.map((row) => [row.rating, Number(row.count)]),
			);

			const response: VendorReviewOverviewDTO = {
				reviewScore: Number(summary?.averageRating ?? 0),
				totalCustomers,
				newCustomersPercent:
					totalCustomers > 0
						? Math.round((newCustomers / totalCustomers) * 100)
						: 0,
				regularCustomersPercent:
					totalCustomers > 0
						? Math.round((regularCustomers / totalCustomers) * 100)
						: 0,
				totalReviews,
				distribution: [5, 4, 3, 2, 1].map((stars) => {
					const count = countByStar.get(stars) ?? 0;
					return {
						stars,
						count,
						percentage:
							totalReviews > 0
								? Math.round((count / totalReviews) * 100)
								: 0,
					};
				}),
			};

			return c.json(response, 200);
		},
	)
	.get(
		"/reviews",
		describeRoute({
			tags: ["Vendor Dashboard Reviews"],
			summary: "Get vendor review list",
			description:
				"Returns paginated reviews for products that belong to the current vendor.",
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
		zValidator("query", vendorReviewListQuerySchema),
		async (c) => {
			const vendorId = c.var.vendorId;
			const { page, limit, sort, rating, status, search } = c.req.valid("query");
			const offset = (page - 1) * limit;

			const whereConditions = [eq(productReviews.vendorId, vendorId)] as any[];
			if (status !== "all") {
				whereConditions.push(eq(productReviews.status, status));
			}
			if (rating !== undefined) {
				whereConditions.push(eq(productReviews.rating, rating));
			}
			if (search && search.trim().length > 0) {
				const pattern = `%${search.trim()}%`;
				whereConditions.push(
					or(
						ilike(productReviews.content, pattern),
						ilike(products.title, pattern),
						ilike(user.name, pattern),
					),
				);
			}

			const [countRow] = await db
				.select({ count: sql<number>`count(*)::int` })
				.from(productReviews)
				.innerJoin(products, eq(productReviews.productId, products.id))
				.innerJoin(user, eq(productReviews.userId, user.id))
				.where(and(...whereConditions));

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
				})
				.from(productReviews)
				.innerJoin(products, eq(productReviews.productId, products.id))
				.innerJoin(vendors, eq(productReviews.vendorId, vendors.id))
				.innerJoin(user, eq(productReviews.userId, user.id))
				.leftJoin(reviewReplies, eq(reviewReplies.reviewId, productReviews.id))
				.where(and(...whereConditions))
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

			const reviews: VendorReviewListItemDTO[] = rows.map((row) => ({
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
			}));

			const response: VendorReviewListResponseDTO = {
				reviews,
				total,
				page,
				limit,
				totalPages,
			};

			return c.json(response, 200);
		},
	)
	.post(
		"/reviews/:reviewId/reply",
		describeRoute({
			tags: ["Vendor Dashboard Reviews"],
			summary: "Reply to review",
			description: "Creates or updates vendor's public reply to one review.",
			responses: {
				200: {
					description: "Reply saved",
					content: {
						"application/json": {
							schema: resolver(z.object({ success: z.boolean() })),
						},
					},
				},
			},
		}),
		zValidator("param", reviewIdParamSchema),
		zValidator("json", vendorReplySchema),
		async (c) => {
			const vendorId = c.var.vendorId;
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { reviewId } = c.req.valid("param");
			const { content } = c.req.valid("json");

			const [review] = await db
				.select({
					id: productReviews.id,
					status: productReviews.status,
					vendorId: productReviews.vendorId,
				})
				.from(productReviews)
				.where(eq(productReviews.id, reviewId))
				.limit(1);

			if (!review || review.vendorId !== vendorId) {
				return c.json({ error: "Review not found" }, 404);
			}

			if (review.status === "removed") {
				return c.json({ error: "Cannot reply to removed review" }, 400);
			}

			await db.transaction(async (tx) => {
				await tx
					.insert(reviewReplies)
					.values({
						reviewId,
						vendorId,
						userId,
						content,
					})
					.onConflictDoUpdate({
						target: reviewReplies.reviewId,
						set: {
							content,
							userId,
							vendorId,
						},
					});

				await tx
					.update(productReviews)
					.set({ vendorRepliedAt: new Date() })
					.where(eq(productReviews.id, reviewId));
			});

			return c.json({ success: true }, 200);
		},
	);
