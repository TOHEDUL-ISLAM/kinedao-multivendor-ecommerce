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
    <section className="container mx-auto px-4 py-6">
      <div
        className={cn(
          // Mobile: 2x2 grid, Tablet: 2 cols, Desktop: 4 cols
          "grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6",
          className
        )}
      >
        {badges.map((badge, index) => {
          const Icon = badge.icon;

          const badgeContent = (
            <div
              key={badge.title}
              className="flex flex-row items-center text-left p-2.5 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl bg-card border border-border h-full"
            >
              <div
                className={cn(
                  "flex items-center justify-center shrink-0 h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full mr-2 sm:mr-4",
                  badge.bg
                )}
              >
                <Icon className={cn("h-4 w-4 sm:h-6 sm:w-6 lg:h-7 lg:w-7", badge.color)} />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-[11px] sm:text-base mb-0 sm:mb-0.5 truncate">
                  {badge.title}
                </h3>
                <p className="text-[9px] sm:text-sm text-muted-foreground leading-tight line-clamp-2">
                  {badge.description}
                </p>
              </div>
            </div>
          );

          if (prefersReducedMotion) {
            return <div key={badge.title}>{badgeContent}</div>;
          }

          return (
            <FadeInView key={badge.title} delay={index * 0.1} y={20} className="h-full">
              {badgeContent}
            </FadeInView>
          );
        })}
      </div>
    </section>
  );

  return content;
}

// Skeleton
export function TrustBadgesSkeleton() {
  return (
    <section className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex flex-row items-center p-2.5 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl bg-muted animate-pulse h-full"
          >
            <div className="h-8 w-8 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full bg-muted-foreground/10 mr-2 sm:mr-4 shrink-0" />
            <div className="flex flex-col gap-1 sm:gap-2 flex-1">
              <div className="h-3 sm:h-4 w-12 sm:w-24 bg-muted-foreground/10 rounded" />
              <div className="h-2 sm:h-3 w-16 sm:w-32 bg-muted-foreground/10 rounded" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
