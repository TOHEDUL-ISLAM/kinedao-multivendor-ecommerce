"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Star, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { useQuickViewStore } from "@/stores/quick-view-store";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice, formatRating } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Overlay, softSpring } from "@/components/ui/motion-wrappers";
import { api } from "@/lib/api-client";
import type { ProductQuickViewDTO } from "@kineDao.com/api-types/catalog";

type ProductQuickViewData = ProductQuickViewDTO;

export function QuickViewModal() {
  const { t, language } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();
  // const isMobile = useIsMobile();
  const { isOpen, productId, close } = useQuickViewStore();
  const addToCart = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<ProductQuickViewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch product data
  useEffect(() => {
    if (!isOpen || !productId) {
      setProduct(null);
      setSelectedOptions({});
      setQuantity(1);
      setCurrentImageIndex(0);
      return;
    }

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.products[":id"]["quick-view"].$get({
          param: { id: productId },
        });
        if (!response.ok) throw new Error("Failed to fetch product");
        const data = await response.json();
        setProduct(data);

        // Set default options
        const defaults: Record<string, string> = {};
        data.options.forEach((opt) => {
          if (opt.values && opt.values.length > 0) {
            defaults[opt.name] = opt.values[0];
          }
        });
        setSelectedOptions(defaults);
      } catch (err) {
        setError("Failed to load product");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [isOpen, productId]);

  // Find matching SKU based on selected options
  const selectedSku = product?.skus.find((sku) => {
    if (!sku.optionValues) return product.skus.length === 1;
    return Object.entries(selectedOptions).every(
      ([key, value]) => sku.optionValues?.[key] === value
    );
  });

  const displayPrice = selectedSku?.priceAmount ?? product?.priceAmount ?? 0;
  const displayCompareAt = selectedSku?.compareAtAmount ?? product?.compareAtAmount;
  const isInStock = selectedSku?.isAvailable !== false && (selectedSku?.stockQty ?? 0) > 0;
  const stockQty = selectedSku?.stockQty ?? 0;

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleAddToCart = async () => {
    if (!product || !selectedSku || !isInStock) return;

    const added = await addToCart(
      { productId: product.id, skuId: selectedSku.id },
      quantity
    );
    if (added) {
      toast.success(t("cart.itemAdded"));
      close();
    } else {
      toast.error(t("cart.addFailed"));
    }
  };

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
  };

  const nextImage = () => {
    if (!product) return;
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    if (!product) return;
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const displayTitle = language === "bn" && product?.titleBn ? product.titleBn : product?.title;
  const displayDescription = language === "bn" && product?.shortDescriptionBn
    ? product.shortDescriptionBn
    : product?.shortDescription;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <Overlay
            isOpen={isOpen}
            onClick={close}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 50, scale: 0.95 }}
            transition={softSpring}
            className={cn(
              "fixed z-50 bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden",
              // Mobile: bottom sheet, full width
              "inset-x-0 bottom-0 max-h-[90vh]",
              // Desktop: centered modal
              "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
              "sm:w-full sm:max-w-4xl sm:max-h-[85vh]"
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-view-title"
          >
            {/* Close Button */}
            <button
              onClick={close}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 rounded-full bg-muted/80 hover:bg-muted transition-colors focus-ring"
              aria-label="Close"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* Content */}
            <div className="overflow-y-auto max-h-[90vh] sm:max-h-[85vh]">
              {isLoading ? (
                <QuickViewSkeleton />
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={close} variant="outline">
                    {t("common.close")}
                  </Button>
                </div>
              ) : product ? (
                <div className="flex flex-col sm:flex-row">
                  {/* Image Gallery */}
                  <div className="relative sm:w-1/2 bg-muted">
                    {/* Main Image */}
                    <div className="relative aspect-square">
                      <img
                        src={product.images[currentImageIndex]?.url || "/placeholder-product.jpg"}
                        alt={product.images[currentImageIndex]?.alt || product.title}
                        className="h-full w-full object-cover"
                      />

                      {/* Image Navigation */}
                      {product.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-card/80 shadow hover:bg-white dark:hover:bg-card transition-colors"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-card/80 shadow hover:bg-white dark:hover:bg-card transition-colors"
                            aria-label="Next image"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnails */}
                    {product.images.length > 1 && (
                      <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                        {product.images.map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => setCurrentImageIndex(index)}
                            className={cn(
                              "flex-shrink-0 h-14 w-14 sm:h-16 sm:w-16 rounded-lg overflow-hidden border-2 transition-colors",
                              index === currentImageIndex
                                ? "border-primary"
                                : "border-transparent hover:border-muted-foreground/30"
                            )}
                          >
                            <img
                              src={image.url}
                              alt={image.alt || `${product.title} ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col">
                    {/* Vendor */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {product.vendor.name}
                      </span>
                      {product.vendor.isVerified && (
                        <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>

                    {/* Title */}
                    <h2
                      id="quick-view-title"
                      className="text-lg sm:text-xl lg:text-2xl font-bold mb-2"
                    >
                      {displayTitle}
                    </h2>

                    {/* Rating */}
                    {product.ratingAvg !== null && product.ratingAvg > 0 && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="text-sm font-medium">
                          {formatRating(product.ratingAvg)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({product.ratingCount} reviews)
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-2xl sm:text-3xl font-bold text-primary">
                        {formatPrice(displayPrice, product.currency, language)}
                      </span>
                      {displayCompareAt && displayCompareAt > displayPrice && (
                        <span className="text-base sm:text-lg text-muted-foreground line-through">
                          {formatPrice(displayCompareAt, product.currency, language)}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {displayDescription && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {displayDescription}
                      </p>
                    )}

                    {/* Options */}
                    {product.options.length > 0 && (
                      <div className="space-y-4 mb-4">
                        {product.options.map((option) => {
                          const displayName = language === "bn" && option.nameBn
                            ? option.nameBn
                            : option.name;
                          const values = option.values || [];

                          return (
                            <div key={option.id}>
                              <label className="block text-sm font-medium mb-2">
                                {displayName}
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {values.map((value) => (
                                  <button
                                    key={value}
                                    onClick={() => handleOptionChange(option.name, value)}
                                    className={cn(
                                      "px-3 py-1.5 text-sm rounded-lg border transition-colors focus-ring",
                                      selectedOptions[option.name] === value
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:border-primary/50"
                                    )}
                                  >
                                    {value}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Stock Status */}
                    <div className="mb-4">
                      {isInStock ? (
                        <span className="text-sm text-success">
                          {stockQty <= 5
                            ? t("quickView.stockLow", { count: stockQty })
                            : t("quickView.stock")}
                        </span>
                      ) : (
                        <span className="text-sm text-destructive">{t("product.outOfStock")}</span>
                      )}
                    </div>

                    {/* Quantity & Add to Cart */}
                    <div className="mt-auto pt-4 border-t border-border">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm font-medium">{t("quickView.quantity")}</span>
                        <div className="flex items-center border border-border rounded-lg">
                          <button
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            className="p-2 hover:bg-muted transition-colors"
                            disabled={quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                          <button
                            onClick={() => setQuantity((q) => Math.min(stockQty || 99, q + 1))}
                            className="p-2 hover:bg-muted transition-colors"
                            disabled={quantity >= (stockQty || 99)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <Button
                        onClick={handleAddToCart}
                        disabled={!isInStock}
                        className="w-full"
                        size="lg"
                      >
                        {isInStock ? t("quickView.addToCart") : t("product.outOfStock")}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function QuickViewSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row">
      <div className="sm:w-1/2 aspect-square bg-muted animate-pulse" />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        <div className="h-7 w-3/4 bg-muted rounded animate-pulse" />
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-8 w-28 bg-muted rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-10 w-full bg-muted rounded animate-pulse mt-auto" />
      </div>
    </div>
  );
}
