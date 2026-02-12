import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api-client";

interface FavoritesStore {
  productIds: string[];
  isHydrated: boolean;
  isSyncing: boolean;
  lastMergedUserId: string | null;
  setHydrated: (value: boolean) => void;
  toggleFavorite: (productId: string, isLoggedIn: boolean) => Promise<boolean>;
  isFavorite: (productId: string) => boolean;
  hydrateFromServer: () => Promise<void>;
  mergeGuestToServer: (userId: string | null | undefined) => Promise<void>;
  clear: () => void;
}

const pendingProductSync = new Set<string>();

function setSyncingState(set: (partial: Partial<FavoritesStore>) => void) {
  set({ isSyncing: pendingProductSync.size > 0 });
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      productIds: [],
      isHydrated: false,
      isSyncing: false,
      lastMergedUserId: null,

      setHydrated: (value) => set({ isHydrated: value }),

      toggleFavorite: async (productId, isLoggedIn) => {
        if (!productId) return false;

        const isFav = get().isFavorite(productId);

        // Optimistic local update for instant feedback
        set((state) => ({
          productIds: isFav
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        }));

        const nextIsFavorite = !isFav;
        if (!isLoggedIn) {
          return nextIsFavorite;
        }

        if (pendingProductSync.has(productId)) {
          return nextIsFavorite;
        }

        pendingProductSync.add(productId);
        setSyncingState(set);

        try {
          const response = nextIsFavorite
            ? await api.wishlist.items.$post({ json: { productId } })
            : await api.wishlist.items[":productId"].$delete({ param: { productId } });

          if (!response.ok) {
            throw new Error("Wishlist sync failed");
          }

          return nextIsFavorite;
        } catch {
          // Roll back optimistic change on failure
          set((state) => ({
            productIds: nextIsFavorite
              ? state.productIds.filter((id) => id !== productId)
              : [...state.productIds, productId],
          }));

          return isFav;
        } finally {
          pendingProductSync.delete(productId);
          setSyncingState(set);
        }
      },

      isFavorite: (productId) => {
        return get().productIds.includes(productId);
      },

      hydrateFromServer: async () => {
        try {
          const response = await api.wishlist.$get();
          if (!response.ok) return;

          const data = await response.json();
          set({ productIds: data.items.map((item) => item.product.id) });
        } catch {
          // Keep local state as fallback
        }
      },

      mergeGuestToServer: async (userId) => {
        if (!userId) return;

        const { lastMergedUserId, productIds } = get();
        if (lastMergedUserId === userId) {
          return;
        }

        try {
          await api.wishlist.merge.$post({
            json: { productIds },
          });

          await get().hydrateFromServer();
          set({ lastMergedUserId: userId });
        } catch {
          // Keep local state; merge can retry later
        }
      },

      clear: () => set({ productIds: [], lastMergedUserId: null }),
    }),
    {
      name: "kinedao-favorites-v2",
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
        productIds: state.productIds,
        lastMergedUserId: state.lastMergedUserId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
