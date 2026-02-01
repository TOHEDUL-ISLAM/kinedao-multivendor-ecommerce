import { db } from "../index";
import { categories, categoryMetrics } from "../schema";
import { isNull } from "drizzle-orm";

/**
 * Seeds category metrics for all parent categories.
 * Run this after the schema migration to populate initial metrics.
 */
async function seedCategoryMetrics() {
  console.log("Seeding category metrics...");

  // Get all root categories (parent_id IS NULL)
  const rootCategories = await db
    .select()
    .from(categories)
    .where(isNull(categories.parentId));

  console.log(`Found ${rootCategories.length} root categories`);

  // Define some curated weights based on common baby product categories
  const curatedWeights: Record<
    string,
    { momChoice: number; editorPick: number; trending: number; seasons: string[] }
  > = {
    clothing: { momChoice: 90, editorPick: 85, trending: 80, seasons: ["winter", "summer"] },
    feeding: { momChoice: 95, editorPick: 80, trending: 75, seasons: [] },
    diapers: { momChoice: 100, editorPick: 70, trending: 85, seasons: [] },
    toys: { momChoice: 75, editorPick: 90, trending: 90, seasons: ["eid", "christmas"] },
    nursery: { momChoice: 85, editorPick: 95, trending: 70, seasons: [] },
    "gift-sets": { momChoice: 80, editorPick: 85, trending: 95, seasons: ["eid", "christmas", "new-year"] },
    strollers: { momChoice: 90, editorPick: 80, trending: 65, seasons: [] },
    safety: { momChoice: 100, editorPick: 75, trending: 60, seasons: [] },
  };

  for (const category of rootCategories) {
    const slug = category.slug.toLowerCase();
    const weights = curatedWeights[slug] || {
      momChoice: 50,
      editorPick: 50,
      trending: 50,
      seasons: [],
    };

    // Random popularity score between 50-100
    const popularityScore = Math.floor(Math.random() * 50) + 50;

    await db
      .insert(categoryMetrics)
      .values({
        categoryId: category.id,
        trendingScore: weights.trending,
        popularityScore,
        momChoiceWeight: weights.momChoice,
        editorPickWeight: weights.editorPick,
        homepageWeight: weights.momChoice > 80 ? 100 : 50,
        seasonalTags: weights.seasons,
        targetAudience: ["new-parents", "expecting"],
        lastCalculatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: categoryMetrics.categoryId,
        set: {
          trendingScore: weights.trending,
          popularityScore,
          momChoiceWeight: weights.momChoice,
          editorPickWeight: weights.editorPick,
          homepageWeight: weights.momChoice > 80 ? 100 : 50,
          seasonalTags: weights.seasons,
          targetAudience: ["new-parents", "expecting"],
          lastCalculatedAt: new Date(),
        },
      });

    console.log(`✓ Seeded metrics for: ${category.name}`);
  }

  console.log("Category metrics seeding complete!");
}

// Run if called directly
seedCategoryMetrics()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding category metrics:", error);
    process.exit(1);
  });
