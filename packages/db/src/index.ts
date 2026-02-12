import { env } from "@kineDao.com/env/server";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });

// Export S3 URL helpers
export * from "./lib/s3-helpers";
