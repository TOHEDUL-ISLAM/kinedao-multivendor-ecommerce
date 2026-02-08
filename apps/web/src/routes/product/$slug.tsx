"use client";

import { useState, useEffect } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageX, Truck, RotateCcw } from "lucide-react";
import { api } from "@/lib/api-client";
import { useTranslation } from "@/hooks/use-translation";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";
import type { ProductDetailDTO } from "@kineDao.com/api-types/catalog";

// Components
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageGallery } from "@/components/product/image-gallery";
import { ProductDetailInfo } from "@/components/product/product-detail-info";
import { RelatedProducts } from "@/components/product/related-products";
import { BabySafetySection } from "@/components/product/baby-safety-section";
import { ProductReviewsSection } from "@/components/product/product-reviews-section";

export const Route = createFileRoute("/product/$slug")({
  component: ProductDetailPage,
});

async function fetchProductDetail(slug: string): Promise<ProductDetailDTO> {
  const response = await api.products[":slug"].detail.$get({
    param: { slug },
  });

  if (response.status === 404) {
    throw notFound();
  }

  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }

  return await response.json();
}

function ProductDetailPage() {
  const { t, language } = useTranslation();
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addItem);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  // Fetch product data
  const { data: product, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["product-detail", slug],
    queryFn: () => fetchProductDetail(slug),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Set default options when product loads
  useEffect(() => {
    if (product && product.options.length > 0) {
      const defaults: Record<string, string> = {};
      product.options.forEach((opt) => {
        if (opt.values && opt.values.length > 0) {
          defaults[opt.name] = opt.values[0];
        }
      });
      setSelectedOptions(defaults);
    }
  }, [product]);

  // Find matching SKU based on selected options
  const selectedSku = product?.skus.find((sku) => {
    if (!sku.optionValues) return product.skus.length === 1;
    return Object.entries(selectedOptions).every(
      ([key, value]) => sku.optionValues?.[key] === value
    );
  });

  const isInStock = selectedSku?.isAvailable !== false && (selectedSku?.stockQty ?? 0) > 0;

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
  };

  const handleAddToCart = async () => {
    if (!product || !selectedSku || !isInStock) return false;

    const added = await addToCart(
      { productId: product.id, skuId: selectedSku.id },
      quantity
    );

    if (added) {
      toast.success(t("cart.itemAdded"));
    } else {
      toast.error(t("cart.addFailed"));
    }

    return added;
  };

  const handleCheckout = async () => {
    const added = await handleAddToCart();
    if (added) {
      navigate({ to: "/cart" });
    }
  };

  // Build breadcrumb items
  const buildBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: t("breadcrumb.home"), labelBn: language === "bn" ? "হোম" : undefined, href: "/" },
    ];

    if (product) {
      const { category } = product;

      // Add grandparent if exists
      if (category.parent?.parent) {
        items.push({
          label: category.parent.parent.name,
          labelBn: category.parent.parent.nameBn,
          href: `/category/${category.parent.parent.slug}`,
        });
      }

      // Add parent if exists
      if (category.parent) {
        items.push({
          label: category.parent.name,
          labelBn: category.parent.nameBn,
          href: `/category/${category.parent.slug}`,
        });
      }

      // Add current category
      items.push({
        label: category.name,
        labelBn: category.nameBn,
        href: `/category/${category.slug}`,
      });

      // Add product title (no link)
      items.push({
        label: product.title,
        labelBn: product.titleBn,
      });
    }

    return items;
  };

  // Loading state
  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  // Error state
  if (isError) {
    // Check if it's a 404
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("not found")) {
      return <ProductNotFound />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">{t("common.error")}</h2>
          <p className="text-muted-foreground mb-4">Failed to load product</p>
          <Button onClick={() => refetch()}>{t("common.retry")}</Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return <ProductNotFound />;
  }

  const displayTitle = language === "bn" && product.titleBn ? product.titleBn : product.title;
  const displayDescription =
    language === "bn" && product.descriptionBn
      ? product.descriptionBn
      : product.description;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={buildBreadcrumbs()} className="mb-6" />

        {/* Main product section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <ImageGallery
            images={product.images}
            productTitle={displayTitle}
            productId={product.id}
          />

          {/* Product Info */}
          <ProductDetailInfo
            product={product}
            selectedOptions={selectedOptions}
            onOptionChange={handleOptionChange}
            quantity={quantity}
            onQuantityChange={setQuantity}
            onAddToCart={handleAddToCart}
            onCheckout={handleCheckout}
          />
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <TabsList className="w-max min-w-full justify-start border-b rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="description"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
                >
                  {t("product.description")}
                </TabsTrigger>
                <TabsTrigger
                  value="safety"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
                >
                  {t("product.safety")}
                </TabsTrigger>
                <TabsTrigger
                  value="shipping"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-6 py-3 text-sm sm:text-base whitespace-nowrap"
                >
                  {t("product.shipping")}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="description" className="pt-6">
              {displayDescription ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: displayDescription }}
                />
              ) : (
                <p className="text-muted-foreground">No description available.</p>
              )}
            </TabsContent>

            <TabsContent value="safety" className="pt-6">
              <BabySafetySection
                ageRange={product.ageRange}
                isBpaFree={product.isBpaFree}
                isOrganic={product.isOrganic}
                isHypoallergenic={product.isHypoallergenic}
                hasSmallParts={product.hasSmallParts}
                safetyWarningEn={product.safetyWarningEn}
                safetyWarningBn={product.safetyWarningBn}
                weightLimitKg={product.weightLimitKg}
                expiryDate={product.expiryDate}
                safetyCertifications={product.safetyCertifications}
              />
            </TabsContent>

            <TabsContent value="shipping" className="pt-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Shipping</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("product.shippingInfo")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <RotateCcw className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Returns</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("product.returnsInfo")}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Product Reviews */}
        <ProductReviewsSection productId={product.id} className="mt-12 border-t border-border" />

        {/* Related Products */}
        <RelatedProducts products={product.relatedProducts} className="mt-12 border-t border-border pt-8" />
      </div>
    </div>
  );
}

function ProductNotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <PackageX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("product.notFound")}</h1>
        <p className="text-muted-foreground mb-6">{t("product.notFoundDesc")}</p>
        <Button asChild>
          <Link to="/catalog">{t("product.backToShop")}</Link>
        </Button>
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumb skeleton */}
        <div className="flex gap-2 mb-6">
          <div className="h-4 w-12 bg-muted rounded animate-pulse" />
          <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image skeleton */}
          <div className="flex gap-3">
            <div className="hidden lg:flex flex-col gap-2 w-20">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="flex-1 aspect-square bg-muted rounded-lg animate-pulse" />
          </div>

          {/* Info skeleton */}
          <div className="space-y-6">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-10 w-40 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 w-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="flex gap-4 pt-4 border-t">
              <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
              <div className="h-10 flex-1 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
