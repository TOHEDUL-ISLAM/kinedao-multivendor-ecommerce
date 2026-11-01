import { env } from "@kineDao.com/env/server";

/**
 * S3 URL Generation Helpers
 *
 * Configured for Cloudflare R2 / S3-compatible storage.
 */

export function getS3Url(s3Key: string): string {
  if (!s3Key) {
    return "";
  }

  // If s3Key is already a full URL (for seed data with external images), return as-is
  if (s3Key.startsWith("http://") || s3Key.startsWith("https://")) {
    return s3Key;
  }

  if (s3Key.startsWith("cloudinary://")) {
    const [resourceType, ...publicId] = s3Key.slice("cloudinary://".length).split("/");
    if (env.CLOUDINARY_CLOUD_NAME && (resourceType === "image" || resourceType === "raw")) {
      return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${publicId.join("/")}`;
    }
  }

  const normalizedKey = s3Key.replace(/^\/+/, "");

  // Primary: Use R2 public domain or custom domain
  if (env.S3_PUBLIC_BASE_URL) {
    return `${env.S3_PUBLIC_BASE_URL.replace(/\/+$/, "")}/${normalizedKey}`;
  }

  // Fallback: Path-style URL (e.g. for development MinIO or direct R2 if public)
  if (env.S3_ENDPOINT && env.S3_BUCKET) {
    const baseUrl = env.S3_ENDPOINT.replace(/\/+$/, "");
    return `${baseUrl}/${env.S3_BUCKET}/${normalizedKey}`;
  }

  console.warn(`No S3_PUBLIC_BASE_URL configured. Returning raw S3 key: ${s3Key}`);
  return s3Key;
}

export function getImageUrl(
  s3Key: string,
  preferredVariant?: "original" | "medium" | "thumbnail",
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

export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // 1. Check if it matches our public base URL
    if (env.S3_PUBLIC_BASE_URL && url.startsWith(env.S3_PUBLIC_BASE_URL)) {
      return url.replace(env.S3_PUBLIC_BASE_URL, "").replace(/^\/+/, "");
    }

    // 2. Fallback check for Cloudflare R2 public worker domain (r2.dev)
    if (urlObj.hostname.includes("r2.dev")) {
      return urlObj.pathname.substring(1); // Remove leading slash
    }

    // 3. Fallback check for Cloudflare R2 path-style (endpoint/bucket/key)
    if (urlObj.hostname.includes("cloudflarestorage.com")) {
      const pathParts = urlObj.pathname.split("/");
      pathParts.shift(); // Remove leading slash
      pathParts.shift(); // Remove bucket name
      return pathParts.join("/");
    }

    return null;
  } catch (error) {
    console.error("Failed to extract S3 key from URL:", url, error);
    return null;
  }
}

export function batchGetUrls(
  s3Keys: string[],
  variant?: "original" | "medium" | "thumbnail",
): string[] {
  return s3Keys.map((key) => getImageUrl(key, variant));
}
