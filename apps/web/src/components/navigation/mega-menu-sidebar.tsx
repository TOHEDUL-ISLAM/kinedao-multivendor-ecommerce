"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { CATEGORY_ICON_MAP } from "@/lib/category-icons";
import { ChevronRight } from "lucide-react";
import type { CategoryTreeNodeDTO } from "@kineDao.com/api-types/catalog";

interface MegaMenuSidebarProps {
  categories: CategoryTreeNodeDTO[];
  activeCategory: string | null;
  onCategoryHover: (categoryId: string) => void;
  onCategoryLeave: () => void;
  onCategoryClick: (category: CategoryTreeNodeDTO) => void;
}

// Color mapping for category icon backgrounds
const ICON_BG_COLORS = [
  "bg-baby-pink/20",
  "bg-baby-mint/20",
  "bg-baby-lavender/20",
  "bg-baby-yellow/20",
  "bg-baby-blue/20",
  "bg-baby-peach/20",
];

export function MegaMenuSidebar({
  categories,
  activeCategory,
  onCategoryHover,
  onCategoryLeave,
  onCategoryClick,
}: MegaMenuSidebarProps) {
  const { language } = useTranslation();

  return (
    <div className="w-64 shrink-0 bg-muted/30 border-r border-border p-2">
      <div className="space-y-0.5">
        {categories.map((category, index) => {
          const displayName =
            language === "bn" && category.nameBn
              ? category.nameBn
              : category.name;
          const Icon =
            CATEGORY_ICON_MAP[category.iconKey || "default"] ||
            CATEGORY_ICON_MAP.default;
          const hasChildren = category.children.length > 0;
          const isActive = activeCategory === category.id;
          const iconBgColor = ICON_BG_COLORS[index % ICON_BG_COLORS.length];

          return (
            <button
              key={category.id}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "hover:bg-background text-foreground"
              )}
              onMouseEnter={() => onCategoryHover(category.id)}
              onMouseLeave={onCategoryLeave}
              onClick={() => onCategoryClick(category)}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  isActive ? "bg-primary-foreground/20" : iconBgColor
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "" : "text-primary"
                  )}
                />
              </span>
              <span className="flex-1 text-sm font-medium truncate">
                {displayName}
              </span>
              {hasChildren && (
                <ChevronRight
                  className={cn(
                    "h-4 w-4 opacity-0 -translate-x-1 transition-all duration-200",
                    isActive
                      ? "opacity-100 translate-x-0"
                      : "group-hover:opacity-50 group-hover:translate-x-0"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
