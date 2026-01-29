import { Hono } from "hono";
import { db } from "@kineDao.com/db";
import { products, productImages, productSkus, vendors, categories } from "@kineDao.com/db/schema";
import { eq, or, ilike, and, asc } from "drizzle-orm";
import { searchQuerySchema, type SearchSuggestResponse } from "../types/catalog";

const searchRouter = new Hono();

// GET /api/search/suggest - Typeahead search suggestions
searchRouter.get("/suggest", async (c) => {
  const query = c.req.query();
  const parsed = searchQuerySchema.safeParse(query);

  if (!parsed.success) {
    return c.json({ error: "Invalid query", details: parsed.error.flatten() }, 400);
  }

  const { q, limit } = parsed.data;
  const searchPattern = `%${q}%`;

  // Search products
  const productResults = await db
    .select({
      id: products.id,
      title: products.title,
      titleBn: products.titleBn,
      slug: products.slug,
    })
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        or(
          ilike(products.title, searchPattern),
          ilike(products.titleBn, searchPattern),
          ilike(products.brand, searchPattern)
        )
      )
    )
    .limit(limit);

  // Get images and prices for product results
  const productsWithDetails = await Promise.all(
    productResults.map(async (product) => {
      const [image] = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(asc(productImages.sortOrder))
        .limit(1);

      const [sku] = await db
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
        imageUrl: image?.url || null,
        priceAmount: sku?.priceAmount || 0,
        currency: sku?.currency || "BDT",
      };
    })
  );

  // Search categories
  const categoryResults = await db
    .select({
      id: categories.id,
      name: categories.name,
      nameBn: categories.nameBn,
      slug: categories.slug,
    })
    .from(categories)
    .where(
      or(ilike(categories.name, searchPattern), ilike(categories.nameBn, searchPattern))
    )
    .limit(limit);

  // Search vendors
  const vendorResults = await db
    .select({
      id: vendors.id,
      name: vendors.name,
      slug: vendors.slug,
    })
    .from(vendors)
    .where(ilike(vendors.name, searchPattern))
    .limit(limit);

  const response: SearchSuggestResponse = {
    products: productsWithDetails,
    categories: categoryResults,
    vendors: vendorResults,
  };

  return c.json(response);
});

export { searchRouter };
