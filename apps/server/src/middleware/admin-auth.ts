import { createMiddleware } from "hono/factory";
import { db } from "@kineDao.com/db";
import { adminUsers, user as authUserTable } from "@kineDao.com/db/schema";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../index";
import { grantRole, hasAnyRole, hasRole } from "../lib/role-service";

/**
 * Extended environment with adminUserId injected by middleware
 */
export type AdminEnv = {
	Variables: AppEnv["Variables"] & {
		adminUserId: string;
		isSuperAdmin: boolean;
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
		const user = c.var.user;
		console.log(`[AdminAuth] Checking access for User: ${user?.email || "NONE"} (ID: ${user?.id || "NONE"})`);

		if (!user?.id) {
			console.log("[AdminAuth] No user ID in context, returning 401");
			return c.json({ error: "Unauthorized" }, 401);
		}

		const sessionRoles = (user as { roles?: string[] | null }).roles;

		// Use database roles as source of truth (handles stale session role snapshots).
		const [dbUser] = await db
			.select({ roles: authUserTable.roles })
			.from(authUserTable)
			.where(eq(authUserTable.id, user.id))
			.limit(1);
		const effectiveRoles = dbUser?.roles ?? sessionRoles;

		if (hasAnyRole(effectiveRoles, ["admin", "super_admin"])) {
			const isSuperAdmin = hasRole(effectiveRoles, "super_admin");
			console.log(`[AdminAuth] Access GRANTED via roles for ${user.email}`);
			c.set("adminUserId", user.id);
			c.set("isSuperAdmin", isSuperAdmin);
			await next();
			return;
		}

		const [adminUser] = await db
			.select({
				id: adminUsers.id,
				userId: adminUsers.userId,
			})
			.from(adminUsers)
			.where(eq(adminUsers.userId, user.id))
			.limit(1);

		if (!adminUser) {
			console.log(`[AdminAuth] User ${user.email} (ID: ${user.id}) not found in adminUsers table, returning 403`);
			return c.json({ error: "Not an admin user" }, 403);
		}

		// Backward compatibility: if legacy admin record exists, sync role once.
		await grantRole(user.id, "admin");

		console.log(`[AdminAuth] Access GRANTED for Admin ${user.email} via legacy table fallback`);
		c.set("adminUserId", user.id);
		c.set("isSuperAdmin", false);
		await next();
	},
);
