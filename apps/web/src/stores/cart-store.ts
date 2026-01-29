import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  productId: string;
  skuId: string;
  title: string;
  imageUrl: string | null;
  priceAmount: number;
  currency: string;
  quantity: number;
  optionValues: Record<string, string> | null;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (skuId: string) => void;
  updateQuantity: (skuId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.skuId === item.skuId
          );

          if (existingIndex > -1) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity += quantity;
            return { items: newItems };
          }

          return {
            items: [...state.items, { ...item, quantity }],
          };
        });
      },

      removeItem: (skuId) => {
        set((state) => ({
          items: state.items.filter((i) => i.skuId !== skuId),
        }));
      },

      updateQuantity: (skuId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(skuId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.skuId === skuId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.priceAmount * item.quantity,
          0
        );
      },
    }),
    {
      name: "kinedao-cart",
      storage: createJSONStorage(() => {
        // Check if we're in a browser environment
        if (typeof window !== "undefined") {
          return localStorage;
        }
        // Return a no-op storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);
