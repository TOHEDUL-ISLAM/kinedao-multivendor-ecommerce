import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  varchar,
  index,
  boolean,
} from "drizzle-orm/pg-core";

// Categories table - hierarchical product categories
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    nameBn: varchar("name_bn", { length: 100 }), // Bangla name
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    parentId: uuid("parent_id").references((): any => categories.id, {
      onDelete: "set null",
    }),
    iconKey: varchar("icon_key", { length: 50 }), // lucide icon name
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").default(0),
    // Hierarchical navigation fields
    depth: integer("depth").default(0), // 0=root, 1=child, 2=grandchild
    path: text("path"), // Materialized path: "/uuid1/uuid2"
    // Mega menu display flags
    isPopular: boolean("is_popular").default(false),
    isFeatured: boolean("is_featured").default(false),
    displayInMegaMenu: boolean("display_in_mega_menu").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("categories_slug_idx").on(table.slug),
    index("categories_parent_idx").on(table.parentId),
    index("categories_depth_idx").on(table.depth),
    index("categories_path_idx").on(table.path),
    index("categories_parent_sort_idx").on(table.parentId, table.sortOrder),
  ]
);

// Category relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, { relationName: "categoryParent" }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
