import { db } from "../index";
import { brands } from "../schema/vendors";
import { sql } from "drizzle-orm";

async function cleanupDuplicateBrands() {
  console.log("Cleaning up duplicate brands...");
  
  // Keep only these 5 brands
  const keepSlugs = ["babylove", "baby-care", "tiny-tots", "littleangel", "babysoft"];
  
  // Delete brands not in the keep list
  await db.execute(sql`
    DELETE FROM ${brands} 
    WHERE slug NOT IN (${sql.join(keepSlugs.map(s => sql`${s}`), sql`, `)})
  `);
  
  console.log("Duplicate brands removed!");
  
  // Show remaining brands
  const remaining = await db.select().from(brands);
  console.log(`\nRemaining brands (${remaining.length}):`);
  remaining.forEach(b => console.log(`  - ${b.name} (${b.slug})`));
  
  process.exit(0);
}

cleanupDuplicateBrands().catch((err) => {
  console.error(err);
  process.exit(1);
});
