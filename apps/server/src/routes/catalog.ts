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
import { eq, and, gte, lte, sql, asc, desc, or, ilike, inArray } from "drizzle-orm";
import {
  catalogQuerySchema,
  type CatalogProductsResponse,
  type CatalogFacetsResponse,
  type ProductCardDTO,
  type CategoryDTO,
  type VendorDTO,
} from "@kineDao.com/api-types/catalog";
import { z } from "zod";

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
    ageRangeMin: product.ageRangeMin,
    ageRangeMax: product.ageRangeMax,
    isBpaFree: product.isBpaFree,
    isOrganic: product.isOrganic,
    isHypoallergenic: product.isHypoallergenic,
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

// GET /api/catalog/products - Paginated product listing with filters
// GET /api/catalog/facets - Category, vendor, brand, and age range facets with price range
const catalogRouter = new Hono().get(
  "/products",
  describeRoute({
    tags: ["Catalog"],
    summary: "Get paginated product catalog",
    description: "Fetch products with filters (category, vendor, price, rating) and sorting options. Supports cursor-based pagination.",
    responses: {
      200: {
        description: "Successful response with product list",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                items: z.array(z.any()),
                nextCursor: z.string().nullable(),
                total: z.number(),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator("query", catalogQuerySchema),
  async (c) => {
  const { q, category, vendor, brand, ageRange, isBpaFree, isOrganic, isHypoallergenic, min, max, rating, sort, cursor, limit } = c.req.valid("query");

  // Build base conditions (exclude cursor for total count)
  const conditions = [eq(products.isActive, true)];
  const cursorConditions: typeof conditions = [];

  // Text search
  if (q) {
    conditions.push(
      or(
        ilike(products.title, `%${q}%`),
        ilike(products.titleBn, `%${q}%`),
        ilike(products.brand, `%${q}%`),
        ilike(products.shortDescription, `%${q}%`)
      )!
    );
  }

  // Category filter (by comma-separated slugs, supports multiple selections)
  if (category) {
    const categorySlugs = category.split(",").filter(Boolean);

    if (categorySlugs.length > 0) {
      const categoryRows = await db
        .select()
        .from(categories)
        .where(inArray(categories.slug, categorySlugs));

      if (categoryRows.length > 0) {
        // Get all category IDs and their descendants recursively
        const allCategoryIds = new Set<string>();

        // Recursive function to get all descendants
        async function addCategoryAndDescendants(categoryId: string) {
          allCategoryIds.add(categoryId);

          // Get all direct children
          const children = await db
            .select()
            .from(categories)
            .where(eq(categories.parentId, categoryId));

          // Recursively add each child and its descendants
          for (const child of children) {
            await addCategoryAndDescendants(child.id);
          }
        }

        // Process each selected category
        for (const cat of categoryRows) {
          await addCategoryAndDescendants(cat.id);
        }

        if (allCategoryIds.size > 0) {
          const categoryIdArray = Array.from(allCategoryIds);
          conditions.push(inArray(products.categoryId, categoryIdArray));
        }
      }
    }
  }

  // Vendor filter (by comma-separated slugs, supports multiple selections)
  if (vendor) {
    const vendorSlugs = vendor.split(",").filter(Boolean);

    if (vendorSlugs.length > 0) {
      const vendorRows = await db
        .select()
        .from(vendors)
        .where(inArray(vendors.slug, vendorSlugs));

      if (vendorRows.length > 0) {
        const vendorIds = vendorRows.map((v) => v.id);
        conditions.push(inArray(products.vendorId, vendorIds));
      }
    }
  }

  // Brand filter
  if (brand) {
    const brandNames = brand.split(",").filter(Boolean);
    if (brandNames.length > 0) {
      conditions.push(inArray(products.brand, brandNames));
    }
  }

  // Age Range filter (numeric overlap logic)
  if (ageRange) {
    const ageRanges = ageRange.split(",").filter(Boolean);
    if (ageRanges.length > 0) {
      const ageRangeMapping: Record<string, { min: number; max: number }> = {
        "0-3 months": { min: 0, max: 3 },
        "3-6 months": { min: 3, max: 6 },
        "6-12 months": { min: 6, max: 12 },
        "1-2 years": { min: 12, max: 24 },
        "2-3 years": { min: 24, max: 36 },
      };

      const ageConditions = ageRanges
        .map((range) => {
          const numeric = ageRangeMapping[range];
          if (!numeric) return null;

          // Overlap: product.ageRangeMin <= selected.max AND product.ageRangeMax >= selected.min
          return and(
            lte(products.ageRangeMin, numeric.max),
            gte(products.ageRangeMax, numeric.min)
          );
        })
        .filter((condition): condition is NonNullable<typeof condition> => condition !== null);

      if (ageConditions.length > 0) {
        conditions.push(or(...ageConditions)!);
      }
    }
  }

  // Safety Filters
  if (isBpaFree === "true") {
    conditions.push(eq(products.isBpaFree, true));
  }
  if (isOrganic === "true") {
    conditions.push(eq(products.isOrganic, true));
  }
  if (isHypoallergenic === "true") {
    conditions.push(eq(products.isHypoallergenic, true));
  }

  // Rating filter
  if (rating !== undefined) {
    conditions.push(gte(products.ratingAvg, rating));
  }

  // Price filter (moved to DB query)
  if (min !== undefined || max !== undefined) {
    const minPrice = min ?? 0;
    const maxPrice = max ?? Number.MAX_SAFE_INTEGER;
    
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${productSkus}
        WHERE ${productSkus.productId} = ${products.id}
        AND ${productSkus.priceAmount} >= ${minPrice}
        AND ${productSkus.priceAmount} <= ${maxPrice}
      )`
    );
  }

  // Cursor-based pagination
  if (cursor) {
    try {
      const [cursorId, cursorValue] = cursor.split("_");
      if (!cursorId) throw new Error("Invalid cursor");

      // Depending on sort, we need different cursor logic
      if (sort === "price_asc" || sort === "price_desc") {
        // Price sort uses SKU subquery, just use ID for now
        cursorConditions.push(sql`${products.id} > ${cursorId}`);
      } else if (sort === "newest" && cursorValue) {
        cursorConditions.push(
          sql`(${products.createdAt}, ${products.id}) < (${new Date(cursorValue)}, ${cursorId})`
        );
      } else if (sort === "bestseller" && cursorValue) {
        cursorConditions.push(
          sql`(${products.bestSellerScore}, ${products.id}) < (${parseInt(cursorValue, 10)}, ${cursorId})`
        );
      } else if (sort === "rating" && cursorValue) {
        cursorConditions.push(
          sql`(${products.ratingAvg}, ${products.id}) < (${parseFloat(cursorValue)}, ${cursorId})`
        );
      } else {
        cursorConditions.push(sql`${products.id} > ${cursorId}`);
      }
    } catch {
      // Invalid cursor, ignore
    }
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
    .where(and(...conditions, ...cursorConditions));

  // Apply sort
  switch (sort) {
    case "newest":
      queryBuilder = queryBuilder.orderBy(desc(products.createdAt), desc(products.id)) as any;
      break;
    case "bestseller":
      queryBuilder = queryBuilder.orderBy(desc(products.bestSellerScore), desc(products.id)) as any;
      break;
    case "rating":
      queryBuilder = queryBuilder.orderBy(desc(products.ratingAvg), desc(products.id)) as any;
      break;
    default:
      queryBuilder = queryBuilder.orderBy(asc(products.id)) as any;
  }

  // Limit + 1 to check for more
  const rows = await (queryBuilder as any).limit(limit + 1);

  // Format products
  let formattedProducts = await Promise.all(
    rows.slice(0, limit).map((row: any) =>
      formatProductCard({
        ...row.product,
        vendor: row.vendor,
        category: row.category,
      })
    )
  );

  // Sort by price if needed (post-query, or we could improve this later with a subquery sort)
  if (sort === "price_asc") {
    formattedProducts.sort((a, b) => a.priceAmount - b.priceAmount);
  } else if (sort === "price_desc") {
    formattedProducts.sort((a, b) => b.priceAmount - a.priceAmount);
  }

  // Calculate next cursor
  const hasMore = rows.length > limit;
  let nextCursor: string | null = null;

  if (hasMore && formattedProducts.length > 0) {
    const lastProduct = rows[limit - 1];
    switch (sort) {
      case "newest":
        nextCursor = `${lastProduct.product.id}_${lastProduct.product.createdAt.toISOString()}`;
        break;
      case "bestseller":
        nextCursor = `${lastProduct.product.id}_${lastProduct.product.bestSellerScore}`;
        break;
      case "rating":
        nextCursor = `${lastProduct.product.id}_${lastProduct.product.ratingAvg}`;
        break;
      default:
        nextCursor = `${lastProduct.product.id}_`;
    }
  }

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(and(...conditions));

  const response: CatalogProductsResponse = {
    items: formattedProducts,
    nextCursor,
    total: countResult?.count || 0,
  };

  return c.json(response, 200);
})
.get(
  "/facets",
  describeRoute({
    tags: ["Catalog"],
    summary: "Get catalog facets",
    description: "Fetch available filters including categories, vendors, brands, age ranges, and price ranges for the catalog.",
    responses: {
      200: {
        description: "Successful response with facets data",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                categories: z.array(z.any()),
                vendors: z.array(z.any()),
                brands: z.array(z.any()),
                ageRanges: z.array(z.any()),
                priceRange: z.object({
                  min: z.number(),
                  max: z.number(),
                }),
              })
            ),
          },
        },
      },
    },
  }),
  async (c) => {
  // Categories with product counts
  const categoriesData = await db
    .select({
      id: categories.id,
      name: categories.name,
      nameBn: categories.nameBn,
      slug: categories.slug,
      parentId: categories.parentId,
      iconKey: categories.iconKey,
      imageUrl: categories.imageUrl,
      sortOrder: categories.sortOrder,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(categories)
    .leftJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.isActive, true))
    )
    .groupBy(
      categories.id,
      categories.name,
      categories.nameBn,
      categories.slug,
      categories.parentId,
      categories.iconKey,
      categories.imageUrl,
      categories.sortOrder
    )
    .orderBy(asc(categories.sortOrder));

  // Map to DTOs with direct product counts
  const categoryDTOs: CategoryDTO[] = categoriesData.map((row) => ({
    id: row.id,
    name: row.name,
    nameBn: row.nameBn,
    slug: row.slug,
    parentId: row.parentId,
    iconKey: row.iconKey,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
    productCount: row.productCount,
  }));

  // Recursively aggregate product counts from children to parents
  const categoryMap = new Map(categoryDTOs.map(c => [c.id, c]));

  // Function to get total count including all descendants
  function getTotalCount(categoryId: string, visited = new Set<string>()): number {
    if (visited.has(categoryId)) return 0; // Prevent infinite loops
    visited.add(categoryId);

    const category = categoryMap.get(categoryId);
    if (!category) return 0;

    // Start with direct product count
    let total = category.productCount || 0;

    // Add counts from all children
    const children = categoryDTOs.filter(c => c.parentId === categoryId);
    for (const child of children) {
      total += getTotalCount(child.id, visited);
    }

    return total;
  }

  // Update all categories with total counts (including descendants)
  categoryDTOs.forEach(category => {
    category.productCount = getTotalCount(category.id);
  });

  // Vendors with product counts
  const vendorsData = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      slug: vendors.slug,
      logoUrl: vendors.logoUrl,
      ratingAvg: vendors.ratingAvg,
      ratingCount: vendors.ratingCount,
      locationCity: vendors.locationCity,
      isVerified: vendors.isVerified,
      badges: vendors.badges,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(vendors)
    .leftJoin(
      products,
      and(eq(products.vendorId, vendors.id), eq(products.isActive, true))
    )
    .groupBy(
      vendors.id,
      vendors.name,
      vendors.slug,
      vendors.logoUrl,
      vendors.ratingAvg,
      vendors.ratingCount,
      vendors.locationCity,
      vendors.isVerified,
      vendors.badges
    )
    .orderBy(desc(sql`count(${products.id})`));

  const vendorDTOs: VendorDTO[] = vendorsData.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logoUrl,
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
    locationCity: row.locationCity,
    isVerified: row.isVerified,
    badges: row.badges,
    productCount: row.productCount,
  }));

  // Brands with product counts
  const brandsData = await db
    .select({
      name: products.brand,
      count: sql<number>`count(*)::int`,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .groupBy(products.brand)
    .orderBy(desc(sql`count(*)`));

  const brandDTOs = brandsData.filter(b => b.name).map(b => ({
    name: b.name!,
    count: b.count,
  }));

  // Age Ranges with product counts
  const ageRangesData = await db
    .select({
      ageRange: products.ageRange,
      count: sql<number>`count(*)::int`,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .groupBy(products.ageRange)
    .orderBy(desc(sql`count(*)`));

  const ageRangeDTOs = ageRangesData.filter(a => a.ageRange).map(a => ({
    value: a.ageRange!,
    label: a.ageRange!,
    labelBn: a.ageRange!, // TODO: Add BN mapping
    count: a.count,
  }));

  // Safety facets
  const [safetyFacets] = await db
    .select({
      isBpaFree: sql<number>`count(*) filter (where ${products.isBpaFree} = true)::int`,
      isOrganic: sql<number>`count(*) filter (where ${products.isOrganic} = true)::int`,
      isHypoallergenic: sql<number>`count(*) filter (where ${products.isHypoallergenic} = true)::int`,
    })
    .from(products)
    .where(eq(products.isActive, true));

  // Price range from SKUs
  const [priceRange] = await db
    .select({
      min: sql<number>`min(${productSkus.priceAmount})::int`,
      max: sql<number>`max(${productSkus.priceAmount})::int`,
    })
    .from(productSkus)
    .innerJoin(products, eq(productSkus.productId, products.id))
    .where(eq(products.isActive, true));

  const response: CatalogFacetsResponse = {
    categories: categoryDTOs,
    vendors: vendorDTOs,
    brands: brandDTOs,
    ageRanges: ageRangeDTOs,
    safety: {
      isBpaFree: safetyFacets?.isBpaFree || 0,
      isOrganic: safetyFacets?.isOrganic || 0,
      isHypoallergenic: safetyFacets?.isHypoallergenic || 0,
    },
    priceRange: {
      min: priceRange?.min || 0,
      max: priceRange?.max || 100000,
    },
  };

  return c.json(response, 200);
});

export { catalogRouter };
export type CatalogRouterType = typeof catalogRouter;
