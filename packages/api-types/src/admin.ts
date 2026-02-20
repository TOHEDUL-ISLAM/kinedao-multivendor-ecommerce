import { z } from "zod";

// =====================
// Dashboard Overview
// =====================

export interface AdminOverviewDTO {
	totalUsers: number;
	activeVendors: number;
	totalOrders: number;
	totalRevenue: number; // paisa
	pendingVendors: number;
	pendingProducts: number;
	pendingPayouts: number;
	recentOrders: Array<{
		id: string;
		orderNumber: string;
		customerName: string;
		vendorName: string;
		status: string;
		total: number; // paisa
		createdAt: string;
	}>;
	monthOverMonth: {
		users: number; // % growth
		vendors: number;
		orders: number;
		revenue: number;
	};
}

// =====================
// Vendor Management
// =====================

export const adminVendorListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: z.enum(["all", "pending", "approved", "rejected"]).default("all"),
	search: z.string().optional(),
});

export type AdminVendorListQuery = z.infer<typeof adminVendorListQuerySchema>;

export interface AdminVendorListItemDTO {
	id: string; // Application ID
	shopNameEn: string;
	shopNameBn: string | null;
	ownerName: string;
	email: string;
	phone: string;
	status: string;
	createdAt: string;
	reviewedAt: string | null;
}

export interface AdminVendorListResponseDTO {
	vendors: AdminVendorListItemDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface AdminVendorCountsDTO {
	pending: number;
	approved: number;
	rejected: number;
}

export interface AdminVendorDetailDTO {
	id: string; // Application ID
	userId: string;
	status: string;
	shopNameEn: string;
	shopNameBn: string | null;
	ownerName: string;
	phone: string;
	email: string;
	businessType: string;
	addressLine1: string;
	addressLine2: string | null;
	district: string;
	city: string;
	postalCode: string | null;
	nidNumber: string;
	nidFrontUrl: string;
	nidBackUrl: string;
	tradeLicenseUrl: string | null;
	shopLogoUrl: string | null;
	bankName: string | null;
	bankAccountNumber: string | null;
	bankAccountName: string | null;
	bkashNumber: string | null;
	nagadNumber: string | null;
	slug: string;
	reviewNotes: string | null;
	reviewedAt: string | null;
	reviewedBy: string | null;
	vendorId: string | null;
	createdAt: string;
	updatedAt: string;
}

export const adminVendorStatusUpdateSchema = z.object({
	status: z.enum(["approved", "rejected"]),
	reviewNotes: z.string().max(1000).optional(),
});

export type AdminVendorStatusUpdateInput = z.infer<
	typeof adminVendorStatusUpdateSchema
>;

// =====================
// Product Moderation
// =====================

export const adminProductListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: z.enum(["all", "pending", "approved", "rejected"]).default("all"),
	search: z.string().optional(),
	vendorId: z.string().uuid().optional(),
	sort: z.enum(["newest", "oldest"]).default("newest"),
});

export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;

export type ProductPendingReason = "new_submission" | "vendor_update";

export interface AdminProductListItemDTO {
	id: string;
	title: string;
	titleBn: string | null;
	slug: string;
	status: string;
	imageUrl: string | null;
	vendorName: string;
	vendorId: string;
	categoryName: string;
	priceAmount: number; // lowest SKU price in paisa
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	submittedAt: string | null;
	pendingReason: ProductPendingReason | null;
	hasVendorUpdate: boolean;
}

export interface AdminProductListResponseDTO {
	products: AdminProductListItemDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface AdminProductCountsDTO {
	pending: number;
	approved: number;
	rejected: number;
}

export interface AdminProductDetailDTO {
	id: string;
	title: string;
	titleBn: string | null;
	slug: string;
	categoryId: string;
	categoryName: string;
	brand: string | null;
	shortDescription: string | null;
	shortDescriptionBn: string | null;
	description: string | null;
	descriptionBn: string | null;
	ageRange: string | null;
	ageRangeMin: number | null;
	ageRangeMax: number | null;
	isBpaFree: boolean;
	isOrganic: boolean;
	isHypoallergenic: boolean;
	hasSmallParts: boolean;
	safetyWarningEn: string | null;
	safetyWarningBn: string | null;
	safetyCertifications: string[] | null;
	weightLimitKg: number | null;
	expiryDate: string | null;
	status: string;
	isActive: boolean;
	submittedAt: string | null;
	pendingReason: ProductPendingReason | null;
	hasVendorUpdate: boolean;
	reviewNotes: string | null;
	lastReviewedAt: string | null;
	lastReviewedBy: string | null;
	vendorId: string;
	vendorName: string;
	images: Array<{
		id: string;
		s3Key: string;
		variant: "original" | "medium" | "thumbnail";
		isPrimary: boolean;
		sortOrder: number | null;
	}>;
	options: Array<{
		id: string;
		name: string;
		nameBn: string | null;
		values: string[] | null;
		valuesBn: string[] | null;
		sortOrder: number | null;
	}>;
	skus: Array<{
		id: string;
		sku: string;
		optionValues: Record<string, string> | null;
		priceAmount: number;
		compareAtAmount: number | null;
		stockQty: number;
		isAvailable: boolean | null;
	}>;
	createdAt: string;
	updatedAt: string;
}

export const adminProductStatusUpdateSchema = z.object({
	status: z.enum(["approved", "rejected"]),
	reviewNotes: z.string().max(1000).optional(),
});

export type AdminProductStatusUpdateInput = z.infer<
	typeof adminProductStatusUpdateSchema
>;

export const adminProductActiveUpdateSchema = z.object({
	isActive: z.boolean(),
	reason: z.string().max(1000).optional(),
});

export type AdminProductActiveUpdateInput = z.infer<
	typeof adminProductActiveUpdateSchema
>;

// =====================
// Order Oversight
// =====================

export const adminOrderListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: z
		.enum([
			"all",
			"pending",
			"confirmed",
			"processing",
			"shipped",
			"delivered",
			"paid_to_admin",
			"completed",
			"returned",
			"cancelled",
		])
		.default("all"),
	search: z.string().optional(), // Order number or customer name
	dateFrom: z.string().optional(), // ISO date
	dateTo: z.string().optional(), // ISO date
	sort: z.enum(["newest", "oldest"]).default("newest"),
});

export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;

export interface AdminOrderListItemDTO {
	id: string;
	orderNumber: string;
	customerName: string;
	vendorName: string;
	status: string;
	total: number; // paisa
	itemCount: number;
	createdAt: string;
}

export interface AdminOrderListResponseDTO {
	orders: AdminOrderListItemDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface AdminOrderDetailDTO {
	id: string;
	orderNumber: string;
	status: string;
	paymentMethod: string;
	subtotal: number; // paisa
	shippingCost: number; // paisa
	codFee: number; // paisa
	total: number; // paisa
	customerNotes: string | null;
	trackingNumber: string | null;
	trackingCarrier: string | null;
	courierName: string | null;
	courierOrderRef: string | null;
	actualCourierCostPaisa: number;
	returnFeePaisa: number;
	commissionRateSnapshot: number | null; // basis points
	commissionAmountPaisa: number | null;
	vendorNetPaisa: number | null;
	paidToAdminAt: string | null;
	completedAt: string | null;
	returnedAt: string | null;
	userId: string;
	customerName: string;
	customerEmail: string;
	vendorId: string;
	vendorName: string;
	shippingAddress: {
		fullName: string;
		phone: string;
		alternatePhone: string | null;
		addressLine1: string;
		addressLine2: string | null;
		city: string;
		district: string;
		postalCode: string | null;
		deliveryInstructions: string | null;
	};
	items: Array<{
		id: string;
		productId: string;
		quantity: number;
		unitPrice: number; // paisa
		lineTotal: number; // paisa
		productSnapshot: {
			title: string;
			titleBn: string | null;
			slug: string;
			image: string | null;
			selectedOptions: Record<string, string> | null;
			skuCode: string | null;
		};
	}>;
	createdAt: string;
	confirmedAt: string | null;
	processingAt: string | null;
	shippedAt: string | null;
	deliveredAt: string | null;
	cancelledAt: string | null;
}

// =====================
// User Management
// =====================

export const adminUserListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	search: z.string().optional(), // Name or email
});

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

export interface AdminUserListItemDTO {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	orderCount: number;
	totalSpent: number; // paisa
	createdAt: string;
}

export interface AdminUserListResponseDTO {
	users: AdminUserListItemDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

// =====================
// Payout Processing
// =====================

export interface AdminPendingPayoutDTO {
	vendorId: string;
	vendorName: string;
	vendorSlug: string;
	orderCount: number; // Financially reconciled orders
	pendingAmount: number; // Backward-compat: equals availableAmount
	availableAmount: number; // paisa, ready to pay now
	pendingBalance: number; // paisa, still in clearing hold
	paymentMethod: string; // From vendor application
	bankAccountNumber: string | null;
	bkashNumber: string | null;
	nagadNumber: string | null;
	lastPayoutDate: string | null;
	lastPayoutAmount: number | null; // paisa
}

export const adminPayoutProcessSchema = z.object({
	vendorId: z.string().uuid(),
	amountPaisa: z.coerce.number().int().min(1).optional(), // Optional; server can auto-compute full payable
	payoutFeePaisa: z.coerce.number().int().min(0).optional(),
	paymentMethod: z.enum(["bank", "bkash", "nagad"]),
	paymentReference: z
		.string()
		.min(1, "Payment reference is required")
		.max(100),
	notes: z.string().max(500).optional(),
	periodStart: z.string().optional(), // ISO date
	periodEnd: z.string().optional(), // ISO date
});

export type AdminPayoutProcessInput = z.infer<typeof adminPayoutProcessSchema>;

export interface AdminPayoutHistoryItemDTO {
	id: string;
	vendorId: string;
	vendorName: string;
	amountPaisa: number;
	payoutFeePaisa: number;
	paymentMethod: string;
	paymentReference: string | null;
	status: string;
	processedAt: string | null;
	processedBy: string | null; // Admin user ID
	processedByName: string | null; // Admin name
	periodStart: string;
	periodEnd: string;
	notes: string | null;
	createdAt: string;
}

export interface AdminPayoutHistoryResponseDTO {
	payouts: AdminPayoutHistoryItemDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export const adminPayoutHistoryQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	vendorId: z.string().uuid().optional(),
});

export type AdminPayoutHistoryQuery = z.infer<
	typeof adminPayoutHistoryQuerySchema
>;

export const adminOrderReconcileSchema = z.object({
	actualCourierCostPaisa: z.coerce.number().int().min(0),
	returnFeePaisa: z.coerce.number().int().min(0).optional().default(0),
	deductDeliveryFromVendor: z.boolean().optional().default(false),
	deductReturnFeeFromVendor: z.boolean().optional().default(false),
	courierName: z.string().max(40).optional(),
	courierOrderRef: z.string().max(120).optional(),
	notes: z.string().max(500).optional(),
});

export type AdminOrderReconcileInput = z.infer<typeof adminOrderReconcileSchema>;

export const adminSettlementClearSchema = z.object({
	maturityDays: z.coerce.number().int().min(0).max(30).optional().default(7),
});

export type AdminSettlementClearInput = z.infer<typeof adminSettlementClearSchema>;

export interface AdminWalletSummaryDTO {
	vendorId: string;
	availableBalancePaisa: number;
	pendingBalancePaisa: number;
	computedPayablePaisa: number;
	commissionRatePercent: number;
}

// =====================
// Banner Management
// =====================

export const adminBannerFormSchema = z.object({
	titleEn: z.string().min(1, "English title is required").max(200),
	titleBn: z.string().max(200).optional(),
	subtitleEn: z.string().max(300).optional(),
	subtitleBn: z.string().max(300).optional(),
	priceLabel: z.string().max(100).optional(),
	badgeText: z.string().max(50).optional(),
	badgeColor: z.enum(["red", "teal", "purple", "orange", "green"]).optional(),
	ctaText: z.string().max(100).optional(),
	discountPercentage: z.coerce.number().int().min(1).max(100).optional(),
	imageUrl: z.string().url("Invalid image URL"),
	s3Key: z.string().min(1, "S3 key is required"),
	linkUrl: z.string().refine(
		(val) => !val || val.startsWith("/") || val.startsWith("http://") || val.startsWith("https://"),
		{ message: "Link URL must be a relative path (starting with /) or absolute URL (starting with http:// or https://)" }
	).optional(),
	placement: z.enum(["hero_carousel", "promotional_card", "homepage_middle", "sidebar"]),
	isActive: z.boolean().default(true),
	sortOrder: z.coerce.number().int().default(0),
	startsAt: z.string().optional(), // ISO date
	endsAt: z.string().optional(), // ISO date
});

export type AdminBannerFormInput = z.infer<typeof adminBannerFormSchema>;

export const adminHeroBannerFormSchema = z.object({
	imageUrl: z.string().url("Invalid image URL"),
	s3Key: z.string().min(1, "S3 key is required"),
	linkUrl: z.string().refine(
		(val) =>
			val.startsWith("/") ||
			val.startsWith("http://") ||
			val.startsWith("https://"),
		{
			message:
				"Link URL must be a relative path (starting with /) or absolute URL (starting with http:// or https://)",
		},
	),
	altText: z.string().max(200).optional(),
	isActive: z.boolean().default(true),
	sortOrder: z.coerce.number().int().default(0),
	startsAt: z.string().optional(), // ISO date
	endsAt: z.string().optional(), // ISO date
});

export type AdminHeroBannerFormInput = z.infer<typeof adminHeroBannerFormSchema>;

export const adminSideCardFormSchema = z.object({
	titleEn: z.string().min(1, "English title is required").max(200),
	titleBn: z.string().max(200).optional(),
	subtitleEn: z.string().max(300).optional(),
	subtitleBn: z.string().max(300).optional(),
	imageUrl: z.string().url("Invalid image URL"),
	s3Key: z.string().min(1, "S3 key is required"),
	linkUrl: z
		.string()
		.refine(
			(val) =>
				!val ||
				val.startsWith("/") ||
				val.startsWith("http://") ||
				val.startsWith("https://"),
			{
				message:
					"Link URL must be a relative path (starting with /) or absolute URL (starting with http:// or https://)",
			},
		)
		.optional(),
	discountPercentage: z.coerce.number().int().min(1).max(100).optional(),
	badgeText: z.string().max(50).optional(),
	badgeColor: z.enum(["red", "teal", "purple", "orange", "green"]).optional(),
	isActive: z.boolean().default(true),
	sortOrder: z.coerce.number().int().min(0).max(2).default(0),
});

export type AdminSideCardFormInput = z.infer<typeof adminSideCardFormSchema>;

export interface AdminBannerListItemDTO {
	id: string;
	titleEn: string;
	titleBn: string | null;
	subtitleEn: string | null;
	subtitleBn: string | null;
	priceLabel: string | null;
	badgeText: string | null;
	badgeColor: string | null;
	ctaText: string | null;
	discountPercentage: number | null;
	imageUrl: string;
	s3Key: string;
	linkUrl: string | null;
	placement: string;
	isActive: boolean;
	sortOrder: number;
	startsAt: string | null;
	endsAt: string | null;
	createdAt: string;
}

export interface AdminHeroBannerListItemDTO {
	id: string;
	imageUrl: string;
	s3Key: string;
	linkUrl: string;
	altText: string;
	isActive: boolean;
	sortOrder: number;
	startsAt: string | null;
	endsAt: string | null;
	createdAt: string;
	status: "active" | "scheduled" | "inactive";
}

export interface AdminSideCardListItemDTO {
	id: string;
	titleEn: string;
	titleBn: string | null;
	subtitleEn: string | null;
	subtitleBn: string | null;
	imageUrl: string;
	s3Key: string;
	linkUrl: string | null;
	discountPercentage: number | null;
	badgeText: string | null;
	badgeColor: string | null;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
}

export const adminBannerReorderSchema = z.object({
	banners: z.array(
		z.object({
			id: z.string().uuid(),
			sortOrder: z.number().int(),
		}),
	),
});

export type AdminBannerReorderInput = z.infer<typeof adminBannerReorderSchema>;

// =====================
// Category Management
// =====================

export const adminCategoryFormSchema = z.object({
	name: z.string().min(1, "Category name is required").max(200),
	nameBn: z.string().max(200).optional(),
	slug: z.string().min(1, "Slug is required").max(200),
	parentId: z.string().uuid().nullable().optional(),
	iconKey: z.string().max(50).optional(),
	sortOrder: z.coerce.number().int().default(0),
	isFeatured: z.boolean().default(false),
	isPopular: z.boolean().default(false),
});

export type AdminCategoryFormInput = z.infer<typeof adminCategoryFormSchema>;

export interface AdminCategoryListItemDTO {
	id: string;
	name: string;
	nameBn: string | null;
	slug: string;
	parentId: string | null;
	iconKey: string | null;
	sortOrder: number | null;
	isFeatured: boolean | null;
	isPopular: boolean | null;
	productCount: number;
	createdAt: string;
}

// =====================
// Brand Management
// =====================

export const adminBrandFormSchema = z.object({
	name: z.string().min(1, "Brand name is required").max(100),
	slug: z.string().min(1, "Slug is required").max(100),
	logoUrl: z.string().url("Invalid logo URL").optional(),
	s3Key: z.string().optional(),
	sortOrder: z.coerce.number().int().default(0),
	isActive: z.boolean().default(true),
});

export type AdminBrandFormInput = z.infer<typeof adminBrandFormSchema>;

export interface AdminBrandListItemDTO {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	s3Key: string | null;
	sortOrder: number;
	isActive: boolean;
	productCount: number;
	createdAt: string;
}
