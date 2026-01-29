import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface FavoritesStore {
  productIds: string[];
  toggle: (productId: string) => boolean; // Returns true if added, false if removed
  isFavorite: (productId: string) => boolean;
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      productIds: [],

      toggle: (productId) => {
        const isFav = get().isFavorite(productId);

        set((state) => ({
          productIds: isFav
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        }));

        return !isFav;
      },

      isFavorite: (productId) => {
        return get().productIds.includes(productId);
      },

      clear: () => set({ productIds: [] }),
    }),
    {
      name: "kinedao-favorites",
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
