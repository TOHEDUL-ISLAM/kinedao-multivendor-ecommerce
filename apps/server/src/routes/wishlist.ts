import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, getS3Url } from "@kineDao.com/db";
import {
  categories,
  productImages,
  productOptions,
  productSkus,
  products,
  vendors,
  wishlistItems,
  wishlists,
} from "@kineDao.com/db/schema";
import {
  wishlistAddItemSchema,
  wishlistMergeSchema,
  wishlistProductIdParamSchema,
  wishlistResolveSchema,
  type ProductCardDTO,
  type WishlistItemDTO,
  type WishlistMergeResponseDTO,
  type WishlistResponseDTO,
  type WishlistResolveResponseDTO,
} from "@kineDao.com/api-types";
import type { AppEnv } from "../index";

async function getWishlistByUserId(userId: string) {
  const [wishlist] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.userId, userId))
    .limit(1);

  return wishlist ?? null;
}

async function getOrCreateWishlist(userId: string) {
  const existing = await getWishlistByUserId(userId);
  if (existing) return existing;

  const [created] = await db
    .insert(wishlists)
    .values({ userId })
    .onConflictDoNothing({ target: wishlists.userId })
    .returning();

  if (created) return created;

  const fallback = await getWishlistByUserId(userId);
  if (!fallback) throw new Error("Failed to create wishlist");
  return fallback;
}

async function buildProductCardMap(productIds: string[]): Promise<Map<string, ProductCardDTO>> {
  if (productIds.length === 0) return new Map();

  const productRows = await db
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
        inArray(products.id, productIds),
        eq(products.isActive, true),
        eq(products.status, "approved")
      )
    );

  if (productRows.length === 0) return new Map();

  const validProductIds = productRows.map((row) => row.product.id);

  const [imageRows, skuRows, optionRows] = await Promise.all([
    db
      .select({
        productId: productImages.productId,
        s3Key: productImages.s3Key,
        alt: productImages.alt,
      })
      .from(productImages)
      .where(inArray(productImages.productId, validProductIds))
      .orderBy(asc(productImages.productId), asc(productImages.sortOrder)),
    db
      .select({
        productId: productSkus.productId,
        id: productSkus.id,
        optionValues: productSkus.optionValues,
        priceAmount: productSkus.priceAmount,
        compareAtAmount: productSkus.compareAtAmount,
        currency: productSkus.currency,
        stockQty: productSkus.stockQty,
        isAvailable: productSkus.isAvailable,
      })
      .from(productSkus)
      .where(inArray(productSkus.productId, validProductIds))
      .orderBy(asc(productSkus.productId), asc(productSkus.priceAmount)),
    db
      .select({ productId: productOptions.productId })
      .from(productOptions)
      .where(inArray(productOptions.productId, validProductIds)),
  ]);

  const firstImageByProductId = new Map<string, { s3Key: string; alt: string | null }>();
  for (const row of imageRows) {
    if (!firstImageByProductId.has(row.productId)) {
      firstImageByProductId.set(row.productId, { s3Key: row.s3Key, alt: row.alt });
    }
  }

  const hasOptionsSet = new Set(optionRows.map((row) => row.productId));

  const skuByProductId = new Map<string, typeof skuRows>();
  for (const row of skuRows) {
    const current = skuByProductId.get(row.productId) ?? [];
    current.push(row);
    skuByProductId.set(row.productId, current);
  }

  const orderedProductIds = [...productIds];
  const rowById = new Map(productRows.map((row) => [row.product.id, row]));
  const cards = new Map<string, ProductCardDTO>();

  for (const productId of orderedProductIds) {
    const row = rowById.get(productId);
    if (!row) continue;

    const productSkusForItem = skuByProductId.get(productId) ?? [];
    const availableSkus = productSkusForItem.filter((sku) => sku.isAvailable && sku.stockQty > 0);
    const prioritizedSkus = availableSkus.length > 0 ? availableSkus : productSkusForItem;
    const lowestSku = prioritizedSkus[0];

    const hasVariants =
      hasOptionsSet.has(productId) ||
      productSkusForItem.length > 1 ||
      productSkusForItem.some(
        (sku) => sku.optionValues && Object.keys(sku.optionValues).length > 0
      );

    const image = firstImageByProductId.get(productId);

    cards.set(productId, {
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
      imageUrl: image ? getS3Url(image.s3Key) : null,
      imageAlt: image?.alt || null,
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
    });
  }

  return cards;
}

export const wishlistRouter = new Hono<AppEnv>()
  .get(
    "/",
    describeRoute({
      tags: ["Wishlist"],
      summary: "Get user wishlist",
      description: "Fetch all saved wishlist items for the authenticated user.",
      responses: {
        200: {
          description: "Wishlist fetched",
          content: {
            "application/json": {
              schema: resolver(z.any()),
            },
          },
        },
        401: {
          description: "Unauthorized",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const userId = c.var.user?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const wishlist = await getWishlistByUserId(userId);
      if (!wishlist) {
        const response: WishlistResponseDTO = { items: [], total: 0 };
        return c.json(response, 200);
      }

      const itemRows = await db
        .select({
          productId: wishlistItems.productId,
          createdAt: wishlistItems.createdAt,
        })
        .from(wishlistItems)
        .where(eq(wishlistItems.wishlistId, wishlist.id))
        .orderBy(desc(wishlistItems.createdAt));

      const cardsById = await buildProductCardMap(itemRows.map((row) => row.productId));

      const items: WishlistItemDTO[] = itemRows
        .map((row) => {
          const product = cardsById.get(row.productId);
          if (!product) return null;

          return {
            product,
            savedAt: row.createdAt.toISOString(),
          };
        })
        .filter((row): row is WishlistItemDTO => row !== null);

      const response: WishlistResponseDTO = {
        items,
        total: items.length,
      };

      return c.json(response, 200);
    }
  )
  .post(
    "/items",
    describeRoute({
      tags: ["Wishlist"],
      summary: "Add item to wishlist",
      description: "Adds a product to the authenticated user's wishlist. Idempotent.",
      responses: {
        200: {
          description: "Item added",
          content: {
            "application/json": {
              schema: resolver(z.object({ success: z.boolean() })),
            },
          },
        },
      },
    }),
    zValidator("json", wishlistAddItemSchema),
    async (c) => {
      const userId = c.var.user?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { productId } = c.req.valid("json");

      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.id, productId),
            eq(products.isActive, true),
            eq(products.status, "approved")
          )
        )
        .limit(1);

      if (!product) {
        return c.json({ error: "Product not found" }, 404);
      }

      const wishlist = await getOrCreateWishlist(userId);

      await db
        .insert(wishlistItems)
        .values({
          wishlistId: wishlist.id,
          productId,
        })
        .onConflictDoNothing({
          target: [wishlistItems.wishlistId, wishlistItems.productId],
        });

      return c.json({ success: true }, 200);
    }
  )
  .delete(
    "/items",
    describeRoute({
      tags: ["Wishlist"],
      summary: "Clear wishlist",
      description: "Removes all products from the authenticated user's wishlist.",
      responses: {
        200: {
          description: "Wishlist cleared",
          content: {
            "application/json": {
              schema: resolver(z.object({ success: z.boolean() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const userId = c.var.user?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const wishlist = await getWishlistByUserId(userId);
      if (!wishlist) {
        return c.json({ success: true }, 200);
      }

      await db.delete(wishlistItems).where(eq(wishlistItems.wishlistId, wishlist.id));
      return c.json({ success: true }, 200);
    }
  )
  .delete(
    "/items/:productId",
    describeRoute({
      tags: ["Wishlist"],
      summary: "Remove item from wishlist",
      description: "Removes a product from the authenticated user's wishlist.",
      responses: {
        200: {
          description: "Item removed",
          content: {
            "application/json": {
              schema: resolver(z.object({ success: z.boolean() })),
            },
          },
        },
      },
    }),
    zValidator("param", wishlistProductIdParamSchema),
    async (c) => {
      const userId = c.var.user?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { productId } = c.req.valid("param");
      const wishlist = await getWishlistByUserId(userId);

      if (!wishlist) {
        return c.json({ success: true }, 200);
      }

      await db
        .delete(wishlistItems)
        .where(
          and(
            eq(wishlistItems.wishlistId, wishlist.id),
            eq(wishlistItems.productId, productId)
          )
        );

      return c.json({ success: true }, 200);
    }
  )
  .post(
    "/merge",
    describeRoute({
      tags: ["Wishlist"],
      summary: "Merge guest wishlist",
      description:
        "Merges client-side guest wishlist product IDs into the authenticated user's wishlist.",
      responses: {
        200: {
          description: "Merge completed",
          content: {
            "application/json": {
              schema: resolver(z.any()),
            },
          },
        },
      },
    }),
    zValidator("json", wishlistMergeSchema),
    async (c) => {
      const userId = c.var.user?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { productIds } = c.req.valid("json");
      const uniqueProductIds = Array.from(new Set(productIds));
      const wishlist = await getOrCreateWishlist(userId);

      if (uniqueProductIds.length === 0) {
        const [totalRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(wishlistItems)
          .where(eq(wishlistItems.wishlistId, wishlist.id));

        const response: WishlistMergeResponseDTO = {
          mergedCount: 0,
          total: totalRow?.count ?? 0,
        };

        return c.json(response, 200);
      }

      const validProducts = await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            inArray(products.id, uniqueProductIds),
            eq(products.isActive, true),
            eq(products.status, "approved")
          )
        );

      const validProductIds = validProducts.map((product) => product.id);

      if (validProductIds.length === 0) {
        const [totalRow] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(wishlistItems)
          .where(eq(wishlistItems.wishlistId, wishlist.id));

        const response: WishlistMergeResponseDTO = {
          mergedCount: 0,
          total: totalRow?.count ?? 0,
        };

        return c.json(response, 200);
      }

      const inserted = await db
        .insert(wishlistItems)
        .values(
          validProductIds.map((productId) => ({
            wishlistId: wishlist.id,
            productId,
          }))
        )
        .onConflictDoNothing({
          target: [wishlistItems.wishlistId, wishlistItems.productId],
        })
        .returning({ productId: wishlistItems.productId });

      const [totalRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(wishlistItems)
        .where(eq(wishlistItems.wishlistId, wishlist.id));

      const response: WishlistMergeResponseDTO = {
        mergedCount: inserted.length,
        total: totalRow?.count ?? 0,
      };

      return c.json(response, 200);
    }
  )
  .post(
    "/resolve",
    describeRoute({
      tags: ["Wishlist"],
      summary: "Resolve product IDs to wishlist cards",
      description:
        "Public helper endpoint for guest wishlist rendering based on product IDs in local storage.",
      responses: {
        200: {
          description: "Resolved cards",
          content: {
            "application/json": {
              schema: resolver(z.any()),
            },
          },
        },
      },
    }),
    zValidator("json", wishlistResolveSchema),
    async (c) => {
      const { productIds } = c.req.valid("json");
      const uniqueProductIds = Array.from(new Set(productIds));
      const cardsById = await buildProductCardMap(uniqueProductIds);

      const response: WishlistResolveResponseDTO = {
        items: uniqueProductIds
          .map((productId) => cardsById.get(productId))
          .filter((row): row is ProductCardDTO => row !== undefined),
      };

      return c.json(response, 200);
    }
  );

export type WishlistRouterType = typeof wishlistRouter;
