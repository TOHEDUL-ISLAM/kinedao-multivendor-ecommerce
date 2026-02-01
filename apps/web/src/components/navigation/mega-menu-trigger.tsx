"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Menu, ChevronDown } from "lucide-react";

interface MegaMenuTriggerProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick?: () => void;
}

export const MegaMenuTrigger = forwardRef<
  HTMLButtonElement,
  MegaMenuTriggerProps
>(({ isOpen, onMouseEnter, onMouseLeave, onClick }, ref) => {
  const { t } = useTranslation();

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        buttonVariants({ variant: "secondary" }),
        "gap-2 rounded-full font-semibold shrink-0",
        isOpen && "bg-accent"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      <Menu className="w-4 h-4" />
      {t("common.all")} {t("catalog.categories")}
      <ChevronDown
        className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  );
});

MegaMenuTrigger.displayName = "MegaMenuTrigger";
