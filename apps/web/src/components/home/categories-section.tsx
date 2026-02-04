import { useState, useRef, useEffect, useCallback } from "react";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    hasOverflow: false,
  });

  // Check if container has overflow and update scroll state
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const hasOverflow = container.scrollWidth > container.clientWidth;
    const canScrollLeft = container.scrollLeft > 0;
    const canScrollRight =
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1; // -1 for rounding

    setScrollState({
      hasOverflow,
      canScrollLeft,
      canScrollRight,
    });
  }, []);

  // Detect overflow on mount, resize, and category changes
  useEffect(() => {
    updateScrollState();

    const container = scrollContainerRef.current;
    if (!container) return;

    // Listen for scroll events
    container.addEventListener("scroll", updateScrollState);

    // Listen for resize events
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState, categories.length]);

  const scrollContainer = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Scroll by approximately 3-4 category widths
    const scrollAmount = container.clientWidth * 0.8;
    const scrollDirection = direction === "left" ? -scrollAmount : scrollAmount;
    container.scrollBy({ left: scrollDirection, behavior: "smooth" });
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, direction: "left" | "right") => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      scrollContainer(direction);
    }
  };

  if (categories.length === 0) return null;

  return (
    <section className="container py-8 mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-heading font-bold">
          {t("home.shopByCategory")}
        </h2>

        {/* Navigation buttons - only show when overflow exists */}
        {scrollState.hasOverflow && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => scrollContainer("left")}
              onKeyDown={(e) => handleKeyDown(e, "left")}
              disabled={!scrollState.canScrollLeft}
              aria-label={t("common.scrollLeft") || "Scroll left"}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => scrollContainer("right")}
              onKeyDown={(e) => handleKeyDown(e, "right")}
              disabled={!scrollState.canScrollRight}
              aria-label={t("common.scrollRight") || "Scroll right"}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="grid auto-cols-[minmax(100px,140px)] grid-flow-col gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 justify-start"
        role="list"
        aria-label={t("home.shopByCategory")}
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
      className="flex flex-col items-center gap-3 cursor-pointer group"
      role="listitem"
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
