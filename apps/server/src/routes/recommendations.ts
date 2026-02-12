import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { db, getS3Url } from "@kineDao.com/db";
import { categories, categoryMetrics, products, productImages, productSkus, vendors } from "@kineDao.com/db/schema";
import { and, eq, sql, desc, arrayContains, inArray, notInArray } from "drizzle-orm";
import {
  recommendationsQuerySchema,
  cartRecommendationsQuerySchema,
  type CategoryDTO,
  type CategoryRecommendationsResponse,
  type ProductCardDTO,
  type CartRecommendationsResponse,
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
          AND ${products.status} = 'approved'
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
          AND ${products.status} = 'approved'
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
          AND ${products.status} = 'approved'
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
          AND ${products.status} = 'approved'
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
)
// GET /api/recommendations/cart - Cart-based product recommendations
.get(
  "/cart",
  describeRoute({
    tags: ["Recommendations"],
    summary: "Get cart-based product recommendations",
    description:
      "Fetch product recommendations based on items in the cart. Returns products from the same categories as cart items, excluding the cart items themselves.",
    responses: {
      200: {
        description: "Successful response with recommended products",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                products: z.array(z.any()),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator("query", cartRecommendationsQuerySchema),
  async (c) => {
    const { productIds, limit } = c.req.valid("query");

    if (productIds.length === 0) {
      return c.json({ products: [] }, 200);
    }

    // Get categories of cart products
    const cartProducts = await db
      .select({ categoryId: products.categoryId })
      .from(products)
      .where(inArray(products.id, productIds));

    const categoryIds = [...new Set(cartProducts.map((p) => p.categoryId))];

    if (categoryIds.length === 0) {
      return c.json({ products: [] }, 200);
    }

    // Fetch products from same categories, excluding cart items
    const recommendedProductRows = await db
      .select({
        product: products,
        vendor: vendors,
        category: categories,
      })
      .from(products)
      .innerJoin(vendors, eq(products.vendorId, vendors.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          inArray(products.categoryId, categoryIds),
          eq(products.isActive, true),
          eq(products.status, "approved"),
          notInArray(products.id, productIds)
        )
      )
      .orderBy(desc(products.ratingAvg))
      .limit(limit);

    // Fetch images for recommended products
    const recommendedProductIds = recommendedProductRows.map((r) => r.product.id);
    const recommendedImages = recommendedProductIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            s3Key: productImages.s3Key,
            alt: productImages.alt,
          })
          .from(productImages)
          .where(inArray(productImages.productId, recommendedProductIds))
      : [];

    // Fetch SKUs for recommended products
    const recommendedSkus = recommendedProductIds.length > 0
      ? await db
          .select()
          .from(productSkus)
          .where(inArray(productSkus.productId, recommendedProductIds))
      : [];

    // Build recommended products DTOs
    const recommendedProducts: ProductCardDTO[] = recommendedProductRows.map((row) => {
      const prodImages = recommendedImages.filter((img) => img.productId === row.product.id);
      const prodSkus = recommendedSkus.filter((sku) => sku.productId === row.product.id);
      const availableSkus = prodSkus.filter((s) => s.isAvailable);
      const sortedSkus = [...(availableSkus.length ? availableSkus : prodSkus)].sort(
        (a, b) => a.priceAmount - b.priceAmount
      );
      const lowestSku = sortedSkus[0];
      const hasVariants =
        prodSkus.length > 1 ||
        prodSkus.some(
          (s) => s.optionValues && Object.keys(s.optionValues).length > 0
        );

      return {
        id: row.product.id,
        title: row.product.title,
        titleBn: row.product.titleBn,
        slug: row.product.slug,
        brand: row.product.brand,
        ageRange: row.product.ageRange,
        ageRangeMin: row.product.ageRangeMin,
        ageRangeMax: row.product.ageRangeMax,
        isBpaFree: row.product.isBpaFree,
        isOrganic: row.product.isOrganic,
        isHypoallergenic: row.product.isHypoallergenic,
        ratingAvg: row.product.ratingAvg,
        ratingCount: row.product.ratingCount,
        isNew: row.product.isNew,
        isHot: row.product.isHot,
        imageUrl: prodImages[0] ? getS3Url(prodImages[0].s3Key) : null,
        imageAlt: prodImages[0]?.alt || null,
        priceAmount: lowestSku?.priceAmount || 0,
        compareAtAmount: lowestSku?.compareAtAmount || null,
        currency: lowestSku?.currency || "BDT",
        isAvailable: availableSkus.length > 0,
        hasVariants,
        vendor: {
          id: row.vendor.id,
          name: row.vendor.name,
          slug: row.vendor.slug,
          isVerified: row.vendor.isVerified,
        },
        category: {
          id: row.category.id,
          name: row.category.name,
          slug: row.category.slug,
        },
      };
    });

    const response: CartRecommendationsResponse = {
      products: recommendedProducts,
    };

    return c.json(response, 200);
  }
);

export { recommendationsRouter };
export type RecommendationsRouterType = typeof recommendationsRouter;
