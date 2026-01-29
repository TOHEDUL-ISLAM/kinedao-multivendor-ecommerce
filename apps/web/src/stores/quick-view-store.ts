import { create } from "zustand";

interface QuickViewStore {
  isOpen: boolean;
  productId: string | null;
  open: (productId: string) => void;
  close: () => void;
}

export const useQuickViewStore = create<QuickViewStore>((set) => ({
  isOpen: false,
  productId: null,
  open: (productId) => set({ isOpen: true, productId }),
  close: () => set({ isOpen: false, productId: null }),
}));
