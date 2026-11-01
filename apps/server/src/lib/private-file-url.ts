import { signedPrivateCloudinaryUrl } from "./cloudinary";

const PRIVATE_REFERENCE_PREFIX = "private://";

export function isPrivateFileReference(value: string): boolean {
  return value.startsWith(PRIVATE_REFERENCE_PREFIX);
}

export function toPrivateFileReference(key: string): string {
  return `${PRIVATE_REFERENCE_PREFIX}${key}`;
}

/** Resolve a private object reference only in an authorized API response. */
export function resolvePrivateFileUrl(value: string): string {
  const cloudinaryUrl = signedPrivateCloudinaryUrl(value);
  if (cloudinaryUrl) return cloudinaryUrl;
  if (!isPrivateFileReference(value)) return value;
  // Legacy S3 references remain readable while existing objects are migrated.
  return value;
}
