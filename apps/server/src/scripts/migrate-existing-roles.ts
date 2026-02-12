import { db } from "@kineDao.com/db";
import {
	adminUsers,
	vendorApplications,
} from "@kineDao.com/db/schema";
import { eq } from "drizzle-orm";
import { grantRole } from "../lib/role-service";

async function run() {
	const adminRows = await db
		.select({ userId: adminUsers.userId })
		.from(adminUsers);

	let migratedAdminCount = 0;
	for (const row of adminRows) {
		await grantRole(row.userId, "admin");
		migratedAdminCount++;
	}

	const vendorRows = await db
		.select({ userId: vendorApplications.userId })
		.from(vendorApplications)
		.where(eq(vendorApplications.status, "approved"));

	let migratedVendorCount = 0;
	for (const row of vendorRows) {
		await grantRole(row.userId, "vendor");
		migratedVendorCount++;
	}

	console.log("migrated_admin_count:", migratedAdminCount);
	console.log("migrated_vendor_count:", migratedVendorCount);
}

run()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});

