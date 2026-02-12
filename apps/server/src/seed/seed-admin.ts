/**
 * Admin User Seed Script
 *
 * This script creates an initial admin user for the KineDao.com platform.
 * Run this script after setting up the database to create your first admin account.
 *
 * Usage:
 *   bun run seed-admin
 *
 * You'll need to create a user account first via the normal signup flow,
 * then run this script with the user's email to promote them to admin.
 */

import { db } from "@kineDao.com/db";
import { user, adminUsers } from "@kineDao.com/db/schema";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@kinedao.com";

async function seedAdmin() {
	console.log("🌱 Seeding admin user...");

	try {
		// Find user by email
		const [existingUser] = await db
			.select()
			.from(user)
			.where(eq(user.email, ADMIN_EMAIL))
			.limit(1);

		if (!existingUser) {
			console.error(
				`❌ User with email "${ADMIN_EMAIL}" not found. Please create a user account first via the signup flow.`,
			);
			process.exit(1);
		}

		// Check if already an admin
		const [existingAdmin] = await db
			.select()
			.from(adminUsers)
			.where(eq(adminUsers.userId, existingUser.id))
			.limit(1);

		if (existingAdmin) {
			console.log(
				`✅ User "${existingUser.email}" is already an admin (ID: ${existingAdmin.id})`,
			);
			return;
		}

		// Create admin record
		const [newAdmin] = await db
			.insert(adminUsers)
			.values({
				userId: existingUser.id,
			})
			.returning();

		if (!newAdmin) {
			console.error("❌ Failed to create admin record");
			process.exit(1);
		}

		console.log("✅ Admin user created successfully!");
		console.log(`   Email: ${existingUser.email}`);
		console.log(`   Name: ${existingUser.name}`);
		console.log(`   Admin ID: ${newAdmin.id}`);
		console.log("\n🎉 You can now log in to /admin/dashboard");
	} catch (error) {
		console.error("❌ Error seeding admin:", error);
		process.exit(1);
	}
}

// Run the seed function
seedAdmin()
	.then(() => {
		console.log("\n✨ Admin seed completed");
		process.exit(0);
	})
	.catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
