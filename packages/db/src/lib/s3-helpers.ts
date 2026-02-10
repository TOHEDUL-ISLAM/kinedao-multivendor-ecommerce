/**
 * S3 URL Generation Helpers
 *
 * Professional pattern: Store S3 keys in database, generate URLs on-demand
 * This allows switching CDN providers, changing storage backends, etc.
 */

/**
 * Generate a public URL from an S3 key
 *
 * In production: Returns CDN URL (permanent, fast, cached)
 * In development: Returns presigned URL (temporary, for local testing)
 *
 * @param s3Key - The S3 key (e.g., "products/123/images/original/uuid.jpg")
 * @param expiresIn - Expiry time in seconds for presigned URLs (default: 7 days)
 * @returns Public URL to access the file
 */
export function getS3Url(s3Key: string): string {
  // If s3Key is already a full URL (for seed data with external images), return as-is
  if (s3Key.startsWith("http://") || s3Key.startsWith("https://")) {
    return s3Key;
  }

  // Check environment
  const isProduction = process.env.NODE_ENV === "production";
  const cdnUrl = process.env.CDN_URL || process.env.S3_PUBLIC_URL;

  if (isProduction && cdnUrl) {
    // Production: Use CDN (permanent URL, no expiry)
    // Example: https://cdn.kinedao.com/products/123/images/original/uuid.jpg
    return `${cdnUrl}/${s3Key}`;
  }

  // Development/fallback: Use Supabase public URL
  const supabaseUrl = process.env.SUPABASE_URL || process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;

  if (supabaseUrl && bucket) {
    // Supabase public storage URL pattern
    // Example: http://127.0.0.1:54321/storage/v1/object/public/kinedao-assets/products/...
    const baseUrl = supabaseUrl.replace("/rest/v1", "");
    return `${baseUrl}/storage/v1/object/public/${bucket}/${s3Key}`;
  }

  // Ultimate fallback: return key as-is (will be invalid but shows the issue)
  console.warn(`No CDN_URL or SUPABASE_URL configured. Returning raw S3 key: ${s3Key}`);
  return s3Key;
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

/**
 * Extract S3 key from a full URL (for migration purposes)
 *
 * @param url - Full S3 or CDN URL
 * @returns S3 key (path without domain)
 */
export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Supabase pattern: /storage/v1/object/public/{bucket}/{key}
    if (url.includes("/storage/v1/object/public/")) {
      const parts = urlObj.pathname.split("/storage/v1/object/public/");
      if (parts[1]) {
        // Remove bucket name
        const pathParts = parts[1].split("/");
        pathParts.shift(); // Remove bucket name
        return pathParts.join("/");
      }
    }

    // CDN pattern: https://cdn.kinedao.com/{key}
    if (urlObj.hostname.includes("cdn.")) {
      return urlObj.pathname.substring(1); // Remove leading slash
    }

    // S3 direct pattern: https://s3.amazonaws.com/bucket/{key}
    if (urlObj.hostname.includes("s3.")) {
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

/**
 * Batch get URLs for multiple S3 keys
 *
 * @param s3Keys - Array of S3 keys
 * @param variant - Optional variant to use
 * @returns Array of URLs
 */
export function batchGetUrls(
  s3Keys: string[],
  variant?: "original" | "medium" | "thumbnail"
): string[] {
  return s3Keys.map((key) => getImageUrl(key, variant));
}
