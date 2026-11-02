import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Language, TranslationKey } from "./translations";
import { formatTranslation, getTranslation } from "./translations";

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
  toggle: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: "en",

      setLanguage: (language: Language) => {
        set({ language });
      },

      toggle: () => {
        set((state) => ({
          language: state.language === "en" ? "bn" : "en",
        }));
      },

      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        const { language } = get();
        const text = getTranslation(language, key);

        if (params) {
          return formatTranslation(text, params);
        }

        return text;
      },
    }),
    {
      name: "kinedao-language", // localStorage key (unified with language-store)
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
    }
  )
);
