"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/i18n/use-language";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, toggle } = useLanguage();
  const isEnglish = language === "en";

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-1.5 py-1 text-[10px] sm:text-[11px] font-medium text-foreground shadow-[0_4px_16px_-10px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all hover:bg-accent/35 hover:border-border focus-ring",
        className
      )}
      aria-label={`Switch to ${language === "en" ? "Bangla" : "English"}`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-card/90 text-primary shadow-sm ring-1 ring-border/70">
        <Languages className="h-3.5 w-3.5" />
      </span>
      <span className="relative flex items-center rounded-full bg-muted/65 p-0.5">
        <span
          className={cn(
            "relative z-10 min-w-8 px-2 py-0.5 text-center rounded-full transition-colors",
            isEnglish
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          EN
        </span>
        <span
          className={cn(
            "relative z-10 min-w-8 px-2 py-0.5 text-center rounded-full transition-colors",
            !isEnglish
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          বাং
        </span>
      </span>
    </button>
  );
}
