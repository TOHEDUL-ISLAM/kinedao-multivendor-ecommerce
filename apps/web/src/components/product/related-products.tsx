"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface RelatedProductsProps {
  products: ProductCardData[];
  className?: string;
}

export function RelatedProducts({ products, className }: RelatedProductsProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className={cn("py-8", className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold">{t("product.relatedProducts")}</h2>

        {/* Desktop navigation arrows */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full border border-border hover:bg-muted transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Horizontal scroll on mobile/tablet, grid on desktop */}
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory",
          "md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:snap-none"
        )}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[280px] md:w-auto snap-start"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
