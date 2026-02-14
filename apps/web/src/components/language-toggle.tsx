"use client";

import { useLanguage } from "@/lib/i18n/use-language";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();
  const isEnglish = language === "en";

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={cn(
        "inline-flex items-center rounded-full border border-primary/20 bg-gradient-to-r from-baby-blue/30 via-baby-mint/25 to-baby-peach/30 p-1 text-[11px] font-semibold text-foreground shadow-[0_6px_14px_-12px_rgba(0,0,0,0.55)] backdrop-blur-sm dark:border-primary/35 dark:from-primary/20 dark:via-secondary/20 dark:to-accent/20",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setLanguage("en")}
        aria-pressed={isEnglish}
        className={cn(
          "rounded-full px-3 py-1 leading-none transition-all duration-200 focus-ring",
          isEnglish
            ? "bg-card text-primary shadow-sm ring-1 ring-primary/25"
            : "text-muted-foreground hover:bg-background/75 hover:text-foreground"
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("bn")}
        aria-pressed={!isEnglish}
        className={cn(
          "rounded-full px-3 py-1 leading-none transition-all duration-200 focus-ring",
          !isEnglish
            ? "bg-card text-primary shadow-sm ring-1 ring-primary/25"
            : "text-muted-foreground hover:bg-background/75 hover:text-foreground"
        )}
      >
        বাং
      </button>
      <span className="sr-only">
        {isEnglish ? "English selected" : "Bangla selected"}
      </span>
    </div>
  );
}
