import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { Client } from "pg";

type JournalEntry = {
  idx: number;
  when: number;
  tag: string;
};

type JournalFile = {
  entries: JournalEntry[];
};

async function main() {
  dotenv.config({ path: "../../apps/server/.env" });

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const journalPath = path.resolve(
    scriptDir,
    "../migrations/meta/_journal.json",
  );
  const journalRaw = await readFile(journalPath, "utf8");
  const journal = JSON.parse(journalRaw) as JournalFile;

  const latestEntry = [...journal.entries].sort((a, b) => a.when - b.when).at(-1);
  if (!latestEntry) {
    throw new Error("No migration entries found in _journal.json");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "drizzle";`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
        "id" serial PRIMARY KEY,
        "hash" text NOT NULL,
        "created_at" bigint
      );
    `);

    const { rows } = await client.query<{
      max_created_at: string | null;
    }>(`SELECT MAX("created_at")::text AS max_created_at FROM "drizzle"."__drizzle_migrations";`);

    const maxCreatedAt = Number(rows[0]?.max_created_at ?? 0);
    if (maxCreatedAt >= latestEntry.when) {
      console.log(
        `Drizzle baseline already applied (max created_at=${maxCreatedAt}, latest migration=${latestEntry.when}).`,
      );
      return;
    }

    await client.query(
      `INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at") VALUES ($1, $2);`,
      [`baseline:${latestEntry.tag}`, latestEntry.when],
    );

    console.log(
      `Inserted drizzle baseline at created_at=${latestEntry.when} (${latestEntry.tag}).`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
