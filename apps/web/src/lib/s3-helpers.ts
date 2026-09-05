import { env } from "@kineDao.com/env/web";

/**
 * Client-side S3 URL helpers
 * Mirrors the server-side helpers in packages/db/src/lib/s3-helpers.ts
 */

export function getS3Url(s3Key: string): string {
  if (!s3Key) return "";

  // Preserve legacy rows that still store a full URL
  if (s3Key.startsWith("http://") || s3Key.startsWith("https://")) {
    return s3Key;
  }

  const normalizedKey = s3Key.replace(/^\/+/, "");

  // Use the public base URL if available
  const explicitPublicBase = env.VITE_S3_PUBLIC_BASE_URL;
  
  if (explicitPublicBase) {
    return `${explicitPublicBase.replace(/\/+$/, "")}/${normalizedKey}`;
  }

  return s3Key;
}

export function getImageUrl(
  s3Key: string,
  preferredVariant?: "original" | "medium" | "thumbnail"
): string {
  if (preferredVariant && preferredVariant !== "original") {
    // Replace /original/ with /medium/ or /thumbnail/
    const variantKey = s3Key.replace("/original/", `/${preferredVariant}/`);
    return getS3Url(variantKey);
  }

  return getS3Url(s3Key);
}

export function getAllImageVariants(baseS3Key: string): {
  original: string;
  medium: string;
  thumbnail: string;
} {
  // Ensure baseS3Key uses 'original' variant
  const originalKey = baseS3Key.includes("/original/")
    ? baseS3Key
    : baseS3Key.replace(/\/(medium|thumbnail)\//, "/original/");

  return {
    original: getS3Url(originalKey),
    medium: getImageUrl(originalKey, "medium"),
    thumbnail: getImageUrl(originalKey, "thumbnail"),
  };
}
