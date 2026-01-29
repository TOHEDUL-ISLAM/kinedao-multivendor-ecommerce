import { useQuery } from "@tanstack/react-query";
import { env } from "@/lib/env";

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

interface CategoriesResponse {
  categories: CategoryDTO[];
}

async function fetchCategories(scope: "all" | "parents") {
  const searchParams = new URLSearchParams();
  if (scope === "parents") searchParams.set("scope", "parents");

  const response = await fetch(
    `${env.VITE_SERVER_URL}/api/categories${searchParams.toString() ? `?${searchParams}` : ""}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const data = (await response.json()) as CategoriesResponse;
  return data.categories;
}

export function useCategories(scope: "all" | "parents" = "all") {
  return useQuery({
    queryKey: ["categories", scope],
    queryFn: () => fetchCategories(scope),
    staleTime: 1000 * 60 * 10,
  });
}
