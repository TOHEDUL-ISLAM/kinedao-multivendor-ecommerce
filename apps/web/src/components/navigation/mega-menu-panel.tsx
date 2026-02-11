"use client";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "@/hooks/use-translation";
import { useCategoryFeaturedProducts } from "@/hooks/use-categories";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import type {
  CategoryTreeNodeDTO,
  MegaMenuProductDTO,
} from "@kineDao.com/api-types/catalog";

interface MegaMenuPanelProps {
  category: CategoryTreeNodeDTO | null;
  onLinkClick: () => void;
}

export function MegaMenuPanel({ category, onLinkClick }: MegaMenuPanelProps) {
  const { language, t } = useTranslation();
  const { data: featuredProducts, isLoading: productsLoading } =
    useCategoryFeaturedProducts(category?.id ?? null, 6);

  if (!category) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center text-muted-foreground">
        <p>{t("catalog.hoverCategory")}</p>
      </div>
    );
  }

  const displayName =
    language === "bn" && category.nameBn ? category.nameBn : category.name;

  return (
    <div className="flex-1 p-6">
      {/* Recommended products */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {t("catalog.recommended")}
        </h3>
        {productsLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 w-[88px] shrink-0">
                <Skeleton className="w-16 h-16 rounded-2xl" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : featuredProducts && featuredProducts.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {featuredProducts.map((product) => (
              <RecommendedProductCard
                key={product.id}
                product={product}
                onLinkClick={onLinkClick}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {t("catalog.noFeaturedProducts")}
          </p>
        )}
      </div>

      {/* Subcategories grid */}
      {category.children.length > 0 && (
        <div className="border-t border-border pt-4">
          <div className="grid grid-cols-3 gap-x-8 gap-y-4">
            {category.children.slice(0, 5).map((subcategory) => {
              const subcategoryDisplayName =
                language === "bn" && subcategory.nameBn
                  ? subcategory.nameBn
                  : subcategory.name;

              return (
                <div key={subcategory.id}>
                  <h4 className="font-semibold text-sm text-foreground mb-2">
                    {subcategoryDisplayName}
                  </h4>
                  <ul className="space-y-1.5">
                    {subcategory.children.map((item) => {
                      const itemDisplayName =
                        language === "bn" && item.nameBn
                          ? item.nameBn
                          : item.name;

                      return (
                        <li key={item.id}>
                          <Link
                            to="/catalog"
                            search={{ category: item.slug }}
                            onClick={onLinkClick}
                            className="text-sm text-muted-foreground hover:text-primary hover:underline underline-offset-2 transition-colors"
                          >
                            {itemDisplayName}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View all link */}
      <div className="mt-6 pt-4 border-t border-border">
        <Link
          to="/catalog"
          search={{ category: category.slug }}
          onClick={onLinkClick}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-2"
        >
          {t("common.viewAll")} {displayName}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

interface RecommendedProductCardProps {
  product: MegaMenuProductDTO;
  onLinkClick: () => void;
}

function RecommendedProductCard({
  product,
  onLinkClick,
}: RecommendedProductCardProps) {
  const { language, t } = useTranslation();
  const displayTitle =
    language === "bn" && product.titleBn ? product.titleBn : product.title;

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      onClick={onLinkClick}
      className="flex flex-col items-center gap-2 w-[88px] shrink-0 group"
    >
      <div className="relative w-16 h-16">
        <div className="w-full h-full rounded-2xl bg-muted flex items-center justify-center overflow-hidden group-hover:scale-105 group-hover:shadow-card transition-all duration-200">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-baby-pink to-baby-blue flex items-center justify-center text-2xl">
              {displayTitle.charAt(0)}
            </div>
          )}
        </div>
        {product.isNew && (
          <div className="absolute -top-1 -right-1">
            <Badge className="bg-baby-blue text-blue-900 hover:bg-baby-blue/90 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
              {t("product.new")}
            </Badge>
          </div>
        )}
      </div>
      <span className="w-full text-xs text-center text-foreground group-hover:text-primary transition-colors line-clamp-2 break-words">
        {displayTitle}
      </span>
    </Link>
  );
}
