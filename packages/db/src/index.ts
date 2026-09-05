import { Pool } from "pg";
import { env } from "@kineDao.com/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
});

export const db = drizzle(pool, { schema });

// Export S3 URL helpers
export * from "./lib/s3-helpers";
