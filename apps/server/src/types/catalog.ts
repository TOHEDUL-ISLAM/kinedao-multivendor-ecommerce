import { z } from "zod";

// =====================
// DTOs (Data Transfer Objects)
// =====================

// Product card for listings
export interface ProductCardDTO {
  id: string;
  title: string;
  titleBn: string | null;
  slug: string;
  brand: string | null;
  ageRange: string | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  isNew: boolean | null;
  isHot: boolean | null;
  imageUrl: string | null;
  imageAlt: string | null;
  priceAmount: number; // Lowest SKU price in paisa
  compareAtAmount: number | null; // Original price if discounted
  currency: string;
  isAvailable: boolean;
  vendor: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

// Product quick view with full details
export interface ProductQuickViewDTO extends ProductCardDTO {
  shortDescription: string | null;
  shortDescriptionBn: string | null;
  description: string | null;
  descriptionBn: string | null;
  images: {
    id: string;
    url: string;
    alt: string | null;
    sortOrder: number | null;
  }[];
  options: {
    id: string;
    name: string;
    nameBn: string | null;
    values: string[] | null;
    valuesBn: string[] | null;
    sortOrder: number | null;
  }[];
  skus: {
    id: string;
    sku: string;
    optionValues: Record<string, string> | null;
    priceAmount: number;
    compareAtAmount: number | null;
    currency: string;
    stockQty: number;
    isAvailable: boolean | null;
  }[];
}

// Category DTO
export interface CategoryDTO {
  id: string;
  name: string;
  nameBn: string | null;
  slug: string;
  parentId: string | null;
  iconKey: string | null;
  imageUrl: string | null;
  sortOrder: number | null;
  productCount?: number;
}

// Vendor DTO
export interface VendorDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  locationCity: string | null;
  isVerified: boolean | null;
  badges: string[] | null;
  productCount?: number;
}

// Brand DTO
export interface BrandDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
}

// Campaign DTO
export interface CampaignDTO {
  id: string;
  placement: string;
  title: string;
  titleBn: string | null;
  subtitle: string | null;
  subtitleBn: string | null;
  imageUrl: string;
  theme: string | null;
  ctaText: string | null;
  ctaTextBn: string | null;
  ctaLink: string | null;
  discountPercent: number | null;
  startsAt: string;
  endsAt: string | null;
}

// =====================
// API Response Types
// =====================

export interface HomePageResponse {
  heroCarouselCampaigns: CampaignDTO[];
  dealWallCampaigns: CampaignDTO[];
  flashDeals: ProductCardDTO[];
  bestSellers: ProductCardDTO[];
  newArrivals: ProductCardDTO[];
  topCategories: CategoryDTO[];
  popularBrands: BrandDTO[];
}

export interface CatalogProductsResponse {
  items: ProductCardDTO[];
  nextCursor: string | null;
  total: number;
}

export interface CatalogFacetsResponse {
  categories: CategoryDTO[];
  vendors: VendorDTO[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface SearchSuggestResponse {
  products: Pick<ProductCardDTO, "id" | "title" | "titleBn" | "slug" | "imageUrl" | "priceAmount" | "currency">[];
  categories: Pick<CategoryDTO, "id" | "name" | "nameBn" | "slug">[];
  vendors: Pick<VendorDTO, "id" | "name" | "slug">[];
}

// =====================
// Query Validators
// =====================

export const catalogQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  vendor: z.string().optional(),
  brand: z.string().optional(),
  min: z.coerce.number().int().min(0).optional(),
  max: z.coerce.number().int().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "bestseller", "rating"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CatalogQuery = z.infer<typeof catalogQuerySchema>;

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
