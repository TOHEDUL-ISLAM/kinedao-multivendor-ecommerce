"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Shirt,
  Baby,
  Gift,
  Bed,
  Heart,
  Blocks,
  ChevronLeft,
  ChevronRight,
  // New icons for comprehensive categories
  Milk,
  Shield,
  Bath,
  ShieldCheck,
  Car,
  User,
  CloudRain,
  Moon,
  Cookie,
  Leaf,
  Package,
  Droplets,
  Backpack,
  Sparkles,
  Scissors,
  Music,
  Book,
  Home,
  Radio,
  Activity,
  Cross,
  Plane,
  Users,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { Link } from "@tanstack/react-router";
import { FadeInView, softSpring } from "@/components/ui/motion-wrappers";

export interface CategoryData {
  id: string;
  name: string;
  nameBn: string | null;
  slug: string;
  iconKey: string | null;
  productCount?: number;
}

interface CategoryNavProps {
  categories: CategoryData[];
  className?: string;
}

// Icon mapping - comprehensive set for all categories
const iconMap: Record<string, typeof Shirt> = {
  // Original icons
  Shirt,
  Baby,
  Gift,
  Bed,
  Heart,
  ToyBrick: Blocks,

  // Clothing & Fashion
  User,
  CloudRain,
  Moon,

  // Feeding & Nursing
  Milk,
  Utensils,
  Cookie,
  Leaf,

  // Diapering & Potty
  Shield,
  Package,
  Droplets,
  Backpack,

  // Bath & Skincare
  Bath,
  Sparkles,
  Scissors,

  // Toys & Entertainment
  Music,
  Book,

  // Nursery & Furniture
  Home,

  // Safety & Health
  ShieldCheck,
  Radio,
  Activity,
  Cross,

  // Gear & Travel
  Car,
  Plane,

  // Mom & Baby Care
  Users,

  // Default fallback
  default: Shirt,
};

export function CategoryNav({ categories, className }: CategoryNavProps) {
  const { t, language } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();
  // const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === "left" ? -200 : 200;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  return (
    <section className={cn("relative", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">
          {t("home.shopByCategory")}
        </h2>

        {/* Desktop scroll buttons */}
        <div className="hidden sm:flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors focus-ring"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors focus-ring"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Categories */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {categories.map((category, index) => {
          const IconComponent = iconMap[category.iconKey || "default"] || iconMap.default;
          const displayName = language === "bn" && category.nameBn ? category.nameBn : category.name;

          const categoryCard = (
            <Link
              key={category.id}
              to="/catalog"
              search={{ category: category.slug }}
              className="group flex flex-col items-center flex-shrink-0"
            >
              <motion.div
                whileHover={prefersReducedMotion ? {} : { y: -5, scale: 1.05 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
                transition={softSpring}
                className={cn(
                  "flex items-center justify-center",
                  // Responsive sizing
                  "h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24",
                  "rounded-2xl sm:rounded-3xl",
                  "bg-gradient-to-br from-primary/10 to-primary/5",
                  "border border-primary/20",
                  "transition-all duration-300",
                  "group-hover:shadow-lg group-hover:shadow-primary/10",
                  "group-hover:border-primary/40"
                )}
              >
                <IconComponent
                  className={cn(
                    "h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10",
                    "text-primary transition-transform duration-300",
                    "group-hover:scale-110"
                  )}
                />
              </motion.div>
              <span className="mt-2 text-xs sm:text-sm font-medium text-center line-clamp-1 max-w-[4.5rem] sm:max-w-[5.5rem] lg:max-w-[6.5rem]">
                {displayName}
              </span>
              {category.productCount !== undefined && (
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {category.productCount} {language === "bn" ? "টি" : "items"}
                </span>
              )}
            </Link>
          );

          if (prefersReducedMotion) {
            return <div key={category.id}>{categoryCard}</div>;
          }

          return (
            <FadeInView key={category.id} delay={index * 0.05} y={15}>
              {categoryCard}
            </FadeInView>
          );
        })}
      </div>
    </section>
  );
}

// Skeleton
export function CategoryNavSkeleton() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="h-6 sm:h-7 w-40 bg-muted rounded animate-pulse" />
        <div className="hidden sm:flex gap-2">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
      <div className="flex gap-3 sm:gap-4 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center flex-shrink-0">
            <div className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-2xl sm:rounded-3xl bg-muted animate-pulse" />
            <div className="mt-2 h-3 sm:h-4 w-14 sm:w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}
