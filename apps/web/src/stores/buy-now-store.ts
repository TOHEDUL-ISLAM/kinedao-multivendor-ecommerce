import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CartResponse } from "@kineDao.com/api-types/cart";
import type { ProductQuickViewDTO } from "@kineDao.com/api-types/catalog";

interface StartBuyNowInput {
  product: ProductQuickViewDTO;
  quantity?: number;
  skuId?: string;
}

interface BuyNowStore {
  cart: CartResponse["cart"] | null;
  startBuyNow: (input: StartBuyNowInput) => boolean;
  clearBuyNow: () => void;
}

const selectSku = (product: ProductQuickViewDTO, skuId?: string) => {
  if (skuId) {
    return product.skus.find((sku) => sku.id === skuId) ?? null;
  }

  return (
    product.skus.find((sku) => (sku.isAvailable ?? true) && sku.stockQty > 0) ??
    null
  );
};

export const useBuyNowStore = create<BuyNowStore>()(
  persist(
    (set) => ({
      cart: null,

      startBuyNow: ({ product, quantity = 1, skuId }) => {
        const selectedSku = selectSku(product, skuId);
        if (!selectedSku) return false;

        const nextQuantity = Math.max(1, Math.floor(quantity));
        if ((selectedSku.isAvailable ?? true) === false) return false;
        if (selectedSku.stockQty <= 0 || nextQuantity > selectedSku.stockQty) {
          return false;
        }

        const image = product.images[0];
        const itemId = `buy-now-${product.id}-${selectedSku.id}`;
        const unitPrice = selectedSku.priceAmount;

        set({
          cart: {
            id: `buy-now-${product.id}`,
            items: [
              {
                id: itemId,
                skuId: selectedSku.id,
                selectedOptions: selectedSku.optionValues ?? null,
                product: {
                  id: product.id,
                  title: product.title,
                  titleBn: product.titleBn,
                  slug: product.slug,
                  image: image?.url ?? product.imageUrl ?? null,
                  imageAlt: image?.alt ?? product.imageAlt ?? null,
                  price: unitPrice,
                  stock: selectedSku.stockQty,
                  vendor: {
                    id: product.vendor.id,
                    shopName: product.vendor.name,
                  },
                  ageRange: product.ageRange,
                  isBpaFree: product.isBpaFree,
                  isOrganic: product.isOrganic,
                  isHypoallergenic: product.isHypoallergenic,
                  expiryDate: product.expiryDate,
                },
                quantity: nextQuantity,
                unitPrice,
                lineTotal: unitPrice * nextQuantity,
              },
            ],
            subtotal: unitPrice * nextQuantity,
            itemCount: nextQuantity,
          },
        });

        return true;
      },

      clearBuyNow: () => {
        set({ cart: null });
      },
    }),
    {
      name: "kinedao-buy-now-v1",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }

        return sessionStorage;
      }),
      partialize: (state) => ({
        cart: state.cart,
      }),
    }
  )
);
