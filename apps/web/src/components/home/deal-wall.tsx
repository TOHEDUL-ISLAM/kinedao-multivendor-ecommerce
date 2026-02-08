"use client";

import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { Link } from "@tanstack/react-router";
import { FadeInView, softSpring } from "@/components/ui/motion-wrappers";
import type { CampaignData } from "./hero-carousel";

interface DealWallProps {
  campaigns: CampaignData[];
  className?: string;
}

const themeColors: Record<string, { bg: string; border: string }> = {
  coral: {
    bg: "from-orange-50 to-rose-50 dark:from-orange-950/30 dark:to-rose-950/30",
    border: "border-orange-200 dark:border-orange-800",
  },
  teal: {
    bg: "from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30",
    border: "border-teal-200 dark:border-teal-800",
  },
  purple: {
    bg: "from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30",
    border: "border-purple-200 dark:border-purple-800",
  },
  amber: {
    bg: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
};

interface DealCardProps {
  campaign: CampaignData;
  index: number;
}

function DealCard({ campaign, index }: DealCardProps) {
  const { language } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const theme = themeColors[campaign.theme || "teal"];

  const displayTitle = language === "bn" && campaign.titleBn ? campaign.titleBn : campaign.title;
  const displaySubtitle = language === "bn" && campaign.subtitleBn ? campaign.subtitleBn : campaign.subtitle;

  const cardContent = (
    <Link
      to={campaign.ctaLink || "/catalog"}
      className={cn(
        "group relative flex flex-col h-full rounded-xl sm:rounded-2xl border overflow-hidden transition-shadow hover:shadow-lg",
        "bg-gradient-to-br",
        theme.bg,
        theme.border
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] sm:aspect-[3/2] overflow-hidden">
        <img
          src={campaign.imageUrl}
          alt={campaign.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Discount Badge */}
        {campaign.discountPercent && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 rounded-lg bg-destructive text-white text-xs sm:text-sm font-bold">
            -{campaign.discountPercent}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 sm:p-4">
        <h3 className="font-semibold text-sm sm:text-base md:text-lg line-clamp-1 mb-1">
          {displayTitle}
        </h3>

        {displaySubtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
            {displaySubtitle}
          </p>
        )}

        {/* CTA */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="hidden xs:inline">Limited time</span>
          </div>
          <span className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary group-hover:underline">
            Shop Now
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );

  if (prefersReducedMotion) {
    return cardContent;
  }

  return (
    <FadeInView delay={index * 0.1} y={20}>
      <motion.div whileHover={{ y: -3 }} transition={softSpring} className="h-full">
        {cardContent}
      </motion.div>
    </FadeInView>
  );
}

export function DealWall({ campaigns, className }: DealWallProps) {
  if (campaigns.length === 0) return null;

  return (
    <div
      className={cn(
        // Responsive grid: 2 cols on mobile, 3 cols on tablet, 3 cols on desktop
        "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6",
        className
      )}
    >
      {campaigns.slice(0, 6).map((campaign, index) => (
        <DealCard key={campaign.id} campaign={campaign} index={index} />
      ))}
    </div>
  );
}

// Skeleton
export function DealWallSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl sm:rounded-2xl border border-border overflow-hidden bg-muted animate-pulse"
        >
          <div className="aspect-[4/3] sm:aspect-[3/2] bg-muted-foreground/10" />
          <div className="p-3 sm:p-4 space-y-2">
            <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
            <div className="h-3 bg-muted-foreground/10 rounded w-full" />
            <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
