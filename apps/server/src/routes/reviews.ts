import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { db } from "@kineDao.com/db";
import {
	products,
	productReviews,
	reviewReplies,
	reviewVotes,
	user,
	vendors,
} from "@kineDao.com/db/schema";
import {
	type ProductReviewSummaryDTO,
	type ReviewEligibilityDTO,
	type ReviewListItemDTO,
	type ReviewListResponseDTO,
	createReviewSchema,
	reviewListQuerySchema,
	reviewVoteSchema,
	updateReviewSchema,
} from "@kineDao.com/api-types/reviews";
import {
	and,
	asc,
	desc,
	eq,
	inArray,
	sql,
} from "drizzle-orm";
import type { AppEnv } from "../index";
import {
	getReviewEligibility,
	syncReviewAggregatesByProduct,
	syncReviewVoteCounts,
} from "../lib/review-service";
import { notifyVendor } from "../lib/notification-service";

const productIdParamSchema = z.object({
	productId: z.string().uuid(),
});

const reviewIdParamSchema = z.object({
	reviewId: z.string().uuid(),
});

export const reviewsRouter = new Hono<AppEnv>()
	.get(
		"/products/:productId/summary",
		describeRoute({
			tags: ["Reviews"],
			summary: "Get product review summary",
			description:
				"Returns average rating, total reviews, and star distribution for one product.",
			responses: {
				200: {
					description: "Review summary",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
			},
		}),
		zValidator("param", productIdParamSchema),
		async (c) => {
			const { productId } = c.req.valid("param");

			const [summary] = await db
				.select({
					averageRating:
						sql<number>`coalesce(avg(${productReviews.rating})::float, 0)::float`,
					totalReviews: sql<number>`count(*)::int`,
				})
				.from(productReviews)
				.where(
					and(
						eq(productReviews.productId, productId),
						eq(productReviews.status, "published"),
					),
				);

			const distributionRows = await db
				.select({
					rating: productReviews.rating,
					count: sql<number>`count(*)::int`,
				})
				.from(productReviews)
				.where(
					and(
						eq(productReviews.productId, productId),
						eq(productReviews.status, "published"),
					),
				)
				.groupBy(productReviews.rating);

			const countByStar = new Map(
				distributionRows.map((row) => [row.rating, Number(row.count)]),
			);
			const totalReviews = Number(summary?.totalReviews ?? 0);

			const response: ProductReviewSummaryDTO = {
				productId,
				averageRating: Number(summary?.averageRating ?? 0),
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
		"/products/:productId",
		describeRoute({
			tags: ["Reviews"],
			summary: "Get product reviews",
			description: "Returns paginated published reviews for one product.",
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
		zValidator("param", productIdParamSchema),
		zValidator("query", reviewListQuerySchema),
		async (c) => {
			const { productId } = c.req.valid("param");
			const { page, limit, sort, rating } = c.req.valid("query");
			const userId = c.var.user?.id ?? null;
			const offset = (page - 1) * limit;

			const conditions = [
				eq(productReviews.productId, productId),
				eq(productReviews.status, "published"),
			] as any[];

			if (rating !== undefined) {
				conditions.push(eq(productReviews.rating, rating));
			}

			const total = await db.$count(productReviews, and(...conditions));
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
				.where(and(...conditions))
				.orderBy(...orderByClause)
				.limit(limit)
				.offset(offset);

			const reviewIds = rows.map((row) => row.reviewId);
			const voteMap = new Map<string, "helpful" | "not_helpful">();

			if (userId && reviewIds.length > 0) {
				const votes = await db
					.select({ reviewId: reviewVotes.reviewId, voteType: reviewVotes.voteType })
					.from(reviewVotes)
					.where(
						and(
							eq(reviewVotes.userId, userId),
							inArray(reviewVotes.reviewId, reviewIds),
						),
					);

				for (const vote of votes) {
					voteMap.set(vote.reviewId, vote.voteType);
				}
			}

			const items: ReviewListItemDTO[] = rows.map((row) => ({
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
				viewerVote: voteMap.get(row.reviewId) ?? null,
			}));

			const response: ReviewListResponseDTO = {
				items,
				total,
				page,
				limit,
				totalPages,
			};

			return c.json(response, 200);
		},
	)
	.get(
		"/products/:productId/eligibility",
		describeRoute({
			tags: ["Reviews"],
			summary: "Check review eligibility",
			description:
				"Checks if current user can submit a verified-purchase review for a product.",
			responses: {
				200: {
					description: "Eligibility result",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
			},
		}),
		zValidator("param", productIdParamSchema),
		async (c) => {
			const userId = c.var.user?.id ?? null;
			const { productId } = c.req.valid("param");
			const eligibility = await getReviewEligibility(userId, productId);
			const response: ReviewEligibilityDTO = {
				productId: eligibility.productId,
				canReview: eligibility.canReview,
				eligibleDeliveredItems: eligibility.eligibleDeliveredItems,
				remainingReviewSlots: eligibility.remainingReviewSlots,
				reason: eligibility.reason,
			};
			return c.json(response, 200);
		},
	)
	.post(
		"/",
		describeRoute({
			tags: ["Reviews"],
			summary: "Create review",
			description:
				"Create verified-buyer review. Allowed only for delivered order items that were not reviewed before.",
			responses: {
				201: {
					description: "Review created",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
			},
		}),
		zValidator("json", createReviewSchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const payload = c.req.valid("json");

			const [product] = await db
				.select({
					id: products.id,
					vendorId: products.vendorId,
					title: products.title,
					isActive: products.isActive,
					status: products.status,
				})
				.from(products)
				.where(eq(products.id, payload.productId))
				.limit(1);

			if (!product || !product.isActive || product.status !== "approved") {
				return c.json({ error: "Product not found" }, 404);
			}

			const eligibility = await getReviewEligibility(userId, payload.productId);
			if (!eligibility.canReview || !eligibility.orderId || !eligibility.orderItemId) {
				return c.json(
					{ error: "Not eligible to review", reason: eligibility.reason },
					403,
				);
			}

			let review: typeof productReviews.$inferSelect | undefined;
			try {
				[review] = await db.transaction(async (tx) => {
					const [created] = await tx
						.insert(productReviews)
						.values({
							productId: payload.productId,
							vendorId: product.vendorId,
							userId,
							orderId: eligibility.orderId!,
							orderItemId: eligibility.orderItemId!,
							rating: payload.rating,
							title: payload.title ?? null,
							content: payload.content,
							status: "published",
						})
						.returning();

					if (!created) {
						throw new Error("Failed to create review");
					}

					await syncReviewAggregatesByProduct(payload.productId, tx);
					return [created];
				});
			} catch (error) {
				const message =
					error instanceof Error ? error.message.toLowerCase() : String(error);
				if (message.includes("product_reviews_order_item_unique")) {
					return c.json({ error: "Review already exists for this delivered item" }, 409);
				}
				throw error;
			}

			if (!review) {
				return c.json({ error: "Failed to create review" }, 500);
			}

			void notifyVendor(product.vendorId, {
				type: "new_review",
				title: "New review received",
				body: `${product.title} received a ${payload.rating}-star review`,
				data: {
					reviewId: review.id,
					productId: payload.productId,
					rating: payload.rating,
				},
			});

			return c.json({ id: review.id }, 201);
		},
	)
	.patch(
		"/:reviewId",
		describeRoute({
			tags: ["Reviews"],
			summary: "Update own review",
			description: "Allows review author to update rating/title/content.",
			responses: {
				200: {
					description: "Review updated",
					content: {
						"application/json": {
							schema: resolver(z.object({ success: z.boolean() })),
						},
					},
				},
			},
		}),
		zValidator("param", reviewIdParamSchema),
		zValidator("json", updateReviewSchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { reviewId } = c.req.valid("param");
			const payload = c.req.valid("json");

			const [existing] = await db
				.select({
					id: productReviews.id,
					productId: productReviews.productId,
					status: productReviews.status,
				})
				.from(productReviews)
				.where(and(eq(productReviews.id, reviewId), eq(productReviews.userId, userId)))
				.limit(1);

			if (!existing) {
				return c.json({ error: "Review not found" }, 404);
			}

			if (existing.status === "removed") {
				return c.json({ error: "Removed reviews cannot be updated" }, 400);
			}

			const setPayload: Partial<typeof productReviews.$inferInsert> = {};
			if (payload.rating !== undefined) setPayload.rating = payload.rating;
			if (payload.title !== undefined) setPayload.title = payload.title || null;
			if (payload.content !== undefined) setPayload.content = payload.content;

			if (Object.keys(setPayload).length === 0) {
				return c.json({ success: true }, 200);
			}

			await db
				.update(productReviews)
				.set(setPayload)
				.where(eq(productReviews.id, reviewId));

			if (payload.rating !== undefined) {
				await syncReviewAggregatesByProduct(existing.productId);
			}

			return c.json({ success: true }, 200);
		},
	)
	.delete(
		"/:reviewId",
		describeRoute({
			tags: ["Reviews"],
			summary: "Delete own review",
			description: "Soft-removes a review by changing status to removed.",
			responses: {
				200: {
					description: "Review removed",
					content: {
						"application/json": {
							schema: resolver(z.object({ success: z.boolean() })),
						},
					},
				},
			},
		}),
		zValidator("param", reviewIdParamSchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { reviewId } = c.req.valid("param");
			const [existing] = await db
				.select({ id: productReviews.id, productId: productReviews.productId })
				.from(productReviews)
				.where(and(eq(productReviews.id, reviewId), eq(productReviews.userId, userId)))
				.limit(1);

			if (!existing) {
				return c.json({ error: "Review not found" }, 404);
			}

			await db
				.update(productReviews)
				.set({ status: "removed", moderationReason: "deleted_by_author" })
				.where(eq(productReviews.id, reviewId));

			await syncReviewAggregatesByProduct(existing.productId);
			return c.json({ success: true }, 200);
		},
	)
	.post(
		"/:reviewId/vote",
		describeRoute({
			tags: ["Reviews"],
			summary: "Vote review helpfulness",
			description: "Adds or updates current user's helpful/not-helpful vote.",
			responses: {
				200: {
					description: "Vote stored",
					content: {
						"application/json": {
							schema: resolver(z.object({ success: z.boolean() })),
						},
					},
				},
			},
		}),
		zValidator("param", reviewIdParamSchema),
		zValidator("json", reviewVoteSchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { reviewId } = c.req.valid("param");
			const { voteType } = c.req.valid("json");

			const [review] = await db
				.select({ id: productReviews.id, userId: productReviews.userId })
				.from(productReviews)
				.where(and(eq(productReviews.id, reviewId), eq(productReviews.status, "published")))
				.limit(1);

			if (!review) {
				return c.json({ error: "Review not found" }, 404);
			}

			if (review.userId === userId) {
				return c.json({ error: "Cannot vote on your own review" }, 400);
			}

			await db
				.insert(reviewVotes)
				.values({ reviewId, userId, voteType })
				.onConflictDoUpdate({
					target: [reviewVotes.reviewId, reviewVotes.userId],
					set: { voteType },
				});

			await syncReviewVoteCounts(reviewId);
			return c.json({ success: true }, 200);
		},
	);
