"use client";

import { Languages } from "lucide-react";
import { useLanguageStore } from "@/stores/language-store";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, toggle } = useLanguageStore();
  const isEnglish = language === "en";

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-2 py-1 text-[11px] sm:text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-accent/50 focus-ring",
        className
      )}
      aria-label={`Switch to ${language === "en" ? "Bangla" : "English"}`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-card text-primary shadow-sm ring-1 ring-border">
        <Languages className="h-4 w-4" />
      </span>
      <span className="relative flex items-center rounded-full bg-muted/70 p-0.5">
        <span
          className={cn(
            "relative z-10 px-2.5 py-1 rounded-full transition-colors",
            isEnglish
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          EN
        </span>
        <span
          className={cn(
            "relative z-10 px-2.5 py-1 rounded-full transition-colors",
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
