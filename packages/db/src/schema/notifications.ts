import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// =====================
// Notifications Table
// =====================

export const notifications = pgTable(
	"notifications",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		type: text("type").notNull(), // order_placed, order_confirmed, new_order, etc.
		title: text("title").notNull(),
		titleBn: text("title_bn"),
		body: text("body").notNull(),
		bodyBn: text("body_bn"),
		data: jsonb("data"), // { orderId, orderNumber, productId, etc. }
		channel: text("channel").notNull(), // "customer" | "vendor" | "admin"
		isRead: boolean("is_read").notNull().default(false),
		readAt: timestamp("read_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userReadCreatedIdx: index("notifications_user_read_created_idx").on(
			table.userId,
			table.isRead,
			table.createdAt,
		),
	}),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(user, {
		fields: [notifications.userId],
		references: [user.id],
	}),
}));

// =====================
// Push Subscriptions Table
// =====================

export const pushSubscriptions = pgTable(
	"push_subscriptions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		endpoint: text("endpoint").notNull(),
		p256dh: text("p256dh").notNull(), // Public key
		auth: text("auth").notNull(), // Auth secret
		userAgent: text("user_agent"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		endpointUnique: uniqueIndex("push_subscriptions_endpoint_unique").on(
			table.endpoint,
		),
		userIdIdx: index("push_subscriptions_user_id_idx").on(table.userId),
	}),
);

export const pushSubscriptionsRelations = relations(
	pushSubscriptions,
	({ one }) => ({
		user: one(user, {
			fields: [pushSubscriptions.userId],
			references: [user.id],
		}),
	}),
);

// =====================
// Notification Preferences Table
// =====================

export const notificationPreferences = pgTable(
	"notification_preferences",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		// Master toggles
		emailEnabled: boolean("email_enabled").notNull().default(true),
		pushEnabled: boolean("push_enabled").notNull().default(true),
		// Customer preferences
		orderUpdates: boolean("order_updates").notNull().default(true),
		deliveryAlerts: boolean("delivery_alerts").notNull().default(true),
		promotions: boolean("promotions").notNull().default(false),
		// Vendor preferences
		newOrders: boolean("new_orders").notNull().default(true),
		lowStock: boolean("low_stock").notNull().default(true),
		soundEnabled: boolean("sound_enabled").notNull().default(true),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => ({
		userIdUnique: uniqueIndex("notification_preferences_user_id_unique").on(
			table.userId,
		),
	}),
);

export const notificationPreferencesRelations = relations(
	notificationPreferences,
	({ one }) => ({
		user: one(user, {
			fields: [notificationPreferences.userId],
			references: [user.id],
		}),
	}),
);
