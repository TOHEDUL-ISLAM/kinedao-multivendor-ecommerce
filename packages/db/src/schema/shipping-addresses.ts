import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const shippingAddresses = pgTable(
	"shipping_addresses",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		fullName: varchar("full_name", { length: 200 }).notNull(),
		phone: varchar("phone", { length: 20 }).notNull(),
		alternatePhone: varchar("alternate_phone", { length: 20 }),

		addressLine1: text("address_line_1").notNull(),
		addressLine2: text("address_line_2"),
		city: varchar("city", { length: 100 }).notNull(),
		district: varchar("district", { length: 100 }).notNull(),
		postalCode: varchar("postal_code", { length: 10 }),
		deliveryInstructions: text("delivery_instructions"),

		isDefault: boolean("is_default").default(false).notNull(),

		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("shipping_addresses_user_id_idx").on(table.userId)],
);

export const shippingAddressesRelations = relations(
	shippingAddresses,
	({ one }) => ({
		user: one(user, {
			fields: [shippingAddresses.userId],
			references: [user.id],
		}),
	}),
);

export type ShippingAddress = typeof shippingAddresses.$inferSelect;
export type NewShippingAddress = typeof shippingAddresses.$inferInsert;
