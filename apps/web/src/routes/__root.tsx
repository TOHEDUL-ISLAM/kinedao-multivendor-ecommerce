import { HeadContent, Outlet, Scripts, createRootRouteWithContext, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ReactLenis } from "@studio-freight/react-lenis";

import { Toaster } from "@/components/ui/sonner";
import { QuickViewModal } from "@/components/quick-view-modal";
import { ClientOnly } from "@/components/client-only";

import Header from "../components/header";
import Footer from "../components/footer";
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

function RootDocument() {
  const location = useLocation();
  const isVendorForm = location.pathname === "/vendor/apply/form";

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
          <QueryClientProvider client={queryClient}>
            <ClientOnly
              fallback={
                <div className="min-h-svh flex flex-col">
                  {!isVendorForm && <Header />}
                  <main className="flex-1">
                    <Outlet />
                  </main>
                  {!isVendorForm && <Footer />}
                </div>
              }
            >
              <ReactLenis root options={{ lerp: 0.1, duration: 1.2 }}>
                <div className="min-h-svh flex flex-col">
                  {!isVendorForm && <Header />}
                  <main className="flex-1">
                    <Outlet />
                  </main>
                  {!isVendorForm && <Footer />}
                </div>

                {/* Global Modals */}
                <QuickViewModal />

                <Toaster richColors position="bottom-right" expand={true} />
              </ReactLenis>
            </ClientOnly>
          </QueryClientProvider>
        </ThemeProvider>

        <TanStackRouterDevtools position="bottom-left" />
        <Scripts />
      </body>
    </html>
  );
}
