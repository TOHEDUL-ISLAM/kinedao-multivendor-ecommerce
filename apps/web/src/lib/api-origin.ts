import { env } from "@/lib/env";

const isBrowser = typeof window !== "undefined";
const isProduction = import.meta.env.PROD;

/**
 * Browser traffic uses Vercel's same-origin `/api` rewrite in production so
 * authentication cookies, RPC calls, and SSE requests share one origin.
 * SSR and local development connect directly to the Hono service.
 */
export function getApiOrigin(): string {
  return isBrowser && isProduction
    ? window.location.origin
    : env.VITE_SERVER_URL.replace(/\/+$/, "");
}
