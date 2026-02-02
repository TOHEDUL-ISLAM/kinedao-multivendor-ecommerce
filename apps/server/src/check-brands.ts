
import { db } from "@kineDao.com/db";
import { brands } from "@kineDao.com/db/schema";

async function checkBrands() {
  const allBrands = await db.select().from(brands);
  console.log(JSON.stringify(allBrands, null, 2));
  process.exit(0);
}

checkBrands();
