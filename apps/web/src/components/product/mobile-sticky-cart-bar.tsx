"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { formatPrice } from "@/lib/format";

interface MobileStickyCartBarProps {
  price: number;
  compareAtPrice: number | null;
  currency: string;
  isAvailable: boolean;
  onCheckout: () => void;
  isVisible: boolean;
  className?: string;
}

export function MobileStickyCartBar({
  price,
  compareAtPrice,
  currency,
  isAvailable,
  onCheckout,
  isVisible,
  className,
}: MobileStickyCartBarProps) {
  const { t, language } = useTranslation();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={cn(
            "fixed bottom-0 inset-x-0 z-40 md:hidden",
            "bg-background/95 backdrop-blur-md border-t border-border",
            "safe-bottom",
            className
          )}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            {/* Price section */}
            <div className="flex-shrink-0">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(price, currency, language)}
                </span>
                {compareAtPrice && compareAtPrice > price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(compareAtPrice, currency, language)}
                  </span>
                )}
              </div>
            </div>

            {/* Checkout button */}
            <Button
              onClick={onCheckout}
              disabled={!isAvailable}
              className="flex-1 max-w-[200px] gap-2"
              size="lg"
            >
              <CreditCard className="h-4 w-4" />
              {isAvailable ? t("cart.checkout") : t("product.outOfStock")}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
