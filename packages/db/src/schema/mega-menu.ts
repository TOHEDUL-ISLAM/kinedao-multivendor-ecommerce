import { relations } from "drizzle-orm";
import {
  pgTable,
  timestamp,
  integer,
  uuid,
  text,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { products } from "./products";

// Mega menu featured products junction table
export const megaMenuFeaturedProducts = pgTable(
  "mega_menu_featured_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    position: text("position").default("right-panel"), // Position in mega menu
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true),
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("mega_menu_featured_category_idx").on(table.categoryId),
    index("mega_menu_featured_product_idx").on(table.productId),
    index("mega_menu_featured_active_idx").on(table.isActive, table.categoryId),
  ]
);

// Mega menu featured products relations
export const megaMenuFeaturedProductsRelations = relations(
  megaMenuFeaturedProducts,
  ({ one }) => ({
    category: one(categories, {
      fields: [megaMenuFeaturedProducts.categoryId],
      references: [categories.id],
    }),
    product: one(products, {
      fields: [megaMenuFeaturedProducts.productId],
      references: [products.id],
    }),
  })
);

export type MegaMenuFeaturedProduct =
  typeof megaMenuFeaturedProducts.$inferSelect;
export type NewMegaMenuFeaturedProduct =
  typeof megaMenuFeaturedProducts.$inferInsert;
