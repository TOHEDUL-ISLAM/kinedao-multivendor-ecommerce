import { auth } from "@kineDao.com/auth";
import { env } from "@kineDao.com/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import route modules
import { homeRouter } from "./routes/home";
import { catalogRouter } from "./routes/catalog";
import { categoriesRouter } from "./routes/categories";
import { productsRouter } from "./routes/products";
import { searchRouter } from "./routes/search";
import { authRouter } from "./routes/auth";
import { newsletterRouter } from "./routes/newsletter";
import { categoryRouter } from "./routes/category";

// Create main app with method chaining for RPC
const app = new Hono()
  .use(logger())
  .use(
    "/*",
    cors({
      origin: env.CORS_ORIGIN,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
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
  // Health check
  .get("/", (c) => c.text("OK"));

// Better-Auth handler (handled separately, not part of RPC)
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Export app type for RPC client
export type AppType = typeof app;
export default app;
