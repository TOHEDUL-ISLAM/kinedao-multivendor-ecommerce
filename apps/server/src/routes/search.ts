import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { db, getS3Url } from "@kineDao.com/db";
import { products, productImages, productSkus, vendors, categories } from "@kineDao.com/db/schema";
import { eq, or, ilike, and, asc, inArray } from "drizzle-orm";
import { searchQuerySchema, type SearchSuggestResponse } from "@kineDao.com/api-types/catalog";
import { z } from "zod";

// GET /api/search/suggest - Typeahead search suggestions
const searchRouter = new Hono().get(
  "/suggest",
  describeRoute({
    tags: ["Search"],
    summary: "Get search suggestions",
    description: "Typeahead search suggestions for products, categories, and vendors based on query string.",
    responses: {
      200: {
        description: "Successful response with search suggestions",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                products: z.array(z.any()),
                categories: z.array(z.any()),
                vendors: z.array(z.any()),
              })
            ),
          },
        },
      },
    },
  }),
  zValidator("query", searchQuerySchema),
  async (c) => {
  const { q, limit } = c.req.valid("query");
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
        eq(products.status, "approved"),
        or(
          ilike(products.title, searchPattern),
          ilike(products.titleBn, searchPattern),
          ilike(products.brand, searchPattern)
        )
      )
    )
    .limit(limit);

  const productIds = productResults.map((product) => product.id);
  const [imageRows, skuRows] =
    productIds.length > 0
      ? await Promise.all([
          db
            .select({
              productId: productImages.productId,
              s3Key: productImages.s3Key,
            })
            .from(productImages)
            .where(inArray(productImages.productId, productIds))
            .orderBy(asc(productImages.productId), asc(productImages.sortOrder)),
          db
            .select({
              productId: productSkus.productId,
              priceAmount: productSkus.priceAmount,
              currency: productSkus.currency,
            })
            .from(productSkus)
            .where(inArray(productSkus.productId, productIds))
            .orderBy(asc(productSkus.productId), asc(productSkus.priceAmount)),
        ])
      : [[], []];

  const imageByProductId = new Map<string, string>();
  for (const row of imageRows) {
    if (!imageByProductId.has(row.productId)) {
      imageByProductId.set(row.productId, row.s3Key);
    }
  }

  const priceByProductId = new Map<
    string,
    { priceAmount: number; currency: string }
  >();
  for (const row of skuRows) {
    if (!priceByProductId.has(row.productId)) {
      priceByProductId.set(row.productId, {
        priceAmount: row.priceAmount,
        currency: row.currency,
      });
    }
  }

  const productsWithDetails = productResults.map((product) => {
    const imageKey = imageByProductId.get(product.id);
    const pricing = priceByProductId.get(product.id);

    return {
      id: product.id,
      title: product.title,
      titleBn: product.titleBn,
      slug: product.slug,
      imageUrl: imageKey ? getS3Url(imageKey) : null,
      priceAmount: pricing?.priceAmount ?? 0,
      currency: pricing?.currency ?? "BDT",
    };
  });

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

  return c.json(response, 200);
});

export { searchRouter };
export type SearchRouterType = typeof searchRouter;
