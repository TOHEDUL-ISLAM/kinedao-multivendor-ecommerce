import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  varchar,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { products } from "./products";

// Campaigns table - for hero carousel and deal wall promotions
export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placement: varchar("placement", { length: 20 }).notNull(), // "heroCarousel" | "dealWall"
    title: varchar("title", { length: 200 }).notNull(),
    titleBn: varchar("title_bn", { length: 200 }),
    subtitle: text("subtitle"),
    subtitleBn: text("subtitle_bn"),
    imageUrl: text("image_url").notNull(),
    theme: varchar("theme", { length: 50 }), // Color theme: "coral", "teal", "purple", "amber"
    ctaText: varchar("cta_text", { length: 50 }),
    ctaTextBn: varchar("cta_text_bn", { length: 50 }),
    ctaLink: text("cta_link"),
    discountPercent: integer("discount_percent"),
    sortOrder: integer("sort_order").default(0),
    startsAt: timestamp("starts_at").defaultNow().notNull(),
    endsAt: timestamp("ends_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("campaigns_placement_idx").on(table.placement),
    index("campaigns_dates_idx").on(table.startsAt, table.endsAt),
  ]
);

// Campaign products junction table
export const campaignProducts = pgTable(
  "campaign_products",
  {
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => [
    primaryKey({ columns: [table.campaignId, table.productId] }),
    index("campaign_products_campaign_idx").on(table.campaignId),
  ]
);

// Campaign relations
export const campaignsRelations = relations(campaigns, ({ many }) => ({
  campaignProducts: many(campaignProducts),
}));

export const campaignProductsRelations = relations(
  campaignProducts,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignProducts.campaignId],
      references: [campaigns.id],
    }),
    product: one(products, {
      fields: [campaignProducts.productId],
      references: [products.id],
    }),
  })
);

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type CampaignProduct = typeof campaignProducts.$inferSelect;
export type NewCampaignProduct = typeof campaignProducts.$inferInsert;
