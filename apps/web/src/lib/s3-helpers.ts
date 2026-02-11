/**
 * Client-side S3 URL helpers
 * Mirrors the server-side helpers in packages/db/src/lib/s3-helpers.ts
 */

function normalizeStorageBaseUrl(inputUrl: string): string {
  const trimmed = inputUrl.replace(/\/+$/, "");
  return trimmed
    .replace(/\/rest\/v1$/i, "")
    .replace(/\/storage\/v1\/s3$/i, "")
    .replace(/\/storage\/v1$/i, "");
}

/**
 * Generate a public URL from an S3 key
 *
 * In production: Returns CDN URL (permanent, fast, cached)
 * In development: Returns Supabase public URL
 *
 * @param s3Key - The S3 key (e.g., "products/123/images/original/uuid.jpg")
 * @returns Public URL to access the file
 */
export function getS3Url(s3Key: string): string {
  if (!s3Key) return "";

  // Preserve legacy rows that still store a full URL
  if (s3Key.startsWith("http://") || s3Key.startsWith("https://")) {
    return s3Key;
  }

  const normalizedKey = s3Key.replace(/^\/+/, "");

  // Explicit public base URL should win in every environment
  const explicitPublicBase =
    import.meta.env.VITE_S3_PUBLIC_URL || import.meta.env.VITE_CDN_URL;
  if (explicitPublicBase) {
    return `${explicitPublicBase.replace(/\/+$/, "")}/${normalizedKey}`;
  }

  // Check environment
  const isProduction = import.meta.env.PROD;
  const cdnUrl = import.meta.env.VITE_CDN_URL;

  if (isProduction && cdnUrl) {
    // Production: Use CDN (permanent URL, no expiry)
    // Example: https://cdn.kinedao.com/products/123/images/original/uuid.jpg
    return `${cdnUrl.replace(/\/+$/, "")}/${normalizedKey}`;
  }

  // Development/fallback: Use Supabase public URL
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
  const bucket = import.meta.env.VITE_S3_BUCKET || "kinedao-assets";

  // Supabase public storage URL pattern
  // Example: http://127.0.0.1:54321/storage/v1/object/public/kinedao-assets/products/...
  const baseUrl = normalizeStorageBaseUrl(supabaseUrl);
  return `${baseUrl}/storage/v1/object/public/${bucket}/${normalizedKey}`;
}

/**
 * Get image URL with automatic variant selection
 *
 * @param s3Key - The S3 key
 * @param preferredVariant - Preferred variant (original, medium, thumbnail)
 * @returns URL for the requested variant
 */
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

/**
 * Get all variant URLs for an image
 *
 * @param baseS3Key - The base S3 key (usually 'original' variant)
 * @returns Object with URLs for all variants
 */
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
