import { auth } from "@kineDao.com/auth";
import { env } from "@kineDao.com/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from 'hono/secure-headers'
import { Scalar } from '@scalar/hono-api-reference'
// Import route modules
import { homeRouter } from "./routes/home";
import { catalogRouter } from "./routes/catalog";
import { categoriesRouter } from "./routes/categories";
import { productsRouter } from "./routes/products";
import { searchRouter } from "./routes/search";
import { authRouter } from "./routes/auth";
import { newsletterRouter } from "./routes/newsletter";
import { categoryRouter } from "./routes/category";
import { recommendationsRouter } from "./routes/recommendations";
import { cartRouter } from "./routes/cart";
import { vendorRouter } from "./routes/vendor";
import { uploadRouter } from "./routes/upload";
import { shippingAddressesRouter } from "./routes/shipping-addresses";
import { ordersRouter } from "./routes/orders";
import { vendorDashboardRouter } from "./routes/vendor-dashboard";
import { adminRouter } from "./routes/admin";
import { adminManagementRouter } from "./routes/admin-management";
import { bannersRouter } from "./routes/banners";
import { notificationsRouter } from "./routes/notifications";
import { wishlistRouter } from "./routes/wishlist";
import { accountRouter } from "./routes/account";
import { reviewsRouter } from "./routes/reviews";
import { vendorDashboardReviewsRouter } from "./routes/vendor-dashboard-reviews";
import { adminReviewsRouter } from "./routes/admin-reviews";
import { siteSettingsRouter } from "./routes/site-settings";
import { openAPIRouteHandler } from 'hono-openapi';
import { db } from "@kineDao.com/db";
import { user } from "@kineDao.com/db/schema/auth";
import { and, eq, isNotNull, lt } from "drizzle-orm";

const normalizeOrigin = (value: string) => value.replace(/\/+$/, "");

const getAllowedCorsOrigins = () => {
  return [normalizeOrigin(env.WEB_ORIGIN)];
};

const allowedCorsOrigins = getAllowedCorsOrigins();

export type AppEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
  };
};
// Create main app with method chaining for RPC
export const app = new Hono<AppEnv>()
  .use(logger())
  .use("*", async (c, next) => {
    // Hosting probes this endpoint while the database may be unavailable.
    // A liveness check must not depend on sessions or Postgres.
    if (c.req.path === "/healthz") {
      await next();
      return;
    }

    try {
      const now = new Date();
      await db
        .delete(user)
        .where(
          and(
            isNotNull(user.deletedAt),
            isNotNull(user.recoverUntil),
            lt(user.recoverUntil, now),
          ),
        );

      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      if (session) {
        const dbUser = await db
          .select({
            id: user.id,
            deletedAt: user.deletedAt,
            recoverUntil: user.recoverUntil,
          })
          .from(user)
          .where(eq(user.id, session.user.id))
          .limit(1);

        const currentUser = dbUser[0];
        if (!currentUser) {
          c.set("user", null);
          await next();
          return;
        }

        // Recover account automatically if user signs in again within 14-day window.
        if (
          currentUser.deletedAt &&
          currentUser.recoverUntil &&
          currentUser.recoverUntil >= now
        ) {
          await db
            .update(user)
            .set({ deletedAt: null, recoverUntil: null, updatedAt: now })
            .where(eq(user.id, currentUser.id));
        }

        // Purge account lazily after recovery window expires.
        if (
          currentUser.deletedAt &&
          currentUser.recoverUntil &&
          currentUser.recoverUntil < now
        ) {
          await db.delete(user).where(eq(user.id, currentUser.id));
          c.set("user", null);
          await next();
          return;
        }

        console.log(`[Session] Found session for user: ${session.user.email}`);
      } else {
        console.log("[Session] No session found for request");
      }
      c.set("user", session?.user ?? null);
    } catch (error) {
      console.error("[Session] Error retrieving session:", error);
      c.set("user", null);
    }
    await next();
  })
  .use(secureHeaders())
  .use(
    "/*",
    cors({
      origin: allowedCorsOrigins,
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization", "x-guest-id"],
      credentials: true,
    })
  )
  // Mount API routes
  .route("/api/auth", authRouter)
  .route("/api/home", homeRouter)
  .route("/api/catalog", catalogRouter)
  .route("/api/categories", categoriesRouter)
  .route("/api/products", productsRouter)
  .route("/api/search", searchRouter)
  .route("/api/newsletter", newsletterRouter)
  .route("/api/category", categoryRouter)
  .route("/api/recommendations", recommendationsRouter)
  .route("/api/cart", cartRouter)
  .route("/api/vendor", vendorRouter)
  .route("/api/upload", uploadRouter)
  .route("/api/shipping-addresses", shippingAddressesRouter)
  .route("/api/orders", ordersRouter)
  .route("/api/vendor-dashboard", vendorDashboardRouter)
  .route("/api/admin", adminRouter)
  .route("/api/admin-management", adminManagementRouter)
  .route("/api/banners", bannersRouter)
  .route("/api/site-settings", siteSettingsRouter)
  .route("/api/notifications", notificationsRouter)
  .route("/api/wishlist", wishlistRouter)
  .route("/api/account", accountRouter)
  .route("/api/reviews", reviewsRouter)
  .route("/api/vendor-dashboard", vendorDashboardReviewsRouter)
  .route("/api/admin", adminReviewsRouter)
  // Health check
  .get("/", (c) => c.text("OK"))
  .get("/healthz", (c) => c.text("OK"))
  .on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))

app.get(
  '/openapi',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'KineDao API',
        version: '1.0.0',
        description: 'কিনেদাও (KineDao.com) - Multivendor baby products marketplace API with bilingual support (Bangla/English)',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Local Development Server' },
      ],
    },
  })
);

// Scalar API Documentation UI
app.get(
  '/docs',
  Scalar({
    url: '/openapi',
    theme: 'purple',
  })
);

console.log(`[BOOT] SMTP Email configured via ${env.SMTP_HOST} (From: ${env.EMAIL_FROM})`);

// Export app type for RPC client
export type AppType = typeof app;

export default {
  port: env.PORT || 3000,
  hostname: '0.0.0.0',
  fetch: app.fetch,
};

// Graceful shutdown handling
import { closeAllSSEConnections } from "./lib/notification-service";

process.on("SIGTERM", async () => {
  console.log("[BOOT] SIGTERM received, shutting down gracefully...");
  await closeAllSSEConnections();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[BOOT] SIGINT received, shutting down gracefully...");
  await closeAllSSEConnections();
  process.exit(0);
});
