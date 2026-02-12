import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Language, TranslationKey } from "./translations";
import { formatTranslation, getTranslation } from "./translations";

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "en";

  try {
    const raw = window.localStorage.getItem("kinedao-language");
    if (!raw) return "en";

    const parsed = JSON.parse(raw) as {
      state?: { language?: Language };
    };

    const storedLanguage = parsed?.state?.language;
    return storedLanguage === "bn" || storedLanguage === "en" ? storedLanguage : "en";
  } catch {
    return "en";
  }
}

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
  toggle: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const useLanguage = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: getInitialLanguage(),

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
