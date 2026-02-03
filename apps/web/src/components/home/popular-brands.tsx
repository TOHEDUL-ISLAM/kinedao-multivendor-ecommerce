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
    <section className={cn("", className)}>
      {/* Section Header */}
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-center">
        {t("home.popularBrands")}
      </h2>

      {/* Brands Grid */}
      <div
        className={cn(
          "grid gap-3 sm:gap-4 lg:gap-6",
          // Responsive: 2-3 cols mobile, 5 cols desktop for 5 brands
          "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
        )}
      >
        {brands.map((brand, index) => {
          const brandCard = (
            <Link
              key={brand.id}
              to="/catalog"
              search={{ brand: brand.slug }}
              className="group flex items-center justify-center p-3 sm:p-4 lg:p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <motion.img
                src={brand.logoUrl}
                alt={brand.name}
                className={cn(
                  "h-12 sm:h-14 lg:h-16 w-auto max-w-full object-contain",
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
    <section>
      <div className="h-6 sm:h-7 w-40 mx-auto bg-muted rounded animate-pulse mb-4 sm:mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 sm:h-20 lg:h-24 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    </section>
  );
}
