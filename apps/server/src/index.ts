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
import { bannersRouter } from "./routes/banners";
import { openAPIRouteHandler } from 'hono-openapi';

export type AppEnv = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
  };
};
// Create main app with method chaining for RPC
const app = new Hono<AppEnv>()
  .use(logger())
  .use("*", async (c, next) => {
    try {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      c.set("user", session?.user ?? null);
    } catch {
      c.set("user", null);
    }
    await next();
  })
  .use(secureHeaders())
  .use(
    "/*",
    cors({
      origin: env.CORS_ORIGIN,
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
  .route("/api/banners", bannersRouter)
  // Health check
  .get("/", (c) => c.text("OK"))
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

// Export app type for RPC client
export type AppType = typeof app;
export default app;
