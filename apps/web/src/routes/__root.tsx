import { HeadContent, Outlet, Scripts, ScrollRestoration, createRootRouteWithContext, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { ReactLenis, useLenis } from "@studio-freight/react-lenis";
import { MantineProvider } from "@mantine/core";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";
import { QuickViewModal } from "@/components/quick-view-modal";
import { ClientOnly } from "@/components/client-only";

import Header from "../components/header";
import Footer from "../components/footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import appCss from "../index.css?url";

export interface RouterAppContext {}

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: "KineDao - Baby Products Marketplace",
      },
      {
        name: "description",
        content: "Bangladesh's premier multivendor baby products marketplace. Shop the best quality baby essentials with fast delivery.",
      },
      {
        name: "theme-color",
        content: "#3b9b8f",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://unpkg.com/@mantine/core@8.3.14/styles.css",
      },
      {
        rel: "stylesheet",
        href: "https://unpkg.com/@mantine/dates@8.3.14/styles.css",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),

  component: RootDocument,
});

function MantineThemeBridge({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const forceColorScheme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <MantineProvider
      forceColorScheme={forceColorScheme}
      theme={{
        components: {
          Select: {
            defaultProps: {
              withScrollArea: false,
              maxDropdownHeight: 280,
              comboboxProps: { withinPortal: true, zIndex: 400 },
            },
          },
          MultiSelect: {
            defaultProps: {
              withScrollArea: false,
              maxDropdownHeight: 280,
              comboboxProps: { withinPortal: true, zIndex: 400 },
            },
          },
        },
      }}
    >
      {children}
    </MantineProvider>
  );
}

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, lenis]);

  return null;
}

function RootDocument() {
  const location = useLocation();
  const locationHref =
    typeof (location as { href?: unknown }).href === "string"
      ? ((location as { href: string }).href)
      : location.pathname;
  const isVendorLogin = location.pathname === "/login" &&
    /(?:\?|&)portal=vendor(?:&|$)/.test(locationHref);
  const isVendorForm = location.pathname === "/vendor/apply/form";
  const isVendorDashboard = location.pathname.startsWith("/vendor/") &&
    !location.pathname.startsWith("/vendor/apply");
  const isAdminPanel = location.pathname.startsWith("/admin");
  const hideMainChrome = isVendorLogin || isVendorForm || isVendorDashboard || isAdminPanel;
  const lenisOptions = {
    lerp: 0.1,
    duration: 1.2,
    allowNestedScroll: true,
    prevent: (node: Node) => {
      if (!(node instanceof HTMLElement)) return false;
      return Boolean(
        node.closest(
          [
            "[data-lenis-prevent]",
            ".mantine-Combobox-dropdown",
            ".mantine-Select-dropdown",
            ".mantine-MultiSelect-dropdown",
            "[role='listbox']",
          ].join(","),
        ),
      );
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <MantineThemeBridge>
            <QueryClientProvider client={queryClient}>
              <ClientOnly
                fallback={
                  <div className="min-h-svh flex flex-col">
                    {!hideMainChrome && <Header />}
                    <main className={`flex-1 ${!hideMainChrome ? "pb-16 md:pb-0" : ""}`}>
                      <Outlet />
                    </main>
                    {!hideMainChrome && <Footer />}
                    {!hideMainChrome && <MobileBottomNav />}
                  </div>
                }
              >
                <ReactLenis root options={lenisOptions}>
                  <ScrollToTopOnNavigate />
                  <div className="min-h-svh flex flex-col">
                    {!hideMainChrome && <Header />}
                    <main className={`flex-1 ${!hideMainChrome ? "pb-16 md:pb-0" : ""}`}>
                      <Outlet />
                    </main>
                    {!hideMainChrome && <Footer />}
                    {!hideMainChrome && <MobileBottomNav />}
                  </div>

                  {/* Global Modals */}
                  <QuickViewModal />

                  <Toaster richColors position="bottom-right" expand={true} />
                </ReactLenis>
              </ClientOnly>
            </QueryClientProvider>
          </MantineThemeBridge>
        </ThemeProvider>

        <TanStackRouterDevtools position="bottom-left" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
