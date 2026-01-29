import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "@/hooks/use-translation";

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
        {categories.map((category) => {
          const displayName = language === "bn" && category.nameBn ? category.nameBn : category.name;

          return (
            <Link
              key={category.id}
              to="/catalog"
              search={{ category: category.slug }}
              className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px]"
            >
              <div
                className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 group-hover:shadow-lg group-hover:border-primary/40 transition-all duration-300 overflow-hidden relative"
              >
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={displayName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                    <span className="text-2xl font-bold text-primary">
                      {displayName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-center group-hover:text-primary transition-colors max-w-[120px] line-clamp-2 leading-tight">
                {displayName}
              </span>
              {category.productCount !== undefined && category.productCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {category.productCount} {language === "bn" ? "টি" : "items"}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </section>
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
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 min-w-[100px]">
            <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
};
