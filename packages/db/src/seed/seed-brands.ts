import { db } from "../index";
import { brands } from "../schema/vendors";

const brandData = [
  { name: "Child's Goods", slug: "childs-goods", logoUrl: "/brands/childs-goods.svg", sortOrder: 1, isActive: true },
  { name: "Baby Shop Limited", slug: "baby-shop-limited", logoUrl: "/brands/baby-shop-limited.svg", sortOrder: 2, isActive: true },
  { name: "E-Baby Shop BD", slug: "e-baby-shop-bd", logoUrl: "/brands/e-baby-shop-bd.svg", sortOrder: 3, isActive: true },
  { name: "Baby Care Bangladesh", slug: "baby-care-bangladesh", logoUrl: "/brands/baby-care-bangladesh.svg", sortOrder: 4, isActive: true },
  { name: "Tiny Tots Bangladesh", slug: "tiny-tots-bangladesh", logoUrl: "/brands/tiny-tots-bangladesh.svg", sortOrder: 5, isActive: true },
];

async function seed() {
  console.log("Seeding brands...");
  
  // Optional: clear existing brands
  // await db.delete(brands); 
  
  // Upsert brands (on conflict do update)
  for (const brand of brandData) {
    await db.insert(brands)
      .values(brand)
      .onConflictDoUpdate({
        target: brands.slug,
        set: {
          name: brand.name,
          logoUrl: brand.logoUrl,
          sortOrder: brand.sortOrder,
          isActive: brand.isActive
        }
      });
  }
  
  console.log("Brands seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
