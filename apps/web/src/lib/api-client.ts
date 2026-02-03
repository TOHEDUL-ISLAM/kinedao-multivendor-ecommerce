import { hc } from "hono/client";
import type { AppType } from "../../../../apps/server/src/index";
import { env } from "./env";

// Create typed RPC client
export const apiClient = hc<AppType>(env.VITE_SERVER_URL);

// Export convenient API object for easy access
export const api = {
  home: apiClient.api.home,
  catalog: apiClient.api.catalog,
  categories: apiClient.api.categories,
  products: apiClient.api.products,
  search: apiClient.api.search,
  newsletter: apiClient.api.newsletter,
  category: apiClient.api.category,
  auth: apiClient.api.auth,
  recommendations: apiClient.api.recommendations,
  cart: apiClient.api.cart,
  vendor: apiClient.api.vendor,
  upload: apiClient.api.upload,
};
