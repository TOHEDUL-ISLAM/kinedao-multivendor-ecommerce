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
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  isBpaFree: boolean;
  isOrganic: boolean;
  isHypoallergenic: boolean;
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
  hasSmallParts: boolean;
  safetyWarningEn: string | null;
  safetyWarningBn: string | null;
  weightLimitKg: number | null;
  expiryDate: string | null;
  safetyCertifications: string[];
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

// Testimonial DTO
export interface TestimonialDTO {
  id: string;
  quote: string;
  quoteBn: string | null;
  customerName: string;
  location: string | null;
  locationBn: string | null;
  avatarUrl: string | null;
  rating: number | null;
}

// Featured Collection DTO
export interface FeaturedCollectionDTO {
  id: string;
  title: string;
  titleBn: string | null;
  description: string | null;
  descriptionBn: string | null;
  imageUrl: string;
  link: string;
  bgColor: string | null;
}

// Instagram Post DTO
export interface InstagramPostDTO {
  id: string;
  imageUrl: string;
  alt: string | null;
  link: string | null;
}

// =====================
// Product Detail Page Types
// =====================

// Vendor with enhanced details for product detail page
export interface VendorDetailDTO extends VendorDTO {
  totalSales: number;
}

// Category with breadcrumb hierarchy for product detail page
export interface CategoryBreadcrumbDTO {
  id: string;
  name: string;
  nameBn: string | null;
  slug: string;
  parent: {
    id: string;
    name: string;
    nameBn: string | null;
    slug: string;
    parent: {
      id: string;
      name: string;
      nameBn: string | null;
      slug: string;
    } | null;
  } | null;
}

// Full product detail for product detail page
export interface ProductDetailDTO extends Omit<ProductQuickViewDTO, "vendor" | "category"> {
  vendor: VendorDetailDTO;
  category: CategoryBreadcrumbDTO;
  relatedProducts: ProductCardDTO[];
}

// Product detail response
export interface ProductDetailResponse {
  product: ProductDetailDTO;
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
  testimonials: TestimonialDTO[];
  featuredCollections: FeaturedCollectionDTO[];
  instagramPosts: InstagramPostDTO[];
}

export interface CatalogProductsResponse {
  items: ProductCardDTO[];
  nextCursor: string | null;
  total: number;
}

export interface CatalogFacetsResponse {
  categories: CategoryDTO[];
  vendors: VendorDTO[];
  brands: BrandFacet[];
  ageRanges: AgeRangeFacet[];
  safety: SafetyFacet;
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

export interface CategoriesResponse {
  categories: CategoryDTO[];
}

// =====================
// Query Validators
// =====================

export const catalogQuerySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  vendor: z.string().optional(),
  brand: z.string().optional(),
  ageRange: z.string().optional(),
  isBpaFree: z.enum(["true", "false"]).optional(),
  isOrganic: z.enum(["true", "false"]).optional(),
  isHypoallergenic: z.enum(["true", "false"]).optional(),
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

export const categoriesQuerySchema = z.object({
  scope: z.enum(["parents"]).optional(),
});

export type CategoriesQuery = z.infer<typeof categoriesQuerySchema>;

// =====================
// Category Page Types
// =====================

// Brand facet for filters
export interface BrandFacet {
  name: string;
  count: number;
}

// Age range facet for filters
export interface AgeRangeFacet {
  value: string;
  label: string;
  labelBn: string;
  count: number;
}

// Safety facet for filters
export interface SafetyFacet {
  isBpaFree: number;
  isOrganic: number;
  isHypoallergenic: number;
}

// Category page response
export interface CategoryPageResponse {
  category: {
    id: string;
    name: string;
    nameBn: string | null;
    slug: string;
    parentId: string | null;
    imageUrl: string | null;
    parent: {
      name: string;
      nameBn: string | null;
      slug: string;
    } | null;
  };
  products: ProductCardDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  facets: {
    brands: BrandFacet[];
    ageRanges: AgeRangeFacet[];
    priceRange: {
      min: number;
      max: number;
    };
  };
}

// Category page query schema
export const categoryPageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  sort: z.enum(["newest", "price_asc", "price_desc", "name_asc"]).default("newest"),
  brand: z.string().optional(), // Comma-separated brand names
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  ageRange: z.string().optional(), // Comma-separated age ranges
  rating: z.coerce.number().min(0).max(5).optional(),
});

export type CategoryPageQuery = z.infer<typeof categoryPageQuerySchema>;

// =====================
// Mega Menu & Category Tree Types
// =====================

// Product card for mega menu featured products
export interface MegaMenuProductDTO {
  id: string;
  title: string;
  titleBn: string | null;
  slug: string;
  imageUrl: string | null;
  priceAmount: number;
  currency: string;
  isNew: boolean | null;
}

// Nested tree node for mega menu
export interface CategoryTreeNodeDTO {
  id: string;
  name: string;
  nameBn: string | null;
  slug: string;
  iconKey: string | null;
  imageUrl: string | null;
  depth: number;
  productCount: number;
  children: CategoryTreeNodeDTO[];
  featuredProducts?: MegaMenuProductDTO[];
}

// Category tree response
export interface CategoryTreeResponse {
  tree: CategoryTreeNodeDTO[];
  lastUpdated: string;
}

// Category with metrics for recommendations
export interface CategoryWithMetricsDTO extends CategoryDTO {
  trendingScore?: number;
  popularityScore?: number;
  momChoiceWeight?: number;
  editorPickWeight?: number;
}

// Recommendation response
export interface CategoryRecommendationsResponse {
  popularCategories: CategoryDTO[];
  momsChoice: CategoryDTO[];
  trendingCategories: CategoryDTO[];
  editorPicks: CategoryDTO[];
}

// Featured products for a category (mega menu panel)
export interface CategoryFeaturedProductsResponse {
  categoryId: string;
  products: MegaMenuProductDTO[];
}

// =====================
// Mega Menu Query Schemas
// =====================

export const categoryTreeQuerySchema = z.object({
  maxDepth: z.coerce.number().int().min(1).max(4).default(3),
  includeProductCount: z.enum(["true", "false"]).default("true"),
  includeFeaturedProducts: z.enum(["true", "false"]).default("false"),
});

export type CategoryTreeQuery = z.infer<typeof categoryTreeQuerySchema>;

export const recommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
  season: z.string().optional(),
});

export type RecommendationsQuery = z.infer<typeof recommendationsQuerySchema>;

export const featuredProductsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(4),
});

export type FeaturedProductsQuery = z.infer<typeof featuredProductsQuerySchema>;
