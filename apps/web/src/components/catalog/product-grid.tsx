"use client";

import { motion } from "framer-motion";
import { PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { ProductCard, ProductCardSkeleton, type ProductCardData } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface ProductGridProps {
  products: ProductCardData[];
  isLoading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  showLoadMore?: boolean;
  className?: string;
}

export function ProductGrid({
  products,
  isLoading,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  showLoadMore = true,
  className,
}: ProductGridProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();

  // Initial loading state
  if (isLoading && products.length === 0) {
    return (
      <div
        className={cn(
          "grid gap-3 sm:gap-4 lg:gap-6",
          // Responsive grid: 2 cols mobile, 2-3 cols tablet, 3-4 cols desktop
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
  if (!isLoading && products.length === 0) {
    return (
      <motion.div
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
      >
        <div className="flex items-center justify-center h-20 w-20 rounded-full bg-muted mb-4">
          <PackageSearch className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t("catalog.noResults")}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {t("catalog.noResultsDesc")}
        </p>
        <Link to="/catalog">
          <Button variant="outline">{t("catalog.clearFilters")}</Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <div className={className}>
      {/* Product Grid */}
      <motion.div
        layout={!prefersReducedMotion}
        className={cn(
          "grid gap-3 sm:gap-4 lg:gap-6",
          // Responsive grid
          "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
        )}
      >
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}

        {/* Loading more skeletons */}
        {isLoadingMore &&
          [...Array(4)].map((_, i) => (
            <ProductCardSkeleton key={`loading-${i}`} />
          ))}
      </motion.div>

      {/* Load More Button */}
      {showLoadMore && hasMore && !isLoadingMore && onLoadMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={onLoadMore}
            className="min-w-[200px]"
          >
            {t("catalog.loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
