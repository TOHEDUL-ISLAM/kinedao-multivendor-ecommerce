import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/vendor-dashboard/product-form/product-form";
import { api } from "@/lib/api-client";
import type { CategoryDTO } from "@kineDao.com/api-types/catalog";

async function fetchProductFormCategories(): Promise<CategoryDTO[]> {
  const response = await api.categories.$get({ query: {} });
  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    typeof data === "object" &&
    "categories" in data &&
    Array.isArray((data as { categories?: unknown[] }).categories)
  ) {
    return (data as { categories: CategoryDTO[] }).categories;
  }

  return [];
}

export const Route = createFileRoute("/vendor/_dashboard/products/new")({
  staleTime: 1000 * 60 * 10,
  loader: fetchProductFormCategories,
  component: NewProductPage,
});

function NewProductPage() {
  const categories = Route.useLoaderData();
  return <ProductForm mode="create" initialCategories={categories} />;
}
