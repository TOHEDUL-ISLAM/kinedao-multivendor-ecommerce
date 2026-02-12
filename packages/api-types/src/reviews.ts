import { z } from "zod";

export const REVIEW_STATUSES = ["published", "hidden", "removed"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_SORT_OPTIONS = [
	"recent",
	"highest",
	"lowest",
	"helpful",
] as const;
export type ReviewSortOption = (typeof REVIEW_SORT_OPTIONS)[number];

export interface ReviewAuthorDTO {
	userId: string;
	name: string;
	email: string;
	avatar: string | null;
}

export interface ReviewReplyDTO {
	id: string;
	vendorId: string;
	vendorName: string;
	content: string;
	createdAt: string;
}

export interface ReviewListItemDTO {
	id: string;
	productId: string;
	productTitle: string;
	productSlug: string;
	vendorId: string;
	vendorName: string;
	userId: string;
	rating: number;
	title: string | null;
	content: string;
	status: ReviewStatus;
	helpfulCount: number;
	notHelpfulCount: number;
	isVerifiedPurchase: boolean;
	createdAt: string;
	updatedAt: string;
	author: ReviewAuthorDTO;
	reply: ReviewReplyDTO | null;
	viewerVote: "helpful" | "not_helpful" | null;
}

export interface ReviewListResponseDTO {
	items: ReviewListItemDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface ProductReviewSummaryDTO {
	productId: string;
	averageRating: number;
	totalReviews: number;
	distribution: Array<{
		stars: number;
		count: number;
		percentage: number;
	}>;
}

export interface ReviewEligibilityDTO {
	productId: string;
	canReview: boolean;
	eligibleDeliveredItems: number;
	remainingReviewSlots: number;
	reason:
		| "eligible"
		| "not_authenticated"
		| "no_delivered_order"
		| "already_reviewed";
}

export const reviewListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
	sort: z.enum(REVIEW_SORT_OPTIONS).default("recent"),
	rating: z.coerce.number().int().min(1).max(5).optional(),
});

export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;

export const createReviewSchema = z.object({
	productId: z.string().uuid(),
	rating: z.coerce.number().int().min(1).max(5),
	title: z.string().trim().max(180).optional(),
	content: z.string().trim().min(8).max(3000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z.object({
	rating: z.coerce.number().int().min(1).max(5).optional(),
	title: z.string().trim().max(180).optional(),
	content: z.string().trim().min(8).max(3000).optional(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export const reviewVoteSchema = z.object({
	voteType: z.enum(["helpful", "not_helpful"]),
});

export type ReviewVoteInput = z.infer<typeof reviewVoteSchema>;

export const vendorReplySchema = z.object({
	content: z.string().trim().min(2).max(2000),
});

export type VendorReplyInput = z.infer<typeof vendorReplySchema>;

export const vendorReviewListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
	sort: z.enum(REVIEW_SORT_OPTIONS).default("recent"),
	rating: z.coerce.number().int().min(1).max(5).optional(),
	status: z.enum(["all", ...REVIEW_STATUSES]).default("all"),
	search: z.string().trim().optional(),
});

export type VendorReviewListQuery = z.infer<typeof vendorReviewListQuerySchema>;

export interface VendorReviewOverviewDTO {
	reviewScore: number;
	totalCustomers: number;
	newCustomersPercent: number;
	regularCustomersPercent: number;
	totalReviews: number;
	distribution: Array<{
		stars: number;
		count: number;
		percentage: number;
	}>;
}

export interface VendorReviewListItemDTO extends ReviewListItemDTO {
	productImageUrl: string | null;
}

export interface VendorReviewListResponseDTO {
	reviews: VendorReviewListItemDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export const adminReviewListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	sort: z.enum(REVIEW_SORT_OPTIONS).default("recent"),
	status: z.enum(["all", ...REVIEW_STATUSES]).default("all"),
	rating: z.coerce.number().int().min(1).max(5).optional(),
	vendorId: z.string().uuid().optional(),
	productId: z.string().uuid().optional(),
	search: z.string().trim().optional(),
});

export type AdminReviewListQuery = z.infer<typeof adminReviewListQuerySchema>;

export interface AdminReviewListItemDTO extends ReviewListItemDTO {
	productImageUrl: string | null;
	moderationReason: string | null;
	moderationNote: string | null;
	moderatedAt: string | null;
	moderatedBy: string | null;
}

export interface AdminReviewListResponseDTO {
	reviews: AdminReviewListItemDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export const adminModerateReviewSchema = z.object({
	status: z.enum(["published", "hidden", "removed"]),
	moderationReason: z.string().trim().max(1000).optional(),
	moderationNote: z.string().trim().max(2000).optional(),
});

export type AdminModerateReviewInput = z.infer<typeof adminModerateReviewSchema>;

export const adminReviewAnalyticsQuerySchema = z.object({
	days: z.coerce.number().int().min(7).max(365).default(30),
});

export type AdminReviewAnalyticsQuery = z.infer<
	typeof adminReviewAnalyticsQuerySchema
>;

export interface AdminReviewAnalyticsDTO {
	timeRangeDays: number;
	totalReviews: number;
	publishedReviews: number;
	hiddenOrRemovedReviews: number;
	averageRating: number;
	distribution: Array<{
		stars: number;
		count: number;
		percentage: number;
	}>;
	topRatedProducts: Array<{
		productId: string;
		productTitle: string;
		vendorId: string;
		vendorName: string;
		averageRating: number;
		reviewCount: number;
	}>;
	lowestRatedProducts: Array<{
		productId: string;
		productTitle: string;
		vendorId: string;
		vendorName: string;
		averageRating: number;
		reviewCount: number;
	}>;
}
