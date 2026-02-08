"use client";

import { useState, useCallback } from "react";
import { createFileRoute, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { motion } from "framer-motion";
import { PackageSearch, SlidersHorizontal, ChevronDown, Check, X } from "lucide-react";
import { api } from "@/lib/api-client";
import { useTranslation } from "@/hooks/use-translation";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { CategoryPageResponse } from "@kineDao.com/api-types/catalog";

// Components
import { FilterSidebar, MobileFilterDrawer } from "@/components/catalog/filter-sidebar";
import { StickyFilterContainer } from "@/components/catalog/sticky-filter-container";
import { ProductCard, ProductCardSkeleton, type ProductCardData } from "@/components/product-card";
import { Pagination, CompactPagination } from "@/components/catalog/pagination";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

// Search params schema for category page
const categorySearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  sort: z.enum(["newest", "price_asc", "price_desc", "name_asc"]).default("newest"),
  brand: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  ageRange: z.string().optional(),
  rating: z.coerce.number().optional(),
});

type CategorySearch = z.infer<typeof categorySearchSchema>;

export const Route = createFileRoute("/category/$slug")({
  validateSearch: categorySearchSchema,
  component: CategoryPage,
});

async function fetchCategoryPage(
  slug: string,
  params: CategorySearch
): Promise<CategoryPageResponse> {
  const response = await api.category[":slug"].$get({
    param: { slug },
    query: {
      page: params.page.toString(),
      limit: "12",
      sort: params.sort,
      brand: params.brand,
      minPrice: params.minPrice?.toString(),
      maxPrice: params.maxPrice?.toString(),
      ageRange: params.ageRange,
      rating: params.rating?.toString(),
    },
  });

  if (response.status === 404) {
    throw notFound();
  }

  if (!response.ok) {
    throw new Error("Failed to fetch category");
  }

  return await response.json();
}

function CategoryPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { slug } = Route.useParams();
  const search = Route.useSearch();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Fetch category page data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["category-page", slug, search],
    queryFn: () => fetchCategoryPage(slug, search),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update URL with search params
  const updateSearch = useCallback(
    (updates: Partial<CategorySearch>) => {
      navigate({
        from: Route.fullPath,
        params: { slug },
        search: (prev) => {
          const newSearch = { ...prev, ...updates };
          // Reset to page 1 when filters change (except when changing page)
          if (!("page" in updates)) {
            newSearch.page = 1;
          }
          // Remove undefined values
          Object.keys(newSearch).forEach((key) => {
            if (newSearch[key as keyof CategorySearch] === undefined) {
              delete newSearch[key as keyof CategorySearch];
            }
          });
          return newSearch;
        },
      });
    },
    [navigate, slug]
  );

  // Filter handlers
  const handleBrandChange = (brands: string[]) => {
    updateSearch({ brand: brands.length > 0 ? brands.join(",") : undefined });
  };

  const handleAgeRangeChange = (ageRanges: string[]) => {
    updateSearch({ ageRange: ageRanges.length > 0 ? ageRanges.join(",") : undefined });
  };

  const handlePriceChange = (min?: number, max?: number) => {
    updateSearch({ minPrice: min, maxPrice: max });
  };

  const handleRatingChange = (rating?: number) => {
    updateSearch({ rating });
  };

  const handleSortChange = (sort: CategorySearch["sort"]) => {
    updateSearch({ sort });
  };

  const handlePageChange = (page: number) => {
    updateSearch({ page });
  };

  const handleClearFilters = () => {
    navigate({
      from: Route.fullPath,
      params: { slug },
      search: { page: 1, sort: "newest" },
    });
  };

  // Parse selected filters from URL
  const selectedBrands = search.brand?.split(",").filter(Boolean) || [];
  const selectedAgeRanges = search.ageRange?.split(",").filter(Boolean) || [];

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedAgeRanges.length > 0 ||
    search.minPrice !== undefined ||
    search.maxPrice !== undefined ||
    search.rating !== undefined;

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: t("breadcrumb.home"), labelBn: language === "bn" ? "হোম" : undefined, href: "/" },
  ];

  if (data?.category.parent) {
    breadcrumbItems.push({
      label: data.category.parent.name,
      labelBn: data.category.parent.nameBn,
      href: `/category/${data.category.parent.slug}`,
    });
  }

  if (data?.category) {
    breadcrumbItems.push({
      label: data.category.name,
      labelBn: data.category.nameBn,
    });
  }

  // Get category display name
  const categoryName = data?.category
    ? language === "bn" && data.category.nameBn
      ? data.category.nameBn
      : data.category.name
    : "";

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">{t("common.error")}</h2>
          <p className="text-muted-foreground mb-4">{t("category.tryAdjusting")}</p>
          <Button onClick={() => refetch()}>{t("common.retry")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-4" />

        {/* Category Header */}
        <div className="mb-6">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-5 w-24 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
                {categoryName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("category.productsFound").replace("{count}", String(data?.pagination.total || 0))}
              </p>
            </>
          )}
        </div>

        {/* Main Layout */}
        <div className="flex gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
            <StickyFilterContainer>
              {isLoading ? (
                <FilterSidebarSkeleton />
              ) : data ? (
                <FilterSidebar
                  brands={data.facets.brands}
                  ageRanges={data.facets.ageRanges}
                  priceRange={data.facets.priceRange}
                  selectedBrands={selectedBrands}
                  selectedAgeRanges={selectedAgeRanges}
                  selectedMinPrice={search.minPrice}
                  selectedMaxPrice={search.maxPrice}
                  selectedRating={search.rating}
                  onBrandChange={handleBrandChange}
                  onAgeRangeChange={handleAgeRangeChange}
                  onPriceChange={handlePriceChange}
                  onRatingChange={handleRatingChange}
                  onClearFilters={handleClearFilters}
                  showCategories={false}
                  showVendors={false}
                />
              ) : null}
            </StickyFilterContainer>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Sort Bar */}
            <CategorySortBar
              totalCount={data?.pagination.total || 0}
              currentSort={search.sort}
              onSortChange={handleSortChange}
              onFilterClick={() => setIsMobileFilterOpen(true)}
              hasActiveFilters={hasActiveFilters}
              className="mb-4 sm:mb-6"
            />

            {/* Active Filters */}
            {hasActiveFilters && (
              <ActiveFilters
                selectedBrands={selectedBrands}
                selectedAgeRanges={selectedAgeRanges}
                ageRangeOptions={data?.facets.ageRanges || []}
                minPrice={search.minPrice}
                maxPrice={search.maxPrice}
                selectedRating={search.rating}
                onRemoveBrand={(brand) =>
                  handleBrandChange(selectedBrands.filter((b) => b !== brand))
                }
                onRemoveAgeRange={(ageRange) =>
                  handleAgeRangeChange(selectedAgeRanges.filter((a) => a !== ageRange))
                }
                onRemovePrice={() => handlePriceChange(undefined, undefined)}
                onRemoveRating={() => handleRatingChange(undefined)}
                onClearAll={handleClearFilters}
                className="mb-4"
              />
            )}

            {/* Product Grid */}
            <CategoryProductGrid
              products={data?.products || []}
              isLoading={isLoading}
            />

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="mt-8">
                {/* Desktop pagination */}
                <div className="hidden sm:block">
                  <Pagination
                    currentPage={data.pagination.page}
                    totalPages={data.pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
                {/* Mobile pagination */}
                <div className="sm:hidden">
                  <CompactPagination
                    currentPage={data.pagination.page}
                    totalPages={data.pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {data && (
        <MobileFilterDrawer
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          brands={data.facets.brands}
          ageRanges={data.facets.ageRanges}
          priceRange={data.facets.priceRange}
          selectedBrands={selectedBrands}
          selectedAgeRanges={selectedAgeRanges}
          selectedMinPrice={search.minPrice}
          selectedMaxPrice={search.maxPrice}
          selectedRating={search.rating}
          onBrandChange={handleBrandChange}
          onAgeRangeChange={handleAgeRangeChange}
          onPriceChange={handlePriceChange}
          onRatingChange={handleRatingChange}
          onClearFilters={handleClearFilters}
          showCategories={false}
          showVendors={false}
        />
      )}
    </div>
  );
}

// Category-specific sort bar with different options
interface CategorySortBarProps {
  totalCount: number;
  currentSort: CategorySearch["sort"];
  onSortChange: (sort: CategorySearch["sort"]) => void;
  onFilterClick: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

function CategorySortBar({
  totalCount,
  currentSort,
  onSortChange,
  onFilterClick,
  hasActiveFilters,
  className,
}: CategorySortBarProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const sortOptions: { value: CategorySearch["sort"]; label: string }[] = [
    { value: "newest", label: t("catalog.sortNewest") },
    { value: "price_asc", label: t("catalog.sortPriceLow") },
    { value: "price_desc", label: t("catalog.sortPriceHigh") },
    { value: "name_asc", label: t("catalog.sortNameAZ") },
  ];

  const currentSortLabel =
    sortOptions.find((o) => o.value === currentSort)?.label || t("catalog.sort");

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-card rounded-xl border border-border",
        className
      )}
    >
      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{totalCount}</span>{" "}
        {t("catalog.results")}
      </p>

      <div className="flex items-center gap-2">
        {/* Mobile Filter Button */}
        <button
          onClick={onFilterClick}
          className={cn(
            "flex lg:hidden items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
            hasActiveFilters
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/50"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-sm font-medium">{t("catalog.filters")}</span>
          {hasActiveFilters && (
            <span className="flex items-center justify-center h-4 w-4 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
              !
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors"
          >
            <span className="text-sm">{t("catalog.sort")}:</span>
            <span className="text-sm font-medium">{currentSortLabel}</span>
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>

          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Dropdown */}
              <motion.div
                initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 z-50 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors",
                      currentSort === option.value
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    {option.label}
                    {currentSort === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Active filters display
interface ActiveFiltersProps {
  selectedBrands: string[];
  selectedAgeRanges: string[];
  ageRangeOptions: { value: string; label: string; labelBn: string }[];
  minPrice?: number;
  maxPrice?: number;
  selectedRating?: number;
  onRemoveBrand: (brand: string) => void;
  onRemoveAgeRange: (ageRange: string) => void;
  onRemovePrice: () => void;
  onRemoveRating: () => void;
  onClearAll: () => void;
  className?: string;
}

function ActiveFilters({
  selectedBrands,
  selectedAgeRanges,
  ageRangeOptions,
  minPrice,
  maxPrice,
  selectedRating,
  onRemoveBrand,
  onRemoveAgeRange,
  onRemovePrice,
  onRemoveRating,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  const { t, language } = useTranslation();

  const getAgeRangeLabel = (value: string) => {
    const option = ageRangeOptions.find((o) => o.value === value);
    if (!option) return value;
    return language === "bn" ? option.labelBn : option.label;
  };

  const hasPrice = minPrice !== undefined || maxPrice !== undefined;
  const hasRating = selectedRating !== undefined;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {selectedBrands.map((brand) => (
        <FilterChip key={brand} label={brand} onRemove={() => onRemoveBrand(brand)} />
      ))}

      {selectedAgeRanges.map((ageRange) => (
        <FilterChip
          key={ageRange}
          label={getAgeRangeLabel(ageRange)}
          onRemove={() => onRemoveAgeRange(ageRange)}
        />
      ))}

      {hasPrice && (
        <FilterChip
          label={`৳${minPrice || 0} - ৳${maxPrice || "∞"}`}
          onRemove={onRemovePrice}
        />
      )}

      {hasRating && (
        <FilterChip
          label={`${selectedRating}★ ${t("catalog.ratingUp")}`}
          onRemove={onRemoveRating}
        />
      )}

      <button
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        {t("catalog.clearFilters")}
      </button>
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

// Category product grid (without load more, uses pagination)
interface CategoryProductGridProps {
  products: ProductCardData[];
  isLoading: boolean;
  className?: string;
}

function CategoryProductGrid({
  products,
  isLoading,
  className,
}: CategoryProductGridProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Initial loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid gap-3 sm:gap-4 lg:gap-6",
          "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4",
          className
        )}
      >
        {[...Array(12)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
      >
        <div className="flex items-center justify-center h-20 w-20 rounded-full bg-muted mb-4">
          <PackageSearch className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t("category.noFiltersMatch")}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {t("category.tryAdjusting")}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout={!prefersReducedMotion}
      className={cn(
        "grid gap-3 sm:gap-4 lg:gap-6",
        "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </motion.div>
  );
}

// Skeleton for filter sidebar
function FilterSidebarSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="h-5 w-20 bg-muted rounded animate-pulse" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="space-y-1.5 pl-2">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-3 w-full bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
