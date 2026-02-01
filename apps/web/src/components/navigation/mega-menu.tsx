"use client";

import { useRef, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useCategoryTree } from "@/hooks/use-categories";
import { useMegaMenu } from "./use-mega-menu";
import { MegaMenuTrigger } from "./mega-menu-trigger";
import { MegaMenuSidebar } from "./mega-menu-sidebar";
import { MegaMenuPanel } from "./mega-menu-panel";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryTreeNodeDTO } from "@kineDao.com/api-types/catalog";

interface MegaMenuProps {
  className?: string;
}

export function MegaMenu({ className }: MegaMenuProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: treeData, isLoading, isError } = useCategoryTree({
    maxDepth: 3,
    includeProductCount: true,
    includeFeaturedProducts: false,
  });

  const {
    isOpen,
    activeCategory,
    handleTriggerEnter,
    handleTriggerLeave,
    handleMenuEnter,
    handleMenuLeave,
    handleCategoryHover,
    handleCategoryLeave,
    closeMenu,
  } = useMegaMenu();

  const categories = treeData?.tree ?? [];

  const activeCategoryData = useMemo(() => {
    if (!activeCategory) return null;
    return categories.find((c) => c.id === activeCategory) || null;
  }, [activeCategory, categories]);

  const handleCategoryClick = useCallback(
    (category: CategoryTreeNodeDTO) => {
      navigate({
        to: "/catalog",
        search: { category: category.slug },
      });
      closeMenu();
    },
    [navigate, closeMenu]
  );

  const handleLinkClick = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

  if (isLoading) {
    return <Skeleton className="h-10 w-36 rounded-full" />;
  }

  if (isError) {
    return null;
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <MegaMenuTrigger
        isOpen={isOpen}
        onMouseEnter={handleTriggerEnter}
        onMouseLeave={handleTriggerLeave}
      />

      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 z-50 mt-1",
            "bg-popover border border-border rounded-2xl shadow-dropdown overflow-hidden overflow-y-auto",
            "w-[min(1040px,calc(100vw-2rem))] max-h-[calc(100vh-220px)]",
            "animate-slide-down"
          )}
          onMouseEnter={handleMenuEnter}
          onMouseLeave={handleMenuLeave}
        >
          <div className="flex">
            <MegaMenuSidebar
              categories={categories}
              activeCategory={activeCategory}
              onCategoryHover={handleCategoryHover}
              onCategoryLeave={handleCategoryLeave}
              onCategoryClick={handleCategoryClick}
            />
            <MegaMenuPanel
              category={activeCategoryData}
              onLinkClick={handleLinkClick}
            />
          </div>
        </div>
      )}
    </div>
  );
}
