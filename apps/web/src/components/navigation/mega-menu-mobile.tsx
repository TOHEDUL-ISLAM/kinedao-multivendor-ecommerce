"use client";

import { useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { useCategoryTree } from "@/hooks/use-categories";
import { CATEGORY_ICON_MAP } from "@/lib/category-icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, ChevronLeft, Menu } from "lucide-react";
import type { CategoryTreeNodeDTO } from "@kineDao.com/api-types/catalog";

interface MegaMenuMobileProps {
  trigger?: React.ReactNode;
}

export function MegaMenuMobile({ trigger }: MegaMenuMobileProps) {
  const { language, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [navigationStack, setNavigationStack] = useState<
    CategoryTreeNodeDTO[]
  >([]);

  const { data: treeData, isLoading, isError } = useCategoryTree({
    maxDepth: 3,
    includeProductCount: true,
    includeFeaturedProducts: false,
  });

  const categories = treeData?.tree ?? [];

  // Current level of categories to display
  const currentCategories =
    navigationStack.length > 0
      ? navigationStack[navigationStack.length - 1].children
      : categories;

  const currentParent =
    navigationStack.length > 0
      ? navigationStack[navigationStack.length - 1]
      : null;

  const handleCategoryClick = useCallback(
    (category: CategoryTreeNodeDTO) => {
      if (category.children.length > 0) {
        // Navigate deeper
        setNavigationStack((prev) => [...prev, category]);
      } else {
        // Close and navigate to catalog
        setIsOpen(false);
        setNavigationStack([]);
      }
    },
    []
  );

  const handleBack = useCallback(() => {
    setNavigationStack((prev) => prev.slice(0, -1));
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setNavigationStack([]);
  }, []);

  const getDisplayName = (category: CategoryTreeNodeDTO) =>
    language === "bn" && category.nameBn ? category.nameBn : category.name;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          {currentParent ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={handleBack}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <SheetTitle className="text-left">
                {getDisplayName(currentParent)}
              </SheetTitle>
            </div>
          ) : (
            <SheetTitle>
              {t("common.all")} {t("catalog.categories")}
            </SheetTitle>
          )}
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-4 text-center text-muted-foreground">
              {t("common.error")}
            </div>
          ) : currentCategories.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No categories available
            </div>
          ) : (
            <nav className="py-2">
              {/* View all link for current category */}
              {currentParent && (
                <Link
                  to="/catalog"
                  search={{ category: currentParent.slug }}
                  onClick={handleClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium",
                    "bg-primary/5 text-primary border-b border-border"
                  )}
                >
                  View all {getDisplayName(currentParent)}
                </Link>
              )}

              {currentCategories.map((category) => {
                const Icon =
                  CATEGORY_ICON_MAP[category.iconKey || "default"] ||
                  CATEGORY_ICON_MAP.default;
                const hasChildren = category.children.length > 0;

                return (
                  <div key={category.id}>
                    {hasChildren ? (
                      <button
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 text-sm",
                          "hover:bg-accent transition-colors text-left"
                        )}
                        onClick={() => handleCategoryClick(category)}
                      >
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="flex-1 truncate">
                          {getDisplayName(category)}
                        </span>
                        {category.productCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({category.productCount})
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ) : (
                      <Link
                        to="/catalog"
                        search={{ category: category.slug }}
                        onClick={handleClose}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 text-sm",
                          "hover:bg-accent transition-colors"
                        )}
                      >
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="flex-1 truncate">
                          {getDisplayName(category)}
                        </span>
                        {category.productCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({category.productCount})
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
