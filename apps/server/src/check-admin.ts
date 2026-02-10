import { db } from "@kineDao.com/db";
import { adminUsers, user } from "@kineDao.com/db/schema";
import { eq } from "drizzle-orm";

const email = process.argv[2] || "tohedulaks@gmail.com";

async function checkAdmin() {
	console.log(`\n🔍 Checking admin status for: ${email}\n`);

	// Check if user exists
	const [userRecord] = await db
		.select()
		.from(user)
		.where(eq(user.email, email))
		.limit(1);

	if (!userRecord) {
		console.log("❌ User not found with this email");
		console.log("   Please create an account first at /signup");
		process.exit(1);
	}

	console.log("✅ User exists:");
	console.log(`   ID: ${userRecord.id}`);
	console.log(`   Name: ${userRecord.name}`);
	console.log(`   Email: ${userRecord.email}`);
	console.log(`   Email Verified: ${userRecord.emailVerified}`);

	// Check if user is admin
	const [adminRecord] = await db
		.select()
		.from(adminUsers)
		.where(eq(adminUsers.userId, userRecord.id))
		.limit(1);

	if (!adminRecord) {
		console.log("\n❌ User is NOT an admin");
		console.log(`   Run: ADMIN_EMAIL=${email} bun run seed-admin`);
		process.exit(1);
	}

	console.log("\n✅ User IS an admin:");
	console.log(`   Admin ID: ${adminRecord.id}`);
	console.log(`   Created: ${adminRecord.createdAt}`);

	console.log("\n🎉 Everything looks good! Try logging in again.");
}

checkAdmin()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("Error:", error);
		process.exit(1);
	});
