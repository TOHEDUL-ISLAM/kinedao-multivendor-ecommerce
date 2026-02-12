import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Stack, Skeleton } from "@mantine/core";
import { ProductForm } from "@/components/vendor-dashboard/product-form/product-form";
import { api } from "@/lib/api-client";

export const Route = createFileRoute(
  "/vendor/_dashboard/products/$productId/edit"
)({
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["vendor-product-detail", productId],
    queryFn: async () => {
      const res = await api.vendorDashboard.products[":productId"].$get({
        param: { productId },
      });
      if (!res.ok) throw new Error("Failed to load product");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Stack gap="md" p="md">
        <Skeleton height={40} />
        <Skeleton height={200} />
        <Skeleton height={200} />
      </Stack>
    );
  }

  if (error || !data) {
    return null;
  }

  return <ProductForm mode="edit" initialData={data} />;
}
