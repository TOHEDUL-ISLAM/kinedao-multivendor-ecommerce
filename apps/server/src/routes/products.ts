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
import { eq, asc, and, ne, count, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type {
  ProductQuickViewDTO,
  ProductDetailDTO,
  ProductCardDTO,
  VendorDetailDTO,
  CategoryBreadcrumbDTO,
} from "@kineDao.com/api-types/catalog";
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
})
.get(
  "/:slug/detail",
  describeRoute({
    tags: ["Products"],
    summary: "Get product detail page data",
    description: "Fetch comprehensive product data for the product detail page, including vendor details, category breadcrumb hierarchy, and related products.",
    responses: {
      200: {
        description: "Successful response with full product details",
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

    // Create aliases for parent and grandparent category joins
    const parentCategory = alias(categories, "parent_category");
    const grandparentCategory = alias(categories, "grandparent_category");

    // Fetch product with vendor and 3-level category hierarchy
    const [productRow] = await db
      .select({
        product: products,
        vendor: vendors,
        category: categories,
        parentCategory: parentCategory,
        grandparentCategory: grandparentCategory,
      })
      .from(products)
      .innerJoin(vendors, eq(products.vendorId, vendors.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(parentCategory, eq(categories.parentId, parentCategory.id))
      .leftJoin(grandparentCategory, eq(parentCategory.parentId, grandparentCategory.id))
      .where(eq(products.slug, slug))
      .limit(1);

    if (!productRow) {
      return c.json({ error: "Product not found" }, 404);
    }

    const { product, vendor, category, parentCategory: parent, grandparentCategory: grandparent } = productRow;

    // Fetch images, options, skus in parallel
    const [images, options, skus, vendorSalesResult] = await Promise.all([
      db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, product.id))
        .orderBy(asc(productImages.sortOrder)),
      db
        .select()
        .from(productOptions)
        .where(eq(productOptions.productId, product.id))
        .orderBy(asc(productOptions.sortOrder)),
      db
        .select()
        .from(productSkus)
        .where(eq(productSkus.productId, product.id)),
      // Count vendor's total products as a proxy for sales
      db
        .select({ count: count() })
        .from(products)
        .where(eq(products.vendorId, vendor.id)),
    ]);

    const totalSales = vendorSalesResult[0]?.count || 0;

    // Fetch related products (same category, exclude current, limit 4)
    const relatedProductRows = await db
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
          eq(products.categoryId, product.categoryId),
          ne(products.id, product.id),
          eq(products.isActive, true)
        )
      )
      .limit(4);

    // Fetch images for related products
    const relatedProductIds = relatedProductRows.map((r) => r.product.id);
    const relatedImages = relatedProductIds.length > 0
      ? await db
          .select()
          .from(productImages)
          .where(sql`${productImages.productId} IN ${relatedProductIds}`)
      : [];

    // Fetch SKUs for related products
    const relatedSkus = relatedProductIds.length > 0
      ? await db
          .select()
          .from(productSkus)
          .where(sql`${productSkus.productId} IN ${relatedProductIds}`)
      : [];

    // Build related products DTOs
    const relatedProducts: ProductCardDTO[] = relatedProductRows.map((row) => {
      const prodImages = relatedImages.filter((img) => img.productId === row.product.id);
      const prodSkus = relatedSkus.filter((sku) => sku.productId === row.product.id);
      const availableSkus = prodSkus.filter((s) => s.isAvailable);
      const sortedSkus = [...(availableSkus.length ? availableSkus : prodSkus)].sort(
        (a, b) => a.priceAmount - b.priceAmount
      );
      const lowestSku = sortedSkus[0];

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
        imageUrl: prodImages[0]?.url || null,
        imageAlt: prodImages[0]?.alt || null,
        priceAmount: lowestSku?.priceAmount || 0,
        compareAtAmount: lowestSku?.compareAtAmount || null,
        currency: lowestSku?.currency || "BDT",
        isAvailable: availableSkus.length > 0,
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

    // Get lowest available price for main product
    const availableSkus = skus.filter((s) => s.isAvailable);
    const sortedSkus = [...(availableSkus.length ? availableSkus : skus)].sort(
      (a, b) => a.priceAmount - b.priceAmount
    );
    const lowestSku = sortedSkus[0];

    // Build vendor detail DTO
    const vendorDetail: VendorDetailDTO = {
      id: vendor.id,
      name: vendor.name,
      slug: vendor.slug,
      logoUrl: vendor.logoUrl,
      ratingAvg: vendor.ratingAvg,
      ratingCount: vendor.ratingCount,
      locationCity: vendor.locationCity,
      isVerified: vendor.isVerified,
      badges: vendor.badges,
      totalSales,
    };

    // Build category breadcrumb DTO
    const categoryBreadcrumb: CategoryBreadcrumbDTO = {
      id: category.id,
      name: category.name,
      nameBn: category.nameBn,
      slug: category.slug,
      parent: parent
        ? {
            id: parent.id,
            name: parent.name,
            nameBn: parent.nameBn,
            slug: parent.slug,
            parent: grandparent
              ? {
                  id: grandparent.id,
                  name: grandparent.name,
                  nameBn: grandparent.nameBn,
                  slug: grandparent.slug,
                }
              : null,
          }
        : null,
    };

    // Build the full response
    const response: ProductDetailDTO = {
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
      vendor: vendorDetail,
      category: categoryBreadcrumb,
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
      relatedProducts,
    };

    return c.json(response, 200);
  }
);

export { productsRouter };
export type ProductsRouterType = typeof productsRouter;
