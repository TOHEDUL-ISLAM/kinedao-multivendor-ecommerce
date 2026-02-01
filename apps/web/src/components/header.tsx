"use client";

import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  Sun,
  Moon,
  Baby,
  MapPin,
  Phone,
  Zap,
  Sparkles,
  TrendingUp,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MegaMenu, MegaMenuMobile } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";
import { useCartStore } from "@/stores/cart-store";
import { useTheme } from "next-themes";
import { AuthModal } from "@/components/auth-modal";
import { LanguageToggle } from "@/components/language-toggle";
import UserMenu from "@/components/user-menu";
import { authClient } from "@/lib/auth-client";
import { SearchBar } from "./search-bar";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const cartCount = useCartStore((state) => state.getItemCount());

  const { data: session, isPending } = authClient.useSession();
  const isLoggedIn = !!session;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-background"
      }`}>
        {/* Top bar */}
        <div className="bg-primary text-primary-foreground py-1 text-xs sm:text-sm">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 cursor-pointer hover:opacity-80">
                <MapPin className="w-3 h-3" />
                Track Order
              </span>
              <span className="hidden md:flex items-center gap-1 cursor-pointer hover:opacity-80">
                <Phone className="w-3 h-3" />
                Help Center
              </span>
            </div>
            <span className="font-medium animate-pulse hidden sm:inline-block">
              🎉 {t("header.freeShipping")}
            </span>
            <div className="flex items-center gap-4">
               <LanguageToggle />
              <span className="hidden md:flex items-center gap-1">
                <Phone className="w-3 h-3" />
                1-800-BABY
              </span>
            </div>
          </div>
        </div>

        {/* Main navbar */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Baby className="h-8 w-8 text-pink-500" />
              <span className="font-bold text-2xl bg-gradient-to-r from-pink-600 to-blue-600 dark:from-pink-400 dark:to-blue-400 bg-clip-text text-transparent hidden sm:block pb-1">
                কিনেদাও
              </span>
            </Link>

            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <SearchBar className="w-full" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Wishlist */}
              <Link to="/catalog">
                <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
                  <Heart className="w-5 h-5" />
                </Button>
              </Link>

              {/* Cart */}
              <Link to="/catalog"> 
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground rounded-full">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Account */}
              {isPending ? (
                 <Skeleton className="h-10 w-24 rounded-full" />
              ) : isLoggedIn ? (
                <UserMenu />
              ) : (
                <Button
                  variant="outline"
                  className="hidden sm:flex gap-2 rounded-full"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  <User className="w-4 h-4" />
                  Account
                </Button>
              )}

              {/* Mobile menu */}
              <MegaMenuMobile
                trigger={
                  <Button variant="ghost" size="icon" className="md:hidden rounded-full">
                    <Menu className="w-5 h-5" />
                  </Button>
                }
              />
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden container mx-auto px-4 pb-3">
          <SearchBar className="w-full" />
        </div>

        {/* Category nav */}
        <nav className="border-t border-border bg-background/50 backdrop-blur-sm hidden md:block">
          <div className="container mx-auto px-4 flex items-center gap-1 py-2">
            <MegaMenu />

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1">
              <Link to="/catalog" search={{ sort: "price_asc" }}>
                <Button variant="ghost" className="gap-2 rounded-full shrink-0 hover:bg-baby-yellow/20 hover:text-orange-600 transition-colors">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Flash Deals
                </Button>
              </Link>

              <Link to="/catalog" search={{ sort: "newest" }}>
                <Button variant="ghost" className="gap-2 rounded-full shrink-0 hover:bg-baby-pink/20 hover:text-pink-600 transition-colors">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  New Arrivals
                </Button>
              </Link>

              <Link to="/catalog" search={{ sort: "bestseller" }}>
                <Button variant="ghost" className="gap-2 rounded-full shrink-0 hover:bg-baby-mint/20 hover:text-green-600 transition-colors">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Trending
                </Button>
              </Link>

              <Link to="/catalog">
                <Button variant="ghost" className="gap-2 rounded-full shrink-0">
                  <Store className="w-4 h-4" />
                  Top Vendors
                </Button>
              </Link>

              <div className="flex-1" />

              <Button variant="ghost" className="gap-2 rounded-full shrink-0 text-primary font-semibold">
                ✨ কিনেদাও Choice
              </Button>
            </div>
          </div>
        </nav>
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
};
