// Vendor Applications schema - for vendor registration workflow
import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { vendors } from "./vendors";

// Application status enum values
export const APPLICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// Business type enum values
export const BUSINESS_TYPES = ["sole_proprietor", "partnership", "company"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

// Vendor Applications table - stores vendor registration applications
export const vendorApplications = pgTable(
  "vendor_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Link to authenticated user (Better-Auth uses text IDs)
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(), // One application per user

    // Application status
    status: varchar("status", { length: 20 })
      .notNull()
      .default("pending")
      .$type<ApplicationStatus>(),

    // ==================
    // Step 1: Business Info
    // ==================
    shopNameEn: varchar("shop_name_en", { length: 200 }).notNull(),
    shopNameBn: varchar("shop_name_bn", { length: 200 }),
    ownerName: varchar("owner_name", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(), // BD format: 01XXXXXXXXX
    email: varchar("email", { length: 255 }).notNull(),
    businessType: varchar("business_type", { length: 50 })
      .notNull()
      .$type<BusinessType>(),

    // ==================
    // Step 2: Address
    // ==================
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    district: varchar("district", { length: 100 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    postalCode: varchar("postal_code", { length: 10 }),

    // ==================
    // Step 3: Documents
    // ==================
    nidNumber: varchar("nid_number", { length: 20 }).notNull(), // 10 or 17 digits
    nidFrontUrl: text("nid_front_url").notNull(),
    nidBackUrl: text("nid_back_url").notNull(),
    tradeLicenseUrl: text("trade_license_url"), // Optional
    shopLogoUrl: text("shop_logo_url"), // Optional

    // ==================
    // Step 4: Payment Info
    // ==================
    // At least one payment method required
    bankName: varchar("bank_name", { length: 100 }),
    bankAccountNumber: varchar("bank_account_number", { length: 50 }),
    bankAccountName: varchar("bank_account_name", { length: 200 }),
    bkashNumber: varchar("bkash_number", { length: 20 }),
    nagadNumber: varchar("nagad_number", { length: 20 }),

    // ==================
    // Generated Fields
    // ==================
    slug: varchar("slug", { length: 200 }).notNull().unique(),

    // ==================
    // Review Fields
    // ==================
    reviewNotes: text("review_notes"),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),

    // Link to vendor after approval
    vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "set null" }),

    // ==================
    // Timestamps
    // ==================
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("vendor_applications_user_id_idx").on(table.userId),
    index("vendor_applications_status_idx").on(table.status),
    index("vendor_applications_slug_idx").on(table.slug),
  ]
);

export type VendorApplication = typeof vendorApplications.$inferSelect;
export type NewVendorApplication = typeof vendorApplications.$inferInsert;
