"use client";

import { motion } from "framer-motion";
import { useLanguageStore } from "@/stores/language-store";
import { usePrefersReducedMotion } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const { language, toggle } = useLanguageStore();
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <button
      onClick={toggle}
      className={cn(
        "relative flex items-center gap-0.5 rounded-full bg-gradient-to-r from-pink-100 to-blue-100 dark:from-pink-950/30 dark:to-blue-950/30 px-1 py-1 text-xs sm:text-sm font-medium transition-all hover:shadow-md focus-ring border border-pink-200 dark:border-pink-800",
        className
      )}
      aria-label={`Switch to ${language === "en" ? "Bangla" : "English"}`}
    >
      <span
        className={cn(
          "relative z-10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 font-semibold",
          language === "en"
            ? "text-white"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EN
      </span>
      <span
        className={cn(
          "relative z-10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 font-semibold",
          language === "bn"
            ? "text-white"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        বাং
      </span>

      {/* Sliding background indicator */}
      {prefersReducedMotion ? (
        <span
          className={cn(
            "absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg transition-transform duration-200",
            language === "en" ? "left-1" : "left-[calc(50%+2px)]"
          )}
        />
      ) : (
        <motion.span
          layoutId="language-indicator"
          className="absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg"
          initial={false}
          animate={{
            x: language === "en" ? 0 : "100%",
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
          style={{ left: 4 }}
        />
      )}
    </button>
  );
}
