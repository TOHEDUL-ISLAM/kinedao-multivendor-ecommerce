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
import { user } from "./auth";
import { products } from "./products";
import { vendors } from "./vendors";

// Order number sequence table for atomic increment
export const orderNumberSequence = pgTable("order_number_sequence", {
	id: integer("id").primaryKey().default(1),
	lastNumber: integer("last_number").notNull().default(0),
});

// Order statuses
export const ORDER_STATUSES = [
	"pending",
	"confirmed",
	"processing",
	"shipped",
	"delivered",
	"paid_to_admin",
	"completed",
	"returned",
	"cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Payment methods
export const PAYMENT_METHODS = ["cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Shipping address snapshot (frozen at order time)
export interface ShippingAddressSnapshot {
	fullName: string;
	phone: string;
	alternatePhone: string | null;
	addressLine1: string;
	addressLine2: string | null;
	city: string;
	district: string;
	postalCode: string | null;
	deliveryInstructions: string | null;
}

// Orders table - ONE per vendor per checkout
export const orders = pgTable(
	"orders",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Order identification
		orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),
		groupId: uuid("group_id").notNull(),

		// Parties
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
		vendorId: uuid("vendor_id")
			.notNull()
			.references(() => vendors.id, { onDelete: "restrict" }),

		// Status
		status: varchar("status", { length: 20 })
			.notNull()
			.default("pending")
			.$type<OrderStatus>(),

		// Payment
		paymentMethod: varchar("payment_method", { length: 20 })
			.notNull()
			.default("cod")
			.$type<PaymentMethod>(),

		// Pricing (all in paisa)
		subtotal: integer("subtotal").notNull(),
		shippingCost: integer("shipping_cost").notNull(),
		codFee: integer("cod_fee").notNull().default(0),
		total: integer("total").notNull(),

		// Frozen address snapshot
		shippingAddress: jsonb("shipping_address")
			.notNull()
			.$type<ShippingAddressSnapshot>(),

		// Customer notes
		customerNotes: text("customer_notes"),

		// Tracking (set by vendor when marking as shipped)
		trackingNumber: varchar("tracking_number", { length: 100 }),
		trackingCarrier: varchar("tracking_carrier", { length: 100 }),
		courierName: varchar("courier_name", { length: 40 }),
		courierOrderRef: varchar("courier_order_ref", { length: 120 }),

		// Financial settlement snapshot
		commissionRateSnapshot: integer("commission_rate_snapshot"), // basis points (e.g. 1200 = 12.00%)
		commissionAmountPaisa: integer("commission_amount_paisa"),
		vendorNetPaisa: integer("vendor_net_paisa"),
		actualCourierCostPaisa: integer("actual_courier_cost_paisa")
			.notNull()
			.default(0),
		returnFeePaisa: integer("return_fee_paisa").notNull().default(0),
		settlementNotes: text("settlement_notes"),

		// COD Verification
		codVerifiedAt: timestamp("cod_verified_at"),

		// Timestamps
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
		confirmedAt: timestamp("confirmed_at"),
		shippedAt: timestamp("shipped_at"),
		deliveredAt: timestamp("delivered_at"),
		paidToAdminAt: timestamp("paid_to_admin_at"),
		completedAt: timestamp("completed_at"),
		returnedAt: timestamp("returned_at"),
		cancelledAt: timestamp("cancelled_at"),
	},
	(table) => [
		index("orders_user_id_idx").on(table.userId),
		index("orders_vendor_id_idx").on(table.vendorId),
		index("orders_group_id_idx").on(table.groupId),
		index("orders_order_number_idx").on(table.orderNumber),
		index("orders_status_idx").on(table.status),
		index("orders_created_at_idx").on(table.createdAt),
	],
);

// Order item product snapshot (frozen at order time)
export interface OrderItemProductSnapshot {
	title: string;
	titleBn: string | null;
	slug: string;
	image: string | null;
	ageRange: string | null;
	isBpaFree: boolean;
	isOrganic: boolean;
	isHypoallergenic: boolean;
	selectedOptions: Record<string, string> | null; // e.g. {"Color": "Blue", "Size": "M"}
	skuCode: string | null; // SKU code for reference
}

export const orderItems = pgTable(
	"order_items",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		orderId: uuid("order_id")
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		productId: uuid("product_id")
			.notNull()
			.references(() => products.id, { onDelete: "restrict" }),

		// Quantity and pricing (paisa)
		quantity: integer("quantity").notNull(),
		unitPrice: integer("unit_price").notNull(),
		lineTotal: integer("line_total").notNull(),

		// Frozen product snapshot
		productSnapshot: jsonb("product_snapshot")
			.notNull()
			.$type<OrderItemProductSnapshot>(),

		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("order_items_order_id_idx").on(table.orderId),
		index("order_items_product_id_idx").on(table.productId),
	],
);

// Relations
export const ordersRelations = relations(orders, ({ one, many }) => ({
	user: one(user, { fields: [orders.userId], references: [user.id] }),
	vendor: one(vendors, { fields: [orders.vendorId], references: [vendors.id] }),
	items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id],
	}),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
