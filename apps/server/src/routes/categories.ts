import { Hono } from "hono";
import { db } from "@kineDao.com/db";
import { categories, products } from "@kineDao.com/db/schema";
import { and, eq, sql, asc } from "drizzle-orm";
import type { CategoryDTO } from "../types/catalog";

const categoriesRouter = new Hono();

// GET /api/categories - Category list (optionally parents only)
categoriesRouter.get("/", async (c) => {
  const scope = c.req.query("scope");

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

  return c.json({ categories: categoryDTOs });
});

export { categoriesRouter };
