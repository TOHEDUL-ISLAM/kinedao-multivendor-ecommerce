import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ShoppingCart, ShieldCheck, X, Trash2, Lock, RotateCcw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { RelatedProducts } from "@/components/product/related-products";
import { useTranslation } from "@/hooks/use-translation";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { api } from "@/lib/api-client";
import type { CartItem } from "@kineDao.com/api-types/cart";
import type { TranslationKey } from "@/lib/i18n/translations";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { t, language } = useTranslation();
  const cart = useCartStore((state) => state.cart);
  const isLoading = useCartStore((state) => state.isLoading);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const error = useCartStore((state) => state.error);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  useEffect(() => {
    void fetchCart();
  }, [fetchCart]);

  const items = cart?.items ?? [];

  const groupedItems = useMemo(() => {
    const groups = new Map<
      string,
      { vendor: CartItem["product"]["vendor"]; items: CartItem[] }
    >();
    items.forEach((item) => {
      const vendor = item.product.vendor;
      const existing = groups.get(vendor.id);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(vendor.id, { vendor, items: [item] });
      }
    });
    return Array.from(groups.values());
  }, [items]);

  const productIds = useMemo(
    () => Array.from(new Set(items.map((item) => item.product.id))),
    [items]
  );

  const { data: recommendations } = useQuery({
    queryKey: ["cart-recommendations", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return { products: [] };
      const response = await api.recommendations.cart.$get({
        query: { productIds: productIds.join(","), limit: "8" },
      });
      if (!response.ok) return { products: [] };
      return response.json();
    },
    enabled: productIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const subtotal = cart?.subtotal ?? 0;
  const shipping = 0;
  const total = subtotal + shipping;
  const currency = "BDT";

  const hasOutOfStock = items.some((item) => item.product.stock <= 0);
  const hasOverStock = items.some(
    (item) => item.product.stock > 0 && item.quantity > item.product.stock
  );
  const disableCheckout = items.length === 0 || hasOutOfStock || hasOverStock;
  const showSafetyReminder = items.some(
    (item) => item.product.ageRange || item.product.isBpaFree
  );

  if (isLoading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">{t("cart.loading")}</p>
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    if (error) {
      return (
        <div className="container mx-auto px-4 py-12 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">{t("cart.title")}</h1>
          <p className="text-muted-foreground">{t(error as TranslationKey)}</p>
          <Button onClick={() => fetchCart()}>{t("cart.retry")}</Button>
        </div>
      );
    }
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t("cart.title")}</h1>
          <p className="text-muted-foreground">{t("cart.empty")}</p>
          <p className="text-sm text-muted-foreground">{t("cart.emptyDesc")}</p>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/">{t("cart.continueShopping")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex flex-row items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("cart.title")}</h1>
        <Button variant="ghost" size="sm" className="h-9 px-2 text-sm sm:h-10 sm:px-4" asChild>
          <Link to="/">
            <span className="hidden sm:inline">{t("cart.continueShopping")}</span>
            <span className="sm:hidden">Shop</span>
          </Link>
        </Button>
      </div>

      {error && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
          <span>{t(error as TranslationKey)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCart()}
            className="w-full sm:w-auto"
          >
            {t("cart.retry")}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {groupedItems.map((group) => (
            <section key={group.vendor.id} className="space-y-4">
              <div className="rounded-lg bg-muted/30 border border-border px-4 py-2 text-sm font-medium">
                {t("cart.itemsFrom", { shop: group.vendor.shopName })}
              </div>
              <div className="space-y-4">
                {group.items.map((item) => {
                  const priceChanged = item.unitPrice !== item.product.price;
                  const isOutOfStock = item.product.stock <= 0;
                  const isOverStock =
                    item.product.stock > 0 && item.quantity > item.product.stock;
                  const isExpired =
                    item.product.expiryDate &&
                    new Date(item.product.expiryDate).getTime() < Date.now();

                  const displayTitle =
                    language === "bn" && item.product.titleBn
                      ? item.product.titleBn
                      : item.product.title;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border border-border p-4 sm:p-5",
                        isOutOfStock && "border-destructive/40 bg-destructive/5"
                      )}
                    >
                      <div className="flex flex-row gap-4 sm:gap-6 items-start">
                        <Link
                          to="/product/$slug"
                          params={{ slug: item.product.slug }}
                          className="h-20 w-20 sm:h-32 sm:w-32 rounded-lg bg-muted overflow-hidden shrink-0"
                        >
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.imageAlt ?? displayTitle}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted" />
                          )}
                        </Link>

                        <div className="flex-1 space-y-2 sm:space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1.5">
                              <Link
                                to="/product/$slug"
                                params={{ slug: item.product.slug }}
                                className="text-sm sm:text-base font-semibold hover:text-primary transition-colors line-clamp-2"
                              >
                                {displayTitle}
                              </Link>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {item.product.ageRange && (
                                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] sm:text-xs sm:px-2.5 sm:py-0.5">
                                    {item.product.ageRange}
                                  </Badge>
                                )}
                                {item.product.isBpaFree && (
                                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 px-1.5 py-0 text-[10px] sm:text-xs sm:px-2.5 sm:py-0.5">
                                    {t("product.bpaFree")}
                                  </Badge>
                                )}
                                {item.product.isOrganic && (
                                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 px-1.5 py-0 text-[10px] sm:text-xs sm:px-2.5 sm:py-0.5">
                                    {t("product.organic")}
                                  </Badge>
                                )}
                                {item.product.isHypoallergenic && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-1.5 py-0 text-[10px] sm:text-xs sm:px-2.5 sm:py-0.5">
                                    {t("product.hypoallergenic")}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 sm:h-10 sm:w-10 -mr-2 sm:mr-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
                              onClick={() => void removeItem(item.id)}
                              aria-label={t("cart.remove")}
                            >
                              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                          </div>

                          <div className="flex items-end justify-between gap-4 mt-4">
                            <QuantitySelector
                              quantity={item.quantity}
                              onQuantityChange={(qty) => updateQuantity(item.id, qty)}
                              min={1}
                              max={Math.max(item.product.stock, 1)}
                              size="md"
                              disabled={isOutOfStock}
                              exceedMessage={t("cart.onlyAvailable", { count: item.product.stock })}
                            />

                            <div className="flex flex-col items-end gap-0.5 text-right">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{t("cart.unitPrice")}:</span>
                                <span>{formatPrice(item.unitPrice, currency, language)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-base font-semibold">
                                <span>{t("cart.total")}:</span>
                                <span>{formatPrice(item.lineTotal, currency, language)}</span>
                              </div>
                            </div>
                          </div>

                          {(priceChanged || isOutOfStock || isOverStock || isExpired) && (
                            <div className="space-y-2 text-sm">
                              {priceChanged && (
                                <p className="text-amber-600">
                                  {t("cart.priceUpdated", {
                                    old: formatPrice(item.unitPrice, currency, language),
                                    new: formatPrice(item.product.price, currency, language),
                                  })}
                                </p>
                              )}
                              {isOutOfStock && (
                                <p className="text-destructive">
                                  {t("cart.outOfStock")}
                                </p>
                              )}
                              {isOverStock && (
                                <p className="text-destructive">
                                  {t("cart.onlyAvailable", {
                                    count: item.product.stock,
                                  })}
                                </p>
                              )}
                              {isExpired && (
                                <p className="text-amber-600">
                                  {t("cart.expiryWarning")}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {showSafetyReminder && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
              <ShieldCheck className="h-5 w-5 mt-0.5" />
              <span>{t("cart.safetyReminder")}</span>
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <div className="sticky top-24 space-y-4 rounded-xl border border-border p-4">
            <h2 className="text-lg font-semibold">{t("cart.orderSummary")}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                <span>{formatPrice(subtotal, currency, language)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("cart.shipping")}</span>
                <span>{t("cart.calculatedAtCheckout")}</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-base border-t border-border pt-3">
                <span>{t("cart.total")}</span>
                <span>{formatPrice(total, currency, language)}</span>
              </div>
              <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                {t("cart.codNotice")}
              </div>
            </div>
            {disableCheckout ? (
              <Button className="w-full" size="lg" disabled>
                {t("cart.checkout")}
              </Button>
            ) : (
              <Button className="w-full" size="lg" asChild>
                <Link to="/checkout">{t("cart.checkout")}</Link>
              </Button>
            )}

            <div className="grid grid-cols-3 gap-2 pt-4">
              <div className="flex flex-col items-center text-center gap-1">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground leading-tight">{t("cart.trust.secure")}</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground leading-tight">{t("cart.trust.cod")}</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground leading-tight">{t("cart.trust.returns")}</span>
              </div>
            </div>

            {hasOutOfStock && (
              <div className="flex items-start gap-2 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <span>{t("cart.checkoutBlocked")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky summary */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-border bg-background/95 backdrop-blur">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isMobileSummaryOpen}
          onClick={() => setIsMobileSummaryOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsMobileSummaryOpen((prev) => !prev);
            }
          }}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div>
            <p className="text-xs text-muted-foreground">{t("cart.total")}</p>
            <p className="text-base font-semibold">
              {formatPrice(total, currency, language)}
            </p>
          </div>
          {disableCheckout ? (
            <Button size="lg" className="h-12" disabled>
              {t("cart.checkout")}
            </Button>
          ) : (
            <Button
              size="lg"
              className="h-12"
              asChild
              onClick={(event) => event.stopPropagation()}
            >
              <Link to="/checkout">{t("cart.checkout")}</Link>
            </Button>
          )}
        </div>
        {isMobileSummaryOpen && (
          <div className="px-4 pb-4 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("cart.subtotal")}</span>
              <span>{formatPrice(subtotal, currency, language)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("cart.shipping")}</span>
              <span>{t("cart.calculatedAtCheckout")}</span>
            </div>
            <div className="flex items-center justify-between font-semibold text-base border-t border-border pt-2">
              <span>{t("cart.total")}</span>
              <span>{formatPrice(total, currency, language)}</span>
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              {t("cart.codNotice")}
            </div>
          </div>
        )}
      </div>

      {recommendations && recommendations.products.length > 0 && (
        <RelatedProducts
          products={recommendations.products}
          className="mt-12 border-t border-border pt-8"
        />
      )}
    </div>
  );
}
