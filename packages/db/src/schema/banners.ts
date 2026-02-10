// Banners schema for homepage and sidebar promotional banners
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// Banner placement values
export const BANNER_PLACEMENTS = [
	"hero_carousel",
	"promotional_card",
	"homepage_middle",
	"sidebar",
] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

// Banners table
export const banners = pgTable(
	"banners",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		// Content
		titleEn: varchar("title_en", { length: 200 }).notNull(),
		titleBn: varchar("title_bn", { length: 200 }),
		subtitleEn: varchar("subtitle_en", { length: 300 }),
		subtitleBn: varchar("subtitle_bn", { length: 300 }),
		priceLabel: varchar("price_label", { length: 100 }),
		badgeText: varchar("badge_text", { length: 50 }),
		badgeColor: varchar("badge_color", { length: 20 }), // 'red' | 'teal' | 'purple' | 'orange' | 'green'
		ctaText: varchar("cta_text", { length: 100 }),
		discountPercentage: integer("discount_percentage"),
		imageUrl: text("image_url").notNull(), // Full S3 URL
		s3Key: text("s3_key").notNull(), // S3 key for deletion
		linkUrl: text("link_url"), // Optional CTA link

		// Display settings
		placement: varchar("placement", { length: 20 })
			.notNull()
			.$type<BannerPlacement>(),
		isActive: boolean("is_active").notNull().default(true),
		sortOrder: integer("sort_order").notNull().default(0), // Lower shows first

		// Scheduling
		startsAt: timestamp("starts_at"), // Optional start date
		endsAt: timestamp("ends_at"), // Optional end date

		// Timestamps
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("banners_placement_idx").on(table.placement),
		index("banners_active_sort_idx").on(table.isActive, table.sortOrder),
	],
);

export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
