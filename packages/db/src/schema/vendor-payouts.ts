import {
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { vendors } from "./vendors";

// Payout statuses
export const PAYOUT_STATUSES = ["pending", "completed", "failed"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

// Vendor payouts table
export const vendorPayouts = pgTable(
	"vendor_payouts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		vendorId: uuid("vendor_id")
			.notNull()
			.references(() => vendors.id, { onDelete: "cascade" }),

		// Payout details (amount in paisa)
		amountPaisa: integer("amount_paisa").notNull(),
		periodStart: timestamp("period_start").notNull(),
		periodEnd: timestamp("period_end").notNull(),

		// Payment info
		paymentMethod: varchar("payment_method", { length: 20 }).notNull(), // bank, bkash, nagad
		paymentReference: varchar("payment_reference", { length: 100 }), // Transaction ID

		// Status
		status: varchar("status", { length: 20 })
			.notNull()
			.default("pending")
			.$type<PayoutStatus>(),
		processedAt: timestamp("processed_at"),

		notes: text("notes"),

		// Timestamps
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("vendor_payouts_vendor_id_idx").on(table.vendorId),
		index("vendor_payouts_status_idx").on(table.status),
	],
);

// Relations
export const vendorPayoutsRelations = relations(vendorPayouts, ({ one }) => ({
	vendor: one(vendors, {
		fields: [vendorPayouts.vendorId],
		references: [vendors.id],
	}),
}));

export type VendorPayout = typeof vendorPayouts.$inferSelect;
export type NewVendorPayout = typeof vendorPayouts.$inferInsert;
