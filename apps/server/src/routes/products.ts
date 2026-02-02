import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { db } from "@kineDao.com/db";
import {
  products,
  productImages,
  productOptions,
  productSkus,
  vendors,
  categories,
} from "@kineDao.com/db/schema";
import { eq, asc } from "drizzle-orm";
import type { ProductQuickViewDTO } from "@kineDao.com/api-types/catalog";
import { z } from "zod";

// GET /api/products/:id/quick-view - Product quick view modal data
// GET /api/products/by-slug/:slug - Product quick view by slug
const productsRouter = new Hono().get(
  "/:id/quick-view",
  describeRoute({
    tags: ["Products"],
    summary: "Get product quick view",
    description: "Fetch detailed product data for quick view modal including images, options, SKUs, and pricing.",
    responses: {
      200: {
        description: "Successful response with product details",
        content: {
          "application/json": {
            schema: resolver(z.any()),
          },
        },
      },
      404: {
        description: "Product not found",
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
  async (c) => {
  const { id } = c.req.param();

  // Fetch product with vendor and category
  const [productRow] = await db
    .select({
      product: products,
      vendor: vendors,
      category: categories,
    })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.id, id))
    .limit(1);

  if (!productRow) {
    return c.json({ error: "Product not found" }, 404);
  }

  const { product, vendor, category } = productRow;

  // Fetch images
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, id))
    .orderBy(asc(productImages.sortOrder));

  // Fetch options
  const options = await db
    .select()
    .from(productOptions)
    .where(eq(productOptions.productId, id))
    .orderBy(asc(productOptions.sortOrder));

  // Fetch SKUs
  const skus = await db
    .select()
    .from(productSkus)
    .where(eq(productSkus.productId, id));

  // Get lowest available price
  const availableSkus = skus.filter((s) => s.isAvailable);
  const sortedSkus = [...(availableSkus.length ? availableSkus : skus)].sort(
    (a, b) => a.priceAmount - b.priceAmount
  );
  const lowestSku = sortedSkus[0];

  const response: ProductQuickViewDTO = {
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
    shortDescription: product.shortDescription,
    shortDescriptionBn: product.shortDescriptionBn,
    description: product.description,
    descriptionBn: product.descriptionBn,
    hasSmallParts: product.hasSmallParts,
    safetyWarningEn: product.safetyWarningEn,
    safetyWarningBn: product.safetyWarningBn,
    weightLimitKg: product.weightLimitKg,
    expiryDate: product.expiryDate?.toISOString() || null,
    safetyCertifications: product.safetyCertifications || [],
    imageUrl: images[0]?.url || null,
    imageAlt: images[0]?.alt || null,
    priceAmount: lowestSku?.priceAmount || 0,
    compareAtAmount: lowestSku?.compareAtAmount || null,
    currency: lowestSku?.currency || "BDT",
    isAvailable: availableSkus.length > 0,
    vendor: {
      id: vendor.id,
      name: vendor.name,
      slug: vendor.slug,
      isVerified: vendor.isVerified,
    },
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
    },
    images: images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      sortOrder: img.sortOrder,
    })),
    options: options.map((opt) => ({
      id: opt.id,
      name: opt.name,
      nameBn: opt.nameBn,
      values: opt.values,
      valuesBn: opt.valuesBn,
      sortOrder: opt.sortOrder,
    })),
    skus: skus.map((sku) => ({
      id: sku.id,
      sku: sku.sku,
      optionValues: sku.optionValues,
      priceAmount: sku.priceAmount,
      compareAtAmount: sku.compareAtAmount,
      currency: sku.currency,
      stockQty: sku.stockQty,
      isAvailable: sku.isAvailable,
    })),
  };

  return c.json(response, 200);
})
.get(
  "/by-slug/:slug",
  describeRoute({
    tags: ["Products"],
    summary: "Get product by slug",
    description: "Fetch product details by slug for quick view modal.",
    responses: {
      200: {
        description: "Successful response with product details",
        content: {
          "application/json": {
            schema: resolver(z.any()),
          },
        },
      },
      404: {
        description: "Product not found",
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
  async (c) => {
  const { slug } = c.req.param();

  const [productRow] = await db
    .select({
      product: products,
      vendor: vendors,
      category: categories,
    })
    .from(products)
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.slug, slug))
    .limit(1);

  if (!productRow) {
    return c.json({ error: "Product not found" }, 404);
  }

  // Same as quick-view
  const { product, vendor, category } = productRow;

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder));

  const options = await db
    .select()
    .from(productOptions)
    .where(eq(productOptions.productId, product.id))
    .orderBy(asc(productOptions.sortOrder));

  const skus = await db
    .select()
    .from(productSkus)
    .where(eq(productSkus.productId, product.id));

  const availableSkus = skus.filter((s) => s.isAvailable);
  const sortedSkus = [...(availableSkus.length ? availableSkus : skus)].sort(
    (a, b) => a.priceAmount - b.priceAmount
  );
  const lowestSku = sortedSkus[0];

  const response: ProductQuickViewDTO = {
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
    shortDescription: product.shortDescription,
    shortDescriptionBn: product.shortDescriptionBn,
    description: product.description,
    descriptionBn: product.descriptionBn,
    hasSmallParts: product.hasSmallParts,
    safetyWarningEn: product.safetyWarningEn,
    safetyWarningBn: product.safetyWarningBn,
    weightLimitKg: product.weightLimitKg,
    expiryDate: product.expiryDate?.toISOString() || null,
    safetyCertifications: product.safetyCertifications || [],
    imageUrl: images[0]?.url || null,
    imageAlt: images[0]?.alt || null,
    priceAmount: lowestSku?.priceAmount || 0,
    compareAtAmount: lowestSku?.compareAtAmount || null,
    currency: lowestSku?.currency || "BDT",
    isAvailable: availableSkus.length > 0,
    vendor: {
      id: vendor.id,
      name: vendor.name,
      slug: vendor.slug,
      isVerified: vendor.isVerified,
    },
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
    },
    images: images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      sortOrder: img.sortOrder,
    })),
    options: options.map((opt) => ({
      id: opt.id,
      name: opt.name,
      nameBn: opt.nameBn,
      values: opt.values,
      valuesBn: opt.valuesBn,
      sortOrder: opt.sortOrder,
    })),
    skus: skus.map((sku) => ({
      id: sku.id,
      sku: sku.sku,
      optionValues: sku.optionValues,
      priceAmount: sku.priceAmount,
      compareAtAmount: sku.compareAtAmount,
      currency: sku.currency,
      stockQty: sku.stockQty,
      isAvailable: sku.isAvailable,
    })),
  };

  return c.json(response, 200);
});

export { productsRouter };
export type ProductsRouterType = typeof productsRouter;
