import { db } from "@kineDao.com/db";
import { vendorApplications } from "@kineDao.com/db/schema";

const apps = await db
	.select({
		id: vendorApplications.id,
		userId: vendorApplications.userId,
		status: vendorApplications.status,
		shopName: vendorApplications.shopNameEn,
		email: vendorApplications.email,
		phone: vendorApplications.phone,
		createdAt: vendorApplications.createdAt,
	})
	.from(vendorApplications)
	.orderBy(vendorApplications.createdAt)
	.limit(10);

console.log("\n📋 VENDOR APPLICATIONS IN DATABASE:\n");
console.log(JSON.stringify(apps, null, 2));
console.log(`\n✅ Total: ${apps.length} applications\n`);

// Show by status
const pending = apps.filter((a) => a.status === "pending");
const approved = apps.filter((a) => a.status === "approved");
const rejected = apps.filter((a) => a.status === "rejected");

console.log(`Pending: ${pending.length}`);
console.log(`Approved: ${approved.length}`);
console.log(`Rejected: ${rejected.length}\n`);

process.exit(0);
