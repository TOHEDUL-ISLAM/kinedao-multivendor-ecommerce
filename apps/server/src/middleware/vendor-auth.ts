import { createMiddleware } from "hono/factory";
import { db } from "@kineDao.com/db";
import { vendorApplications, vendors } from "@kineDao.com/db/schema";
import { eq, and } from "drizzle-orm";
import type { AppEnv } from "../index";

/**
 * Extended environment with vendorId injected by middleware
 */
export type VendorEnv = {
	Variables: AppEnv["Variables"] & {
		vendorId: string;
		vendorName: string;
	};
};

/**
 * Helper: generate slug from shop name
 */
function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 200);
}

/**
 * Vendor Auth Middleware
 *
 * Verifies the authenticated user is an approved vendor and injects
 * vendorId + vendorName into the Hono context.
 *
 * Returns 401 if not authenticated, 403 if not an approved vendor.
 *
 * If an approved application doesn't have a vendorId, creates a vendor
 * record and links it to the application.
 */
export const vendorAuthMiddleware = createMiddleware<VendorEnv>(
	async (c, next) => {
		const userId = c.var.user?.id;
		if (!userId) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const [application] = await db
			.select({
				id: vendorApplications.id,
				vendorId: vendorApplications.vendorId,
				shopNameEn: vendorApplications.shopNameEn,
			})
			.from(vendorApplications)
			.where(
				and(
					eq(vendorApplications.userId, userId),
					eq(vendorApplications.status, "approved"),
				),
			)
			.limit(1);

		if (!application) {
			return c.json({ error: "Not an approved vendor" }, 403);
		}

		let vendorId = application.vendorId;

		// If approved but no vendorId, create vendor and link it
		if (!vendorId) {
			const slug = generateSlug(application.shopNameEn);

			// Create vendor record
			const [newVendor] = await db
				.insert(vendors)
				.values({
					name: application.shopNameEn,
					slug,
					isVerified: true, // Auto-verify approved vendors
				})
				.returning({ id: vendors.id });

			if (!newVendor) {
				return c.json({ error: "Failed to create vendor" }, 500);
			}

			vendorId = newVendor.id;

			// Link vendor to application
			await db
				.update(vendorApplications)
				.set({ vendorId })
				.where(eq(vendorApplications.id, application.id));
		}

		c.set("vendorId", vendorId);
		c.set("vendorName", application.shopNameEn);
		await next();
	},
);
