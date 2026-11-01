import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

// Load the app-local `.env` first, then find a workspace-level `.env.local`.
// Neon CLI writes its branch connection strings at the workspace root, while
// this server is normally started from `apps/server`.
dotenv.config();

let currentDirectory = process.cwd();
while (true) {
  const localEnvPath = join(currentDirectory, ".env.local");
  if (existsSync(localEnvPath)) {
    dotenv.config({ path: localEnvPath, override: true, quiet: true });
    break;
  }

  const parentDirectory = resolve(currentDirectory, "..");
  if (parentDirectory === currentDirectory) break;
  currentDirectory = parentDirectory;
}

export const env = createEnv({
  clientPrefix: "",
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    WEB_ORIGIN: z.string().url(),
    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().default("auto"),
    S3_BUCKET: z.string().min(1).optional(),
    S3_PRIVATE_BUCKET: z.string().min(1).optional(),
    S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    S3_PUBLIC_BASE_URL: z.string().url().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
    CLOUDINARY_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().min(1).optional(),
    SMTP_HOST: z.string().default("smtp-relay.brevo.com"),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().min(1),
    SMTP_PASS: z.string().min(1),
    EMAIL_FROM: z.string().email(),
    VAPID_PUBLIC_KEY: z.string().min(1),
    VAPID_PRIVATE_KEY: z.string().min(1),
    VAPID_SUBJECT: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    FACEBOOK_CLIENT_ID: z.string().optional(),
    FACEBOOK_CLIENT_SECRET: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
