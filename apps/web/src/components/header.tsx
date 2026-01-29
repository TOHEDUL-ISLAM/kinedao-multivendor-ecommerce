"use client";

import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  Sun, 
  Moon, 
  Baby, // Added Baby icon import
  ChevronDown,
  MapPin,
  Phone,
  Zap,
  Sparkles,
  TrendingUp,
  Store,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
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

const categories = [
  { name: "Clothing", icon: "👶" },
  { name: "Toys", icon: "🧸" },
  { name: "Feeding", icon: "🍼" },
  { name: "Nursery", icon: "🛏️" },
  { name: "Bath & Care", icon: "🛁" },
  { name: "Safety", icon: "🔒" },
  { name: "Strollers", icon: "🚼" },
  { name: "Car Seats", icon: "🚗" },
];

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
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden rounded-full">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col gap-6 mt-6">
                    <SearchBar className="w-full" />
                    <nav className="flex flex-col gap-2">
                      {categories.map((cat) => (
                        <Button key={cat.name} variant="ghost" className="justify-start gap-2 h-12 text-base">
                          <span>{cat.icon}</span>
                          {cat.name}
                        </Button>
                      ))}
                      {!isLoggedIn && !isPending && (
                        <Button 
                          className="mt-4 rounded-full" 
                          onClick={() => setIsAuthModalOpen(true)}
                        >
                          Sign In / Sign Up
                        </Button>
                      )}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Category nav */}
        <nav className="border-t border-border bg-background/50 backdrop-blur-sm hidden md:block">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
              <DropdownMenu>
                <DropdownMenuTrigger className={cn(buttonVariants({ variant: "secondary" }), "gap-2 rounded-full font-semibold shrink-0")}>
                    <Menu className="w-4 h-4" />
                    All Categories
                    <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {categories.map((cat) => (
                    <DropdownMenuItem key={cat.name} className="gap-2 cursor-pointer">
                      <span>{cat.icon}</span>
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" className="gap-2 rounded-full shrink-0 hover:bg-baby-yellow/20 hover:text-orange-600 transition-colors">
                <Zap className="w-4 h-4 text-yellow-500" />
                Flash Deals
              </Button>

              <Button variant="ghost" className="gap-2 rounded-full shrink-0 hover:bg-baby-pink/20 hover:text-pink-600 transition-colors">
                <Sparkles className="w-4 h-4 text-pink-500" />
                New Arrivals
              </Button>

              <Button variant="ghost" className="gap-2 rounded-full shrink-0 hover:bg-baby-mint/20 hover:text-green-600 transition-colors">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Trending
              </Button>

              <Button variant="ghost" className="gap-2 rounded-full shrink-0">
                <Store className="w-4 h-4" />
                Top Vendors
              </Button>

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
