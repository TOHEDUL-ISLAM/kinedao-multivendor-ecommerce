import { db } from "@kineDao.com/db";
import { user } from "@kineDao.com/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { grantRole, getUserRoles } from "../lib/role-service";
import {
	canonicalizeEmail,
	normalizeEmail,
} from "../lib/email-normalization";

async function run() {
	const email = process.env.FIRST_ADMIN_EMAIL;
	if (!email) {
		throw new Error("FIRST_ADMIN_EMAIL is required");
	}

	const normalizedEmail = normalizeEmail(email);
	const canonicalEmail = canonicalizeEmail(normalizedEmail);

	let [existingUser] = await db
		.select({ id: user.id, email: user.email })
		.from(user)
		.where(eq(user.email, normalizedEmail))
		.limit(1);

	// Gmail aliases (dots / +tag / googlemail.com) map to one canonical identity.
	if (!existingUser && normalizedEmail.includes("@")) {
		const candidates = await db
			.select({ id: user.id, email: user.email })
			.from(user)
			.where(
				or(
					sql`lower(${user.email}) like '%@gmail.com'`,
					sql`lower(${user.email}) like '%@googlemail.com'`,
				),
			);

		existingUser = candidates.find(
			(candidate) => canonicalizeEmail(candidate.email) === canonicalEmail,
		);
	}

	if (!existingUser) {
		throw new Error(`User not found for email: ${normalizedEmail}`);
	}

	await grantRole(existingUser.id, "super_admin");
	await grantRole(existingUser.id, "admin");

	const roles = await getUserRoles(existingUser.id);
	console.log("first_admin_email:", existingUser.email);
	console.log("roles:", roles);
}

run()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
