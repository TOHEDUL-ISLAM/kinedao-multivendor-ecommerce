import { z } from "zod";
import { describeRoute } from "hono-openapi";

/**
 * Helper to create standard OpenAPI responses for common scenarios
 */
export const apiResponses = {
  success: (schema: any, description = "Successful response") => ({
    200: {
      description,
      content: {
        "application/json": { schema },
      },
    },
  }),
  notFound: () => ({
    404: {
      description: "Resource not found",
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
    },
  }),
  badRequest: () => ({
    400: {
      description: "Bad request - invalid parameters",
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
    },
  }),
  serverError: () => ({
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            error: z.string().optional(),
          }),
        },
      },
    },
  }),
};

/**
 * Common parameter schemas
 */
export const commonParams = {
  paginated: z.object({
    page: z.string().optional().default("1"),
    limit: z.string().optional().default("20"),
  }),
  search: z.object({
    q: z.string().describe("Search query"),
  }),
  language: z.object({
    lang: z.enum(["en", "bn"]).optional().default("en"),
  }),
};

/**
 * Helper function to document a route with common patterns
 */
export function documentRoute(config: {
  description: string;
  summary?: string;
  tags?: string[];
}) {
  return describeRoute(config);
}
