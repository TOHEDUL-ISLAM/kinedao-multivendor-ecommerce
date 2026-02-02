"use client";

import { Heart, Star, ShoppingCart, Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useCartStore } from "@/stores/cart-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useQuickViewStore } from "@/stores/quick-view-store";
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

  const isFav = isFavorite(product.id);
  const discountPercent = product.compareAtAmount
    ? calculateDiscountPercent(product.compareAtAmount, product.priceAmount)
    : 0;

  const displayTitle = language === "bn" && product.titleBn ? product.titleBn : product.title;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.isAvailable) return;

    addToCart({
      productId: product.id,
      skuId: product.id,
      title: product.title,
      imageUrl: product.imageUrl,
      priceAmount: product.priceAmount,
      currency: product.currency,
      optionValues: null,
    });

    toast.success(t("cart.itemAdded"));
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggleFavorite(product.id);
    toast.success(added ? t("favorites.added") : t("favorites.removed"));
  };

  return (
    <div className="group bg-card rounded-2xl overflow-hidden product-card shadow-sm border border-border/50 hover:shadow-lg transition-all duration-300">
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
              NEW
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
            e.stopPropagation();
            openQuickView(product.id);
          }}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Quick add overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
           {/* Mobile usually needs always visible buttons, but following the design: */}
           <Button 
            className="w-full rounded-full gap-2 bg-white text-black hover:bg-gray-100"
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
          >
            <ShoppingCart className="w-4 h-4" />
            {product.isAvailable ? t("product.addToCart") : t("product.outOfStock")}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
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

        {/* Stock status */}
        {product.isAvailable && (
          <div className="flex items-center gap-1 text-xs text-green-600 mb-3">
            <Check className="w-3 h-3" />
            In Stock
          </div>
        )}

        {/* Action buttons (Visible on mobile/tablet or duplicate of hover?) 
            The design had them. I'll include them for better UX especially on touch devices.
        */}
        <div className="flex gap-2 mt-3 lg:hidden">
          <Button 
            className="flex-1 rounded-full text-xs h-8"
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
          >
            Buy Now
          </Button>
          <Button 
            variant="outline" 
            className="rounded-full text-xs h-8 w-8 p-0"
            onClick={handleAddToCart}
            disabled={!product.isAvailable}
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
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
