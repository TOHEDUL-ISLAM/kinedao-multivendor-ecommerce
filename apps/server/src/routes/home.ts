import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { db, getS3Url } from "@kineDao.com/db";
import {
  products,
  campaigns,
  brands,
  categories,
  testimonials,
  featuredCollections,
  instagramPosts,
} from "@kineDao.com/db/schema";
import { eq, and, lte, sql, asc } from "drizzle-orm";
import type {
  HomePageResponse,
  ProductCardDTO,
  CampaignDTO,
  CategoryDTO,
  BrandDTO,
  TestimonialDTO,
  FeaturedCollectionDTO,
  InstagramPostDTO,
} from "@kineDao.com/api-types/catalog";
import { z } from "zod";

// Helper to format product card from relational data
function formatProductFromRelation(
  product: typeof products.$inferSelect & {
    vendor: { id: string; name: string; slug: string; isVerified: boolean | null };
    category: { id: string; name: string; slug: string };
    images: { s3Key: string; alt: string | null; sortOrder: number | null }[];
    skus: {
      priceAmount: number;
      compareAtAmount: number | null;
      currency: string;
      isAvailable: boolean | null;
      optionValues?: Record<string, string> | null;
    }[];
  }
): ProductCardDTO {
  // Get first image
  const image = product.images.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0];

  // Get lowest price SKU
  // Filter for available ones first
  const availableSkus = product.skus.filter((s) => s.isAvailable);
  const skusToCheck = availableSkus.length > 0 ? availableSkus : product.skus;

  const sku = skusToCheck.sort((a, b) => a.priceAmount - b.priceAmount)[0];
  const hasVariants =
    product.skus.length > 1 ||
    product.skus.some(
      (s) => s.optionValues && Object.keys(s.optionValues).length > 0
    );

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
    imageUrl: image ? getS3Url(image.s3Key) : null,
    imageAlt: image?.alt || null,
    priceAmount: sku?.priceAmount || 0,
    compareAtAmount: sku?.compareAtAmount || null,
    currency: sku?.currency || "BDT",
    isAvailable: availableSkus.length > 0,
    hasVariants,
    vendor: {
      id: product.vendor.id,
      name: product.vendor.name,
      slug: product.vendor.slug,
      isVerified: product.vendor.isVerified ?? false,
    },
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
  };
}

// GET /api/home - Homepage data
const homeRouter = new Hono().get(
  "/",
  describeRoute({
    tags: ["Home"],
    summary: "Get homepage data",
    description: "Fetch all homepage data including hero carousel campaigns, deal wall, flash deals, best sellers, new arrivals, categories, brands, testimonials, featured collections, and Instagram posts.",
    responses: {
      200: {
        description: "Successful response with complete homepage data",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                heroCarouselCampaigns: z.array(z.any()),
                dealWallCampaigns: z.array(z.any()),
                flashDeals: z.array(z.any()),
                bestSellers: z.array(z.any()),
                newArrivals: z.array(z.any()),
                topCategories: z.array(z.any()),
                popularBrands: z.array(z.any()),
                testimonials: z.array(z.any()),
                featuredCollections: z.array(z.any()),
                instagramPosts: z.array(z.any()),
              })
            ),
          },
        },
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: resolver(
              z.object({
                message: z.string(),
                error: z.string().optional(),
                stack: z.string().optional(),
              })
            ),
          },
        },
      },
    },
  }),
  async (c) => {
  try {
    const now = new Date();

    // Fetch active campaigns
    const activeCampaigns = await db
      .select()
      .from(campaigns)
      .where(
        and(
          lte(campaigns.startsAt, now),
          sql`(${campaigns.endsAt} IS NULL OR ${campaigns.endsAt} >= ${now})`
        )
      )
      .orderBy(asc(campaigns.sortOrder));

    const heroCarouselCampaigns: CampaignDTO[] = activeCampaigns
      .filter((c) => c.placement === "heroCarousel")
      .map((c) => ({
        id: c.id,
        placement: c.placement,
        title: c.title,
        titleBn: c.titleBn,
        subtitle: c.subtitle,
        subtitleBn: c.subtitleBn,
        imageUrl: c.imageUrl,
        theme: c.theme,
        ctaText: c.ctaText,
        ctaTextBn: c.ctaTextBn,
        ctaLink: c.ctaLink,
        discountPercent: c.discountPercent,
        startsAt: c.startsAt.toISOString(),
        endsAt: c.endsAt?.toISOString() || null,
      }));

    const dealWallCampaigns: CampaignDTO[] = activeCampaigns
      .filter((c) => c.placement === "dealWall")
      .map((c) => ({
        id: c.id,
        placement: c.placement,
        title: c.title,
        titleBn: c.titleBn,
        subtitle: c.subtitle,
        subtitleBn: c.subtitleBn,
        imageUrl: c.imageUrl,
        theme: c.theme,
        ctaText: c.ctaText,
        ctaTextBn: c.ctaTextBn,
        ctaLink: c.ctaLink,
        discountPercent: c.discountPercent,
        startsAt: c.startsAt.toISOString(),
        endsAt: c.endsAt?.toISOString() || null,
      }));

    // Fetch products with relations - OPTIMIZED
    const productsRaw = await db.query.products.findMany({
      where: eq(products.isActive, true),
      with: {
        vendor: true,
        category: true,
        images: true,
        skus: true,
      },
    });

    // Format all products
    const allProducts = productsRaw.map(formatProductFromRelation);

    // Filter by criteria
    const flashDeals = allProducts
      .filter((p) => p.compareAtAmount !== null)
      .sort((a, b) => {
        const discountA = a.compareAtAmount
          ? ((a.compareAtAmount - a.priceAmount) / a.compareAtAmount) * 100
          : 0;
        const discountB = b.compareAtAmount
          ? ((b.compareAtAmount - b.priceAmount) / b.compareAtAmount) * 100
          : 0;
        return discountB - discountA;
      })
      .slice(0, 12);

    const bestSellers = [...allProducts]
      .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0))
      .slice(0, 12);

    const newArrivals = allProducts.filter((p) => p.isNew).slice(0, 12);

    // Fetch top categories (parent categories with product counts)
    const categoriesWithCounts = await db
      .select({
        category: categories,
        productCount: sql<number>`count(${products.id})::int`,
      })
      .from(categories)
      .leftJoin(
        products,
        and(eq(products.categoryId, categories.id), eq(products.isActive, true))
      )
      .where(sql`${categories.parentId} IS NULL`)
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder))
      .limit(10);

    const topCategories: CategoryDTO[] = categoriesWithCounts.map((row) => ({
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

    // Fetch popular brands
    const brandsData = await db
      .select()
      .from(brands)
      .where(eq(brands.isActive, true))
      .orderBy(asc(brands.sortOrder))
      .limit(5);

    const popularBrands: BrandDTO[] = brandsData.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logoUrl,
    }));

    // Fetch testimonials
    const testimonialsData = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(asc(testimonials.sortOrder))
      .limit(6);

    const testimonialsDTO: TestimonialDTO[] = testimonialsData.map((t) => ({
      id: t.id,
      quote: t.quote,
      quoteBn: t.quoteBn,
      customerName: t.customerName,
      location: t.location,
      locationBn: t.locationBn,
      avatarUrl: t.avatarUrl,
      rating: t.rating,
    }));

    // Fetch featured collections
    const collectionsData = await db
      .select()
      .from(featuredCollections)
      .where(eq(featuredCollections.isActive, true))
      .orderBy(asc(featuredCollections.sortOrder))
      .limit(3);

    const featuredCollectionsDTO: FeaturedCollectionDTO[] = collectionsData.map((c) => ({
      id: c.id,
      title: c.title,
      titleBn: c.titleBn,
      description: c.description,
      descriptionBn: c.descriptionBn,
      imageUrl: c.imageUrl,
      link: c.link,
      bgColor: c.bgColor,
    }));

    // Fetch instagram posts
    const instagramData = await db
      .select()
      .from(instagramPosts)
      .where(eq(instagramPosts.isActive, true))
      .orderBy(asc(instagramPosts.sortOrder))
      .limit(8);

    const instagramPostsDTO: InstagramPostDTO[] = instagramData.map((p) => ({
      id: p.id,
      imageUrl: p.imageUrl,
      alt: p.alt,
      link: p.link,
    }));

    const response: HomePageResponse = {
      heroCarouselCampaigns,
      dealWallCampaigns,
      flashDeals,
      bestSellers,
      newArrivals,
      topCategories,
      popularBrands,
      testimonials: testimonialsDTO,
      featuredCollections: featuredCollectionsDTO,
      instagramPosts: instagramPostsDTO,
    };

    return c.json(response, 200);
  } catch (error) {
    console.error("Error in /api/home:", error);
    return c.json(
      {
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      500
    );
  }
});

export { homeRouter };
export type HomeRouterType = typeof homeRouter;
