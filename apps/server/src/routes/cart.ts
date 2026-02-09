import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { db, getS3Url } from "@kineDao.com/db";
import {
  carts,
  cartItems,
  products,
  productImages,
  productSkus,
  vendors,
} from "@kineDao.com/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  cartAddItemSchema,
  cartHeaders,
  cartItemParamSchema,
  cartUpdateItemSchema,
  type CartResponse,
  type CartItem,
} from "@kineDao.com/api-types/cart";
import type { AppEnv } from "../index";

type CartRow = typeof carts.$inferSelect;

const getCartByUserId = async (userId: string) => {
  const [cart] = await db
    .select()
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);
  return cart ?? null;
};

const getCartBySessionId = async (sessionId: string) => {
  const [cart] = await db
    .select()
    .from(carts)
    .where(eq(carts.sessionId, sessionId))
    .limit(1);
  return cart ?? null;
};

const resolveCart = async (userId: string | null, guestId: string | null) => {
  if (userId) {
    return await getCartByUserId(userId);
  }
  if (guestId) {
    return await getCartBySessionId(guestId);
  }
  return null;
};

const createCart = async (userId: string | null, guestId: string | null) => {
  const [cart] = await db
    .insert(carts)
    .values({
      userId: userId ?? null,
      sessionId: userId ? null : guestId,
    })
    .returning();
  return cart;
};

const getOrCreateCart = async (userId: string | null, guestId: string | null) => {
  const existing = await resolveCart(userId, guestId);
  if (existing) return existing;
  return await createCart(userId, guestId);
};

const selectSkuForProduct = async (productId: string, skuId?: string) => {
  const skuRows = await db
    .select({
      id: productSkus.id,
      productId: productSkus.productId,
      priceAmount: productSkus.priceAmount,
      stockQty: productSkus.stockQty,
      isAvailable: productSkus.isAvailable,
    })
    .from(productSkus)
    .where(eq(productSkus.productId, productId))
    .orderBy(asc(productSkus.priceAmount));

  if (skuId) {
    const selected = skuRows.find((sku) => sku.id === skuId);
    return selected ?? null;
  }

  const available = skuRows.find(
    (sku) => (sku.isAvailable ?? true) && sku.stockQty > 0
  );
  return available ?? skuRows[0] ?? null;
};

const buildCartResponse = async (cart: CartRow): Promise<CartResponse> => {
  const itemRows = await db
    .select({
      itemId: cartItems.id,
      quantity: cartItems.quantity,
      unitPrice: cartItems.unitPrice,
      productId: products.id,
      productTitle: products.title,
      productTitleBn: products.titleBn,
      productSlug: products.slug,
      productAgeRange: products.ageRange,
      productIsBpaFree: products.isBpaFree,
      productIsOrganic: products.isOrganic,
      productIsHypoallergenic: products.isHypoallergenic,
      productExpiryDate: products.expiryDate,
      productStatus: products.status,
      productIsActive: products.isActive,
      vendorId: vendors.id,
      vendorName: vendors.name,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(eq(cartItems.cartId, cart.id));

  if (itemRows.length === 0) {
    return {
      cart: {
        id: cart.id,
        items: [],
        subtotal: 0,
        itemCount: 0,
      },
    };
  }

  const invalidItemIds = itemRows
    .filter((row) => row.productStatus !== "approved" || !row.productIsActive)
    .map((row) => row.itemId);

  if (invalidItemIds.length > 0) {
    await db.delete(cartItems).where(inArray(cartItems.id, invalidItemIds));
  }

  const validRows = itemRows.filter(
    (row) => row.productStatus === "approved" && row.productIsActive
  );

  if (validRows.length === 0) {
    return {
      cart: {
        id: cart.id,
        items: [],
        subtotal: 0,
        itemCount: 0,
      },
    };
  }

  const productIds = Array.from(new Set(validRows.map((row) => row.productId)));

  const imageRows = await db
    .select({
      productId: productImages.productId,
      s3Key: productImages.s3Key,
      alt: productImages.alt,
      sortOrder: productImages.sortOrder,
    })
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sortOrder));

  const imageByProduct = new Map<
    string,
    { url: string; alt: string | null }
  >();
  for (const image of imageRows) {
    if (!imageByProduct.has(image.productId)) {
      imageByProduct.set(image.productId, { url: getS3Url(image.s3Key), alt: image.alt });
    }
  }

  const skuRows = await db
    .select({
      productId: productSkus.productId,
      priceAmount: productSkus.priceAmount,
      stockQty: productSkus.stockQty,
      isAvailable: productSkus.isAvailable,
    })
    .from(productSkus)
    .where(inArray(productSkus.productId, productIds))
    .orderBy(asc(productSkus.priceAmount));

  const preferredSkuByProduct = new Map<string, typeof skuRows[number]>();
  const fallbackSkuByProduct = new Map<string, typeof skuRows[number]>();

  for (const sku of skuRows) {
    if (!fallbackSkuByProduct.has(sku.productId)) {
      fallbackSkuByProduct.set(sku.productId, sku);
    }
    if (
      !preferredSkuByProduct.has(sku.productId) &&
      (sku.isAvailable ?? true) &&
      sku.stockQty > 0
    ) {
      preferredSkuByProduct.set(sku.productId, sku);
    }
  }

  const items: CartItem[] = validRows.map((row) => {
    const sku =
      preferredSkuByProduct.get(row.productId) ??
      fallbackSkuByProduct.get(row.productId);
    const image = imageByProduct.get(row.productId);
    const currentPrice = sku?.priceAmount ?? row.unitPrice;
    const stock = sku?.stockQty ?? 0;

    return {
      id: row.itemId,
      product: {
        id: row.productId,
        title: row.productTitle,
        titleBn: row.productTitleBn,
        slug: row.productSlug,
        image: image?.url ?? null,
        imageAlt: image?.alt ?? null,
        price: currentPrice,
        stock,
        vendor: {
          id: row.vendorId,
          shopName: row.vendorName,
        },
        ageRange: row.productAgeRange,
        isBpaFree: row.productIsBpaFree,
        isOrganic: row.productIsOrganic,
        isHypoallergenic: row.productIsHypoallergenic,
        expiryDate: row.productExpiryDate
          ? row.productExpiryDate.toISOString()
          : null,
      },
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      lineTotal: row.unitPrice * row.quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart: {
      id: cart.id,
      items,
      subtotal,
      itemCount,
    },
  };
};

const cartRouter = new Hono<AppEnv>()
  .get(
    "/",
    describeRoute({
      tags: ["Cart"],
      summary: "Get current cart",
      responses: {
        200: {
          description: "Cart retrieved successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  cart: z.any(),
                })
              ),
            },
          },
        },
        404: {
          description: "Cart not found",
        },
      },
    }),
    zValidator("header", cartHeaders),
    async (c) => {
      const guestId = c.req.valid("header")["x-guest-id"];
      const userId = c.var.user?.id ?? null;

      const cart = await resolveCart(userId, guestId);
      if (!cart) {
        return c.json({ error: "Cart not found" }, 404);
      }

      const response = await buildCartResponse(cart);
      return c.json(response);
    }
  )
  .post(
    "/items",
    describeRoute({
      tags: ["Cart"],
      summary: "Add item to cart",
      responses: {
        200: {
          description: "Item added successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  cart: z.any(),
                })
              ),
            },
          },
        },
      },
    }),
    zValidator("header", cartHeaders),
    zValidator("json", cartAddItemSchema),
    async (c) => {
      const guestId = c.req.valid("header")["x-guest-id"];
      const { productId, skuId, quantity } = c.req.valid("json");
      const userId = c.var.user?.id ?? null;

      const [product] = await db
        .select({
          id: products.id,
          status: products.status,
          isActive: products.isActive,
        })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) {
        return c.json({ error: "Product not found" }, 404);
      }

      if (product.status !== "approved" || !product.isActive) {
        return c.json({ error: "Product unavailable" }, 400);
      }

      const sku = await selectSkuForProduct(productId, skuId);
      if (!sku) {
        return c.json({ error: "Product out of stock" }, 400);
      }

      if ((sku.isAvailable ?? true) === false || sku.stockQty <= 0) {
        return c.json({ error: "Product out of stock" }, 400);
      }

      const cart = await getOrCreateCart(userId, guestId);
      if (!cart) {
        return c.json({ error: "Failed to create cart" }, 500);
      }

      const [existing] = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)))
        .limit(1);

      if (existing) {
        const nextQty = existing.quantity + quantity;
        if (nextQty > sku.stockQty) {
          return c.json({ error: "Insufficient stock" }, 400);
        }

        await db
          .update(cartItems)
          .set({ quantity: nextQty })
          .where(eq(cartItems.id, existing.id));
      } else {
        if (quantity > sku.stockQty) {
          return c.json({ error: "Insufficient stock" }, 400);
        }

        await db.insert(cartItems).values({
          cartId: cart.id,
          productId,
          quantity,
          unitPrice: sku.priceAmount,
        });
      }

      const response = await buildCartResponse(cart);
      return c.json(response);
    }
  )
  .patch(
    "/items/:itemId",
    describeRoute({
      tags: ["Cart"],
      summary: "Update cart item quantity",
      responses: {
        200: {
          description: "Item updated successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  cart: z.any(),
                })
              ),
            },
          },
        },
      },
    }),
    zValidator("header", cartHeaders),
    zValidator("param", cartItemParamSchema),
    zValidator("json", cartUpdateItemSchema),
    async (c) => {
      const guestId = c.req.valid("header")["x-guest-id"];
      const { itemId } = c.req.valid("param");
      const { quantity } = c.req.valid("json");
      const userId = c.var.user?.id ?? null;

      const cart = await resolveCart(userId, guestId);
      if (!cart) {
        return c.json({ error: "Cart not found" }, 404);
      }

      const [item] = await db
        .select({
          id: cartItems.id,
          productId: cartItems.productId,
        })
        .from(cartItems)
        .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
        .limit(1);

      if (!item) {
        return c.json({ error: "Item not found" }, 404);
      }

      const [product] = await db
        .select({
          status: products.status,
          isActive: products.isActive,
        })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product || product.status !== "approved" || !product.isActive) {
        await db.delete(cartItems).where(eq(cartItems.id, item.id));
        return c.json({ error: "Product unavailable" }, 400);
      }

      const sku = await selectSkuForProduct(item.productId);
      if (!sku || sku.stockQty <= 0) {
        return c.json({ error: "Product out of stock" }, 400);
      }

      if (quantity > sku.stockQty) {
        return c.json({ error: "Insufficient stock" }, 400);
      }

      await db
        .update(cartItems)
        .set({ quantity })
        .where(eq(cartItems.id, item.id));

      const response = await buildCartResponse(cart);
      return c.json(response);
    }
  )
  .delete(
    "/items/:itemId",
    describeRoute({
      tags: ["Cart"],
      summary: "Remove cart item",
      responses: {
        200: {
          description: "Item removed successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  cart: z.any(),
                })
              ),
            },
          },
        },
      },
    }),
    zValidator("header", cartHeaders),
    zValidator("param", cartItemParamSchema),
    async (c) => {
      const guestId = c.req.valid("header")["x-guest-id"];
      const { itemId } = c.req.valid("param");
      const userId = c.var.user?.id ?? null;

      const cart = await resolveCart(userId, guestId);
      if (!cart) {
        return c.json({ error: "Cart not found" }, 404);
      }

      await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));

      const response = await buildCartResponse(cart);
      return c.json(response);
    }
  )
  .post(
    "/merge",
    describeRoute({
      tags: ["Cart"],
      summary: "Merge guest cart into user cart",
      responses: {
        200: {
          description: "Cart merged successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  cart: z.any(),
                })
              ),
            },
          },
        },
        401: {
          description: "Unauthorized",
        },
      },
    }),
    zValidator("header", cartHeaders),
    async (c) => {
      const userId = c.var.user?.id ?? null;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const guestId = c.req.valid("header")["x-guest-id"];

      const guestCart = await getCartBySessionId(guestId);
      if (!guestCart) {
        const existingUserCart = await getCartByUserId(userId);
        if (!existingUserCart) {
          const created = await createCart(userId, null);
          if (!created) {
            return c.json({ error: "Failed to create cart" }, 500);
          }
          const response = await buildCartResponse(created);
          return c.json(response);
        }
        const response = await buildCartResponse(existingUserCart);
        return c.json(response);
      }

      const userCart = await getCartByUserId(userId);

      if (!userCart) {
        const [updated] = await db
          .update(carts)
          .set({ userId, sessionId: null })
          .where(eq(carts.id, guestCart.id))
          .returning();

        if (!updated) {
          return c.json({ error: "Failed to update cart" }, 500);
        }
        const response = await buildCartResponse(updated);
        return c.json(response);
      }

      const guestItems = await db
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, guestCart.id));

      for (const guestItem of guestItems) {
        const sku = await selectSkuForProduct(guestItem.productId);
        if (!sku) {
          continue;
        }
        const [existing] = await db
          .select()
          .from(cartItems)
          .where(
            and(
              eq(cartItems.cartId, userCart.id),
              eq(cartItems.productId, guestItem.productId)
            )
          )
          .limit(1);

        if (existing) {
          const nextQty = Math.min(
            existing.quantity + guestItem.quantity,
            sku.stockQty
          );
          await db
            .update(cartItems)
            .set({ quantity: nextQty })
            .where(eq(cartItems.id, existing.id));
        } else {
          const nextQty = Math.min(guestItem.quantity, sku.stockQty);
          if (nextQty <= 0) continue;
          await db.insert(cartItems).values({
            cartId: userCart.id,
            productId: guestItem.productId,
            quantity: nextQty,
            unitPrice: guestItem.unitPrice,
          });
        }
      }

      await db.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
      await db.delete(carts).where(eq(carts.id, guestCart.id));

      const response = await buildCartResponse(userCart);
      return c.json(response);
    }
  );

export { cartRouter };
export type CartRouterType = typeof cartRouter;
