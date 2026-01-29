"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";

type SortOption = "price_asc" | "price_desc" | "newest" | "bestseller" | "rating";

interface SortBarProps {
  totalCount: number;
  currentSort: SortOption | undefined;
  onSortChange: (sort: SortOption) => void;
  onFilterClick: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export function SortBar({
  totalCount,
  currentSort,
  onSortChange,
  onFilterClick,
  hasActiveFilters,
  className,
}: SortBarProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "bestseller", label: t("catalog.sortBestSeller") },
    { value: "newest", label: t("catalog.sortNewest") },
    { value: "price_asc", label: t("catalog.sortPriceLow") },
    { value: "price_desc", label: t("catalog.sortPriceHigh") },
    { value: "rating", label: t("catalog.sortRating") },
  ];

  const currentSortLabel =
    sortOptions.find((o) => o.value === currentSort)?.label || t("catalog.sort");

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-card rounded-xl border border-border",
        className
      )}
    >
      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{totalCount}</span>{" "}
        {t("catalog.results")}
      </p>

      <div className="flex items-center gap-2">
        {/* Mobile Filter Button */}
        <button
          onClick={onFilterClick}
          className={cn(
            "flex sm:hidden items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
            hasActiveFilters
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/50"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="text-sm font-medium">{t("catalog.filters")}</span>
          {hasActiveFilters && (
            <span className="flex items-center justify-center h-4 w-4 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
              !
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary/50 transition-colors"
          >
            <span className="text-sm">{t("catalog.sort")}:</span>
            <span className="text-sm font-medium">{currentSortLabel}</span>
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsDropdownOpen(false)}
                />

                {/* Dropdown */}
                <motion.div
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 z-50 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors",
                        currentSort === option.value
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      {option.label}
                      {currentSort === option.value && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
