import { relations } from "drizzle-orm";
import {
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { vendors } from "./vendors";
import { vendorPayouts } from "./vendor-payouts";

export const TRANSACTION_TYPES = [
	"sale",
	"commission_deduction",
	"delivery_charge",
	"return_fee",
	"payout",
	"payout_fee",
	"adjustment",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_STATUSES = ["pending", "cleared", "cancelled"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const TRANSACTION_REFERENCE_TYPES = [
	"order",
	"payout",
	"dispute",
	"adjustment",
	"external",
] as const;
export type TransactionReferenceType =
	(typeof TRANSACTION_REFERENCE_TYPES)[number];

export const transactions = pgTable(
	"transactions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		vendorId: uuid("vendor_id")
			.notNull()
			.references(() => vendors.id, { onDelete: "cascade" }),
		orderId: uuid("order_id").references(() => orders.id, {
			onDelete: "set null",
		}),
		payoutId: uuid("payout_id").references(() => vendorPayouts.id, {
			onDelete: "set null",
		}),
		type: varchar("type", { length: 40 }).notNull().$type<TransactionType>(),
		amountPaisa: integer("amount_paisa").notNull(), // Signed, positive=credit, negative=debit
		status: varchar("status", { length: 20 })
			.notNull()
			.default("pending")
			.$type<TransactionStatus>(),
		description: text("description"),
		referenceId: text("reference_id"),
		referenceType: varchar("reference_type", { length: 30 }).$type<TransactionReferenceType>(),
		meta: jsonb("meta"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("transactions_vendor_status_created_idx").on(
			table.vendorId,
			table.status,
			table.createdAt,
		),
		index("transactions_order_idx").on(table.orderId),
		index("transactions_payout_idx").on(table.payoutId),
		index("transactions_type_idx").on(table.type),
		index("transactions_reference_idx").on(table.referenceType, table.referenceId),
	],
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
	vendor: one(vendors, {
		fields: [transactions.vendorId],
		references: [vendors.id],
	}),
	order: one(orders, {
		fields: [transactions.orderId],
		references: [orders.id],
	}),
	payout: one(vendorPayouts, {
		fields: [transactions.payoutId],
		references: [vendorPayouts.id],
	}),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
