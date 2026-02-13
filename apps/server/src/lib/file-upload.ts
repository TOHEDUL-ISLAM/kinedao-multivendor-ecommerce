import { s3 } from "./s3-client";
import { randomUUID } from "crypto";

/**
 * Allowed file types for uploads
 * - Any image/* MIME type (supports phone formats like HEIC/HEIF)
 * - PDF documents
 */
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];

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
export type UploadCategory =
  | "vendor-documents"
  | "vendor-logos"
  | "product-images"
  | "banners"
  | "profile-images";

/**
 * Options for file upload
 */
export interface UploadOptions {
  /** User ID for organizing files by user (for vendor applications) */
  userId: string;
  /** Category for organizing files by type */
  category: UploadCategory;
  /** Product ID for organizing product images (optional, required for product-images) */
  productId?: string;
  /** Vendor ID for organizing vendor files (optional) */
  vendorId?: string;
  /** Image variant for organizing different sizes (optional: 'thumbnail', 'medium', 'original') */
  variant?: "thumbnail" | "medium" | "original";
}

/**
 * Result of a successful file upload
 */
export interface UploadResult {
  /** S3 key (path) for the uploaded file */
  s3Key: string;
  /** Public URL for accessing the file (generated from S3 key) */
  url: string;
  /** Generated filename (UUID-based) */
  filename: string;
  /** Image variant (for product images) */
  variant?: "original" | "medium" | "thumbnail";
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
  const isImage = file.type.startsWith("image/");
  const isPdf = ALLOWED_DOCUMENT_TYPES.includes(file.type);

  // Validate file type
  if (!isImage && !isPdf) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed types: image/* or application/pdf`
    );
  }

  // Determine max size based on file type
  const maxSize = isPdf ? MAX_DOCUMENT_SIZE : MAX_IMAGE_SIZE;

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

  // Build S3 key based on category and context
  let s3Key: string;

  switch (options.category) {
    case "product-images":
      // Product images: products/{productId}/images/{variant}/{uuid}.{ext}
      if (!options.productId) {
        throw new Error("productId is required for product-images category");
      }
      const variant = options.variant || "original";
      s3Key = `products/${options.productId}/images/${variant}/${uuid}.${ext}`;
      break;

    case "vendor-logos":
      // Vendor logos: vendors/{vendorId}/logo/{uuid}.{ext}
      const vendorId = options.vendorId || options.userId;
      s3Key = `vendors/${vendorId}/logo/${uuid}.${ext}`;
      break;

    case "vendor-documents":
      // Vendor documents: vendors/{vendorId}/documents/{uuid}.{ext}
      const vendorDocId = options.vendorId || options.userId;
      s3Key = `vendors/${vendorDocId}/documents/${uuid}.${ext}`;
      break;

    case "banners":
      // Banners: banners/{uuid}.{ext}
      s3Key = `banners/${uuid}.${ext}`;
      break;

    case "profile-images":
      // Profile images: users/{userId}/profile/{uuid}.{ext}
      s3Key = `users/${options.userId}/profile/${uuid}.${ext}`;
      break;

    default:
      // Fallback (shouldn't happen)
      s3Key = `uploads/${options.userId}/${uuid}.${ext}`;
  }

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
      s3Key,
      url,
      filename: `${uuid}.${ext}`,
      variant: options.variant,
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
  return mimeType.startsWith("image/");
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

/**
 * Delete all images for a product
 * Useful when deleting a product to clean up S3 storage
 *
 * @param productId - The product ID
 * @returns Promise resolving to number of files deleted
 *
 * TODO: Implement when Bun S3Client list() API is documented
 * For now, track image keys in database and delete individually
 */
export async function deleteProductImages(productId: string): Promise<number> {
  // TODO: Check Bun S3Client documentation for list() return type
  // const response = await s3.list({ prefix: `products/${productId}/images/` });
  console.warn(`deleteProductImages not yet implemented for product ${productId}`);
  return 0;
}

/**
 * Delete all documents for a vendor
 * Useful when removing vendor access
 *
 * @param vendorId - The vendor ID
 * @returns Promise resolving to number of files deleted
 *
 * TODO: Implement when Bun S3Client list() API is documented
 * For now, track document keys in database and delete individually
 */
export async function deleteVendorDocuments(vendorId: string): Promise<number> {
  // TODO: Check Bun S3Client documentation for list() return type
  // const response = await s3.list({ prefix: `vendors/${vendorId}/documents/` });
  console.warn(`deleteVendorDocuments not yet implemented for vendor ${vendorId}`);
  return 0;
}

/**
 * Delete a single file from S3
 *
 * @param s3Key - The S3 key of the file to delete
 * @returns Promise resolving when file is deleted
 */
export async function deleteFile(s3Key: string): Promise<void> {
  try {
    await s3.delete(s3Key);
  } catch (error) {
    console.error(`Failed to delete file ${s3Key}:`, error);
    throw new Error("Failed to delete file");
  }
}
