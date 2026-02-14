import {
	index,
	jsonb,
	pgTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const siteSettings = pgTable(
	"site_settings",
	{
		key: varchar("key", { length: 80 }).primaryKey(),
		value: jsonb("value").notNull(),
		updatedBy: text("updated_by").references(() => user.id, {
			onDelete: "set null",
		}),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("site_settings_updated_at_idx").on(table.updatedAt)],
);

export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;
