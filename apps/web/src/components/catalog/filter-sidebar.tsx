"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Star } from "lucide-react";
import { Drawer, Checkbox as MantineCheckbox } from "@mantine/core";
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

interface SafetyFilter {
  isBpaFree: number;
  isOrganic: number;
  isHypoallergenic: number;
}

interface FilterSidebarProps {
  categories?: CategoryFilter[];
  vendors?: VendorFilter[];
  brands?: BrandFilter[];
  ageRanges?: AgeRangeFilter[];
  safetyFacets?: SafetyFilter;
  priceRange: { min: number; max: number };
  selectedCategories?: string[];
  selectedVendors?: string[];
  selectedBrands?: string[];
  selectedAgeRanges?: string[];
  selectedIsBpaFree?: boolean;
  selectedIsOrganic?: boolean;
  selectedIsHypoallergenic?: boolean;
  selectedMinPrice?: number;
  selectedMaxPrice?: number;
  selectedRating?: number;
  onCategoryChange?: (slugs: string[]) => void;
  onVendorChange?: (slugs: string[]) => void;
  onBrandChange?: (brands: string[]) => void;
  onAgeRangeChange?: (ageRanges: string[]) => void;
  onSafetyChange?: (safety: { isBpaFree?: boolean; isOrganic?: boolean; isHypoallergenic?: boolean }) => void;
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
  ageRanges: _ageRanges = [],
  safetyFacets,
  priceRange,
  selectedCategories = [],
  selectedVendors = [],
  selectedBrands = [],
  selectedAgeRanges: _selectedAgeRanges = [],
  selectedIsBpaFree = false,
  selectedIsOrganic = false,
  selectedIsHypoallergenic = false,
  selectedMinPrice,
  selectedMaxPrice,
  selectedRating,
  onCategoryChange,
  onVendorChange,
  onBrandChange,
  onAgeRangeChange: _onAgeRangeChange,
  onSafetyChange,
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
    selectedIsBpaFree ||
    selectedIsOrganic ||
    selectedIsHypoallergenic ||
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
                    aria-pressed={isSelected}
                    onClick={() => handleCategoryToggle(category.slug)}
                    className="w-full flex items-center gap-2 cursor-pointer group hover:text-primary transition-colors text-sm"
                  >
                    <MantineCheckbox.Indicator
                      checked={isSelected}
                      aria-hidden
                      color="var(--primary)"
                      size="xs"
                      className="shrink-0"
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
                            aria-pressed={isChildSelected}
                            onClick={() => handleCategoryToggle(child.slug)}
                            className="w-full flex items-center gap-2 cursor-pointer group hover:text-primary transition-colors text-sm"
                          >
                            <MantineCheckbox.Indicator
                              checked={isChildSelected}
                              aria-hidden
                              color="var(--primary)"
                              size="xs"
                              className="shrink-0"
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
                aria-pressed={selectedBrands.includes(brand.name)}
                onClick={() => handleBrandToggle(brand.name)}
                className="w-full flex items-center gap-2 cursor-pointer group hover:text-primary transition-colors text-sm"
              >
                <MantineCheckbox.Indicator
                  checked={selectedBrands.includes(brand.name)}
                  aria-hidden
                  color="var(--primary)"
                  size="xs"
                  className="shrink-0"
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
              className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors"
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
              className="w-full px-3 py-2 text-sm border-2 border-border rounded-lg bg-background focus:outline-none focus:border-primary transition-colors"
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

      {/* Safety Filters */}
      {safetyFacets && (safetyFacets.isBpaFree > 0 || safetyFacets.isOrganic > 0 || safetyFacets.isHypoallergenic > 0) && (
        <AccordionSection title="Safety & Ingredients">
          <div className="space-y-1">
            {safetyFacets.isBpaFree > 0 && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <Checkbox
                  checked={selectedIsBpaFree}
                  onCheckedChange={() => onSafetyChange?.({ isBpaFree: !selectedIsBpaFree })}
                />
                <span className="text-sm flex-1">BPA-Free</span>
                <span className="text-xs text-muted-foreground">({safetyFacets.isBpaFree})</span>
              </label>
            )}
            {safetyFacets.isOrganic > 0 && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <Checkbox
                  checked={selectedIsOrganic}
                  onCheckedChange={() => onSafetyChange?.({ isOrganic: !selectedIsOrganic })}
                />
                <span className="text-sm flex-1">Organic</span>
                <span className="text-xs text-muted-foreground">({safetyFacets.isOrganic})</span>
              </label>
            )}
            {safetyFacets.isHypoallergenic > 0 && (
              <label className="flex items-center gap-2 cursor-pointer group">
                <Checkbox
                  checked={selectedIsHypoallergenic}
                  onCheckedChange={() => onSafetyChange?.({ isHypoallergenic: !selectedIsHypoallergenic })}
                />
                <span className="text-sm flex-1">Hypoallergenic</span>
                <span className="text-xs text-muted-foreground">({safetyFacets.isHypoallergenic})</span>
              </label>
            )}
          </div>
        </AccordionSection>
      )}

      {/* Rating */}
      {showRating && onRatingChange && (
        <AccordionSection title={t("catalog.rating")} defaultOpen={false}>
          <div className="space-y-3">
            {ratingOptions.map((rating) => (
              <button
                key={rating}
                aria-pressed={selectedRating === rating}
                onClick={() =>
                  onRatingChange(selectedRating === rating ? undefined : rating)
                }
                className="w-full flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity"
              >
                <MantineCheckbox.Indicator
                  checked={selectedRating === rating}
                  aria-hidden
                  color="var(--primary)"
                  size="xs"
                  className="shrink-0"
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
                aria-pressed={selectedVendors.includes(vendor.slug)}
                onClick={() => handleVendorToggle(vendor.slug)}
                className="w-full flex items-center gap-2 cursor-pointer group hover:text-primary transition-colors text-sm"
              >
                <MantineCheckbox.Indicator
                  checked={selectedVendors.includes(vendor.slug)}
                  aria-hidden
                  color="var(--primary)"
                  size="xs"
                  className="shrink-0"
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
    <Drawer
      opened={isOpen}
      onClose={onClose}
      title={t("catalog.filters")}
      position="left"
      size="85%"
      zIndex={400}
      closeButtonProps={{ "aria-label": t("common.close") }}
      overlayProps={{ backgroundOpacity: 0.6, blur: 3 }}
      transitionProps={{ duration: prefersReducedMotion ? 0 : 200 }}
      styles={{
        content: { maxWidth: 384, display: "flex", flexDirection: "column", background: "var(--background)", color: "var(--foreground)" },
        header: { background: "var(--background)", color: "var(--foreground)" },
        body: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: 0 },
      }}
    >
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <FilterSidebar {...props} className="border-0 p-0" />
      </div>
      <div className="shrink-0 p-4 border-t border-border bg-background" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}>
        <Button onClick={onClose} className="w-full">
          {t("catalog.applyFilters")}
        </Button>
      </div>
    </Drawer>
  );
}
