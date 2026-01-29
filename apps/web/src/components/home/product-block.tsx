"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { Link } from "@tanstack/react-router";
import { ProductCard, ProductCardSkeleton, type ProductCardData } from "@/components/product-card";
import { Button } from "@/components/ui/button";

interface ProductBlockProps {
  title: string;
  products: ProductCardData[];
  viewAllLink?: string;
  viewAllParams?: Record<string, string>;
  layout?: "grid" | "carousel";
  className?: string;
}

export function ProductBlock({
  title,
  products,
  viewAllLink = "/catalog",
  viewAllParams,
  layout = "carousel",
  className,
}: ProductBlockProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.querySelector("div")?.offsetWidth || 200;
    const scrollAmount = direction === "left" ? -cardWidth - 16 : cardWidth + 16;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section className={cn("relative", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">{title}</h2>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* View All Button */}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link to={viewAllLink} search={viewAllParams}>
              {t("home.viewAll")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Products */}
      {layout === "carousel" ? (
        // Carousel Layout - horizontal scroll
        <div className="relative">
          <div
            ref={scrollRef}
            className={cn(
              "flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2",
              // Negative margin + padding for edge-to-edge scroll on mobile
              "-mx-4 px-4 sm:mx-0 sm:px-0"
            )}
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                className={cn(
                  "flex-shrink-0",
                  // Responsive card widths for carousel
                  "w-[160px] xs:w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px] xl:w-[260px]"
                )}
              >
                <ProductCard product={product} index={index} />
              </div>
            ))}
          </div>

          {/* Carousel scroll buttons - centered on sides */}
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex items-center justify-center absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-full bg-background/90 shadow-md ring-1 ring-border hover:bg-background transition-colors focus-ring"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-9 w-9 rounded-full bg-background/90 shadow-md ring-1 ring-border hover:bg-background transition-colors focus-ring"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // Grid Layout
        <div
          className={cn(
            "grid gap-3 sm:gap-4 lg:gap-6",
            // Responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop, 5 cols large
            "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          )}
        >
          {products.slice(0, 10).map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}

      {/* Mobile View All Button */}
      <div className="mt-4 sm:hidden">
        <Link to={viewAllLink} search={viewAllParams} className="w-full">
          <Button variant="outline" className="w-full">
            {t("home.viewAll")}
          </Button>
        </Link>
      </div>
    </section>
  );
}

// Skeleton
export function ProductBlockSkeleton({ layout = "carousel" }: { layout?: "grid" | "carousel" }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="h-6 sm:h-7 w-32 sm:w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-16 sm:w-20 bg-muted rounded animate-pulse" />
      </div>

      {layout === "carousel" ? (
        <div className="flex gap-3 sm:gap-4 overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[160px] xs:w-[180px] sm:w-[200px] md:w-[220px] lg:w-[240px] xl:w-[260px]"
            >
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {[...Array(10)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}
    </section>
  );
}
