import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  CategoryDTO,
  CategoryTreeNodeDTO,
  CategoryTreeResponse,
  CategoryRecommendationsResponse,
  MegaMenuProductDTO,
} from "@kineDao.com/api-types/catalog";

export type {
  CategoryDTO,
  CategoryTreeNodeDTO,
  CategoryTreeResponse,
  CategoryRecommendationsResponse,
  MegaMenuProductDTO,
};

// Fetch flat categories list
async function fetchCategories(scope: "all" | "parents") {
  const response = await api.categories.$get({
    query: scope === "parents" ? { scope: "parents" } : {},
  });

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const data = await response.json();
  return data.categories;
}

// Fetch hierarchical category tree
async function fetchCategoryTree(options: {
  maxDepth?: number;
  includeProductCount?: boolean;
  includeFeaturedProducts?: boolean;
}): Promise<CategoryTreeResponse> {
  const response = await api.categories.tree.$get({
    query: {
      maxDepth: options.maxDepth?.toString() ?? "3",
      includeProductCount: options.includeProductCount ? "true" : "false",
      includeFeaturedProducts: options.includeFeaturedProducts ? "true" : "false",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch category tree");
  }

  return response.json();
}

// Fetch featured products for a category
async function fetchCategoryFeaturedProducts(
  categoryId: string,
  limit: number = 4
): Promise<MegaMenuProductDTO[]> {
  const response = await api.categories[":id"].featured.$get({
    param: { id: categoryId },
    query: { limit: limit.toString() },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch featured products");
  }

  const data = await response.json();
  return data.products;
}

// Fetch category recommendations
async function fetchCategoryRecommendations(options: {
  limit?: number;
  season?: string;
}): Promise<CategoryRecommendationsResponse> {
  const response = await api.recommendations.categories.$get({
    query: {
      limit: options.limit?.toString() ?? "8",
      season: options.season,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch category recommendations");
  }

  return response.json();
}

/**
 * Hook to fetch flat categories list
 */
export function useCategories(scope: "all" | "parents" = "all") {
  return useQuery({
    queryKey: ["categories", scope],
    queryFn: () => fetchCategories(scope),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch hierarchical category tree for mega menu
 */
export function useCategoryTree(options: {
  maxDepth?: number;
  includeProductCount?: boolean;
  includeFeaturedProducts?: boolean;
} = {}) {
  return useQuery({
    queryKey: ["categories", "tree", options],
    queryFn: () =>
      fetchCategoryTree({
        maxDepth: options.maxDepth ?? 3,
        includeProductCount: options.includeProductCount ?? true,
        includeFeaturedProducts: options.includeFeaturedProducts ?? false,
      }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Hook to fetch featured products for a category (for mega menu panel)
 */
export function useCategoryFeaturedProducts(
  categoryId: string | null,
  limit: number = 4
) {
  return useQuery({
    queryKey: ["categories", categoryId, "featured", limit],
    queryFn: () =>
      categoryId ? fetchCategoryFeaturedProducts(categoryId, limit) : [],
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to prefetch category products (for hover optimization)
 */
export function usePrefetchCategoryProducts() {
  const queryClient = useQuery({ queryKey: ["noop"], queryFn: () => null });

  return (_categoryId: string) => {
    // This would trigger prefetch when hovering
    queryClient.refetch();
  };
}

/**
 * Hook to fetch category recommendations
 */
export function useCategoryRecommendations(options: {
  limit?: number;
  season?: string;
} = {}) {
  return useQuery({
    queryKey: ["recommendations", "categories", options],
    queryFn: () =>
      fetchCategoryRecommendations({
        limit: options.limit ?? 8,
        season: options.season,
      }),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
