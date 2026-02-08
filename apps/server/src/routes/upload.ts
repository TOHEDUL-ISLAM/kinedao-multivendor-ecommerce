import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import type { UploadResponse } from "@kineDao.com/api-types/vendor";
import type { AppEnv } from "../index";
import { uploadFile } from "../lib/file-upload";

/**
 * Upload Router
 *
 * Handles file uploads to S3 with security and validation:
 * - UUID-based filenames (prevents enumeration)
 * - File type validation (images and PDFs only)
 * - File size limits (10MB images, 20MB PDFs)
 * - Authentication required
 * - Presigned URLs (7-day expiry)
 */
const uploadRouter = new Hono<AppEnv>()
  // POST /api/upload - Upload file to S3
  .post(
    "/",
    describeRoute({
      tags: ["Upload"],
      summary: "Upload a file to S3",
      description:
        "Upload a file (image or PDF) to S3 storage for vendor applications. " +
        "Supports images (JPEG, PNG, WebP) up to 10MB and PDFs up to 20MB. " +
        "Files are stored with UUID-based filenames for security. " +
        "Returns a presigned URL valid for 7 days.",
      responses: {
        200: {
          description: "File uploaded successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  url: z.string(),
                  filename: z.string(),
                })
              ),
            },
          },
        },
        401: {
          description: "Unauthorized - user not logged in",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
        400: {
          description: "Bad request - no file provided or invalid file",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
        500: {
          description: "Server error - upload failed",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      // Require authentication
      const userId = c.var.user?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Parse multipart form data
      const body = await c.req.parseBody();
      const file = body["file"];

      // Validate file field exists and is a File object
      if (!file || typeof file === "string") {
        return c.json({ error: "No file provided" }, 400);
      }

      try {
        // Upload file to S3 with UUID-based filename
        const result = await uploadFile(file, {
          userId,
          category: "vendor-documents",
        });

        const response: UploadResponse = {
          url: result.url,
          filename: result.filename,
        };

        return c.json(response, 200);
      } catch (error) {
        // Log error for debugging
        console.error("Upload error:", error);

        // Return user-friendly error message
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";

        return c.json({ error: errorMessage }, 500);
      }
    }
  );

export { uploadRouter };
export type UploadRouterType = typeof uploadRouter;
