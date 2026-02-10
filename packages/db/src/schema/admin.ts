// Admin users and audit log schema
import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

// Admin users table - simple lookup table (a row means user is admin)
export const adminUsers = pgTable(
	"admin_users",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" })
			.unique(), // One admin record per user
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("admin_users_user_id_idx").on(table.userId)],
);

// Admin audit log - tracks all admin actions
export const adminAuditLog = pgTable(
	"admin_audit_log",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		adminUserId: text("admin_user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		action: varchar("action", { length: 50 }).notNull(), // approve_vendor, reject_product, process_payout, etc.
		entityType: varchar("entity_type", { length: 50 }).notNull(), // vendor_application, product, payout, etc.
		entityId: text("entity_id").notNull(), // UUID of the entity
		details: jsonb("details"), // Flexible JSON for action-specific data
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		index("admin_audit_log_admin_user_id_idx").on(table.adminUserId),
		index("admin_audit_log_entity_idx").on(table.entityType, table.entityId),
		index("admin_audit_log_created_at_idx").on(table.createdAt),
	],
);

// Relations
export const adminUsersRelations = relations(adminUsers, ({ one }) => ({
	user: one(user, {
		fields: [adminUsers.userId],
		references: [user.id],
	}),
}));

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
	adminUser: one(user, {
		fields: [adminAuditLog.adminUserId],
		references: [user.id],
	}),
}));

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type AdminAuditLogEntry = typeof adminAuditLog.$inferSelect;
export type NewAdminAuditLogEntry = typeof adminAuditLog.$inferInsert;
