// This file seeds the order_number_sequence table
// Run from apps/server: bun run ../../packages/db/src/seed-order-sequence.ts

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { orderNumberSequence } from "./schema/orders";

// Get DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable not set");
}

// Create direct DB connection (bypass env validation)
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();
const db = drizzle(client);

async function seedOrderSequence() {
	try {
		await db
			.insert(orderNumberSequence)
			.values({ id: 1, lastNumber: 0 })
			.onConflictDoNothing();
		console.log("✓ Order number sequence initialized");
	} catch (error) {
		console.error("Error seeding order sequence:", error);
		throw error;
	} finally {
		await client.end();
	}
}

seedOrderSequence().then(() => process.exit(0));
