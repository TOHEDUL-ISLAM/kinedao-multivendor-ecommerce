"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface CategoryFilter {
  id: string;
  name: string;
  nameBn: string | null;
  slug: string;
  parentId: string | null;
  productCount?: number;
}

interface VendorFilter {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

interface FilterSidebarProps {
  categories: CategoryFilter[];
  vendors: VendorFilter[];
  priceRange: { min: number; max: number };
  selectedCategories: string[];
  selectedVendors: string[];
  selectedMinPrice?: number;
  selectedMaxPrice?: number;
  selectedRating?: number;
  onCategoryChange: (slugs: string[]) => void;
  onVendorChange: (slugs: string[]) => void;
  onPriceChange: (min?: number, max?: number) => void;
  onRatingChange: (rating?: number) => void;
  onClearFilters: () => void;
  className?: string;
}

interface AccordionSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function AccordionSection({ title, defaultOpen = true, children }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 text-sm font-medium hover:text-primary transition-colors"
      >
        {title}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={prefersReducedMotion ? {} : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={prefersReducedMotion ? {} : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterSidebar({
  categories,
  vendors,
  priceRange,
  selectedCategories,
  selectedVendors,
  selectedMinPrice,
  selectedMaxPrice,
  selectedRating,
  onCategoryChange,
  onVendorChange,
  onPriceChange,
  onRatingChange,
  onClearFilters,
  className,
}: FilterSidebarProps) {
  const { t, language } = useTranslation();

  const [minPriceInput, setMinPriceInput] = useState(
    selectedMinPrice ? (selectedMinPrice / 100).toString() : ""
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    selectedMaxPrice ? (selectedMaxPrice / 100).toString() : ""
  );

  // Group categories by parent
  const parentCategories = categories.filter((c) => !c.parentId);
  const childCategoriesMap = categories.reduce(
    (acc, c) => {
      if (c.parentId) {
        if (!acc[c.parentId]) acc[c.parentId] = [];
        acc[c.parentId].push(c);
      }
      return acc;
    },
    {} as Record<string, CategoryFilter[]>
  );

  const handleCategoryToggle = (slug: string) => {
    if (selectedCategories.includes(slug)) {
      onCategoryChange(selectedCategories.filter((s) => s !== slug));
    } else {
      onCategoryChange([...selectedCategories, slug]);
    }
  };

  const handleVendorToggle = (slug: string) => {
    if (selectedVendors.includes(slug)) {
      onVendorChange(selectedVendors.filter((s) => s !== slug));
    } else {
      onVendorChange([...selectedVendors, slug]);
    }
  };

  const handlePriceSubmit = () => {
    const min = minPriceInput ? parseInt(minPriceInput) * 100 : undefined;
    const max = maxPriceInput ? parseInt(maxPriceInput) * 100 : undefined;
    onPriceChange(min, max);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedVendors.length > 0 ||
    selectedMinPrice !== undefined ||
    selectedMaxPrice !== undefined ||
    selectedRating !== undefined;

  const ratingOptions = [4, 3, 2, 1];

  return (
    <div className={cn("bg-card rounded-xl border border-border p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{t("catalog.filters")}</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            {t("catalog.clearFilters")}
          </button>
        )}
      </div>

      {/* Categories */}
      <AccordionSection title={t("catalog.categories")}>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {parentCategories.map((category) => {
            const displayName =
              language === "bn" && category.nameBn ? category.nameBn : category.name;
            const children = childCategoriesMap[category.id] || [];

            return (
              <div key={category.id}>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <Checkbox
                    checked={selectedCategories.includes(category.slug)}
                    onCheckedChange={() => handleCategoryToggle(category.slug)}
                  />
                  <span className="text-sm group-hover:text-primary transition-colors">
                    {displayName}
                  </span>
                  {category.productCount !== undefined && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      ({category.productCount})
                    </span>
                  )}
                </label>

                {/* Child categories */}
                {children.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {children.map((child) => {
                      const childName =
                        language === "bn" && child.nameBn ? child.nameBn : child.name;
                      return (
                        <label
                          key={child.id}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <Checkbox
                            checked={selectedCategories.includes(child.slug)}
                            onCheckedChange={() => handleCategoryToggle(child.slug)}
                          />
                          <span className="text-sm group-hover:text-primary transition-colors">
                            {childName}
                          </span>
                          {child.productCount !== undefined && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              ({child.productCount})
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AccordionSection>

      {/* Price Range */}
      <AccordionSection title={t("catalog.priceRange")}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="number"
                placeholder={t("common.from")}
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="flex-1">
              <input
                type="number"
                placeholder={t("common.to")}
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <Button size="sm" onClick={handlePriceSubmit} className="w-full">
            Apply
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {formatPrice(priceRange.min, "BDT", language)} -{" "}
            {formatPrice(priceRange.max, "BDT", language)}
          </p>
        </div>
      </AccordionSection>

      {/* Rating */}
      <AccordionSection title={t("catalog.rating")}>
        <div className="space-y-2">
          {ratingOptions.map((rating) => (
            <label
              key={rating}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <Checkbox
                checked={selectedRating === rating}
                onCheckedChange={() =>
                  onRatingChange(selectedRating === rating ? undefined : rating)
                }
              />
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5",
                      i < rating
                        ? "fill-warning text-warning"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {t("catalog.ratingUp")}
              </span>
            </label>
          ))}
        </div>
      </AccordionSection>

      {/* Vendors */}
      <AccordionSection title={t("catalog.vendors")} defaultOpen={false}>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
          {vendors.slice(0, 15).map((vendor) => (
            <label
              key={vendor.id}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <Checkbox
                checked={selectedVendors.includes(vendor.slug)}
                onCheckedChange={() => handleVendorToggle(vendor.slug)}
              />
              <span className="text-sm group-hover:text-primary transition-colors truncate">
                {vendor.name}
              </span>
              {vendor.productCount !== undefined && (
                <span className="text-xs text-muted-foreground ml-auto">
                  ({vendor.productCount})
                </span>
              )}
            </label>
          ))}
        </div>
      </AccordionSection>
    </div>
  );
}

// Mobile Filter Drawer
interface MobileFilterDrawerProps extends FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  ...props
}: MobileFilterDrawerProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={prefersReducedMotion ? {} : { x: "-100%" }}
            animate={{ x: 0 }}
            exit={prefersReducedMotion ? {} : { x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-background shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-background">
              <h2 className="font-semibold">{t("catalog.filters")}</h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <FilterSidebar {...props} className="border-0 p-0" />
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 p-4 border-t border-border bg-background safe-bottom">
              <Button onClick={onClose} className="w-full">
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
