import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import type { UploadResponse } from "@kineDao.com/api-types/vendor";
import type { AppEnv } from "../index";

// Mock upload endpoint for MVP
// TODO: Replace with S3/R2 integration
const uploadRouter = new Hono<AppEnv>()
  // POST /api/upload - Mock file upload
  .post(
    "/",
    describeRoute({
      tags: ["Upload"],
      summary: "Upload a file (mock)",
      description:
        "Mock file upload endpoint for MVP. Returns a fake URL. Will be replaced with S3/R2 integration later.",
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
          description: "No file provided",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const userId = c.var.user?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Parse form data
      const body = await c.req.parseBody();
      const file = body["file"];

      if (!file || typeof file === "string") {
        return c.json({ error: "No file provided" }, 400);
      }

      // For MVP, generate a mock URL
      // In production, this would upload to S3/R2 and return the real URL
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const filename = file.name || "file";
      const ext = filename.split(".").pop() || "jpg";

      // Mock URL that looks like an S3 URL
      const mockUrl = `https://kinedao-uploads.s3.ap-south-1.amazonaws.com/vendor-applications/${userId}/${timestamp}-${randomId}.${ext}`;

      const response: UploadResponse = {
        url: mockUrl,
        filename: filename,
      };

      return c.json(response, 200);
    }
  );

export { uploadRouter };
export type UploadRouterType = typeof uploadRouter;
