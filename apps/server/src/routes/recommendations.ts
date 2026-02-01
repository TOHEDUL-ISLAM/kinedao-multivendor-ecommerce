import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { db } from "@kineDao.com/db";
import { categories, categoryMetrics, products } from "@kineDao.com/db/schema";
import { and, eq, sql, desc, arrayContains } from "drizzle-orm";
import {
  recommendationsQuerySchema,
  type CategoryDTO,
  type CategoryRecommendationsResponse,
} from "@kineDao.com/api-types/catalog";
import { z } from "zod";

// Helper to format category with product count
function formatCategoryDTO(
  category: typeof categories.$inferSelect,
  productCount: number
): CategoryDTO {
  return {
    id: category.id,
    name: category.name,
    nameBn: category.nameBn,
    slug: category.slug,
    parentId: category.parentId,
    iconKey: category.iconKey,
    imageUrl: category.imageUrl,
    sortOrder: category.sortOrder,
    productCount,
  };
}

// GET /api/recommendations/categories - Category recommendations
const recommendationsRouter = new Hono().get(
  "/categories",
  describeRoute({
    tags: ["Recommendations"],
    summary: "Get category recommendations",
    description:
      "Fetch curated category recommendations including popular, mom's choice, trending, and editor picks.",
    responses: {
      200: {
        description: "Successful response with category recommendations",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                popularCategories: z.array(z.any()),
                momsChoice: z.array(z.any()),
                trendingCategories: z.array(z.any()),
                editorPicks: z.array(z.any()),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator("query", recommendationsQuerySchema),
  async (c) => {
    const { limit, season } = c.req.valid("query");

    // Popular categories - sorted by popularityScore
    const popularRows = await db
      .select({
        category: categories,
        metrics: categoryMetrics,
        productCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${products}
          WHERE ${products.categoryId} = ${categories.id}
          AND ${products.isActive} = true
        )`,
      })
      .from(categories)
      .leftJoin(categoryMetrics, eq(categoryMetrics.categoryId, categories.id))
      .where(eq(categories.displayInMegaMenu, true))
      .orderBy(desc(sql`COALESCE(${categoryMetrics.popularityScore}, 0)`))
      .limit(limit);

    const popularCategories = popularRows.map((row) =>
      formatCategoryDTO(row.category, row.productCount)
    );

    // Mom's Choice - sorted by momChoiceWeight
    const momsChoiceRows = await db
      .select({
        category: categories,
        metrics: categoryMetrics,
        productCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${products}
          WHERE ${products.categoryId} = ${categories.id}
          AND ${products.isActive} = true
        )`,
      })
      .from(categories)
      .leftJoin(categoryMetrics, eq(categoryMetrics.categoryId, categories.id))
      .where(
        and(
          eq(categories.displayInMegaMenu, true),
          sql`COALESCE(${categoryMetrics.momChoiceWeight}, 0) > 0`
        )
      )
      .orderBy(desc(sql`COALESCE(${categoryMetrics.momChoiceWeight}, 0)`))
      .limit(limit);

    const momsChoice = momsChoiceRows.map((row) =>
      formatCategoryDTO(row.category, row.productCount)
    );

    // Trending categories - sorted by trendingScore, optionally filtered by season
    const trendingConditions = [eq(categories.displayInMegaMenu, true)];
    if (season) {
      trendingConditions.push(
        arrayContains(categoryMetrics.seasonalTags, [season])
      );
    }

    const trendingRows = await db
      .select({
        category: categories,
        metrics: categoryMetrics,
        productCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${products}
          WHERE ${products.categoryId} = ${categories.id}
          AND ${products.isActive} = true
        )`,
      })
      .from(categories)
      .leftJoin(categoryMetrics, eq(categoryMetrics.categoryId, categories.id))
      .where(and(...trendingConditions))
      .orderBy(desc(sql`COALESCE(${categoryMetrics.trendingScore}, 0)`))
      .limit(limit);

    const trendingCategories = trendingRows.map((row) =>
      formatCategoryDTO(row.category, row.productCount)
    );

    // Editor Picks - sorted by editorPickWeight
    const editorPickRows = await db
      .select({
        category: categories,
        metrics: categoryMetrics,
        productCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${products}
          WHERE ${products.categoryId} = ${categories.id}
          AND ${products.isActive} = true
        )`,
      })
      .from(categories)
      .leftJoin(categoryMetrics, eq(categoryMetrics.categoryId, categories.id))
      .where(
        and(
          eq(categories.displayInMegaMenu, true),
          sql`COALESCE(${categoryMetrics.editorPickWeight}, 0) > 0`
        )
      )
      .orderBy(desc(sql`COALESCE(${categoryMetrics.editorPickWeight}, 0)`))
      .limit(limit);

    const editorPicks = editorPickRows.map((row) =>
      formatCategoryDTO(row.category, row.productCount)
    );

    const response: CategoryRecommendationsResponse = {
      popularCategories,
      momsChoice,
      trendingCategories,
      editorPicks,
    };

    return c.json(response, 200);
  }
);

export { recommendationsRouter };
export type RecommendationsRouterType = typeof recommendationsRouter;
