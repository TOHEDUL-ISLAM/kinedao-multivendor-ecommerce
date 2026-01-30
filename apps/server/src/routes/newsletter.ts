import { Hono } from "hono";
import { db } from "@kineDao.com/db";
import { newsletterSubscribers } from "@kineDao.com/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const newsletterRouter = new Hono();

// Email validation schema
const subscribeSchema = z.object({
  email: z.string().email("Invalid email format"),
});

// POST /api/newsletter/subscribe - Subscribe to newsletter
newsletterRouter.post("/subscribe", async (c) => {
  try {
    const body = await c.req.json();

    // Validate request body
    const result = subscribeSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    const { email } = result.data;
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

        return c.json({ success: true, message: "Subscription reactivated" });
      }

      // Already subscribed and active
      return c.json({ error: "Already subscribed" }, 409);
    }

    // Create new subscription
    await db.insert(newsletterSubscribers).values({
      email: normalizedEmail,
    });

    return c.json({ success: true, message: "Successfully subscribed" });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return c.json({ error: "Failed to subscribe" }, 500);
  }
});

// POST /api/newsletter/unsubscribe - Unsubscribe from newsletter
newsletterRouter.post("/unsubscribe", async (c) => {
  try {
    const body = await c.req.json();

    const result = subscribeSchema.safeParse(body);
    if (!result.success) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    const { email } = result.data;
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

    return c.json({ success: true, message: "Successfully unsubscribed" });
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return c.json({ error: "Failed to unsubscribe" }, 500);
  }
});

export { newsletterRouter };
