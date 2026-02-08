import { s3 } from "./s3-client";
import { randomUUID } from "crypto";

/**
 * Allowed file types for vendor document uploads
 */
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

/**
 * File size limits based on user requirements
 * - Images: 10MB (for NID images, logos)
 * - PDFs: 20MB (for trade licenses, other documents)
 */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Upload categories for organizing files in S3
 */
export type UploadCategory = "vendor-documents" | "vendor-logos";

/**
 * Options for file upload
 */
export interface UploadOptions {
  /** User ID for organizing files by user */
  userId: string;
  /** Category for organizing files by type */
  category: UploadCategory;
}

/**
 * Result of a successful file upload
 */
export interface UploadResult {
  /** Presigned URL for accessing the file (expires in 7 days) */
  url: string;
  /** Generated filename (UUID-based) */
  filename: string;
}

/**
 * Upload a file to S3 with validation and security measures
 *
 * Security features:
 * - UUID-based filenames prevent enumeration attacks
 * - File type validation (only images and PDFs allowed)
 * - File size limits enforced (10MB for images, 20MB for PDFs)
 * - Files organized by userId to prevent cross-user access
 * - Presigned URLs expire in 7 days
 *
 * @param file - The file to upload
 * @param options - Upload options (userId, category)
 * @returns Promise resolving to upload result with URL and filename
 * @throws Error if validation fails or upload fails
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(", ")}`
    );
  }

  // Determine max size based on file type
  const maxSize = ALLOWED_DOCUMENT_TYPES.includes(file.type)
    ? MAX_DOCUMENT_SIZE
    : MAX_IMAGE_SIZE;

  // Validate file size
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    throw new Error(
      `File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed: ${maxSizeMB}MB`
    );
  }

  // Generate UUID-based filename
  // Original filename extension is preserved but original name is discarded
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const uuid = randomUUID();
  const s3Key = `${options.category}/${options.userId}/${uuid}.${ext}`;

  try {
    // Upload file to S3
    const s3File = s3.file(s3Key);
    await s3File.write(file, {
      type: file.type,
    });

    // Generate presigned URL for retrieval (7 days expiry)
    const url = s3File.presign({
      expiresIn: 60 * 60 * 24 * 7, // 7 days
    });

    return {
      url,
      filename: `${uuid}.${ext}`,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(
      `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get file extension from filename
 * @param filename - The filename to extract extension from
 * @returns File extension without dot, or 'bin' if no extension found
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "bin";
}

/**
 * Check if a file type is an image
 * @param mimeType - The MIME type to check
 * @returns True if the MIME type is an image
 */
export function isImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

/**
 * Check if a file type is a document (PDF)
 * @param mimeType - The MIME type to check
 * @returns True if the MIME type is a PDF
 */
export function isDocumentType(mimeType: string): boolean {
  return ALLOWED_DOCUMENT_TYPES.includes(mimeType);
}

/**
 * Get maximum allowed file size for a given MIME type
 * @param mimeType - The MIME type
 * @returns Maximum file size in bytes
 */
export function getMaxFileSize(mimeType: string): number {
  return isDocumentType(mimeType) ? MAX_DOCUMENT_SIZE : MAX_IMAGE_SIZE;
}
