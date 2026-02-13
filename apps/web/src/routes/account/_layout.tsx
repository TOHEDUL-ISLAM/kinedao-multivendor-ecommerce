import { createFileRoute, Outlet, Link, redirect, useLocation } from "@tanstack/react-router";
import { Bell, ChevronRight, Package, Settings, UserCircle } from "lucide-react";
import type { ComponentType } from "react";

import { getUser } from "@/functions/get-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { getS3Url } from "@/lib/s3-helpers";

export const Route = createFileRoute("/account/_layout")({
  component: AccountLayout,
  beforeLoad: async () => {
    const session = await getUser();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: "/account" },
      });
    }
    return { session };
  },
});

function getDisplayName(name: string | null | undefined, email: string): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email.split("@")[0]?.trim();
  return local || "Customer";
}

function AccountLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { session } = Route.useRouteContext();

  const displayName = getDisplayName(session.user.name, session.user.email);
  const initial = displayName.charAt(0).toUpperCase();

  const navItems: Array<{
    to: "/account" | "/account/orders" | "/account/notifications" | "/account/settings";
    label: string;
    icon: ComponentType<{ className?: string }>;
    active: boolean;
  }> = [
    {
      to: "/account",
      label: t("userMenu.myAccount"),
      icon: UserCircle,
      active: location.pathname === "/account",
    },
    {
      to: "/account/orders",
      label: t("userMenu.myOrders"),
      icon: Package,
      active: location.pathname.startsWith("/account/orders"),
    },
    {
      to: "/account/notifications",
      label: t("userMenu.notifications"),
      icon: Bell,
      active: location.pathname.startsWith("/account/notifications"),
    },
    {
      to: "/account/settings",
      label: t("userMenu.settings"),
      icon: Settings,
      active: location.pathname.startsWith("/account/settings"),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14 border border-primary/30">
                  {session.user.image ? (
                    <AvatarImage src={getS3Url(session.user.image)} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-primary/15 text-primary font-semibold">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t("userMenu.welcome")}</p>
                  <h1 className="text-lg font-semibold truncate">{displayName}</h1>
                  <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-primary/15 shadow-sm">
            <CardContent className="p-3">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all ${
                        item.active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-foreground hover:bg-primary/5 hover:text-primary"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
