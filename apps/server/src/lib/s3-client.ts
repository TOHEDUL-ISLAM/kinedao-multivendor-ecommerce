import { S3Client } from "bun";
import { env } from "@kineDao.com/env/server";

/**
 * S3 Client Singleton
 *
 * Uses Bun's native S3 implementation for fast, efficient file operations.
 * Configured for Supabase S3-compatible storage.
 *
 * Security features:
 * - UUID-based filenames prevent enumeration attacks
 * - No listing functionality exposed
 * - Presigned URLs for secure, time-limited access
 */
export const s3 = new S3Client({
  accessKeyId: env.S3_ACCESS_KEY_ID,
  secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  bucket: env.S3_BUCKET,
});
