import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/product/quantity-selector";
import { RelatedProducts } from "@/components/product/related-products";
import { useTranslation } from "@/hooks/use-translation";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/stores/cart-store";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const { t, language } = useTranslation();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  // Get unique product IDs from cart items
  const productIds = [...new Set(items.map((item) => item.productId))];

  // Fetch cart recommendations
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
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const subtotal = items.reduce(
    (sum, item) => sum + item.priceAmount * item.quantity,
    0
  );
  const currency = items[0]?.currency ?? "BDT";
  const shipping = 0;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center space-y-3">
          <h1 className="text-2xl font-bold">{t("cart.title")}</h1>
          <p className="text-muted-foreground">{t("cart.empty")}</p>
          <p className="text-sm text-muted-foreground">{t("cart.emptyDesc")}</p>
          <Button asChild>
            <Link to="/catalog">{t("cart.continueShopping")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t("cart.title")}</h1>
        <Button variant="ghost" asChild>
          <Link to="/catalog">{t("cart.continueShopping")}</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {items.map((item) => {
            const optionSummary = item.optionValues
              ? Object.entries(item.optionValues)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(" / ")
              : null;

            return (
              <div
                key={item.skuId}
                className="flex gap-4 border-b border-border pb-6"
              >
                <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-medium">{item.title}</p>
                      {optionSummary && (
                        <p className="text-xs text-muted-foreground">{optionSummary}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.skuId)}
                    >
                      {t("cart.remove")}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <QuantitySelector
                      quantity={item.quantity}
                      onQuantityChange={(qty) => updateQuantity(item.skuId, qty)}
                      min={1}
                      max={99}
                      size="sm"
                    />
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.priceAmount, item.currency, language)}
                      </p>
                      <p className="font-semibold">
                        {formatPrice(
                          item.priceAmount * item.quantity,
                          item.currency,
                          language
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-fit space-y-3 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("cart.subtotal")}</span>
            <span>{formatPrice(subtotal, currency, language)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t("cart.shipping")}</span>
            <span>{formatPrice(shipping, currency, language)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
            <span>{t("cart.total")}</span>
            <span>{formatPrice(total, currency, language)}</span>
          </div>
          <Button className="w-full" size="lg">
            {t("cart.checkout")}
          </Button>
        </div>
      </div>

      {/* You May Also Like Section */}
      {recommendations && recommendations.products.length > 0 && (
        <RelatedProducts
          products={recommendations.products}
          className="mt-12 border-t border-border pt-8"
        />
      )}
    </div>
  );
}
