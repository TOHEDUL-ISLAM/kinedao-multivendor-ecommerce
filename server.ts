import { app } from "./apps/server/src/index";

// Vercel's Bun framework preset detects this Bun.serve() entry point and
// routes incoming requests through the Hono app as a Vercel Function.
Bun.serve({
	fetch: app.fetch,
});
