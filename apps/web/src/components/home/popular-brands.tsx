"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { Link } from "@tanstack/react-router";
import { FadeInView, softSpring } from "@/components/ui/motion-wrappers";

export interface BrandData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
}

interface PopularBrandsProps {
  brands: BrandData[];
  className?: string;
}

export function PopularBrands({ brands, className }: PopularBrandsProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();

  if (brands.length === 0) return null;

  return (
    <section className={cn("w-full", className)}>
      {/* Section Header */}
      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 md:mb-6 text-center px-2">
        {t("home.popularBrands")}
      </h2>

      {/* Brands Grid */}
      <div
        className={cn(
          "grid gap-3 sm:gap-4 md:gap-5 lg:gap-6",
          // Responsive: 1 col mobile, 2 cols tablet, 3-5 cols desktop
          "grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
          // Ensure grid doesn't overflow
          "w-full max-w-full"
        )}
      >
        {brands.map((brand, index) => {
          const brandCard = (
            <Link
              key={brand.id}
              to="/catalog"
              search={{ brand: brand.slug }}
              className="group flex items-center justify-center p-6 xs:p-5 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300 min-h-[120px] xs:min-h-[100px] sm:min-h-[100px] md:min-h-[110px] lg:min-h-[120px]"
            >
              <motion.img
                src={brand.logoUrl}
                alt={brand.name}
                className={cn(
                  "h-20 xs:h-16 sm:h-16 md:h-18 lg:h-20 xl:h-24",
                  "w-auto max-w-[85%] object-contain",
                  "group-hover:scale-105",
                  "transition-all duration-300"
                )}
                whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
                transition={softSpring}
                loading="lazy"
              />
            </Link>
          );

          if (prefersReducedMotion) {
            return <div key={brand.id}>{brandCard}</div>;
          }

          return (
            <FadeInView key={brand.id} delay={index * 0.05} y={15}>
              {brandCard}
            </FadeInView>
          );
        })}
      </div>
    </section>
  );
}

// Skeleton
export function PopularBrandsSkeleton() {
  return (
    <section className="w-full">
      <div className="h-5 sm:h-6 md:h-7 w-32 sm:w-40 mx-auto bg-muted rounded animate-pulse mb-3 sm:mb-4 md:mb-6" />
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full max-w-full">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="min-h-[120px] xs:min-h-[100px] sm:min-h-[100px] md:min-h-[110px] lg:min-h-[120px] rounded-lg sm:rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    </section>
  );
}