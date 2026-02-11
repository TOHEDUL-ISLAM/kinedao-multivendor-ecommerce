import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Heart,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  User,
  UserCircle,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { useTranslation } from "@/hooks/use-translation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Skeleton } from "./ui/skeleton";

function getDisplayName(name: string | null | undefined, email: string): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;

  const fallbackFromEmail = email.split("@")[0]?.trim();
  return fallbackFromEmail || "Account";
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function UserMenu() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: session, isPending } = authClient.useSession();
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");

  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  if (isPending) {
    return <Skeleton className="h-10 w-32 rounded-full" />;
  }

  if (!session) {
    return null;
  }

  const displayName = getDisplayName(session.user.name, session.user.email);
  const initial = getInitial(displayName);

  const handlePointerEnter = () => {
    if (!canHover) return;

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setOpen(true);
  };

  const handlePointerLeave = () => {
    if (!canHover) return;

    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  const handleSignOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          navigate({ to: "/" });
        },
      },
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-1.5 py-1 shadow-sm transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onMouseEnter={handlePointerEnter}
          onMouseLeave={handlePointerLeave}
          aria-label={`${t("userMenu.myAccount")}: ${displayName}`}
        >
          <Avatar className="h-8 w-8 border border-primary/30">
            {session.user.image ? (
              <AvatarImage src={session.user.image} alt={displayName} />
            ) : null}
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              {initial || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>

          <span className="hidden md:flex flex-col items-start leading-tight pr-1">
            <span className="text-[11px] text-muted-foreground">{t("userMenu.welcome")}</span>
            <span className="text-sm font-semibold max-w-[150px] truncate">{displayName}</span>
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl border border-border/70 bg-card p-1.5 shadow-lg"
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
      >
        <DropdownMenuLabel className="px-3 py-2.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold truncate">{displayName}</span>
            <span className="text-xs text-muted-foreground truncate">{session.user.email}</span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/account" className="gap-2">
              <UserCircle className="h-4 w-4" />
              <span>{t("userMenu.myAccount")}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/account/orders" className="gap-2">
              <Package className="h-4 w-4" />
              <span>{t("userMenu.myOrders")}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/wishlist" className="gap-2">
              <Heart className="h-4 w-4" />
              <span>{t("userMenu.wishlist")}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/account/notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span>{t("userMenu.notifications")}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span>{t("userMenu.continueShopping")}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/account/settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span>{t("userMenu.settings")}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>{t("userMenu.signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
