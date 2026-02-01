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
  sortOrder?: number | null;
  productCount?: number;
}

interface VendorFilter {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

interface BrandFilter {
  name: string;
  count: number;
}

interface AgeRangeFilter {
  value: string;
  label: string;
  labelBn: string;
  count: number;
}

interface FilterSidebarProps {
  categories?: CategoryFilter[];
  vendors?: VendorFilter[];
  brands?: BrandFilter[];
  ageRanges?: AgeRangeFilter[];
  priceRange: { min: number; max: number };
  selectedCategories?: string[];
  selectedVendors?: string[];
  selectedBrands?: string[];
  selectedAgeRanges?: string[];
  selectedMinPrice?: number;
  selectedMaxPrice?: number;
  selectedRating?: number;
  onCategoryChange?: (slugs: string[]) => void;
  onVendorChange?: (slugs: string[]) => void;
  onBrandChange?: (brands: string[]) => void;
  onAgeRangeChange?: (ageRanges: string[]) => void;
  onPriceChange: (min?: number, max?: number) => void;
  onRatingChange?: (rating?: number) => void;
  onClearFilters: () => void;
  showCategories?: boolean;
  showVendors?: boolean;
  showRating?: boolean;
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
  categories = [],
  vendors = [],
  brands = [],
  ageRanges = [],
  priceRange,
  selectedCategories = [],
  selectedVendors = [],
  selectedBrands = [],
  selectedAgeRanges = [],
  selectedMinPrice,
  selectedMaxPrice,
  selectedRating,
  onCategoryChange,
  onVendorChange,
  onBrandChange,
  onAgeRangeChange,
  onPriceChange,
  onRatingChange,
  onClearFilters,
  showCategories = true,
  showVendors = true,
  showRating = true,
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
  const parentCategories = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
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
    if (!onCategoryChange) return;
    if (selectedCategories.includes(slug)) {
      onCategoryChange(selectedCategories.filter((s) => s !== slug));
    } else {
      onCategoryChange([...selectedCategories, slug]);
    }
  };

  const handleVendorToggle = (slug: string) => {
    if (!onVendorChange) return;
    if (selectedVendors.includes(slug)) {
      onVendorChange(selectedVendors.filter((s) => s !== slug));
    } else {
      onVendorChange([...selectedVendors, slug]);
    }
  };

  const handleBrandToggle = (brand: string) => {
    if (!onBrandChange) return;
    if (selectedBrands.includes(brand)) {
      onBrandChange(selectedBrands.filter((b) => b !== brand));
    } else {
      onBrandChange([...selectedBrands, brand]);
    }
  };

  const handleAgeRangeToggle = (value: string) => {
    if (!onAgeRangeChange) return;
    if (selectedAgeRanges.includes(value)) {
      onAgeRangeChange(selectedAgeRanges.filter((a) => a !== value));
    } else {
      onAgeRangeChange([...selectedAgeRanges, value]);
    }
  };

  const handlePriceSubmit = () => {
    const minNum = minPriceInput ? parseFloat(minPriceInput) : null;
    const maxNum = maxPriceInput ? parseFloat(maxPriceInput) : null;

    // Validate price inputs
    if (minNum !== null && minNum < 0) return;
    if (maxNum !== null && maxNum < 0) return;
    if (minNum !== null && maxNum !== null && minNum > maxNum) return;

    const min = minNum ? Math.round(minNum * 100) : undefined;
    const max = maxNum ? Math.round(maxNum * 100) : undefined;
    onPriceChange(min, max);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedVendors.length > 0 ||
    selectedBrands.length > 0 ||
    selectedAgeRanges.length > 0 ||
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
      {showCategories && categories.length > 0 && (
        <AccordionSection title={t("catalog.categories")}>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {parentCategories.map((category) => {
              const displayName =
                language === "bn" && category.nameBn ? category.nameBn : category.name;
              const isSelected = selectedCategories.includes(category.slug);
              const children = [...(childCategoriesMap[category.id] || [])].sort(
                (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
              );

              return (
                <div key={category.id}>
                  <button
                    onClick={() => handleCategoryToggle(category.slug)}
                    className="w-full flex items-center gap-2 cursor-pointer group hover:text-primary transition-colors text-sm"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleCategoryToggle(category.slug)}
                      className="pointer-events-none"
                    />
                    <span className="text-sm group-hover:text-primary transition-colors flex-1 text-left">
                      {displayName}
                    </span>
                    {category.productCount !== undefined && (
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        ({category.productCount})
                      </span>
                    )}
                  </button>

                  {/* Child categories */}
                  {children.length > 0 && (
                    <div className="ml-6 mt-1.5 space-y-1">
                      {children.map((child) => {
                        const childName =
                          language === "bn" && child.nameBn ? child.nameBn : child.name;
                        const isChildSelected = selectedCategories.includes(child.slug);
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleCategoryToggle(child.slug)}
                            className="w-full flex items-center gap-2 cursor-pointer group hover:text-primary transition-colors text-sm"
                          >
                            <Checkbox
                              checked={isChildSelected}
                              onCheckedChange={() => handleCategoryToggle(child.slug)}
                              className="pointer-events-none"
                            />
                            <span className="text-sm group-hover:text-primary transition-colors flex-1 text-left">
                              {childName}
                            </span>
                            {child.productCount !== undefined && (
                              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                                ({child.productCount})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </AccordionSection>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <AccordionSection title={t("catalog.brands")}>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
            {brands.map((brand) => (
              <button
                key={brand.name}
                onClick={() => handleBrandToggle(brand.name)}
                className="w-full flex items-center gap-2 cursor-pointer group hover:text-primary transition-colors text-sm"
              >
                <Checkbox
                  checked={selectedBrands.includes(brand.name)}
                  onCheckedChange={() => handleBrandToggle(brand.name)}
                  className="pointer-events-none"
                />
                <span className="text-sm group-hover:text-primary transition-colors truncate flex-1 text-left">
                  {brand.name}
                </span>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                  ({brand.count})
                </span>
              </button>
            ))}
          </div>
        </AccordionSection>
      )}

      {/* Age Range */}
      {ageRanges.length > 0 && (
        <AccordionSection title={t("catalog.ageRange")}>
          <div className="space-y-1">
            {ageRanges.map((option) => {
              const displayLabel = language === "bn" ? option.labelBn : option.label;
              const isSelected = selectedAgeRanges.includes(option.value);
              return (
                <button
                  key={option.value}
                  onClick={() => handleAgeRangeToggle(option.value)}
                  className="w-full flex items-center gap-2 cursor-pointer group hover:text-primary transition-colors text-sm"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleAgeRangeToggle(option.value)}
                    className="pointer-events-none"
                  />
                  <span className="text-sm group-hover:text-primary transition-colors flex-1 text-left">
                    {displayLabel}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    ({option.count})
                  </span>
                </button>
              );
            })}
          </div>
        </AccordionSection>
      )}

      {/* Price Range */}
      <AccordionSection title={t("catalog.priceRange")}>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t("common.from")}
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              min="0"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t("common.to")}
            </label>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              min="0"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
      {showRating && onRatingChange && (
        <AccordionSection title={t("catalog.rating")} defaultOpen={false}>
          <div className="space-y-3">
            {ratingOptions.map((rating) => (
              <button
                key={rating}
                onClick={() =>
                  onRatingChange(selectedRating === rating ? undefined : rating)
                }
                className="w-full flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity"
              >
                <Checkbox
                  checked={selectedRating === rating}
                  onCheckedChange={() =>
                    onRatingChange(selectedRating === rating ? undefined : rating)
                  }
                  className="pointer-events-none"
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
                  {rating} {t("catalog.ratingUp")}
                </span>
              </button>
            ))}
          </div>
        </AccordionSection>
      )}

      {/* Vendors */}
      {showVendors && vendors.length > 0 && (
        <AccordionSection title={t("catalog.vendors")} defaultOpen={false}>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
            {vendors.slice(0, 15).map((vendor) => (
              <button
                key={vendor.id}
                onClick={() => handleVendorToggle(vendor.slug)}
                className="w-full flex items-center gap-2 cursor-pointer group hover:text-primary transition-colors text-sm"
              >
                <Checkbox
                  checked={selectedVendors.includes(vendor.slug)}
                  onCheckedChange={() => handleVendorToggle(vendor.slug)}
                  className="pointer-events-none"
                />
                <span className="text-sm group-hover:text-primary transition-colors truncate flex-1 text-left">
                  {vendor.name}
                </span>
                {vendor.productCount !== undefined && (
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    ({vendor.productCount})
                  </span>
                )}
              </button>
            ))}
          </div>
        </AccordionSection>
      )}
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
