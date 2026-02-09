#!/usr/bin/env bun
/**
 * Create a test vendor account for development
 * Usage: bun run scripts/create-test-vendor.ts
 */

import { db } from "@kineDao.com/db";
import { users, vendorApplications } from "@kineDao.com/db/schema";
import { eq } from "drizzle-orm";

const TEST_EMAIL = "vendor@test.com";
const TEST_PASSWORD = "password123"; // You'll need to hash this properly with better-auth

async function createTestVendor() {
  console.log("🔍 Looking for existing test vendor...");

  // Check if test user already exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, TEST_EMAIL))
    .limit(1);

  if (existingUser) {
    console.log("✅ Test user already exists:", existingUser.email);

    // Check if vendor application exists
    const [existingApp] = await db
      .select()
      .from(vendorApplications)
      .where(eq(vendorApplications.userId, existingUser.id))
      .limit(1);

    if (existingApp) {
      if (existingApp.status === "approved") {
        console.log("✅ Vendor application already approved!");
        console.log("\n📱 Login credentials:");
        console.log(`   Email: ${TEST_EMAIL}`);
        console.log(`   Password: ${TEST_PASSWORD}`);
        console.log("\n🚀 Visit: http://localhost:3001/vendor/dashboard");
        return;
      }

      // Approve existing pending application
      await db
        .update(vendorApplications)
        .set({ status: "approved" })
        .where(eq(vendorApplications.id, existingApp.id));

      console.log("✅ Approved existing vendor application!");
      console.log("\n📱 Login credentials:");
      console.log(`   Email: ${TEST_EMAIL}`);
      console.log(`   Password: ${TEST_PASSWORD}`);
      console.log("\n🚀 Visit: http://localhost:3001/vendor/dashboard");
      return;
    }

    // Create vendor application for existing user
    console.log("⚠️  User exists but no vendor application. Please:");
    console.log(`   1. Login with: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
    console.log("   2. Go to: http://localhost:3001/vendor/apply/form");
    console.log("   3. Submit the application");
    console.log("   4. Run this script again to approve it");
    return;
  }

  console.log("⚠️  Test user doesn't exist. Please:");
  console.log("   1. Register at: http://localhost:3001/login");
  console.log(`   2. Use email: ${TEST_EMAIL}`);
  console.log("   3. Go to: http://localhost:3001/vendor/apply/form");
  console.log("   4. Submit the application");
  console.log("   5. Run this script again to approve it");
}

createTestVendor()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
