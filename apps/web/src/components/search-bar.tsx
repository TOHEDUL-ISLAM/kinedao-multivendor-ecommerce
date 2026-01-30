"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { usePrefersReducedMotion, useIsMobile } from "@/hooks/use-media-query";
import { useNavigate } from "@tanstack/react-router";
import { formatPrice } from "@/lib/format";
import { api } from "@/lib/api-client";
import { softSpring } from "@/components/ui/motion-wrappers";
import type { SearchSuggestResponse } from "@kineDao.com/api-types/catalog";

interface SearchBarProps {
  className?: string;
  onClose?: () => void;
}

export function SearchBar({ className, onClose }: SearchBarProps) {
  const { t, language } = useTranslation();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestResponse | null>(null);
  // const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions(null);
      return;
    }

    // setIsLoading(true);
    try {
      const response = await api.search.suggest.$get({
        query: { q: searchQuery, limit: "5" },
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      // setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(query);
      }, 200);
    } else {
      setSuggestions(null);
      setIsOpen(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, fetchSuggestions]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions || !isOpen) {
      if (e.key === "Enter" && query.trim()) {
        handleSearch();
      }
      return;
    }

    const totalItems =
      suggestions.products.length +
      suggestions.categories.length +
      suggestions.vendors.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectItem(selectedIndex);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectItem = (index: number) => {
    if (!suggestions) return;

    const productCount = suggestions.products.length;
    const categoryCount = suggestions.categories.length;

    if (index < productCount) {
      // Product selected
      const product = suggestions.products[index];
      navigate({ to: "/catalog", search: { q: product.title } });
    } else if (index < productCount + categoryCount) {
      // Category selected
      const category = suggestions.categories[index - productCount];
      navigate({ to: "/catalog", search: { category: category.slug } });
    } else {
      // Vendor selected
      const vendor = suggestions.vendors[index - productCount - categoryCount];
      navigate({ to: "/catalog", search: { vendor: vendor.slug } });
    }

    setIsOpen(false);
    setQuery("");
    onClose?.();
  };

  const handleSearch = () => {
    if (query.trim()) {
      navigate({ to: "/catalog", search: { q: query.trim() } });
      setIsOpen(false);
      setQuery("");
      onClose?.();
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const hasSuggestions =
    suggestions &&
    (suggestions.products.length > 0 ||
      suggestions.categories.length > 0 ||
      suggestions.vendors.length > 0);

  let currentIndex = 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => hasSuggestions && setIsOpen(true)}
          placeholder={t("header.search.placeholder")}
          className={cn(
            "w-full h-9 sm:h-10 pl-9 pr-9 rounded-full",
            "bg-muted/50 border border-border",
            "text-sm placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-all duration-200"
          )}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && hasSuggestions && (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
            transition={softSpring}
            className={cn(
              "absolute top-full left-0 right-0 mt-2 z-50",
              "bg-card border border-border rounded-xl shadow-lg overflow-hidden",
              // Mobile: full screen overlay style
              isMobile && "fixed inset-x-4 top-auto mt-2"
            )}
          >
            <div className="max-h-[60vh] overflow-y-auto">
              {/* Products */}
              {suggestions.products.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                    Products
                  </p>
                  {suggestions.products.map((product, _idx) => {
                    const itemIndex = currentIndex++;
                    const displayTitle =
                      language === "bn" && product.titleBn ? product.titleBn : product.title;

                    return (
                      <button
                        key={product.id}
                        onClick={() => handleSelectItem(itemIndex)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                          selectedIndex === itemIndex
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-muted overflow-hidden">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{displayTitle}</p>
                          <p className="text-xs text-primary">
                            {formatPrice(product.priceAmount, product.currency, language)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Categories */}
              {suggestions.categories.length > 0 && (
                <div className="p-2 border-t border-border">
                  <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                    Categories
                  </p>
                  {suggestions.categories.map((category, _idx) => {
                    const itemIndex = currentIndex++;
                    const displayName =
                      language === "bn" && category.nameBn ? category.nameBn : category.name;

                    return (
                      <button
                        key={category.id}
                        onClick={() => handleSelectItem(itemIndex)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-left",
                          selectedIndex === itemIndex
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                      >
                        <span className="text-sm">{displayName}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Vendors */}
              {suggestions.vendors.length > 0 && (
                <div className="p-2 border-t border-border">
                  <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                    Vendors
                  </p>
                  {suggestions.vendors.map((vendor, _idx) => {
                    const itemIndex = currentIndex++;

                    return (
                      <button
                        key={vendor.id}
                        onClick={() => handleSelectItem(itemIndex)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-left",
                          selectedIndex === itemIndex
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                      >
                        <span className="text-sm">{vendor.name}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Search All */}
              {query.trim() && (
                <div className="p-2 border-t border-border">
                  <button
                    onClick={handleSearch}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                    Search for "{query}"
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}