import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { orders, orderItems } from "./orders";
import { products } from "./products";
import { vendors } from "./vendors";

export const REVIEW_STATUSES = ["published", "hidden", "removed"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_VOTE_TYPES = ["helpful", "not_helpful"] as const;
export type ReviewVoteType = (typeof REVIEW_VOTE_TYPES)[number];

export const productReviews = pgTable(
	"product_reviews",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		vendorId: uuid("vendor_id")
			.notNull()
			.references(() => vendors.id, { onDelete: "restrict" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "restrict" }),
		orderItemId: uuid("order_item_id")
			.notNull()
			.references(() => orderItems.id, { onDelete: "restrict" }),
		rating: integer("rating").notNull(),
		title: varchar("title", { length: 180 }),
		content: text("content").notNull(),
		status: varchar("status", { length: 20 })
			.$type<ReviewStatus>()
			.default("published")
			.notNull(),
		moderationReason: text("moderation_reason"),
		moderationNote: text("moderation_note"),
		moderatedAt: timestamp("moderated_at"),
		moderatedBy: text("moderated_by").references(() => user.id, {
			onDelete: "set null",
		}),
		isVerifiedPurchase: boolean("is_verified_purchase")
			.default(true)
			.notNull(),
		helpfulCount: integer("helpful_count").default(0).notNull(),
		notHelpfulCount: integer("not_helpful_count").default(0).notNull(),
		vendorRepliedAt: timestamp("vendor_replied_at"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => ({
		productStatusCreatedIdx: index(
			"product_reviews_product_status_created_idx",
		).on(table.productId, table.status, table.createdAt),
		vendorStatusCreatedIdx: index(
			"product_reviews_vendor_status_created_idx",
		).on(table.vendorId, table.status, table.createdAt),
		userCreatedIdx: index("product_reviews_user_created_idx").on(
			table.userId,
			table.createdAt,
		),
		ratingIdx: index("product_reviews_rating_idx").on(table.rating),
		orderItemUnique: uniqueIndex("product_reviews_order_item_unique").on(
			table.orderItemId,
		),
	}),
);

export const reviewVotes = pgTable(
	"review_votes",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		reviewId: uuid("review_id")
			.notNull()
			.references(() => productReviews.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		voteType: varchar("vote_type", { length: 20 })
			.$type<ReviewVoteType>()
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => ({
		reviewUserUnique: uniqueIndex("review_votes_review_user_unique").on(
			table.reviewId,
			table.userId,
		),
		reviewIdx: index("review_votes_review_idx").on(table.reviewId),
		userIdx: index("review_votes_user_idx").on(table.userId),
	}),
);

export const reviewReplies = pgTable(
	"review_replies",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		reviewId: uuid("review_id")
			.notNull()
			.references(() => productReviews.id, { onDelete: "cascade" }),
		vendorId: uuid("vendor_id")
			.notNull()
			.references(() => vendors.id, { onDelete: "restrict" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
		content: text("content").notNull(),
		isHidden: boolean("is_hidden").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => ({
		reviewUnique: uniqueIndex("review_replies_review_unique").on(table.reviewId),
		vendorCreatedIdx: index("review_replies_vendor_created_idx").on(
			table.vendorId,
			table.createdAt,
		),
	}),
);

export const productReviewsRelations = relations(productReviews, ({ one, many }) => ({
	product: one(products, {
		fields: [productReviews.productId],
		references: [products.id],
	}),
	vendor: one(vendors, {
		fields: [productReviews.vendorId],
		references: [vendors.id],
	}),
	user: one(user, {
		fields: [productReviews.userId],
		references: [user.id],
	}),
	order: one(orders, {
		fields: [productReviews.orderId],
		references: [orders.id],
	}),
	orderItem: one(orderItems, {
		fields: [productReviews.orderItemId],
		references: [orderItems.id],
	}),
	votes: many(reviewVotes),
	reply: one(reviewReplies, {
		fields: [productReviews.id],
		references: [reviewReplies.reviewId],
	}),
}));

export const reviewVotesRelations = relations(reviewVotes, ({ one }) => ({
	review: one(productReviews, {
		fields: [reviewVotes.reviewId],
		references: [productReviews.id],
	}),
	user: one(user, {
		fields: [reviewVotes.userId],
		references: [user.id],
	}),
}));

export const reviewRepliesRelations = relations(reviewReplies, ({ one }) => ({
	review: one(productReviews, {
		fields: [reviewReplies.reviewId],
		references: [productReviews.id],
	}),
	vendor: one(vendors, {
		fields: [reviewReplies.vendorId],
		references: [vendors.id],
	}),
	user: one(user, {
		fields: [reviewReplies.userId],
		references: [user.id],
	}),
}));

export type ProductReview = typeof productReviews.$inferSelect;
export type NewProductReview = typeof productReviews.$inferInsert;
export type ReviewVote = typeof reviewVotes.$inferSelect;
export type NewReviewVote = typeof reviewVotes.$inferInsert;
export type ReviewReply = typeof reviewReplies.$inferSelect;
export type NewReviewReply = typeof reviewReplies.$inferInsert;
