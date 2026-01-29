"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { usePrefersReducedMotion, useIsMobile } from "@/hooks/use-media-query";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export interface CampaignData {
  id: string;
  title: string;
  titleBn: string | null;
  subtitle: string | null;
  subtitleBn: string | null;
  imageUrl: string;
  theme: string | null;
  ctaText: string | null;
  ctaTextBn: string | null;
  ctaLink: string | null;
  discountPercent: number | null;
}

interface HeroCarouselProps {
  campaigns: CampaignData[];
  className?: string;
}

const themeColors: Record<string, { bg: string; text: string; accent: string }> = {
  // Baby Pink Theme
  pink: {
    bg: "from-pink-100 to-rose-100 dark:from-pink-950/50 dark:to-rose-950/50",
    text: "text-pink-900 dark:text-pink-100",
    accent: "bg-pink-500 hover:bg-pink-600",
  },
  // Baby Blue Theme
  blue: {
    bg: "from-blue-100 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-950/50",
    text: "text-blue-900 dark:text-blue-100",
    accent: "bg-blue-500 hover:bg-blue-600",
  },
  // Lavender Theme
  lavender: {
    bg: "from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-pink-950/50",
    text: "text-purple-900 dark:text-purple-100",
    accent: "bg-purple-500 hover:bg-purple-600",
  },
  // Mint Green Theme
  mint: {
    bg: "from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50",
    text: "text-emerald-900 dark:text-emerald-100",
    accent: "bg-emerald-500 hover:bg-emerald-600",
  },
  // Peach Theme
  peach: {
    bg: "from-orange-100 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50",
    text: "text-orange-900 dark:text-orange-100",
    accent: "bg-orange-500 hover:bg-orange-600",
  },
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export function HeroCarousel({ campaigns, className }: HeroCarouselProps) {
  const { language } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const [[page, direction], setPage] = useState([0, 0]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const currentIndex = ((page % campaigns.length) + campaigns.length) % campaigns.length;

  const paginate = useCallback(
    (newDirection: number) => {
      setPage([page + newDirection, newDirection]);
    },
    [page]
  );

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying || campaigns.length <= 1) return;

    const interval = setInterval(() => {
      paginate(1);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, paginate, campaigns.length]);

  // Pause on hover (desktop only)
  const handleMouseEnter = () => !isMobile && setIsAutoPlaying(false);
  const handleMouseLeave = () => !isMobile && setIsAutoPlaying(true);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    }
  };

  if (campaigns.length === 0) return null;

  const campaign = campaigns[currentIndex];
  // Safely get theme with fallback for old/invalid theme names
  const themeName = campaign.theme && themeColors[campaign.theme] ? campaign.theme : "pink";
  const theme = themeColors[themeName];
  const displayTitle = language === "bn" && campaign.titleBn ? campaign.titleBn : campaign.title;
  const displaySubtitle = language === "bn" && campaign.subtitleBn ? campaign.subtitleBn : campaign.subtitle;
  const displayCta = language === "bn" && campaign.ctaTextBn ? campaign.ctaTextBn : campaign.ctaText;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Aspect ratio container - responsive */}
      <div className="relative aspect-[16/10] sm:aspect-[16/7] lg:aspect-[21/9]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={prefersReducedMotion ? {} : variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.3 },
                  }
            }
            drag={!prefersReducedMotion && campaigns.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={handleDragEnd}
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              theme.bg
            )}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="h-full w-full object-cover opacity-40 dark:opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent dark:from-background/90 dark:via-background/50 dark:to-transparent" />
            </div>

            {/* Content */}
            <div className="relative h-full flex items-center px-4 sm:px-8 lg:px-12 xl:px-16">
              <div className="max-w-lg lg:max-w-xl xl:max-w-2xl">
                {campaign.discountPercent && (
                  <motion.span
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="inline-block px-3 py-1 mb-3 sm:mb-4 text-xs sm:text-sm font-bold rounded-full bg-destructive text-white"
                  >
                    {campaign.discountPercent}% OFF
                  </motion.span>
                )}

                <motion.h2
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className={cn(
                    "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-2 sm:mb-4",
                    theme.text
                  )}
                >
                  {displayTitle}
                </motion.h2>

                {displaySubtitle && (
                  <motion.p
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-4 sm:mb-6 max-w-md"
                  >
                    {displaySubtitle}
                  </motion.p>
                )}

                {displayCta && campaign.ctaLink && (
                  <motion.div
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Link to={campaign.ctaLink}>
                      <Button
                        size="lg"
                        className={cn(
                          "text-sm sm:text-base px-6 sm:px-8 py-2.5 sm:py-3 text-white font-semibold",
                          theme.accent
                        )}
                      >
                        {displayCta}
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows - Hidden on mobile */}
        {campaigns.length > 1 && (
          <>
            <button
              onClick={() => paginate(-1)}
              className="hidden sm:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-sm text-foreground shadow-lg hover:bg-white dark:hover:bg-card transition-colors focus-ring"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
            </button>
            <button
              onClick={() => paginate(1)}
              className="hidden sm:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-sm text-foreground shadow-lg hover:bg-white dark:hover:bg-card transition-colors focus-ring"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
            </button>
          </>
        )}

        {/* Dots Navigation */}
        {campaigns.length > 1 && (
          <div className="absolute bottom-3 sm:bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
            {campaigns.map((_, index) => (
              <button
                key={index}
                onClick={() => setPage([index, index > currentIndex ? 1 : -1])}
                className={cn(
                  "h-1.5 sm:h-2 rounded-full transition-all duration-300 focus-ring",
                  index === currentIndex
                    ? "w-6 sm:w-8 bg-primary"
                    : "w-1.5 sm:w-2 bg-foreground/30 hover:bg-foreground/50"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Skeleton
export function HeroCarouselSkeleton() {
  return (
    <div className="relative w-full aspect-[16/10] sm:aspect-[16/7] lg:aspect-[21/9] rounded-xl sm:rounded-2xl lg:rounded-3xl bg-muted animate-pulse overflow-hidden">
      <div className="absolute inset-0 flex items-center px-4 sm:px-8 lg:px-12">
        <div className="space-y-4 max-w-lg">
          <div className="h-6 w-20 bg-muted-foreground/20 rounded-full" />
          <div className="h-10 sm:h-14 lg:h-16 w-full bg-muted-foreground/20 rounded" />
          <div className="h-4 sm:h-5 w-2/3 bg-muted-foreground/20 rounded" />
          <div className="h-10 w-32 bg-muted-foreground/20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
