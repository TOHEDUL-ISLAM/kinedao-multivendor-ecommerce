import { db } from "../index";
import { brands } from "../schema/vendors";
import { eq } from "drizzle-orm";

const brandUpdates = [
  { slug: "babylove", logoUrl: "/brands/babylove.svg" },
  { slug: "baby-care", logoUrl: "/brands/babycare.svg" },
  { slug: "tinytots", logoUrl: "/brands/tinytots.svg" },
  { slug: "tiny-tots", logoUrl: "/brands/tinytots.svg" },
  { slug: "littleangel", logoUrl: "/brands/littleangel.svg" },
  { slug: "babysoft", logoUrl: "/brands/babysoft.svg" },
  { slug: "soft-touch", logoUrl: "/brands/softtouch.svg" },
  { slug: "pure-baby", logoUrl: "/brands/purebaby.svg" },
];

async function updateBrands() {
  console.log("Updating brand logos...");
  
  for (const brand of brandUpdates) {
    await db
      .update(brands)
      .set({ logoUrl: brand.logoUrl })
      .where(eq(brands.slug, brand.slug));
    console.log(`Updated ${brand.slug}`);
  }
  
  console.log("All brand logos updated successfully!");
  process.exit(0);
}

updateBrands().catch((err) => {
  console.error(err);
  process.exit(1);
});
