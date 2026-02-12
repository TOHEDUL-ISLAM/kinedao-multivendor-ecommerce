import { z } from "zod";

// =====================
// Vendor Identity
// =====================

export interface VendorIdentityDTO {
	vendorId: string;
	vendorName: string;
	vendorSlug: string;
	vendorLogo: string | null;
	isVerified: boolean;
}

// =====================
// Dashboard Overview (US-9.1)
// =====================

export interface VendorDashboardStatsDTO {
	totalOrders: number;
	pendingOrders: number;
	totalEarnings: number; // paisa - sum of delivered orders
	pendingPayout: number; // paisa - delivered but not yet paid out
	productsListed: number;
	productsPendingApproval: number;
}

export interface VendorRecentOrderDTO {
	id: string;
	orderNumber: string;
	customerName: string;
	status: string;
	total: number;
	itemCount: number;
	createdAt: string;
}

export interface VendorLowStockProductDTO {
	id: string;
	title: string;
	slug: string;
	imageUrl: string | null;
	skuId: string;
	sku: string;
	stockQty: number;
}

export interface VendorDashboardOverviewDTO {
	vendor: VendorIdentityDTO;
	stats: VendorDashboardStatsDTO;
	recentOrders: VendorRecentOrderDTO[];
	lowStockProducts: VendorLowStockProductDTO[];
}

// =====================
// Product Management (US-9.2)
// =====================

export interface VendorProductListItemDTO {
	id: string;
	title: string;
	titleBn: string | null;
	slug: string;
	status: string;
	imageUrl: string | null;
	categoryName: string;
	categoryId: string;
	priceAmount: number; // lowest SKU price in paisa
	totalStock: number; // sum of all SKU stock
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface VendorProductListResponseDTO {
	products: VendorProductListItemDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export const vendorProductListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: z
		.enum(["all", "draft", "pending", "approved", "rejected"])
		.default("all"),
	active: z.enum(["all", "active", "inactive"]).default("all"),
	search: z.string().optional(),
	categoryId: z.string().uuid().optional(),
	sort: z
		.enum(["newest", "oldest", "price_asc", "price_desc", "stock_asc"])
		.default("newest"),
});

export type VendorProductListQuery = z.infer<
	typeof vendorProductListQuerySchema
>;

// Product form schema for create/edit
const vendorProductImageSchema = z.object({
	s3Key: z.string().min(1),
	variant: z
		.enum(["original", "medium", "thumbnail"])
		.default("original"),
	sortOrder: z.number().int().min(0),
});

const vendorProductOptionSchema = z.object({
	name: z.string().min(1).max(50),
	nameBn: z.string().max(50).optional(),
	values: z.array(z.string().min(1)).min(1),
	valuesBn: z.array(z.string()).optional(),
});

const vendorProductSkuSchema = z.object({
	sku: z.string().max(50).default(""),
	optionValues: z.record(z.string(), z.string()).optional(),
	priceAmount: z.coerce.number().int().min(0).default(0),
	compareAtAmount: z.coerce.number().int().min(0).optional(),
	stockQty: z.coerce.number().int().min(0).default(0),
	isAvailable: z.boolean().default(true),
});

export const vendorProductFormSchema = z.object({
	// Basic Info
	title: z.string().trim().min(1, "Title is required").max(300),
	titleBn: z.string().max(300).optional(),
	categoryId: z.string().uuid("Please select a category"),
	brand: z.string().max(100).optional(),

	// Description
	shortDescription: z.string().max(500).optional(),
	shortDescriptionBn: z.string().max(500).optional(),
	description: z.string().max(5000).optional(),
	descriptionBn: z.string().max(5000).optional(),

	// Baby Info
	ageRange: z.string().max(50).optional(),
	ageRangeMin: z.coerce.number().int().min(0).max(36).optional(),
	ageRangeMax: z.coerce.number().int().min(0).max(36).optional(),
	isBpaFree: z.boolean().default(false),
	isOrganic: z.boolean().default(false),
	isHypoallergenic: z.boolean().default(false),
	hasSmallParts: z.boolean().default(false),

	// Safety
	safetyWarningEn: z.string().max(1000).optional(),
	safetyWarningBn: z.string().max(1000).optional(),
	safetyCertifications: z.array(z.string()).optional(),
	weightLimitKg: z.coerce.number().min(0).optional(),
	expiryDate: z.string().optional(), // ISO date string

	// Images (array of S3 keys)
	images: z
		.array(vendorProductImageSchema)
		.max(5, "Maximum 5 images allowed")
		.default([]),

	// Options (for variants: Size, Color, etc.)
	options: z.array(vendorProductOptionSchema).optional(),

	// SKUs (pricing + inventory per variant)
	skus: z.array(vendorProductSkuSchema).default([]),

	// Publish action
	isDraft: z.boolean().default(false),
}).superRefine((data, ctx) => {
	if (data.ageRangeMin != null && data.ageRangeMax != null && data.ageRangeMin > data.ageRangeMax) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["ageRangeMax"],
			message: "Age range max must be greater than or equal to age range min",
		});
	}

	if (data.isDraft) {
		return;
	}

	if (data.title.trim().length < 3) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["title"],
			message: "Title must be at least 3 characters",
		});
	}

	if (data.images.length < 1) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["images"],
			message: "At least one image is required",
		});
	}

	if (data.skus.length < 1) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["skus"],
			message: "At least one SKU is required",
		});
		return;
	}

	data.skus.forEach((sku, index) => {
		if (!sku.sku.trim()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["skus", index, "sku"],
				message: "SKU is required",
			});
		}

		if (sku.priceAmount < 100) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["skus", index, "priceAmount"],
				message: "Price must be at least 1 BDT",
			});
		}

		if (
			sku.compareAtAmount != null &&
			sku.compareAtAmount > 0 &&
			sku.compareAtAmount < sku.priceAmount
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["skus", index, "compareAtAmount"],
				message: "Compare-at price should be greater than or equal to price",
			});
		}
	});
});

export type VendorProductFormInput = z.infer<typeof vendorProductFormSchema>;

export interface VendorProductDetailDTO {
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

// =====================
// Order Management (US-9.3)
// =====================

export interface VendorOrderListItemDTO {
	id: string;
	orderNumber: string;
	customerName: string;
	customerPhone: string;
	status: string;
	total: number;
	itemCount: number;
	paymentMethod: string;
	createdAt: string;
}

export interface VendorOrderListResponseDTO {
	orders: VendorOrderListItemDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export const vendorOrderListQuerySchema = z.object({
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
	search: z.string().optional(),
	sort: z.enum(["newest", "oldest"]).default("newest"),
});

export type VendorOrderListQuery = z.infer<typeof vendorOrderListQuerySchema>;

export interface VendorOrderDetailDTO {
	id: string;
	orderNumber: string;
	status: string;
	paymentMethod: string;
	subtotal: number;
	shippingCost: number;
	codFee: number;
	total: number;
	customerNotes: string | null;
	trackingNumber: string | null;
	trackingCarrier: string | null;
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
		unitPrice: number;
		lineTotal: number;
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
	shippedAt: string | null;
	deliveredAt: string | null;
	cancelledAt: string | null;
}

// Status update
export const vendorOrderStatusUpdateSchema = z
	.object({
		status: z.enum([
			"confirmed",
			"processing",
			"shipped",
			"delivered",
			"cancelled",
		]),
		trackingNumber: z.string().max(100).optional(),
		trackingCarrier: z.string().max(100).optional(),
	})
	.refine(
		(data) => {
			if (data.status === "shipped") {
				return !!data.trackingNumber;
			}
			return true;
		},
		{
			message: "Tracking number is required when marking as shipped",
			path: ["trackingNumber"],
		},
	);

export type VendorOrderStatusUpdateInput = z.infer<
	typeof vendorOrderStatusUpdateSchema
>;

// Valid status transitions map
export const VENDOR_STATUS_TRANSITIONS: Record<string, string[]> = {
	pending: ["confirmed", "cancelled"],
	confirmed: ["processing", "cancelled"],
	processing: ["shipped"],
	shipped: ["delivered"],
};

// =====================
// Earnings
// =====================

export interface VendorEarningsSummaryDTO {
	totalEarnings: number; // paisa - all delivered orders
	pendingPayout: number; // paisa - not yet paid
	totalPaidOut: number; // paisa - already paid
	thisMonthEarnings: number; // paisa - current month delivered
	orderCount: number; // total delivered orders
	availableBalance: number; // paisa
	pendingBalance: number; // paisa
}

export interface VendorWalletSummaryDTO {
	availableBalance: number; // paisa
	pendingBalance: number; // paisa
	totalPaidOut: number; // paisa
}

export interface VendorTransactionItemDTO {
	id: string;
	orderId: string | null;
	payoutId: string | null;
	type: string;
	status: string;
	amountPaisa: number;
	description: string | null;
	referenceId: string | null;
	referenceType: string | null;
	createdAt: string;
}

export const vendorTransactionsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	status: z.enum(["all", "pending", "cleared", "cancelled"]).default("all"),
});

export type VendorTransactionsQuery = z.infer<typeof vendorTransactionsQuerySchema>;

export interface VendorTransactionsResponseDTO {
	transactions: VendorTransactionItemDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
