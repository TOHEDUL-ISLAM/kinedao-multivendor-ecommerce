import { relations } from "drizzle-orm";
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
import { vendors } from "./vendors";
import { categories } from "./categories";

// Products table - main product information
export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 300 }).notNull(),
    titleBn: varchar("title_bn", { length: 300 }), // Bangla title
    slug: varchar("slug", { length: 300 }).notNull().unique(),
    vendorId: uuid("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    brand: varchar("brand", { length: 100 }),
    shortDescription: text("short_description"),
    shortDescriptionBn: text("short_description_bn"),
    description: text("description"),
    descriptionBn: text("description_bn"),
    ageRange: varchar("age_range", { length: 50 }), // e.g., "0-3 months", "1-2 years"
    ratingAvg: real("rating_avg").default(0),
    ratingCount: integer("rating_count").default(0),
    bestSellerScore: integer("best_seller_score").default(0),
    isNew: boolean("is_new").default(true),
    isHot: boolean("is_hot").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("products_slug_idx").on(table.slug),
    index("products_vendor_idx").on(table.vendorId),
    index("products_category_idx").on(table.categoryId),
    index("products_bestseller_idx").on(table.bestSellerScore),
    index("products_created_idx").on(table.createdAt),
  ]
);

// Product images table
export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: varchar("alt", { length: 200 }),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("product_images_product_idx").on(table.productId)]
);

// Product options table (e.g., Size, Color)
export const productOptions = pgTable(
  "product_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 50 }).notNull(), // e.g., "Size", "Color"
    nameBn: varchar("name_bn", { length: 50 }),
    values: text("values").array().notNull(), // e.g., ["S", "M", "L"]
    valuesBn: text("values_bn").array(),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => [index("product_options_product_idx").on(table.productId)]
);

// Product SKUs table - individual purchasable variants with pricing
export const productSkus = pgTable(
  "product_skus",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 50 }).notNull().unique(),
    optionValues: jsonb("option_values").$type<Record<string, string>>(), // e.g., { "Size": "M", "Color": "Blue" }
    priceAmount: integer("price_amount").notNull(), // Price in minor units (paisa)
    compareAtAmount: integer("compare_at_amount"), // Original price for discount display
    currency: varchar("currency", { length: 3 }).default("BDT").notNull(),
    stockQty: integer("stock_qty").default(0).notNull(),
    isAvailable: boolean("is_available").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("product_skus_product_idx").on(table.productId),
    index("product_skus_sku_idx").on(table.sku),
  ]
);

// Product relations
export const productsRelations = relations(products, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  options: many(productOptions),
  skus: many(productSkus),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productOptionsRelations = relations(productOptions, ({ one }) => ({
  product: one(products, {
    fields: [productOptions.productId],
    references: [products.id],
  }),
}));

export const productSkusRelations = relations(productSkus, ({ one }) => ({
  product: one(products, {
    fields: [productSkus.productId],
    references: [products.id],
  }),
}));

// Vendor relations (defined here to avoid circular imports)
export const vendorsRelations = relations(vendors, ({ many }) => ({
  products: many(products),
}));

// Category relations for products
export const categoriesProductsRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
export type ProductOption = typeof productOptions.$inferSelect;
export type NewProductOption = typeof productOptions.$inferInsert;
export type ProductSku = typeof productSkus.$inferSelect;
export type NewProductSku = typeof productSkus.$inferInsert;
