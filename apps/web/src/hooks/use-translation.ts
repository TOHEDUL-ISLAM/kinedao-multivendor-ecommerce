import { useLanguageStore } from "@/stores/language-store";
import { translations, type TranslationKey } from "@/lib/i18n/translations";

export function useTranslation() {
  const { language } = useLanguageStore();

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text: string = translations[language][key] || key;

    // Replace placeholders like {count} with actual values
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }

    return text;
  };

  return { t, language };
}
