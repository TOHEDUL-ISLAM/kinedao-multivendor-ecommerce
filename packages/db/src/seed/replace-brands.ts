import { db } from "../index";
import { brands } from "../schema/vendors";
import { sql } from "drizzle-orm";

const newBrands = [
  { name: "Child's Goods", slug: "childs-goods", logoUrl: "/brands/childs-goods.svg", sortOrder: 1, isActive: true },
  { name: "Baby Shop Limited", slug: "baby-shop-limited", logoUrl: "/brands/baby-shop-limited.svg", sortOrder: 2, isActive: true },
  { name: "E-Baby Shop BD", slug: "e-baby-shop-bd", logoUrl: "/brands/e-baby-shop-bd.svg", sortOrder: 3, isActive: true },
  { name: "Baby Care Bangladesh", slug: "baby-care-bangladesh", logoUrl: "/brands/baby-care-bangladesh.svg", sortOrder: 4, isActive: true },
  { name: "Tiny Tots Bangladesh", slug: "tiny-tots-bangladesh", logoUrl: "/brands/tiny-tots-bangladesh.svg", sortOrder: 5, isActive: true },
];

async function replaceBrands() {
  console.log("Replacing brands with new ones...");
  
  // Delete all existing brands
  await db.delete(brands);
  console.log("Cleared existing brands");
  
  // Insert new brands
  for (const brand of newBrands) {
    await db.insert(brands).values(brand);
    console.log(`Inserted: ${brand.name}`);
  }
  
  console.log("\nBrand replacement complete!");
  console.log(`Total brands: ${newBrands.length}`);
  
  process.exit(0);
}

replaceBrands().catch((err) => {
  console.error(err);
  process.exit(1);
});
