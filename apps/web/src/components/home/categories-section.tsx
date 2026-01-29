import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "@/hooks/use-translation";
import { CATEGORY_ICON_MAP } from "@/lib/category-icons";

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

interface CategoriesSectionProps {
  categories?: CategoryDTO[];
}

export const CategoriesSection = ({ categories = [] }: CategoriesSectionProps) => {
  const { language, t } = useTranslation();
  const itemsLabel = t("common.items");

  const scrollContainer = (direction: "left" | "right") => {
    const container = document.getElementById("categories-scroll");
    if (container) {
      const scrollAmount = direction === "left" ? -200 : 200;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (categories.length === 0) return null;

  return (
    <section className="container py-8 mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-heading font-bold">
          {t("home.shopByCategory")}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => scrollContainer("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => scrollContainer("right")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div
        id="categories-scroll"
        className="flex gap-6 overflow-x-auto scroll-snap-x scrollbar-hide pb-4"
      >
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            slug={category.slug}
            displayName={language === "bn" && category.nameBn ? category.nameBn : category.name}
            iconKey={category.iconKey}
            imageUrl={category.imageUrl}
            productCount={category.productCount}
            itemsLabel={itemsLabel}
          />
        ))}
      </div>
    </section>
  );
};

interface CategoryCardProps {
  slug: string;
  displayName: string;
  iconKey: string | null;
  imageUrl: string | null;
  productCount?: number;
  itemsLabel: string;
}

const CategoryCard = ({
  slug,
  displayName,
  iconKey,
  imageUrl,
  productCount,
  itemsLabel,
}: CategoryCardProps) => {
  const [imageError, setImageError] = useState(false);
  const Icon = CATEGORY_ICON_MAP[iconKey || "default"] || CATEGORY_ICON_MAP.default;

  return (
    <Link
      to="/catalog"
      search={{ category: slug }}
      className="flex flex-col items-center gap-3 cursor-pointer group min-w-[108px] md:min-w-[120px]"
    >
      <div className="relative p-1 rounded-full bg-gradient-to-br from-primary via-orange-400 to-amber-500 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/25">
        <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full overflow-hidden bg-background ring-2 ring-background">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={displayName}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-muted">
              <Icon className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
          )}
        </div>
      </div>
      <span className="text-xs md:text-sm font-medium text-center leading-tight text-foreground/70 group-hover:text-foreground transition-colors line-clamp-2 max-w-[120px]">
        {displayName}
      </span>
      {productCount !== undefined && productCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {productCount} {itemsLabel}
        </span>
      )}
    </Link>
  );
};

// Skeleton for loading state
export const CategoriesSectionSkeleton = () => {
  return (
    <section className="container py-8 mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
      <div className="flex gap-6 overflow-hidden pb-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 min-w-[108px] md:min-w-[120px]">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
};
