import { Hono } from "hono";
import { db } from "@kineDao.com/db";
import {
  products,
  productImages,
  productSkus,
  vendors,
  categories,
} from "@kineDao.com/db/schema";
import { eq, and, gte, sql, asc, desc, or, ilike } from "drizzle-orm";
import {
  catalogQuerySchema,
  type CatalogProductsResponse,
  type CatalogFacetsResponse,
  type ProductCardDTO,
  type CategoryDTO,
  type VendorDTO,
} from "../types/catalog";

const catalogRouter = new Hono();

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

// GET /api/catalog/products - Paginated product listing with filters
catalogRouter.get("/products", async (c) => {
  const query = c.req.query();
  const parsed = catalogQuerySchema.safeParse(query);

  if (!parsed.success) {
    return c.json({ error: "Invalid query parameters", details: parsed.error.flatten() }, 400);
  }

  const { q, category, vendor, brand, min, max, rating, sort, cursor, limit } = parsed.data;

  // Build conditions
  const conditions = [eq(products.isActive, true)];

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

  // Category filter (by slug)
  if (category) {
    const categoryRow = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);

    if (categoryRow[0]) {
      // Get category and all child categories
      const childCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.parentId, categoryRow[0].id));

      const categoryIds = [categoryRow[0].id, ...childCategories.map((c) => c.id)];
      conditions.push(sql`${products.categoryId} IN ${categoryIds}`);
    }
  }

  // Vendor filter (by slug)
  if (vendor) {
    const vendorRow = await db
      .select()
      .from(vendors)
      .where(eq(vendors.slug, vendor))
      .limit(1);

    if (vendorRow[0]) {
      conditions.push(eq(products.vendorId, vendorRow[0].id));
    }
  }

  // Brand filter
  if (brand) {
    conditions.push(ilike(products.brand, brand));
  }

  // Rating filter
  if (rating !== undefined) {
    conditions.push(gte(products.ratingAvg, rating));
  }

  // Cursor-based pagination
  if (cursor) {
    try {
      const [cursorId, cursorValue] = cursor.split("_");
      if (!cursorId) throw new Error("Invalid cursor");

      // Depending on sort, we need different cursor logic
      if (sort === "price_asc" || sort === "price_desc") {
        // Price sort uses SKU subquery, just use ID for now
        conditions.push(sql`${products.id} > ${cursorId}`);
      } else if (sort === "newest" && cursorValue) {
        conditions.push(
          sql`(${products.createdAt}, ${products.id}) < (${new Date(cursorValue)}, ${cursorId})`
        );
      } else if (sort === "bestseller" && cursorValue) {
        conditions.push(
          sql`(${products.bestSellerScore}, ${products.id}) < (${parseInt(cursorValue, 10)}, ${cursorId})`
        );
      } else if (sort === "rating" && cursorValue) {
        conditions.push(
          sql`(${products.ratingAvg}, ${products.id}) < (${parseFloat(cursorValue)}, ${cursorId})`
        );
      } else {
        conditions.push(sql`${products.id} > ${cursorId}`);
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
    .where(and(...conditions));

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

  // Apply price filter (post-query since price is in SKUs)
  if (min !== undefined || max !== undefined) {
    formattedProducts = formattedProducts.filter((p) => {
      if (min !== undefined && p.priceAmount < min) return false;
      if (max !== undefined && p.priceAmount > max) return false;
      return true;
    });
  }

  // Sort by price if needed (post-query)
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
    .where(and(...conditions.slice(0, -1))); // Remove cursor condition for total

  const response: CatalogProductsResponse = {
    items: formattedProducts,
    nextCursor,
    total: countResult?.count || 0,
  };

  return c.json(response);
});

// GET /api/catalog/facets - Filter options
catalogRouter.get("/facets", async (c) => {
  // Categories with product counts
  const categoriesData = await db
    .select({
      category: categories,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(categories)
    .leftJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.isActive, true))
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));

  const categoryDTOs: CategoryDTO[] = categoriesData.map((row) => ({
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

  // Vendors with product counts
  const vendorsData = await db
    .select({
      vendor: vendors,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(vendors)
    .leftJoin(
      products,
      and(eq(products.vendorId, vendors.id), eq(products.isActive, true))
    )
    .groupBy(vendors.id)
    .orderBy(desc(sql`count(${products.id})`));

  const vendorDTOs: VendorDTO[] = vendorsData.map((row) => ({
    id: row.vendor.id,
    name: row.vendor.name,
    slug: row.vendor.slug,
    logoUrl: row.vendor.logoUrl,
    ratingAvg: row.vendor.ratingAvg,
    ratingCount: row.vendor.ratingCount,
    locationCity: row.vendor.locationCity,
    isVerified: row.vendor.isVerified,
    badges: row.vendor.badges,
    productCount: row.productCount,
  }));

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
    priceRange: {
      min: priceRange?.min || 0,
      max: priceRange?.max || 100000,
    },
  };

  return c.json(response);
});

export { catalogRouter };
