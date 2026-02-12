import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { db, getS3Url } from "@kineDao.com/db";
import {
  categories,
  products,
  productImages,
  productSkus,
  megaMenuFeaturedProducts,
} from "@kineDao.com/db/schema";
import { and, eq, sql, asc, lte } from "drizzle-orm";
import {
  categoriesQuerySchema,
  categoryTreeQuerySchema,
  featuredProductsQuerySchema,
  type CategoryDTO,
  type CategoryTreeNodeDTO,
  type CategoryTreeResponse,
  type MegaMenuProductDTO,
  type CategoryFeaturedProductsResponse,
} from "@kineDao.com/api-types/catalog";
import { z } from "zod";

// GET /api/categories - Category list (optionally parents only)
const categoriesRouter = new Hono().get(
  "/",
  describeRoute({
    tags: ["Categories"],
    summary: "Get category list",
    description: "Fetch all categories or only parent categories with product counts.",
    responses: {
      200: {
        description: "Successful response with categories",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                categories: z.array(z.any()),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator("query", categoriesQuerySchema),
  async (c) => {
  const { scope } = c.req.valid("query");

  const baseQuery = db
    .select({
      category: categories,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(categories)
    .leftJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.isActive, true), eq(products.status, "approved"))
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));

  const rows =
    scope === "parents"
      ? await baseQuery.where(sql`${categories.parentId} IS NULL`)
      : await baseQuery;

  const categoryDTOs: CategoryDTO[] = rows.map((row) => ({
    id: row.category.id,
    name: row.category.name,
    nameBn: row.category.nameBn,
    slug: row.category.slug,
    parentId: row.category.parentId,
    iconKey: row.category.iconKey,
    imageUrl: row.category.imageUrl,
    sortOrder: row.category.sortOrder,
    productCount: row.productCount,
  }));

  return c.json({ categories: categoryDTOs }, 200);
})
.get(
  "/tree",
  describeRoute({
    tags: ["Categories"],
    summary: "Get hierarchical category tree",
    description: "Fetch categories as a nested tree structure for mega menu navigation. Uses materialized path for efficient querying.",
    responses: {
      200: {
        description: "Successful response with category tree",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                tree: z.array(z.any()),
                lastUpdated: z.string(),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator("query", categoryTreeQuerySchema),
  async (c) => {
    const { maxDepth, includeProductCount, includeFeaturedProducts } = c.req.valid("query");
    const shouldIncludeProductCount = includeProductCount === "true";
    const shouldIncludeFeaturedProducts = includeFeaturedProducts === "true";

    // Fetch all categories up to maxDepth with product counts
    const categoriesData = await db
      .select({
        category: categories,
        productCount: shouldIncludeProductCount
          ? sql<number>`(
              SELECT COUNT(*)::int
              FROM ${products}
              WHERE ${products.categoryId} = ${categories.id}
              AND ${products.isActive} = true
              AND ${products.status} = 'approved'
            )`
          : sql<number>`0`,
      })
      .from(categories)
      .where(
        and(
          eq(categories.displayInMegaMenu, true),
          lte(categories.depth, maxDepth - 1)
        )
      )
      .orderBy(asc(categories.depth), asc(categories.sortOrder));

    // Build tree structure from flat list
    const categoryMap = new Map<string, CategoryTreeNodeDTO>();
    const rootCategories: CategoryTreeNodeDTO[] = [];

    // First pass: create all nodes
    for (const row of categoriesData) {
      const node: CategoryTreeNodeDTO = {
        id: row.category.id,
        name: row.category.name,
        nameBn: row.category.nameBn,
        slug: row.category.slug,
        iconKey: row.category.iconKey,
        imageUrl: row.category.imageUrl,
        depth: row.category.depth ?? 0,
        productCount: row.productCount,
        children: [],
      };
      categoryMap.set(row.category.id, node);
    }

    // Second pass: build tree structure
    for (const row of categoriesData) {
      const node = categoryMap.get(row.category.id)!;
      if (row.category.parentId && categoryMap.has(row.category.parentId)) {
        categoryMap.get(row.category.parentId)!.children.push(node);
      } else if (!row.category.parentId) {
        rootCategories.push(node);
      }
    }

	    // Optionally load featured products for root categories
	    if (shouldIncludeFeaturedProducts) {
	      await Promise.all(
	        rootCategories.map(async (rootNode) => {
	          rootNode.featuredProducts = await getFeaturedProductsForCategory(
	            rootNode.id,
	            4,
	          );
	        }),
	      );
	    }

    const response: CategoryTreeResponse = {
      tree: rootCategories,
      lastUpdated: new Date().toISOString(),
    };

    return c.json(response, 200);
  }
)
.get(
  "/:id/featured",
  describeRoute({
    tags: ["Categories"],
    summary: "Get featured products for category",
    description: "Fetch featured products to display in mega menu panel for a specific category.",
    responses: {
      200: {
        description: "Successful response with featured products",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                categoryId: z.string(),
                products: z.array(z.any()),
              })
            ),
          },
        },
      },
      404: {
        description: "Category not found",
        content: {
          "application/json": {
            schema: resolver(z.object({ error: z.string() })),
          },
        },
      },
    },
  }),
  zValidator("query", featuredProductsQuerySchema),
  async (c) => {
    const categoryId = c.req.param("id");
    const { limit } = c.req.valid("query");

    // Verify category exists
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!category) {
      return c.json({ error: "Category not found" }, 404);
    }

    const featuredProducts = await getFeaturedProductsForCategory(categoryId, limit);

    const response: CategoryFeaturedProductsResponse = {
      categoryId,
      products: featuredProducts,
    };

    return c.json(response, 200);
  }
);

// Helper function to get featured products for a category
async function getFeaturedProductsForCategory(
  categoryId: string,
  limit: number
): Promise<MegaMenuProductDTO[]> {
  const now = new Date();

  // First try to get curated featured products from junction table
  const featuredRows = await db
    .select({
      product: products,
      image: {
        s3Key: productImages.s3Key,
      },
      sku: productSkus,
    })
    .from(megaMenuFeaturedProducts)
    .innerJoin(products, eq(megaMenuFeaturedProducts.productId, products.id))
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.sortOrder, 0)
      )
    )
    .leftJoin(
      productSkus,
      eq(productSkus.productId, products.id)
    )
    .where(
      and(
        eq(megaMenuFeaturedProducts.categoryId, categoryId),
        eq(megaMenuFeaturedProducts.isActive, true),
        eq(products.isActive, true),
        eq(products.status, "approved"),
        sql`(${megaMenuFeaturedProducts.startsAt} IS NULL OR ${megaMenuFeaturedProducts.startsAt} <= ${now})`,
        sql`(${megaMenuFeaturedProducts.endsAt} IS NULL OR ${megaMenuFeaturedProducts.endsAt} >= ${now})`
      )
    )
    .orderBy(asc(megaMenuFeaturedProducts.sortOrder))
    .limit(limit);

  // If we have featured products, return them
  if (featuredRows.length > 0) {
    // Dedupe by product id and get lowest price per product
    const productMap = new Map<string, MegaMenuProductDTO>();
    for (const row of featuredRows) {
      const existing = productMap.get(row.product.id);
      if (!existing || (row.sku && row.sku.priceAmount < (existing.priceAmount || Infinity))) {
        productMap.set(row.product.id, {
          id: row.product.id,
          title: row.product.title,
          titleBn: row.product.titleBn,
          slug: row.product.slug,
          imageUrl: row.image?.s3Key ? getS3Url(row.image.s3Key) : null,
          priceAmount: row.sku?.priceAmount || 0,
          currency: row.sku?.currency || "BDT",
          isNew: row.product.isNew,
        });
      }
    }
    return Array.from(productMap.values()).slice(0, limit);
  }

  // Fallback: get best-selling products from this category
  const fallbackRows = await db
    .select({
      product: products,
      image: {
        s3Key: productImages.s3Key,
      },
      sku: productSkus,
    })
    .from(products)
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.sortOrder, 0)
      )
    )
    .leftJoin(
      productSkus,
      eq(productSkus.productId, products.id)
    )
    .where(
      and(
        eq(products.categoryId, categoryId),
        eq(products.isActive, true),
        eq(products.status, "approved")
      )
    )
    .orderBy(sql`${products.bestSellerScore} DESC NULLS LAST`)
    .limit(limit * 3); // Get more to account for deduplication

  // Dedupe and format
  const productMap = new Map<string, MegaMenuProductDTO>();
  for (const row of fallbackRows) {
    const existing = productMap.get(row.product.id);
    if (!existing || (row.sku && row.sku.priceAmount < (existing.priceAmount || Infinity))) {
      productMap.set(row.product.id, {
        id: row.product.id,
        title: row.product.title,
        titleBn: row.product.titleBn,
        slug: row.product.slug,
        imageUrl: row.image?.s3Key ? getS3Url(row.image.s3Key) : null,
        priceAmount: row.sku?.priceAmount || 0,
        currency: row.sku?.currency || "BDT",
        isNew: row.product.isNew,
      });
    }
  }

  return Array.from(productMap.values()).slice(0, limit);
}

export { categoriesRouter };
export type CategoriesRouterType = typeof categoriesRouter;
