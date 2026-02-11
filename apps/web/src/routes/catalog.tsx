import { useState, useCallback, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api-client";
import { useTranslation } from "@/hooks/use-translation";
import type { CatalogFacetsResponse, CatalogProductsResponse } from "@kineDao.com/api-types/catalog";

// Components
import { FilterSidebar, MobileFilterDrawer } from "@/components/catalog/filter-sidebar";
import { StickyFilterContainer } from "@/components/catalog/sticky-filter-container";
import { SortBar } from "@/components/catalog/sort-bar";
import { ProductGrid } from "@/components/catalog/product-grid";

// Search params schema
const catalogSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(), // Comma-separated list of category slugs
  vendor: z.string().optional(), // Comma-separated list of vendor slugs
  brand: z.string().optional(), // Comma-separated list of brands
  ageRange: z.string().optional(), // Comma-separated list of age ranges
  isBpaFree: z.enum(["true", "false"]).optional(),
  isOrganic: z.enum(["true", "false"]).optional(),
  isHypoallergenic: z.enum(["true", "false"]).optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  rating: z.coerce.number().optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "bestseller", "rating"]).optional(),
});

type CatalogSearch = z.infer<typeof catalogSearchSchema>;

export const Route = createFileRoute("/catalog")({
  validateSearch: catalogSearchSchema,
  component: CatalogPage,
});

async function fetchFacets(): Promise<CatalogFacetsResponse> {
  const response = await api.catalog.facets.$get();
  if (!response.ok) throw new Error("Failed to fetch facets");
  return await response.json();
}

async function fetchProducts(params: CatalogSearch & { cursor?: string }): Promise<CatalogProductsResponse> {
  const response = await api.catalog.products.$get({
    query: {
      q: params.q,
      category: params.category, // API expects comma-separated categories
      vendor: params.vendor, // API expects comma-separated vendors
      brand: params.brand,
      ageRange: params.ageRange,
      min: params.min?.toString(),
      max: params.max?.toString(),
      rating: params.rating?.toString(),
      sort: params.sort,
      cursor: params.cursor,
      limit: "20",
    },
  });
  if (!response.ok) throw new Error("Failed to fetch products");
  return await response.json();
}

function CatalogPage() {
  const { t, language } = useTranslation();
  // const isMobile = useIsMobile();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Fetch facets (categories, vendors, price range)
  const { data: facets, isLoading: facetsLoading } = useQuery({
    queryKey: ["catalog-facets"],
    queryFn: fetchFacets,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch products with infinite query for pagination
  const {
    data: productsData,
    isLoading: productsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["catalog-products", search],
    queryFn: ({ pageParam }) => fetchProducts({ ...search, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Flatten products from all pages
  const products = productsData?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = productsData?.pages[0]?.total ?? 0;

  // Update URL with filters
  const updateSearch = useCallback(
    (updates: Partial<CatalogSearch>) => {
      navigate({
        from: Route.fullPath,
        search: (prev) => {
          const newSearch = { ...prev, ...updates };
          // Remove undefined values
          Object.keys(newSearch).forEach((key) => {
            if (newSearch[key as keyof CatalogSearch] === undefined) {
              delete newSearch[key as keyof CatalogSearch];
            }
          });
          return newSearch;
        },
      });
    },
    [navigate]
  );

  // Filter handlers
  const handleCategoryChange = (slugs: string[]) => {
    updateSearch({ category: slugs.length > 0 ? slugs.join(",") : undefined });
  };

  const handleVendorChange = (slugs: string[]) => {
    updateSearch({ vendor: slugs.length > 0 ? slugs.join(",") : undefined });
  };

  const handleBrandChange = (brands: string[]) => {
    updateSearch({ brand: brands.length > 0 ? brands.join(",") : undefined });
  };

  const handleAgeRangeChange = (ageRanges: string[]) => {
    updateSearch({ ageRange: ageRanges.length > 0 ? ageRanges.join(",") : undefined });
  };

  const handleSafetyChange = (safety: {
    isBpaFree?: boolean;
    isOrganic?: boolean;
    isHypoallergenic?: boolean;
  }) => {
    updateSearch({
      isBpaFree: safety.isBpaFree ? "true" : undefined,
      isOrganic: safety.isOrganic ? "true" : undefined,
      isHypoallergenic: safety.isHypoallergenic ? "true" : undefined,
    });
  };

  const handlePriceChange = (min?: number, max?: number) => {
    updateSearch({ min, max });
  };

  const handleRatingChange = (rating?: number) => {
    updateSearch({ rating });
  };

  const handleSortChange = (sort: CatalogSearch["sort"]) => {
    updateSearch({ sort });
  };

  const handleClearFilters = () => {
    navigate({
      from: Route.fullPath,
      search: search.q ? { q: search.q } : {},
    });
  };

  const hasActiveFilters =
    !!search.category ||
    !!search.vendor ||
    !!search.brand ||
    !!search.ageRange ||
    search.isBpaFree === "true" ||
    search.isOrganic === "true" ||
    search.isHypoallergenic === "true" ||
    search.min !== undefined ||
    search.max !== undefined ||
    search.rating !== undefined;

  // Selected values for sidebar
  const selectedCategories = search.category?.split(",").filter(Boolean) ?? [];
  const selectedVendors = search.vendor?.split(",").filter(Boolean) ?? [];
  const selectedBrands = search.brand?.split(",").filter(Boolean) ?? [];
  const selectedAgeRanges = search.ageRange?.split(",").filter(Boolean) ?? [];

  const selectedCategoryNames = useMemo(() => {
    if (!facets?.categories || selectedCategories.length === 0) return [];
    const nameBySlug = new Map(
      facets.categories.map((category) => [
        category.slug,
        language === "bn" && category.nameBn ? category.nameBn : category.name,
      ])
    );
    return selectedCategories.map((slug) => nameBySlug.get(slug) ?? slug);
  }, [facets?.categories, language, selectedCategories]);

  const pageTitle = search.q
    ? `"${search.q}"`
    : selectedCategoryNames.length > 0
      ? selectedCategoryNames.join(", ")
      : t("catalog.title");

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{pageTitle}</h1>
          {search.q && (
            <p className="text-sm text-muted-foreground mt-1">
              Search results for "{search.q}"
            </p>
          )}
        </div>

        {/* Main Layout */}
        <div className="flex gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
            <StickyFilterContainer>
              {facetsLoading ? (
                <FilterSidebarSkeleton />
              ) : facets ? (
                <FilterSidebar
                  categories={facets.categories}
                  vendors={facets.vendors}
                  brands={facets.brands}
                  ageRanges={facets.ageRanges}
                  safetyFacets={facets.safety}
                  priceRange={facets.priceRange}
                  selectedCategories={selectedCategories}
                  selectedVendors={selectedVendors}
                  selectedBrands={selectedBrands}
                  selectedAgeRanges={selectedAgeRanges}
                  selectedIsBpaFree={search.isBpaFree === "true"}
                  selectedIsOrganic={search.isOrganic === "true"}
                  selectedIsHypoallergenic={search.isHypoallergenic === "true"}
                  selectedMinPrice={search.min}
                  selectedMaxPrice={search.max}
                  selectedRating={search.rating}
                  onCategoryChange={handleCategoryChange}
                  onVendorChange={handleVendorChange}
                  onBrandChange={handleBrandChange}
                  onAgeRangeChange={handleAgeRangeChange}
                  onSafetyChange={handleSafetyChange}
                  onPriceChange={handlePriceChange}
                  onRatingChange={handleRatingChange}
                  onClearFilters={handleClearFilters}
                />
              ) : null}
            </StickyFilterContainer>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Sort Bar */}
            <SortBar
              totalCount={totalCount}
              currentSort={search.sort}
              onSortChange={handleSortChange}
              onFilterClick={() => setIsMobileFilterOpen(true)}
              hasActiveFilters={hasActiveFilters}
              className="mb-4 sm:mb-6"
            />

            {/* Product Grid */}
            <ProductGrid
              products={products}
              isLoading={productsLoading}
              hasMore={!!hasNextPage}
              onLoadMore={() => fetchNextPage()}
              isLoadingMore={isFetchingNextPage}
            />
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {facets && (
        <MobileFilterDrawer
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          categories={facets.categories}
          vendors={facets.vendors}
          brands={facets.brands}
          ageRanges={facets.ageRanges}
          safetyFacets={facets.safety}
          priceRange={facets.priceRange}
          selectedCategories={selectedCategories}
          selectedVendors={selectedVendors}
          selectedBrands={selectedBrands}
          selectedAgeRanges={selectedAgeRanges}
          selectedIsBpaFree={search.isBpaFree === "true"}
          selectedIsOrganic={search.isOrganic === "true"}
          selectedIsHypoallergenic={search.isHypoallergenic === "true"}
          selectedMinPrice={search.min}
          selectedMaxPrice={search.max}
          selectedRating={search.rating}
          onCategoryChange={handleCategoryChange}
          onVendorChange={handleVendorChange}
          onBrandChange={handleBrandChange}
          onAgeRangeChange={handleAgeRangeChange}
          onSafetyChange={handleSafetyChange}
          onPriceChange={handlePriceChange}
          onRatingChange={handleRatingChange}
          onClearFilters={handleClearFilters}
        />
      )}
    </div>
  );
}

// Skeleton for filter sidebar
function FilterSidebarSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="h-5 w-20 bg-muted rounded animate-pulse" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="space-y-1.5 pl-2">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="h-3 w-full bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
