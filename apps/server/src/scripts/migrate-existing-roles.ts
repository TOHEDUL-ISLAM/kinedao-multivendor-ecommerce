import { db } from "@kineDao.com/db";
import {
	adminUsers,
	vendorApplications,
} from "@kineDao.com/db/schema";
import { eq } from "drizzle-orm";
import { grantRole } from "../lib/role-service";

async function runInBatches<T>(
	rows: T[],
	batchSize: number,
	handler: (row: T) => Promise<void>,
): Promise<void> {
	for (let i = 0; i < rows.length; i += batchSize) {
		const batch = rows.slice(i, i + batchSize);
		await Promise.all(batch.map((row) => handler(row)));
	}
}

async function run() {
	const adminRows = await db
		.select({ userId: adminUsers.userId })
		.from(adminUsers);

	let migratedAdminCount = 0;
	await runInBatches(adminRows, 25, async (row) => {
		await grantRole(row.userId, "admin");
		migratedAdminCount++;
	});

	const vendorRows = await db
		.select({ userId: vendorApplications.userId })
		.from(vendorApplications)
		.where(eq(vendorApplications.status, "approved"));

	let migratedVendorCount = 0;
	await runInBatches(vendorRows, 25, async (row) => {
		await grantRole(row.userId, "vendor");
		migratedVendorCount++;
	});

	console.log("migrated_admin_count:", migratedAdminCount);
	console.log("migrated_vendor_count:", migratedVendorCount);
}

run()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
