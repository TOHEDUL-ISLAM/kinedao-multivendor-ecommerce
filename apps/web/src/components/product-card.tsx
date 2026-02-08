"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Star, ShoppingCart, Check, Eye, Loader2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useQuickViewStore } from "@/stores/quick-view-store";
import { api } from "@/lib/api-client";
import { formatPrice, calculateDiscountPercent, formatRating } from "@/lib/format";
import { toast } from "sonner";

export interface ProductCardData {
  id: string;
  title: string;
  titleBn: string | null;
  slug: string;
  brand: string | null;
  ageRange: string | null;
  ratingAvg: number | null;
  ratingCount: number | null;
  isNew: boolean | null;
  isHot: boolean | null;
  imageUrl: string | null;
  imageAlt: string | null;
  priceAmount: number;
  compareAtAmount: number | null;
  currency: string;
  isAvailable: boolean;
  hasVariants: boolean;
  vendor: {
    id: string;
    name: string;
    slug: string;
    isVerified: boolean | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
  index?: number;
}

export function ProductCard({ product }: ProductCardProps) {
  const { t, language } = useTranslation();
  const addToCart = useCartStore((state) => state.addItem);
  const { toggle: toggleFavorite, isFavorite } = useFavoritesStore();
  const openQuickView = useQuickViewStore((state) => state.open);
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState<"buyNow" | "addToCart" | null>(null);
  const addTimeoutRef = useRef<number | null>(null);

  const isFav = isFavorite(product.id);
  const discountPercent = product.compareAtAmount
    ? calculateDiscountPercent(product.compareAtAmount, product.priceAmount)
    : 0;

  const displayTitle = language === "bn" && product.titleBn ? product.titleBn : product.title;
  const isOutOfStock = !product.isAvailable;
  const isVariantProduct = product.hasVariants;
  const actionLabel = isOutOfStock
    ? t("product.outOfStock")
    : isVariantProduct
      ? t("product.viewOptions")
      : t("product.buyNow");

  useEffect(() => {
    return () => {
      if (addTimeoutRef.current) {
        window.clearTimeout(addTimeoutRef.current);
      }
    };
  }, []);

  const addOneToCart = async (action: "buyNow" | "addToCart"): Promise<boolean> => {
    if (loadingAction || isOutOfStock) return false;

    setLoadingAction(action);
    const startedAt = Date.now();

    try {
      const response = await api.products[":id"]["quick-view"].$get({
        param: { id: product.id },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.hasVariants) {
          // Reset loading immediately when opening quick view modal
          setLoadingAction(null);
          openQuickView(data.id);
          return false;
        }
        const availableSku = data.skus.find(
          (sku) => (sku.isAvailable ?? true) && sku.stockQty > 0
        );

        if (!availableSku) {
          toast.error(t("cart.justSoldOut"));
          return false;
        }

        const added = await addToCart(
          { productId: data.id, skuId: availableSku.id },
          1
        );
        if (added) {
          toast.success(t("cart.itemAdded"));
        } else {
          toast.error(t("cart.addFailed"));
        }
        return added;
      }

      const added = await addToCart({ productId: product.id }, 1);
      if (added) {
        toast.success(t("cart.itemAdded"));
      } else {
        toast.error(t("cart.addFailed"));
      }
      return added;
    } catch {
      const added = await addToCart({ productId: product.id }, 1);
      if (added) {
        toast.success(t("cart.itemAdded"));
      } else {
        toast.error(t("cart.addFailed"));
      }
      return added;
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 500 - elapsed);
      if (addTimeoutRef.current) {
        window.clearTimeout(addTimeoutRef.current);
      }
      addTimeoutRef.current = window.setTimeout(() => {
        setLoadingAction(null);
      }, remaining);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isVariantProduct) {
      handleViewOptions(e);
      return;
    }
    await addOneToCart("addToCart");
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isVariantProduct) {
      handleViewOptions(e);
      return;
    }
    const added = await addOneToCart("buyNow");
    if (added) {
      navigate({ to: "/cart" });
    }
  };

  const handleViewOptions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    openQuickView(product.id);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggleFavorite(product.id);
    toast.success(added ? t("favorites.added") : t("favorites.removed"));
  };

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group bg-card rounded-2xl overflow-hidden product-card shadow-sm border border-border/50 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
    >
      {/* Image container */}
      <div className="relative aspect-square bg-secondary/30 overflow-hidden">
        <img
          src={product.imageUrl || "/placeholder-product.jpg"}
          alt={product.imageAlt || product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discountPercent > 0 && (
            <Badge variant="destructive" className="rounded-full px-2">-{discountPercent}%</Badge>
          )}
          {product.isNew && (
            <Badge className="bg-baby-blue text-blue-900 hover:bg-baby-blue/90 rounded-full px-2">
              {t("product.new")}
            </Badge>
          )}
        </div>
        
        {/* Wishlist button */}
        <button 
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow-sm transition-all duration-300",
            "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0",
            isFav ? "text-red-500" : "text-gray-500 hover:text-red-500"
          )}
          onClick={handleToggleFavorite}
        >
          <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
        </button>

        {/* Quick view button */}
        <button
          className="absolute top-14 right-3 p-2 rounded-full bg-white/90 shadow-sm transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 delay-75 text-gray-500 hover:text-primary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openQuickView(product.id);
          }}
        >
          <Eye className="w-4 h-4" />
        </button>

      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-muted-foreground mb-1">{product.vendor.name}</p>
        <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
          {displayTitle}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "w-3 h-3",
                  i < Math.floor(product.ratingAvg || 0)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatRating(product.ratingAvg)}
          </span>
          <span className="text-xs text-muted-foreground">
            ({product.ratingCount || 0})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-bold text-primary">
            {formatPrice(product.priceAmount, product.currency, language)}
          </span>
          {product.compareAtAmount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compareAtAmount, product.currency, language)}
            </span>
          )}
        </div>

        {/* Stock status - always show placeholder for consistent height */}
        <div className="h-5 mb-3">
          {product.isAvailable && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Check className="w-3 h-3" />
              {t("product.inStock")}
            </div>
          )}
        </div>

        {/* Action buttons - pushed to bottom with mt-auto */}
        <div className="flex gap-1.5 sm:gap-2 mt-auto">
          <Button
            className="flex-1 rounded-full text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4 gap-1 sm:gap-2 min-w-0"
            onClick={isVariantProduct ? handleViewOptions : handleBuyNow}
            disabled={isOutOfStock || (!isVariantProduct && loadingAction !== null)}
            aria-busy={!isVariantProduct && loadingAction === "buyNow"}
          >
            {!isOutOfStock && isVariantProduct && <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
            {!isOutOfStock && !isVariantProduct && (
              <>
                {loadingAction === "buyNow" ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin shrink-0" />
                ) : (
                  <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                )}
              </>
            )}
            <span className="truncate">{actionLabel}</span>
          </Button>
          {!isVariantProduct && !isOutOfStock && (
            <Button
              variant="secondary"
              className="rounded-full h-8 w-8 sm:h-10 sm:w-10 p-0 shrink-0"
              onClick={handleAddToCart}
              disabled={isOutOfStock || loadingAction !== null}
              aria-busy={loadingAction === "addToCart"}
              aria-label={t("product.addToCart")}
            >
              {loadingAction === "addToCart" ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/50">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
        <div className="flex gap-1">
          <div className="h-3 w-3 bg-muted rounded-full animate-pulse" />
          <div className="h-3 w-3 bg-muted rounded-full animate-pulse" />
          <div className="h-3 w-3 bg-muted rounded-full animate-pulse" />
        </div>
        <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}
