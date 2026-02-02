"use client";

import { Link } from "@tanstack/react-router";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface RelatedProductsProps {
  products: ProductCardData[];
  className?: string;
}

export function RelatedProducts({ products, className }: RelatedProductsProps) {
  const { t } = useTranslation();

  if (products.length === 0) return null;

  return (
    <section className={cn("py-8", className)}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold">{t("product.relatedProducts")}</h2>

        {/* View All link */}
        <Link
          to="/catalog"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {t("common.viewAll")}
        </Link>
      </div>

      {/* 2-column grid on mobile, 4-column on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {products.map((product) => (
          <div key={product.id}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
