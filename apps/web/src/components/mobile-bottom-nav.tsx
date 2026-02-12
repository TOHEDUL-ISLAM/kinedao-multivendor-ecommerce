"use client";

import { Link, useLocation } from "@tanstack/react-router";
import { Home, Heart, ShoppingCart, UserCircle } from "lucide-react";
import type { ComponentType } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

interface NavItem {
  key: "home" | "wishlist" | "cart" | "profile";
  to: "/" | "/wishlist" | "/cart" | "/account";
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive: (pathname: string) => boolean;
}

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const cartCount = useCartStore((state) => state.itemCount);

  const items: NavItem[] = [
    {
      key: "home",
      to: "/",
      label: t("nav.home"),
      icon: Home,
      isActive: (pathname) => pathname === "/",
    },
    {
      key: "wishlist",
      to: "/wishlist",
      label: t("userMenu.wishlist"),
      icon: Heart,
      isActive: (pathname) => pathname.startsWith("/wishlist"),
    },
    {
      key: "cart",
      to: "/cart",
      label: t("header.cart"),
      icon: ShoppingCart,
      isActive: (pathname) => pathname.startsWith("/cart") || pathname.startsWith("/checkout"),
    },
    {
      key: "profile",
      to: "/account",
      label: t("userMenu.myAccount"),
      icon: UserCircle,
      isActive: (pathname) =>
        pathname.startsWith("/account"),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="mx-2 mb-2 rounded-2xl border border-border/60 bg-background/70 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.45)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="grid grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.isActive(location.pathname);

          return (
            <Link
              key={item.key}
              to={item.to}
              className={cn(
                "relative m-1 flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[11px] font-medium transition-all duration-200",
                active
                  ? "bg-primary/12 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", active ? "scale-105" : "")} />
                {item.key === "cart" && cartCount > 0 ? (
                  <span className="absolute -top-2 -right-2 min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] leading-4 text-center px-1 shadow-sm">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                ) : null}
              </div>
              <span className="truncate max-w-[72px] text-center">{item.label}</span>
            </Link>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
