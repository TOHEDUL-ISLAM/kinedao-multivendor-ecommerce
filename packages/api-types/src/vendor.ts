import { z } from "zod";

// =====================
// Constants
// =====================

// All 64 districts of Bangladesh
export const BD_DISTRICTS = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogra",
  "Brahmanbaria",
  "Chandpur",
  "Chapainawabganj",
  "Chattogram",
  "Chuadanga",
  "Comilla",
  "Cox's Bazar",
  "Dhaka",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokati",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Nawabganj",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
] as const;

export type BDDistrict = (typeof BD_DISTRICTS)[number];

export const BUSINESS_TYPES = ["sole_proprietor", "partnership", "company"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// =====================
// Step Schemas
// =====================

// BD Phone regex: 01[3-9]XXXXXXXX (11 digits)
const bdPhoneRegex = /^01[3-9]\d{8}$/;

// NID regex: 10 or 17 digits
const nidRegex = /^(\d{10}|\d{17})$/;

// Step 1: Business Info
export const businessInfoSchema = z.object({
  shopNameEn: z
    .string()
    .min(2, "Shop name must be at least 2 characters")
    .max(200, "Shop name must not exceed 200 characters"),
  shopNameBn: z.string().max(200, "Shop name must not exceed 200 characters").optional(),
  ownerName: z
    .string()
    .min(2, "Owner name must be at least 2 characters")
    .max(200, "Owner name must not exceed 200 characters"),
  phone: z.string().regex(bdPhoneRegex, "Invalid BD phone number (e.g., 01712345678)"),
  email: z.string().email("Invalid email address"),
  businessType: z.enum(BUSINESS_TYPES, {
    error: "Please select a business type",
  }),
});

export type BusinessInfoInput = z.infer<typeof businessInfoSchema>;

// Step 2: Address
export const addressSchema = z.object({
  addressLine1: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(500, "Address must not exceed 500 characters"),
  addressLine2: z.string().max(500, "Address must not exceed 500 characters").optional(),
  district: z.enum(BD_DISTRICTS, {
    error: "Please select a district",
  }),
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must not exceed 100 characters"),
  postalCode: z.string().max(10, "Postal code must not exceed 10 characters").optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

// Step 3: Documents
export const documentsSchema = z.object({
  nidNumber: z.string().regex(nidRegex, "NID must be 10 or 17 digits"),
  nidFrontUrl: z.string().url("Invalid NID front image URL"),
  nidBackUrl: z.string().url("Invalid NID back image URL"),
  tradeLicenseUrl: z.string().url("Invalid trade license URL").optional(),
  shopLogoUrl: z.string().url("Invalid shop logo URL").optional(),
});

export type DocumentsInput = z.infer<typeof documentsSchema>;

// Step 4: Payment Info
export const paymentSchema = z
  .object({
    bankName: z.string().max(100, "Bank name must not exceed 100 characters").optional(),
    bankAccountNumber: z
      .string()
      .max(50, "Account number must not exceed 50 characters")
      .optional(),
    bankAccountName: z
      .string()
      .max(200, "Account name must not exceed 200 characters")
      .optional(),
    bkashNumber: z
      .string()
      .regex(bdPhoneRegex, "Invalid bKash number")
      .optional()
      .or(z.literal("")),
    nagadNumber: z
      .string()
      .regex(bdPhoneRegex, "Invalid Nagad number")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      const hasBank = data.bankName && data.bankAccountNumber && data.bankAccountName;
      const hasBkash = data.bkashNumber && data.bkashNumber.length > 0;
      const hasNagad = data.nagadNumber && data.nagadNumber.length > 0;
      return hasBank || hasBkash || hasNagad;
    },
    {
      message: "At least one payment method is required (Bank, bKash, or Nagad)",
    }
  );

export type PaymentInput = z.infer<typeof paymentSchema>;

// =====================
// Combined Schema
// =====================

export const vendorApplicationSchema = businessInfoSchema
  .merge(addressSchema)
  .merge(documentsSchema)
  .merge(
    z.object({
      bankName: z.string().max(100).optional(),
      bankAccountNumber: z.string().max(50).optional(),
      bankAccountName: z.string().max(200).optional(),
      bkashNumber: z.string().optional(),
      nagadNumber: z.string().optional(),
    })
  )
  .refine(
    (data) => {
      const hasBank = data.bankName && data.bankAccountNumber && data.bankAccountName;
      const hasBkash = data.bkashNumber && data.bkashNumber.length > 0;
      const hasNagad = data.nagadNumber && data.nagadNumber.length > 0;
      return hasBank || hasBkash || hasNagad;
    },
    {
      message: "At least one payment method is required (Bank, bKash, or Nagad)",
      path: ["bankName"],
    }
  );

export type VendorApplicationInput = z.infer<typeof vendorApplicationSchema>;

// =====================
// Response DTOs
// =====================

export interface VendorApplicationDTO {
  id: string;
  userId: string;
  status: ApplicationStatus;
  shopNameEn: string;
  shopNameBn: string | null;
  ownerName: string;
  phone: string;
  email: string;
  businessType: BusinessType;
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
  vendorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VendorApplicationStatusResponse {
  exists: boolean;
  canApply: boolean;
  canResubmit: boolean;
  application: VendorApplicationDTO | null;
}

export interface VendorApplicationSubmitResponse {
  success: boolean;
  application: VendorApplicationDTO;
}

// =====================
// Upload Types
// =====================

export interface UploadResponse {
  url: string;
  filename: string;
}
