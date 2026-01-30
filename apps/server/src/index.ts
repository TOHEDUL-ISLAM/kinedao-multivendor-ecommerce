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

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Auth routes (custom controllers first)
app.route("/api/auth", authRouter);
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// API routes
app.route("/api/home", homeRouter);
app.route("/api/catalog", catalogRouter);
app.route("/api/categories", categoriesRouter);
app.route("/api/products", productsRouter);
app.route("/api/search", searchRouter);
app.route("/api/newsletter", newsletterRouter);
app.route("/api/category", categoryRouter);

// Health check
app.get("/", (c) => {
  return c.text("OK");
});

export default app;
