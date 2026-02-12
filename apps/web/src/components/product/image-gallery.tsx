"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Heart, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useTranslation } from "@/hooks/use-translation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number | null;
}

interface ImageGalleryProps {
  images: ProductImage[];
  productTitle: string;
  productId?: string;
  className?: string;
}

export function ImageGallery({ images, productTitle, productId, className }: ImageGalleryProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { data: session } = authClient.useSession();
  const isFav = productId ? isFavorite(productId) : false;

  // Minimum swipe distance for navigation
  const minSwipeDistance = 50;

  const sortedImages = [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const currentImage = sortedImages[currentIndex] || { url: "/placeholder-product.jpg", alt: productTitle };

  const goToNext = useCallback(() => {
    if (sortedImages.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % sortedImages.length);
    }
  }, [sortedImages.length]);

  const goToPrev = useCallback(() => {
    if (sortedImages.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
    }
  }, [sortedImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape" && isZoomed) {
        setIsZoomed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, isZoomed]);

  // Touch handlers for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productTitle,
          url: window.location.href,
        });
      } catch {
        // User cancelled or error
      }
    }
  };

  const handleFavorite = async () => {
    if (productId) {
      const previous = isFav;
      const next = await toggleFavorite(productId, !!session);

      if (next === previous) {
        toast.error(t("wishlist.addFailed"), {
          position: "bottom-right",
        });
        return;
      }

      toast.success(next ? t("wishlist.added") : t("wishlist.removed"), {
        position: "bottom-right",
      });
    }
  };

  if (sortedImages.length === 0) {
    return (
      <div className={cn("relative aspect-square bg-muted rounded-lg overflow-hidden", className)}>
        <img
          src="/placeholder-product.jpg"
          alt={productTitle}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <>
      <div className={cn("flex flex-col lg:flex-row gap-3", className)}>
        {/* Desktop: Vertical thumbnails (left) */}
        {sortedImages.length > 1 && (
          <div className="hidden lg:flex flex-col gap-2 w-20">
            {sortedImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                  index === currentIndex
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                <img
                  src={image.url}
                  alt={image.alt || `${productTitle} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div className="flex-1 relative">
          <div
            className="relative aspect-square bg-muted rounded-lg overflow-hidden group"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={currentImage.url}
                alt={currentImage.alt || productTitle}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setIsZoomed(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </AnimatePresence>

            {/* Action buttons (top right) - Share and Favorite */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-white/90 dark:bg-card/90 shadow-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Share"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                onClick={handleFavorite}
                className={cn(
                  "p-2 rounded-full bg-white/90 dark:bg-card/90 shadow-sm transition-colors",
                  isFav ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                )}
                aria-label={isFav ? t("wishlist.remove") : t("header.wishlist")}
              >
                <Heart className={cn("h-5 w-5", isFav && "fill-current")} />
              </button>
            </div>

            {/* Image counter indicator (mobile) */}
            {sortedImages.length > 1 && (
              <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-black/50 text-white text-xs lg:hidden">
                {currentIndex + 1} / {sortedImages.length}
              </div>
            )}

            {/* Navigation arrows */}
            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrev();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-card/90 shadow-lg transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-card/90 shadow-lg transition-opacity"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile & Tablet: Horizontal thumbnail grid below */}
          {sortedImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide lg:hidden">
              {sortedImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all",
                    index === currentIndex
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <img
                    src={image.url}
                    alt={image.alt || `${productTitle} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen zoom dialog */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="fixed inset-0 !translate-x-0 !translate-y-0 !left-0 !top-0 max-w-none w-screen h-screen max-h-screen p-0 bg-black border-none rounded-none">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Main zoomed image */}
            <img
              src={currentImage.url}
              alt={currentImage.alt || productTitle}
              className="max-w-[90vw] max-h-[70vh] object-contain"
            />

            {/* Navigation in zoom view */}
            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Thumbnails in zoom view */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto">
                  {sortedImages.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        "flex-shrink-0 w-10 h-10 rounded overflow-hidden border-2 transition-all",
                        index === currentIndex
                          ? "border-white"
                          : "border-transparent opacity-60 hover:opacity-100"
                      )}
                    >
                      <img
                        src={image.url}
                        alt={image.alt || `${productTitle} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
