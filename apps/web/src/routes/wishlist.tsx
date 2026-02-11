import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { useFavoritesStore } from "@/stores/favorites-store";
import { ProductCard } from "@/components/product-card";
import { Pagination, CompactPagination } from "@/components/catalog/pagination";
import { useIsDesktop, useIsLargeDesktop, useIsTablet } from "@/hooks/use-media-query";
import type { ProductCardDTO } from "@kineDao.com/api-types/catalog";
import { toast } from "sonner";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { t } = useTranslation();
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session;
  const isLargeDesktop = useIsLargeDesktop();
  const isDesktop = useIsDesktop();
  const isTablet = useIsTablet();

  const favoriteIds = useFavoritesStore((state) => state.productIds);
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const clearFavorites = useFavoritesStore((state) => state.clear);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["wishlist", isLoggedIn, favoriteIds.join(",")],
    queryFn: async (): Promise<ProductCardDTO[]> => {
      if (isLoggedIn) {
        const response = await api.wishlist.$get();
        if (!response.ok) return [];
        const data = await response.json();
        return data.items.map((item) => item.product);
      }

      if (favoriteIds.length === 0) return [];

      const response = await api.wishlist.resolve.$post({
        json: { productIds: favoriteIds },
      });
      if (!response.ok) return [];

      const data = await response.json();
      return data.items;
    },
    staleTime: 1000 * 60,
  });

  const columns = isLargeDesktop ? 5 : isDesktop ? 4 : isTablet ? 3 : 2;
  const pageSize = columns === 5 ? 10 : columns * 3;
  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const pagedProducts = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return products.slice(start, end);
  }, [currentPage, pageSize, products, totalPages]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleRemove = async (productId: string) => {
    const next = await toggleFavorite(productId, isLoggedIn);

    if (!next) {
      toast.success(t("wishlist.removed"), { position: "bottom-right" });
      return;
    }

    toast.error(t("wishlist.addFailed"), { position: "bottom-right" });
  };

  const handleRemoveAll = async () => {
    if (isLoggedIn) {
      try {
        const response = await api.wishlist.items.$delete();
        if (!response.ok) {
          toast.error(t("wishlist.removeAllFailed"), { position: "bottom-right" });
          return;
        }
      } catch {
        toast.error(t("wishlist.removeAllFailed"), { position: "bottom-right" });
        return;
      }
    }

    clearFavorites();
    setCurrentPage(1);
    toast.success(t("wishlist.removedAll"), { position: "bottom-right" });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <p className="text-muted-foreground">{t("wishlist.loading")}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-14">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t("wishlist.title")}</h1>
          <p className="text-muted-foreground">{t("wishlist.empty")}</p>
          <p className="text-sm text-muted-foreground">{t("wishlist.emptyDesc")}</p>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/catalog">{t("wishlist.continueShopping")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("wishlist.title")}</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs sm:text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/15 hover:border-primary/30 hover:shadow-md">
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground px-1.5 text-[11px] leading-none">
              {products.length}
            </span>
            <span>{t("common.items")}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-300 shadow-sm transition-colors"
            onClick={() => void handleRemoveAll()}
          >
            <Trash2 className="h-4 w-4" />
            {t("wishlist.removeAll")}
          </Button>
        </div>
      </div>

      <div
        className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      >
        {pagedProducts.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            index={index}
            onRemove={() => {
              void handleRemove(product.id);
            }}
          />
        ))}
      </div>

      <div className="mt-8 border-t border-border/60 pt-6">
        <div className="mb-3 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {Math.min(currentPage, totalPages)} of {totalPages}
          </span>
          <span>{products.length} items</span>
        </div>
        <div className="hidden sm:block">
          {totalPages > 1 ? (
            <Pagination
              currentPage={Math.min(currentPage, totalPages)}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          ) : (
            <div className="flex justify-center">
              <Button variant="outline" size="icon" className="h-9 w-9 pointer-events-none">
                1
              </Button>
            </div>
          )}
        </div>
        <div className="sm:hidden">
          {totalPages > 1 ? (
            <CompactPagination
              currentPage={Math.min(currentPage, totalPages)}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          ) : (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" className="pointer-events-none">
                1 / 1
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
