import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { CategoryDTO } from "@kineDao.com/api-types/catalog";

export type { CategoryDTO };

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

export function useCategories(scope: "all" | "parents" = "all") {
  return useQuery({
    queryKey: ["categories", scope],
    queryFn: () => fetchCategories(scope),
    staleTime: 1000 * 60 * 10,
  });
}
