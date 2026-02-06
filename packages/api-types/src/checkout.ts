import { z } from "zod";
import { BD_DISTRICTS } from "./vendor";

// BD Phone regex (same as vendor module)
const bdPhoneRegex = /^01[3-9]\d{8}$/;

// =====================
// Shipping Address Schemas
// =====================

export const shippingAddressSchema = z.object({
	fullName: z.string().min(2).max(200),
	phone: z
		.string()
		.regex(bdPhoneRegex, "Invalid BD phone number (e.g., 01712345678)"),
	alternatePhone: z
		.string()
		.regex(bdPhoneRegex, "Invalid BD phone number")
		.optional()
		.or(z.literal("")),
	addressLine1: z.string().min(5).max(500),
	addressLine2: z.string().max(500).optional(),
	city: z.string().min(2).max(100),
	district: z.enum(BD_DISTRICTS as any, {
		message: "Please select a district",
	}),
	postalCode: z.string().max(10).optional(),
	deliveryInstructions: z.string().max(500).optional(),
	isDefault: z.boolean().optional(),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

export const shippingAddressParamSchema = z.object({
	addressId: z.string().uuid(),
});

export const shippingCostQuerySchema = z.object({
	district: z.string().min(1),
});

// =====================
// Shipping Cost Constants & Types
// =====================

export const SHIPPING_ZONES = {
	dhaka_metro: {
		districts: ["Dhaka"],
		costPaisa: 6000, // ৳60
		estimatedDays: "1-2",
		labelEn: "Dhaka Metro",
		labelBn: "ঢাকা মেট্রো",
	},
	dhaka_suburbs: {
		districts: ["Gazipur", "Narayanganj", "Manikganj"],
		costPaisa: 8000, // ৳80
		estimatedDays: "2-3",
		labelEn: "Dhaka Suburbs",
		labelBn: "ঢাকা শহরতলী",
	},
	major_cities: {
		districts: [
			"Chattogram",
			"Sylhet",
			"Rajshahi",
			"Khulna",
			"Rangpur",
			"Barishal",
		],
		costPaisa: 10000, // ৳100
		estimatedDays: "3-5",
		labelEn: "Major Cities",
		labelBn: "প্রধান শহর",
	},
	other: {
		districts: [], // Everything else
		costPaisa: 13000, // ৳130
		estimatedDays: "5-7",
		labelEn: "Other Districts",
		labelBn: "অন্যান্য জেলা",
	},
} as const;

export type ShippingZone = keyof typeof SHIPPING_ZONES;

// =====================
// Place Order Schema
// =====================

export const placeOrderSchema = z.object({
	shippingAddressId: z.string().uuid(),
	customerNotes: z.string().max(500).optional(),
	acceptedTerms: z.literal(true, {
		message: "You must accept the terms and conditions",
	}),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

// =====================
// Response DTOs
// =====================

export interface ShippingAddressDTO {
	id: string;
	fullName: string;
	phone: string;
	alternatePhone: string | null;
	addressLine1: string;
	addressLine2: string | null;
	city: string;
	district: string;
	postalCode: string | null;
	deliveryInstructions: string | null;
	isDefault: boolean;
	createdAt: string;
}

export interface ShippingCostDTO {
	zone: ShippingZone;
	costPaisa: number;
	estimatedDays: string;
	labelEn: string;
	labelBn: string;
}

export interface OrderItemDTO {
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
		ageRange: string | null;
		isBpaFree: boolean;
		isOrganic: boolean;
		isHypoallergenic: boolean;
	};
}

export interface OrderDTO {
	id: string;
	orderNumber: string;
	groupId: string;
	vendorId: string;
	vendorName: string;
	status: string;
	paymentMethod: string;
	subtotal: number;
	shippingCost: number;
	codFee: number;
	total: number;
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
	customerNotes: string | null;
	items: OrderItemDTO[];
	createdAt: string;
}

export interface PlaceOrderResponseDTO {
	success: boolean;
	groupId: string;
	orders: OrderDTO[];
	grandTotal: number;
}

export interface OrderGroupDTO {
	groupId: string;
	orders: OrderDTO[];
	grandTotal: number;
	createdAt: string;
}
