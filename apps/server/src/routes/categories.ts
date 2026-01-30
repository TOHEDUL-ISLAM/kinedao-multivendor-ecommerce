import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { db } from "@kineDao.com/db";
import { categories, products } from "@kineDao.com/db/schema";
import { and, eq, sql, asc } from "drizzle-orm";
import { categoriesQuerySchema, type CategoryDTO } from "@kineDao.com/api-types/catalog";

// GET /api/categories - Category list (optionally parents only)
const categoriesRouter = new Hono().get("/", zValidator("query", categoriesQuerySchema), async (c) => {
  const { scope } = c.req.valid("query");

  const baseQuery = db
    .select({
      category: categories,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(categories)
    .leftJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.isActive, true))
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder));

  const rows =
    scope === "parents"
      ? await baseQuery.where(sql`${categories.parentId} IS NULL`)
      : await baseQuery;

  const categoryDTOs: CategoryDTO[] = rows.map((row) => ({
    id: row.category.id,
    name: row.category.name,
    nameBn: row.category.nameBn,
    slug: row.category.slug,
    parentId: row.category.parentId,
    iconKey: row.category.iconKey,
    imageUrl: row.category.imageUrl,
    sortOrder: row.category.sortOrder,
    productCount: row.productCount,
  }));

  return c.json({ categories: categoryDTOs }, 200);
});

export { categoriesRouter };
export type CategoriesRouterType = typeof categoriesRouter;
