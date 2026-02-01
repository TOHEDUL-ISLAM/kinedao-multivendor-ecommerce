import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { db } from "@kineDao.com/db";
import {
  products,
  productImages,
  productSkus,
  vendors,
  categories,
} from "@kineDao.com/db/schema";
import { eq, and, sql, asc, desc, ilike } from "drizzle-orm";
import {
  categoryPageQuerySchema,
  type CategoryPageResponse,
  type ProductCardDTO,
  type BrandFacet,
  type AgeRangeFacet,
} from "@kineDao.com/api-types/catalog";
import { z } from "zod";

// Standard age range options for filtering
const AGE_RANGE_OPTIONS = [
  { value: "0-3", label: "0-3 months", labelBn: "০-৩ মাস", pattern: "0-3" },
  { value: "3-6", label: "3-6 months", labelBn: "৩-৬ মাস", pattern: "3-6" },
  { value: "6-12", label: "6-12 months", labelBn: "৬-১২ মাস", pattern: "6-12" },
  { value: "1-2", label: "1-2 years", labelBn: "১-২ বছর", pattern: "1-2" },
  { value: "2-3", label: "2-3 years", labelBn: "২-৩ বছর", pattern: "2-3" },
  { value: "3+", label: "3+ years", labelBn: "৩+ বছর", pattern: "3+" },
];

// Helper to format product card
async function formatProductCard(
  product: typeof products.$inferSelect & {
    vendor: typeof vendors.$inferSelect;
    category: typeof categories.$inferSelect;
  }
): Promise<ProductCardDTO> {
  const [image] = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder))
    .limit(1);

  const [sku] = await db
    .select()
    .from(productSkus)
    .where(
      and(eq(productSkus.productId, product.id), eq(productSkus.isAvailable, true))
    )
    .orderBy(asc(productSkus.priceAmount))
    .limit(1);

  const [anySku] =
    sku !== undefined
      ? [sku]
      : await db
          .select()
          .from(productSkus)
          .where(eq(productSkus.productId, product.id))
          .orderBy(asc(productSkus.priceAmount))
          .limit(1);

  return {
    id: product.id,
    title: product.title,
    titleBn: product.titleBn,
    slug: product.slug,
    brand: product.brand,
    ageRange: product.ageRange,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    isNew: product.isNew,
    isHot: product.isHot,
    imageUrl: image?.url || null,
    imageAlt: image?.alt || null,
    priceAmount: anySku?.priceAmount || 0,
    compareAtAmount: anySku?.compareAtAmount || null,
    currency: anySku?.currency || "BDT",
    isAvailable: sku !== undefined,
    vendor: {
      id: product.vendor.id,
      name: product.vendor.name,
      slug: product.vendor.slug,
      isVerified: product.vendor.isVerified,
    },
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
  };
}

// GET /api/category/:slug - Category page with products, pagination, and facets
const categoryRouter = new Hono().get(
  "/:slug",
  describeRoute({
    tags: ["Category"],
    summary: "Get category page data",
    description: "Fetch category details, products with pagination, and available facets (brands, age ranges, price range) for filtering.",
    responses: {
      200: {
        description: "Successful response with category page data",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                category: z.any(),
                products: z.array(z.any()),
                pagination: z.object({
                  page: z.number(),
                  limit: z.number(),
                  total: z.number(),
                  totalPages: z.number(),
                }),
                facets: z.object({
                  brands: z.array(z.any()),
                  ageRanges: z.array(z.any()),
                  priceRange: z.object({
                    min: z.number(),
                    max: z.number(),
                  }),
                }),
              })
            ),
          },
        },
      },
      404: {
        description: "Category not found",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                error: z.string(),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator("query", categoryPageQuerySchema),
  async (c) => {
  const { slug } = c.req.param();
  const { page, limit, sort, brand, minPrice, maxPrice, ageRange } = c.req.valid("query");

  // Fetch the category
  const [categoryRow] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  if (!categoryRow) {
    return c.json({ error: "Category not found" }, 404);
  }

  // Fetch parent category if exists
  let parentCategory = null;
  if (categoryRow.parentId) {
    const [parent] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryRow.parentId))
      .limit(1);
    if (parent) {
      parentCategory = {
        name: parent.name,
        nameBn: parent.nameBn,
        slug: parent.slug,
      };
    }
  }

  // Get category and all child categories for product query
  const childCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.parentId, categoryRow.id));
  const categoryIds = [categoryRow.id, ...childCategories.map((c) => c.id)];

  // Build base conditions
  const conditions = [
    eq(products.isActive, true),
    sql`${products.categoryId} IN ${categoryIds}`,
  ];

  // Brand filter (comma-separated)
  const brandFilters = brand?.split(",").filter(Boolean) || [];
  if (brandFilters.length > 0) {
    const brandConditions = brandFilters.map((b) => ilike(products.brand, b));
    conditions.push(sql`(${sql.join(brandConditions, sql` OR `)})`);
  }

  // Age range filter (comma-separated)
  const ageRangeFilters = ageRange?.split(",").filter(Boolean) || [];
  if (ageRangeFilters.length > 0) {
    const ageConditions = ageRangeFilters.map((ar) =>
      ilike(products.ageRange, `%${ar}%`)
    );
    conditions.push(sql`(${sql.join(ageConditions, sql` OR `)})`);
  }

  // Query products with joins
  let queryBuilder = db
    .select({
      product: products,
      vendor: vendors,
      category: categories,
    })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions));

  // Apply sort
  switch (sort) {
    case "newest":
      queryBuilder = queryBuilder.orderBy(desc(products.createdAt), desc(products.id)) as typeof queryBuilder;
      break;
    case "name_asc":
      queryBuilder = queryBuilder.orderBy(asc(products.title), asc(products.id)) as typeof queryBuilder;
      break;
    default:
      queryBuilder = queryBuilder.orderBy(desc(products.createdAt), desc(products.id)) as typeof queryBuilder;
  }

  // Fetch all products for this category (for price filtering and sorting)
  const allRows = await queryBuilder;

  // Format products
  let formattedProducts = await Promise.all(
    allRows.map((row) =>
      formatProductCard({
        ...row.product,
        vendor: row.vendor,
        category: row.category,
      })
    )
  );

  // Apply price filter (post-query since price is in SKUs)
  if (minPrice !== undefined || maxPrice !== undefined) {
    formattedProducts = formattedProducts.filter((p) => {
      if (minPrice !== undefined && p.priceAmount < minPrice) return false;
      if (maxPrice !== undefined && p.priceAmount > maxPrice) return false;
      return true;
    });
  }

  // Sort by price if needed (post-query)
  if (sort === "price_asc") {
    formattedProducts.sort((a, b) => a.priceAmount - b.priceAmount);
  } else if (sort === "price_desc") {
    formattedProducts.sort((a, b) => b.priceAmount - a.priceAmount);
  }

  // Calculate pagination
  const total = formattedProducts.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginatedProducts = formattedProducts.slice(offset, offset + limit);

  // Calculate facets (brands with counts)
  const brandCounts: Record<string, number> = {};
  for (const p of formattedProducts) {
    if (p.brand) {
      brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
    }
  }
  const brandFacets: BrandFacet[] = Object.entries(brandCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Calculate age range facets
  const ageRangeCounts: Record<string, number> = {};
  for (const p of formattedProducts) {
    if (p.ageRange) {
      for (const option of AGE_RANGE_OPTIONS) {
        if (p.ageRange.toLowerCase().includes(option.pattern.toLowerCase())) {
          ageRangeCounts[option.value] = (ageRangeCounts[option.value] || 0) + 1;
        }
      }
    }
  }
  const ageRangeFacets: AgeRangeFacet[] = AGE_RANGE_OPTIONS
    .map((option) => ({
      value: option.value,
      label: option.label,
      labelBn: option.labelBn,
      count: ageRangeCounts[option.value] || 0,
    }))
    .filter((ar) => ar.count > 0);

  // Calculate price range from all products
  const prices = formattedProducts.map((p) => p.priceAmount).filter((p) => p > 0);
  const priceRange = {
    min: prices.length > 0 ? Math.min(...prices) : 0,
    max: prices.length > 0 ? Math.max(...prices) : 100000,
  };

  const response: CategoryPageResponse = {
    category: {
      id: categoryRow.id,
      name: categoryRow.name,
      nameBn: categoryRow.nameBn,
      slug: categoryRow.slug,
      parentId: categoryRow.parentId,
      imageUrl: categoryRow.imageUrl,
      parent: parentCategory,
    },
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    facets: {
      brands: brandFacets,
      ageRanges: ageRangeFacets,
      priceRange,
    },
  };

  return c.json(response, 200);
});

export { categoryRouter };
export type CategoryRouterType = typeof categoryRouter;
