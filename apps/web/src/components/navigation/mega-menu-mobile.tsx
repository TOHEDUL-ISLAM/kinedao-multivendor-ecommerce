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
import {
  ChevronRight,
  ChevronLeft,
  Home,
  ShoppingBag,
  Sparkles,
  Zap,
  TrendingUp,
  Store,
  Settings,
  CircleHelp,
  Info,
  Phone,
  Search,
  Menu,
} from "lucide-react";
import type { CategoryTreeNodeDTO } from "@kineDao.com/api-types/catalog";

interface MegaMenuMobileProps {
  trigger?: React.ReactNode;
}

type DrawerTab = "menu" | "categories";

interface MobileMenuLink {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function MegaMenuMobile({ trigger }: MegaMenuMobileProps) {
  const { language, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>("menu");
  const [query, setQuery] = useState("");
  const [navigationStack, setNavigationStack] = useState<
    CategoryTreeNodeDTO[]
  >([]);

  const { data: treeData, isLoading, isError } = useCategoryTree({
    maxDepth: 3,
    includeProductCount: true,
    includeFeaturedProducts: false,
  });

  const categories = treeData?.tree ?? [];

  const menuItems: MobileMenuLink[] = [
    { key: "home", label: t("nav.home"), href: "/", icon: Home },
    { key: "shop", label: t("nav.shop"), href: "/catalog", icon: ShoppingBag },
    {
      key: "newArrivals",
      label: t("nav.newArrivals"),
      href: "/catalog?sort=newest",
      icon: Sparkles,
    },
    {
      key: "deals",
      label: t("nav.deals"),
      href: "/catalog?sort=price_asc",
      icon: Zap,
    },
    {
      key: "trending",
      label: t("nav.trending"),
      href: "/catalog?sort=bestseller",
      icon: TrendingUp,
    },
    { key: "vendors", label: t("header.becomeSeller"), href: "/vendor/apply", icon: Store },
    { key: "settings", label: t("userMenu.settings"), href: "/account/settings", icon: Settings },
    { key: "help", label: t("footer.helpCenter"), href: "/help", icon: CircleHelp },
    { key: "about", label: t("footer.about"), href: "/about", icon: Info },
    { key: "contact", label: t("footer.contact"), href: "/contact", icon: Phone },
  ];

  const uiText =
    language === "bn"
      ? {
          menu: "মেনু",
          categories: "ক্যাটাগরি",
          searchMenu: "মেনু খুঁজুন...",
          searchCategories: "ক্যাটাগরি খুঁজুন...",
          noMenu: "কোন মেনু আইটেম পাওয়া যায়নি",
          noMatchingCategories: "মিলে এমন কোনো ক্যাটাগরি পাওয়া যায়নি",
          noCategories: "কোনো ক্যাটাগরি পাওয়া যায়নি",
        }
      : {
          menu: "Menu",
          categories: "Categories",
          searchMenu: "Search menu...",
          searchCategories: "Search categories...",
          noMenu: "No menu items found",
          noMatchingCategories: "No matching categories",
          noCategories: "No categories available",
        };

  // Current level of categories to display
  const currentCategories =
    navigationStack.length > 0
      ? navigationStack[navigationStack.length - 1].children
      : categories;

  const currentParent =
    navigationStack.length > 0
      ? navigationStack[navigationStack.length - 1]
      : null;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMenuItems = normalizedQuery
    ? menuItems.filter((item) => item.label.toLowerCase().includes(normalizedQuery))
    : menuItems;
  const filteredCategories = normalizedQuery
    ? currentCategories.filter((category) =>
        getDisplayName(category).toLowerCase().includes(normalizedQuery)
      )
    : currentCategories;

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
    setActiveTab("menu");
    setQuery("");
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {activeTab === "categories" && currentParent ? (
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
                  {activeTab === "menu"
                    ? uiText.menu
                    : `${t("common.all")} ${t("catalog.categories")}`}
                </SheetTitle>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  activeTab === "menu" ? uiText.searchMenu : uiText.searchCategories
                }
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>

            <div className="grid grid-cols-2 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("menu");
                  setNavigationStack([]);
                }}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === "menu"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {uiText.menu}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("categories")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === "categories"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                {uiText.categories}
              </button>
            </div>
          </div>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
          {activeTab === "menu" ? (
            <nav className="py-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    onClick={handleClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm",
                      "hover:bg-accent transition-colors border-b border-border/60 last:border-b-0"
                    )}
                  >
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                  </a>
                );
              })}

              {filteredMenuItems.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {uiText.noMenu}
                </div>
              ) : null}
            </nav>
          ) : isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-4 text-center text-muted-foreground">
              {t("common.error")}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {normalizedQuery ? uiText.noMatchingCategories : uiText.noCategories}
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

              {filteredCategories.map((category) => {
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
