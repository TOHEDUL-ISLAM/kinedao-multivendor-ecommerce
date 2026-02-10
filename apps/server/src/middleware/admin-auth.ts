import { createMiddleware } from "hono/factory";
import { db } from "@kineDao.com/db";
import { adminUsers } from "@kineDao.com/db/schema";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../index";

/**
 * Extended environment with adminUserId injected by middleware
 */
export type AdminEnv = {
	Variables: AppEnv["Variables"] & {
		adminUserId: string;
	};
};

/**
 * Admin Auth Middleware
 *
 * Verifies the authenticated user is an admin and injects
 * adminUserId into the Hono context.
 *
 * Returns 401 if not authenticated, 403 if not an admin.
 */
export const adminAuthMiddleware = createMiddleware<AdminEnv>(
	async (c, next) => {
		const userId = c.var.user?.id;
		if (!userId) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const [adminUser] = await db
			.select({
				id: adminUsers.id,
				userId: adminUsers.userId,
			})
			.from(adminUsers)
			.where(eq(adminUsers.userId, userId))
			.limit(1);

		if (!adminUser) {
			return c.json({ error: "Not an admin user" }, 403);
		}

		c.set("adminUserId", userId);
		await next();
	},
);
