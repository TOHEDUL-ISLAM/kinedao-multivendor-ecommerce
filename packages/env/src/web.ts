import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// Robustly get the environment object, handling Vite (import.meta.env) and Node (process.env)
const getRuntimeEnv = () => {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env;
  }
  if (typeof process !== "undefined" && process.env) {
    return process.env;
  }
  return {};
};

const runtimeEnv = getRuntimeEnv();

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.string().min(1).url(),
    VITE_ADMIN_FRONTEND_URL: z.string().url().optional(),
  },
  // We explicitly map the values to ensure they are available even if the proxy doesn't work as expected in all environments
  runtimeEnv: {
    VITE_SERVER_URL: runtimeEnv.VITE_SERVER_URL || "http://localhost:3000",
    VITE_ADMIN_FRONTEND_URL: runtimeEnv.VITE_ADMIN_FRONTEND_URL,
  },
  emptyStringAsUndefined: true,
});
