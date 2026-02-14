"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  Heart,
  User,
  Menu,
  Sun,
  Moon,
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
import { useFavoritesStore } from "@/stores/favorites-store";
import { ensureGuestId } from "@/lib/cart-session";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useTheme } from "next-themes";
import { AuthModal } from "@/components/auth-modal";
import { LanguageToggle } from "@/components/language-toggle";
import UserMenu from "@/components/user-menu";
import { api } from "@/lib/api-client";
import { useHeaderSellerAction } from "@/hooks/use-header-seller-action";
import type { TopBarAnnouncementDTO } from "@kineDao.com/api-types/site-settings";
import { SearchBar } from "./search-bar";
import { KineDaoLogo } from "./kinedao-logo";

const TOP_BAR_ANNOUNCEMENT_QUERY_KEY = [
  "site-settings",
  "top-bar-announcement",
] as const;

async function fetchTopBarAnnouncement(): Promise<TopBarAnnouncementDTO> {
  const response = await api.siteSettings["top-bar-announcement"].$get();
  if (!response.ok) {
    throw new Error("Failed to fetch top bar announcement");
  }
  return response.json();
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { t, language } = useTranslation();
  const { theme, setTheme } = useTheme();
  const cartCount = useCartStore((state) => state.itemCount);
  const favoriteCount = useFavoritesStore((state) => state.productIds.length);
  const fetchCart = useCartStore((state) => state.fetchCart);
  const mergeGuestCart = useCartStore((state) => state.mergeGuestCart);
  const mergeGuestWishlist = useFavoritesStore((state) => state.mergeGuestToServer);

  const sellerAction = useHeaderSellerAction();
  const {
    session,
    isSessionPending,
  } = sellerAction;
  const isLoggedIn = !!session;
  const { data: announcementData } = useQuery({
    queryKey: TOP_BAR_ANNOUNCEMENT_QUERY_KEY,
    queryFn: fetchTopBarAnnouncement,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const announcementText = !announcementData
    ? t("header.freeShipping")
    : announcementData.isActive
      ? (language === "bn"
        ? announcementData.textBn || announcementData.textEn
        : announcementData.textEn || announcementData.textBn || t("header.freeShipping"))
      : "";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    ensureGuestId();
    void fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (session?.user?.id) {
      void mergeGuestCart(session.user.id);
    }
  }, [mergeGuestCart, session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      void mergeGuestWishlist(session.user.id);
    }
  }, [mergeGuestWishlist, session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) {
      void api.account.recover.$post();
    }
  }, [session?.user?.id]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-background"
      }`}>
        {/* Top bar */}
        <div className="bg-primary text-primary-foreground text-[11px] sm:text-xs">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex h-8 sm:h-9 items-center gap-2 sm:gap-3">
              <span className="flex shrink-0 items-center gap-1 whitespace-nowrap cursor-pointer hover:opacity-80">
                <MapPin className="h-3 w-3" />
                <span className="hidden sm:inline">{t("header.trackOrder")}</span>
              </span>

              <p className="min-w-0 flex-1 truncate text-center font-semibold leading-none motion-safe:animate-pulse">
                {announcementText || "\u00A0"}
              </p>

              <div className="hidden md:flex shrink-0 items-center gap-3 whitespace-nowrap">
                <span className="flex items-center gap-1 cursor-pointer hover:opacity-80">
                  <Phone className="h-3 w-3" />
                  {t("header.helpCenter")}
                </span>
                <Link
                  to={sellerAction.action.to}
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <Store className="h-3 w-3" />
                  {t(sellerAction.action.labelKey)}
                </Link>
                <span className="hidden xl:flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  1-800-BABY
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main navbar */}
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <KineDaoLogo
                iconClassName="h-7 w-7 sm:h-8 sm:w-8"
                textClassName="hidden sm:block"
              />
            </Link>

            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <SearchBar className="w-full" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <LanguageToggle className="hidden sm:inline-flex" />
              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hidden sm:inline-flex rounded-full"
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Wishlist */}
              <Link to="/wishlist" className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full relative"
                  aria-label={t("header.wishlist")}
                >
                  <Heart className="w-5 h-5" />
                  {favoriteCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground rounded-full">
                      {favoriteCount > 9 ? "9+" : favoriteCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Notifications */}
              {isLoggedIn ? (
                <div className="hidden sm:block">
                  <NotificationBell />
                </div>
              ) : null}

              {/* Cart */}
              <Link to="/cart" className="hidden sm:block"> 
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground rounded-full">
                      {cartCount > 9 ? "9+" : cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Account */}
              {isSessionPending ? (
                 <Skeleton className="h-9 w-9 sm:h-10 sm:w-24 rounded-full" />
              ) : isLoggedIn ? (
                <UserMenu />
              ) : (
                <Button
                  variant="outline"
                  className="hidden sm:flex gap-2 rounded-full"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  <User className="w-4 h-4" />
                  {t("header.account")}
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
                  {t("home.flashDeals")}
                </Button>
              </Link>

              <Link to="/catalog" search={{ sort: "newest" }}>
                <Button variant="ghost" className="gap-2 rounded-full shrink-0 hover:bg-baby-pink/20 hover:text-pink-600 transition-colors">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  {t("nav.newArrivals")}
                </Button>
              </Link>

              <Link to="/catalog" search={{ sort: "bestseller" }}>
                <Button variant="ghost" className="gap-2 rounded-full shrink-0 hover:bg-baby-mint/20 hover:text-green-600 transition-colors">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  {t("nav.trending")}
                </Button>
              </Link>

              <Link to="/catalog">
                <Button variant="ghost" className="gap-2 rounded-full shrink-0">
                  <Store className="w-4 h-4" />
                  {t("nav.topVendors")}
                </Button>
              </Link>

              <div className="flex-1" />
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
