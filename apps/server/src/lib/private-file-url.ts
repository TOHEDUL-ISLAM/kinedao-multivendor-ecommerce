import { privateS3 } from "./s3-client";

const PRIVATE_REFERENCE_PREFIX = "private://";

export function isPrivateFileReference(value: string): boolean {
  return value.startsWith(PRIVATE_REFERENCE_PREFIX);
}

export function toPrivateFileReference(key: string): string {
  return `${PRIVATE_REFERENCE_PREFIX}${key}`;
}

/** Resolve a private object reference only in an authorized API response. */
export function resolvePrivateFileUrl(value: string): string {
  if (!isPrivateFileReference(value)) return value;

  return privateS3.file(value.slice(PRIVATE_REFERENCE_PREFIX.length)).presign({
    expiresIn: 60 * 60,
  });
}
