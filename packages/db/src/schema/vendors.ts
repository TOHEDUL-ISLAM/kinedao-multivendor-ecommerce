// Vendors and brands schema
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  varchar,
  index,
  real,
  jsonb,
} from "drizzle-orm/pg-core";

// Vendors table - stores marketplace seller information
export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    logoUrl: text("logo_url"),
    ratingAvg: real("rating_avg").default(0),
    ratingCount: integer("rating_count").default(0),
    commissionRate: real("commission_rate").default(12).notNull(),
    payoutDetails: jsonb("payout_details"),
    balancePendingPaisa: integer("balance_pending_paisa").default(0).notNull(),
    balanceAvailablePaisa: integer("balance_available_paisa")
      .default(0)
      .notNull(),
    pathaoStoreId: varchar("pathao_store_id", { length: 120 }),
    locationCity: varchar("location_city", { length: 100 }),
    isVerified: boolean("is_verified").default(false),
    badges: text("badges").array(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("vendors_slug_idx").on(table.slug),
    index("vendors_pathao_store_idx").on(table.pathaoStoreId),
  ]
);

// Brands table - for popular brands display section
export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    logoUrl: text("logo_url").notNull(),
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("brands_slug_idx").on(table.slug)]
);

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
