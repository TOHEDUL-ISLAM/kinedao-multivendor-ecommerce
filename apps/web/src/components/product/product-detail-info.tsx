"use client";

import { Star, BadgeCheck, MapPin, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { formatPrice, formatRating, calculateDiscountPercent } from "@/lib/format";
import { QuantitySelector } from "./quantity-selector";
import { BabySafetySection } from "./baby-safety-section";
import type { ProductDetailDTO } from "@kineDao.com/api-types/catalog";

interface ProductDetailInfoProps {
  product: ProductDetailDTO;
  selectedOptions: Record<string, string>;
  onOptionChange: (optionName: string, value: string) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onAddToCart: () => void;
  onCheckout: () => void;
  className?: string;
}

export function ProductDetailInfo({
  product,
  selectedOptions,
  onOptionChange,
  quantity,
  onQuantityChange,
  onAddToCart,
  onCheckout,
  className,
}: ProductDetailInfoProps) {
  const { t, language } = useTranslation();

  // Find matching SKU based on selected options
  const selectedSku = product.skus.find((sku) => {
    if (!sku.optionValues) return product.skus.length === 1;
    return Object.entries(selectedOptions).every(
      ([key, value]) => sku.optionValues?.[key] === value
    );
  });

  const displayPrice = selectedSku?.priceAmount ?? product.priceAmount;
  const displayCompareAt = selectedSku?.compareAtAmount ?? product.compareAtAmount;
  const isInStock = selectedSku?.isAvailable !== false && (selectedSku?.stockQty ?? 0) > 0;
  const stockQty = selectedSku?.stockQty ?? 0;
  const discountPercent = displayCompareAt
    ? calculateDiscountPercent(displayCompareAt, displayPrice)
    : 0;

  const displayTitle = language === "bn" && product.titleBn ? product.titleBn : product.title;
  const displayDescription =
    language === "bn" && product.shortDescriptionBn
      ? product.shortDescriptionBn
      : product.shortDescription;

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {/* Vendor Info */}
      <div className="inline-flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Store className="h-4 w-4" />
          <span>{product.vendor.name}</span>
          {product.vendor.isVerified && (
            <BadgeCheck className="h-4 w-4 text-primary" />
          )}
        </div>
        {product.vendor.ratingAvg && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            <span>{formatRating(product.vendor.ratingAvg)}</span>
          </div>
        )}
        {product.vendor.locationCity && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{product.vendor.locationCity}</span>
          </div>
        )}
        <span className="text-xs text-muted-foreground">
          ({product.vendor.totalSales} {t("product.sales")})
        </span>
      </div>

      {/* Title */}
      <h1 id="product-title" className="text-xl sm:text-2xl md:text-3xl font-bold">
        {displayTitle}
      </h1>

      {/* Rating */}
      {product.ratingAvg !== null && product.ratingAvg > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < Math.floor(product.ratingAvg || 0)
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <span className="text-sm font-medium">{formatRating(product.ratingAvg)}</span>
          <span className="text-sm text-muted-foreground">
            ({product.ratingCount} {t("product.reviews")})
          </span>
        </div>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-primary">
          {formatPrice(displayPrice, product.currency, language)}
        </span>
        {displayCompareAt && displayCompareAt > displayPrice && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(displayCompareAt, product.currency, language)}
            </span>
            {discountPercent > 0 && (
              <Badge variant="destructive" className="rounded-full">
                -{discountPercent}% {t("product.off")}
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Short Description */}
      {displayDescription && (
        <p className="text-muted-foreground">{displayDescription}</p>
      )}

      {/* Stock Status */}
      <div>
        {isInStock ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              {stockQty <= 5
                ? t("quickView.stockLow", { count: stockQty })
                : t("quickView.stock")}
            </span>
            {selectedSku?.sku && (
              <span className="text-xs text-muted-foreground">
                {t("quickView.sku")}: {selectedSku.sku}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-destructive">{t("product.outOfStock")}</span>
        )}
      </div>

      {/* Options */}
      {product.options.length > 0 && (
        <div className="space-y-4">
          {product.options.map((option) => {
            const displayName =
              language === "bn" && option.nameBn ? option.nameBn : option.name;
            const values = option.values || [];
            const displayValues =
              language === "bn" && option.valuesBn ? option.valuesBn : values;

            return (
              <div key={option.id}>
                <label className="block text-sm font-medium mb-2">
                  {displayName}
                </label>
                <div className="flex flex-wrap gap-2">
                  {values.map((value, index) => (
                    <button
                      key={value}
                      onClick={() => onOptionChange(option.name, value)}
                      className={cn(
                        "px-4 py-2 text-sm rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        selectedOptions[option.name] === value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {displayValues?.[index] || value}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quantity and Actions */}
      <div className="flex flex-col gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{t("quickView.quantity")}</span>
          <QuantitySelector
            quantity={quantity}
            onQuantityChange={onQuantityChange}
            min={1}
            max={stockQty || 99}
            disabled={!isInStock}
          />
        </div>
        <div className="flex flex-row gap-2 sm:gap-3">
          <Button
            onClick={onAddToCart}
            disabled={!isInStock}
            variant="secondary"
            className="flex-1 min-w-0"
          >
            {isInStock ? t("product.addToCart") : t("product.outOfStock")}
          </Button>
          <Button
            onClick={onCheckout}
            disabled={!isInStock}
            className="flex-1 min-w-0"
          >
            {isInStock ? t("product.buyNow") : t("product.outOfStock")}
          </Button>
        </div>
      </div>

      {/* Baby Safety Section */}
      <div className="pt-4 border-t border-border">
        <BabySafetySection
          ageRange={product.ageRange}
          isBpaFree={product.isBpaFree}
          isOrganic={product.isOrganic}
          isHypoallergenic={product.isHypoallergenic}
          hasSmallParts={product.hasSmallParts}
          safetyWarningEn={product.safetyWarningEn}
          safetyWarningBn={product.safetyWarningBn}
          weightLimitKg={product.weightLimitKg}
          expiryDate={product.expiryDate}
          safetyCertifications={product.safetyCertifications}
        />
      </div>
    </div>
  );
}
