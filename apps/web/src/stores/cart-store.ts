import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api-client";
import { getCartHeaders } from "@/lib/cart-session";
import type { CartItem, CartResponse } from "@kineDao.com/api-types/cart";

interface AddCartItemInput {
  productId: string;
  skuId?: string;
}

interface CartStore {
  cart: CartResponse["cart"] | null;
  itemCount: number;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  lastMergedUserId: string | null;
  fetchCart: () => Promise<void>;
  addItem: (input: AddCartItemInput, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeGuestCart: (userId: string | null | undefined) => Promise<void>;
}

const pendingUpdates = new Map<string, ReturnType<typeof setTimeout>>();

const calculateSummary = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, itemCount };
};

const applyCartState = (
  set: (partial: Partial<CartStore>) => void,
  cart: CartResponse["cart"] | null
) => {
  set({
    cart,
    itemCount: cart?.itemCount ?? 0,
  });
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: null,
      itemCount: 0,
      isLoading: false,
      isSyncing: false,
      error: null,
      lastMergedUserId: null,

      fetchCart: async () => {
        const headers = getCartHeaders();
        if (!headers) return;

        const hasCart = get().cart !== null;
        set({
          isLoading: !hasCart,
          isSyncing: hasCart,
          error: null,
        });

        try {
          const response = await api.cart.$get({ header: headers });
          if (response.status === 404) {
            applyCartState(set, null);
            set({ isLoading: false, isSyncing: false });
            return;
          }
          if (!response.ok) throw new Error("Failed to fetch cart");

          const data = await response.json();
          applyCartState(set, data.cart);
        } catch {
          set({ error: "cart.fetchFailed" });
        } finally {
          set({ isLoading: false, isSyncing: false });
        }
      },

      addItem: async (input, quantity = 1) => {
        const headers = getCartHeaders();
        if (!headers) return false;

        set({ isSyncing: true, error: null });
        try {
          const response = await api.cart.items.$post({
            header: headers,
            json: {
              productId: input.productId,
              skuId: input.skuId,
              quantity,
            },
          });
          if (!response.ok) {
            throw new Error("Failed to add item");
          }
          const data = await response.json();
          applyCartState(set, data.cart);
          return true;
        } catch {
          set({ error: "cart.addFailed" });
          return false;
        } finally {
          set({ isSyncing: false });
        }
      },

      updateQuantity: (itemId, quantity) => {
        const cart = get().cart;
        if (!cart) return;

        const item = cart.items.find((entry) => entry.id === itemId);
        if (!item) return;

        const nextQty = Math.max(1, quantity);
        const nextItems = cart.items.map((entry) =>
          entry.id === itemId
            ? { ...entry, quantity: nextQty, lineTotal: entry.unitPrice * nextQty }
            : entry
        );
        const { subtotal, itemCount } = calculateSummary(nextItems);

        set({
          cart: { ...cart, items: nextItems, subtotal, itemCount },
          itemCount,
          error: null,
        });

        const existingTimeout = pendingUpdates.get(itemId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        const timeoutId = setTimeout(async () => {
          const headers = getCartHeaders();
          if (!headers) {
            pendingUpdates.delete(itemId);
            if (pendingUpdates.size === 0) {
              set({ isSyncing: false });
            }
            return;
          }

          try {
            const response = await api.cart.items[":itemId"].$patch({
              param: { itemId },
              header: headers,
              json: { quantity: nextQty },
            });

            if (response.ok) {
              const data = await response.json();
              applyCartState(set, data.cart);
            } else {
              await get().fetchCart();
              set({ error: "cart.updateFailed" });
            }
          } catch {
            await get().fetchCart();
            set({ error: "cart.updateFailed" });
          } finally {
            pendingUpdates.delete(itemId);
            if (pendingUpdates.size === 0) {
              set({ isSyncing: false });
            }
          }
        }, 500);

        pendingUpdates.set(itemId, timeoutId);
        set({ isSyncing: true });
      },

      removeItem: async (itemId) => {
        const cart = get().cart;
        if (!cart) return;

        const pending = pendingUpdates.get(itemId);
        if (pending) {
          clearTimeout(pending);
          pendingUpdates.delete(itemId);
        }

        const nextItems = cart.items.filter((entry) => entry.id !== itemId);
        const { subtotal, itemCount } = calculateSummary(nextItems);

        set({
          cart: { ...cart, items: nextItems, subtotal, itemCount },
          itemCount,
          error: null,
        });

        const headers = getCartHeaders();
        if (!headers) return;

        set({ isSyncing: true });
        try {
          const response = await api.cart.items[":itemId"].$delete({
            param: { itemId },
            header: headers,
          });
          if (response.ok) {
            const data = await response.json();
            applyCartState(set, data.cart);
          } else {
            await get().fetchCart();
            set({ error: "cart.removeFailed" });
          }
        } catch {
          await get().fetchCart();
          set({ error: "cart.removeFailed" });
        } finally {
          set({ isSyncing: false });
        }
      },

      clearCart: async () => {
        const cart = get().cart;
        if (!cart || cart.items.length === 0) return;
        for (const item of cart.items) {
          await get().removeItem(item.id);
        }
      },

      mergeGuestCart: async (userId) => {
        if (!userId || get().lastMergedUserId === userId) return;
        const headers = getCartHeaders();
        if (!headers) return;

        set({ isSyncing: true, error: null });
        try {
          const response = await api.cart.merge.$post({ header: headers });
          if (response.ok) {
            const data = await response.json();
            applyCartState(set, data.cart);
            set({ lastMergedUserId: userId });
          } else {
            set({ error: "cart.mergeFailed" });
          }
        } catch {
          set({ error: "cart.mergeFailed" });
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: "kinedao-cart-v2",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        cart: state.cart,
        itemCount: state.itemCount,
      }),
    }
  )
);
