import { db } from "@kineDao.com/db";
import {
	orders,
	orderItems,
	productReviews,
	reviewVotes,
	products,
	vendors,
} from "@kineDao.com/db/schema";
import {
	type ReviewEligibilityDTO,
} from "@kineDao.com/api-types/reviews";
import { and, eq, inArray, sql } from "drizzle-orm";

interface ReviewEligibilityInternal extends ReviewEligibilityDTO {
	orderId: string | null;
	orderItemId: string | null;
}

function getClient(tx?: any) {
	return tx ?? db;
}

export async function getReviewEligibility(
	userId: string | null,
	productId: string,
	tx?: any,
): Promise<ReviewEligibilityInternal> {
	if (!userId) {
		return {
			productId,
			canReview: false,
			eligibleDeliveredItems: 0,
			remainingReviewSlots: 0,
			reason: "not_authenticated",
			orderId: null,
			orderItemId: null,
		};
	}

	const client = getClient(tx);

	const deliveredRows = await client
		.select({
			orderId: orderItems.orderId,
			orderItemId: orderItems.id,
		})
		.from(orderItems)
		.innerJoin(orders, eq(orderItems.orderId, orders.id))
		.where(
			and(
				eq(orders.userId, userId),
				eq(orders.status, "delivered"),
				eq(orderItems.productId, productId),
			),
		);

	if (deliveredRows.length === 0) {
		return {
			productId,
			canReview: false,
			eligibleDeliveredItems: 0,
			remainingReviewSlots: 0,
			reason: "no_delivered_order",
			orderId: null,
			orderItemId: null,
		};
	}

	const deliveredOrderItemIds = deliveredRows.map(
		(row: { orderItemId: string }) => row.orderItemId,
	);
	const reviewedRows = await client
		.select({ orderItemId: productReviews.orderItemId })
		.from(productReviews)
		.where(inArray(productReviews.orderItemId, deliveredOrderItemIds));

	const reviewedIds = new Set(
		reviewedRows.map((row: { orderItemId: string }) => row.orderItemId),
	);
	const remainingRows = deliveredRows.filter(
		(row: { orderItemId: string }) => !reviewedIds.has(row.orderItemId),
	);

	if (remainingRows.length === 0) {
		return {
			productId,
			canReview: false,
			eligibleDeliveredItems: deliveredRows.length,
			remainingReviewSlots: 0,
			reason: "already_reviewed",
			orderId: null,
			orderItemId: null,
		};
	}

	const candidate = remainingRows[0];
	return {
		productId,
		canReview: true,
		eligibleDeliveredItems: deliveredRows.length,
		remainingReviewSlots: remainingRows.length,
		reason: "eligible",
		orderId: candidate?.orderId ?? null,
		orderItemId: candidate?.orderItemId ?? null,
	};
}

export async function recalculateProductReviewAggregates(
	productId: string,
	tx?: any,
): Promise<void> {
	const client = getClient(tx);
	const [row] = await client
		.select({
			averageRating:
				sql<number>`coalesce(avg(${productReviews.rating})::float, 0)::float`,
			reviewCount: sql<number>`count(*)::int`,
		})
		.from(productReviews)
		.where(
			and(
				eq(productReviews.productId, productId),
				eq(productReviews.status, "published"),
			),
		);

	await client
		.update(products)
		.set({
			ratingAvg: Number(row?.averageRating ?? 0),
			ratingCount: Number(row?.reviewCount ?? 0),
		})
		.where(eq(products.id, productId));
}

export async function recalculateVendorReviewAggregates(
	vendorId: string,
	tx?: any,
): Promise<void> {
	const client = getClient(tx);
	const [row] = await client
		.select({
			averageRating:
				sql<number>`coalesce(avg(${productReviews.rating})::float, 0)::float`,
			reviewCount: sql<number>`count(*)::int`,
		})
		.from(productReviews)
		.where(
			and(
				eq(productReviews.vendorId, vendorId),
				eq(productReviews.status, "published"),
			),
		);

	await client
		.update(vendors)
		.set({
			ratingAvg: Number(row?.averageRating ?? 0),
			ratingCount: Number(row?.reviewCount ?? 0),
		})
		.where(eq(vendors.id, vendorId));
}

export async function syncReviewAggregatesByProduct(
	productId: string,
	tx?: any,
): Promise<void> {
	const client = getClient(tx);
	const [product] = await client
		.select({ id: products.id, vendorId: products.vendorId })
		.from(products)
		.where(eq(products.id, productId))
		.limit(1);

	if (!product) {
		return;
	}

	await recalculateProductReviewAggregates(product.id, client);
	await recalculateVendorReviewAggregates(product.vendorId, client);
}

export async function syncReviewVoteCounts(reviewId: string, tx?: any): Promise<void> {
	const client = getClient(tx);
	const [voteStats] = await client
		.select({
			helpfulCount:
				sql<number>`coalesce(sum(case when ${reviewVotes.voteType} = 'helpful' then 1 else 0 end), 0)::int`,
			notHelpfulCount:
				sql<number>`coalesce(sum(case when ${reviewVotes.voteType} = 'not_helpful' then 1 else 0 end), 0)::int`,
		})
		.from(reviewVotes)
		.where(eq(reviewVotes.reviewId, reviewId));

	await client
		.update(productReviews)
		.set({
			helpfulCount: Number(voteStats?.helpfulCount ?? 0),
			notHelpfulCount: Number(voteStats?.notHelpfulCount ?? 0),
		})
		.where(eq(productReviews.id, reviewId));
}
