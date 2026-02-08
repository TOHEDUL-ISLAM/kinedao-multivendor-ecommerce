import { relations } from "drizzle-orm";
import {
  pgTable,
  timestamp,
  integer,
  uuid,
  text,
  real,
  jsonb,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";

// Category metrics table - scoring and recommendation data
export const categoryMetrics = pgTable("category_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" })
    .unique(),

  // Scoring
  trendingScore: integer("trending_score").default(0),
  popularityScore: integer("popularity_score").default(0),
  salesVelocity: real("sales_velocity").default(0),

  // Curated weights for recommendations
  momChoiceWeight: integer("mom_choice_weight").default(0),
  editorPickWeight: integer("editor_pick_weight").default(0),
  homepageWeight: integer("homepage_weight").default(0),

  // Contextual targeting
  seasonalTags: text("seasonal_tags").array(), // ["winter", "eid", "monsoon"]
  targetAudience: text("target_audience").array(), // ["new-parents", "toddler"]

  // Future ML capabilities (nullable)
  embeddingVector: jsonb("embedding_vector").$type<number[]>(),
  userSegmentAffinity: jsonb("user_segment_affinity").$type<
    Record<string, number>
  >(),

  lastCalculatedAt: timestamp("last_calculated_at"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Category metrics relations
export const categoryMetricsRelations = relations(
  categoryMetrics,
  ({ one }) => ({
    category: one(categories, {
      fields: [categoryMetrics.categoryId],
      references: [categories.id],
    }),
  })
);

export type CategoryMetric = typeof categoryMetrics.$inferSelect;
export type NewCategoryMetric = typeof categoryMetrics.$inferInsert;
