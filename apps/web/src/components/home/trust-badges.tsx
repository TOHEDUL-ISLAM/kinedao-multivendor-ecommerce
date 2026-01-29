"use client";

import { Truck, Shield, RotateCcw, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { FadeInView } from "@/components/ui/motion-wrappers";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

interface TrustBadgesProps {
  className?: string;
}

export function TrustBadges({ className }: TrustBadgesProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();

  const badges = [
    {
      icon: Truck,
      title: t("trust.fastDelivery"),
      description: t("trust.fastDeliveryDesc"),
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Shield,
      title: t("trust.safePackaging"),
      description: t("trust.safePackagingDesc"),
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: RotateCcw,
      title: t("trust.easyReturns"),
      description: t("trust.easyReturnsDesc"),
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      icon: Headphones,
      title: t("trust.support"),
      description: t("trust.supportDesc"),
      color: "text-accent-foreground",
      bg: "bg-accent",
    },
  ];

  const content = (
    <div
      className={cn(
        // Mobile: 2x2 grid, Tablet: 4 cols, Desktop: 4 cols
        "grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6",
        className
      )}
    >
      {badges.map((badge, index) => {
        const Icon = badge.icon;

        const badgeContent = (
          <div
            key={badge.title}
            className="flex flex-col items-center text-center p-3 sm:p-4 lg:p-6 rounded-xl bg-card border border-border"
          >
            <div
              className={cn(
                "flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full mb-2 sm:mb-3",
                badge.bg
              )}
            >
              <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7", badge.color)} />
            </div>
            <h3 className="font-semibold text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1">
              {badge.title}
            </h3>
            <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground leading-tight">
              {badge.description}
            </p>
          </div>
        );

        if (prefersReducedMotion) {
          return <div key={badge.title}>{badgeContent}</div>;
        }

        return (
          <FadeInView key={badge.title} delay={index * 0.1} y={20}>
            {badgeContent}
          </FadeInView>
        );
      })}
    </div>
  );

  return content;
}

// Skeleton
export function TrustBadgesSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center p-3 sm:p-4 lg:p-6 rounded-xl bg-muted animate-pulse"
        >
          <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full bg-muted-foreground/10 mb-2 sm:mb-3" />
          <div className="h-3 sm:h-4 w-20 bg-muted-foreground/10 rounded mb-1 sm:mb-2" />
          <div className="h-2 sm:h-3 w-24 bg-muted-foreground/10 rounded" />
        </div>
      ))}
    </div>
  );
}