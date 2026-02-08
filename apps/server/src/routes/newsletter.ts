import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { db } from "@kineDao.com/db";
import { newsletterSubscribers } from "@kineDao.com/db/schema";
import { eq } from "drizzle-orm";
import { newsletterSubscribeSchema, newsletterUnsubscribeSchema } from "@kineDao.com/api-types/newsletter";
import { z } from "zod";

// POST /api/newsletter/subscribe - Subscribe to newsletter
// POST /api/newsletter/unsubscribe - Unsubscribe from newsletter
const newsletterRouter = new Hono()
  .post(
    "/subscribe",
    describeRoute({
      tags: ["Newsletter"],
      summary: "Subscribe to newsletter",
      description: "Subscribe an email address to the newsletter. Reactivates subscription if previously unsubscribed.",
      responses: {
        200: {
          description: "Successfully subscribed or reactivated",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  success: z.boolean(),
                  message: z.string(),
                })
              ),
            },
          },
        },
        409: {
          description: "Already subscribed",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  error: z.string(),
                })
              ),
            },
          },
        },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  error: z.string(),
                })
              ),
            },
          },
        },
      },
    }),
    zValidator("json", newsletterSubscribeSchema),
    async (c) => {
    try {
      const { email } = c.req.valid("json");
      const normalizedEmail = email.toLowerCase().trim();

      // Check if already subscribed
      const existing = await db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, normalizedEmail))
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        // If exists but inactive, reactivate
        if (!existing[0].isActive) {
          await db
            .update(newsletterSubscribers)
            .set({ isActive: true, subscribedAt: new Date() })
            .where(eq(newsletterSubscribers.id, existing[0].id));

          return c.json({ success: true, message: "Subscription reactivated" }, 200);
        }

        // Already subscribed and active
        return c.json({ error: "Already subscribed" }, 409);
      }

      // Create new subscription
      await db.insert(newsletterSubscribers).values({
        email: normalizedEmail,
      });

      return c.json({ success: true, message: "Successfully subscribed" }, 200);
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      return c.json({ error: "Failed to subscribe" }, 500);
    }
  })
  .post(
    "/unsubscribe",
    describeRoute({
      tags: ["Newsletter"],
      summary: "Unsubscribe from newsletter",
      description: "Unsubscribe an email address from the newsletter.",
      responses: {
        200: {
          description: "Successfully unsubscribed",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  success: z.boolean(),
                  message: z.string(),
                })
              ),
            },
          },
        },
        404: {
          description: "Email not found",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  error: z.string(),
                })
              ),
            },
          },
        },
        500: {
          description: "Server error",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  error: z.string(),
                })
              ),
            },
          },
        },
      },
    }),
    zValidator("json", newsletterUnsubscribeSchema),
    async (c) => {
    try {
      const { email } = c.req.valid("json");
      const normalizedEmail = email.toLowerCase().trim();

      // Find and deactivate subscription
      const existing = await db
        .select()
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.email, normalizedEmail))
        .limit(1);

      if (existing.length === 0 || !existing[0]) {
        return c.json({ error: "Email not found" }, 404);
      }

      await db
        .update(newsletterSubscribers)
        .set({ isActive: false })
        .where(eq(newsletterSubscribers.id, existing[0].id));

      return c.json({ success: true, message: "Successfully unsubscribed" }, 200);
    } catch (error) {
      console.error("Newsletter unsubscribe error:", error);
      return c.json({ error: "Failed to unsubscribe" }, 500);
    }
  });

export { newsletterRouter };
export type NewsletterRouterType = typeof newsletterRouter;
