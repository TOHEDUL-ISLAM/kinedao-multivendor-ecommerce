import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { db } from "@kineDao.com/db";
import { banners } from "@kineDao.com/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { getBannersQuerySchema, type BannerDTO } from "@kineDao.com/api-types/catalog";
import { getS3Url } from "@kineDao.com/db/lib/s3-helpers";
import { z } from "zod";

const bannersRouter = new Hono()
	.get(
		"/",
		describeRoute({
			tags: ["Public - Banners"],
			summary: "Get active banners",
			description: "Fetch active banners for display on homepage. Supports filtering by placement type and automatic scheduling.",
			responses: {
				200: {
					description: "List of active banners",
					content: {
						"application/json": {
							schema: resolver(z.array(z.object({
								id: z.string(),
								titleEn: z.string(),
								titleBn: z.string().nullable(),
								subtitleEn: z.string().nullable(),
								subtitleBn: z.string().nullable(),
								imageUrl: z.string(),
								linkUrl: z.string().nullable(),
								priceLabel: z.string().nullable(),
								badgeText: z.string().nullable(),
								badgeColor: z.string().nullable(),
								ctaText: z.string().nullable(),
								discountPercentage: z.number().nullable(),
								placement: z.string(),
								sortOrder: z.number(),
							})))
						}
					}
				}
			}
		}),
		zValidator("query", getBannersQuerySchema),
		async (c) => {
			const { placement } = c.req.valid("query");

			const now = new Date();
			const conditions = [eq(banners.isActive, true)];

			// Filter by placement (support comma-separated values)
			if (placement) {
				const placements = placement.split(",").map(p => p.trim()) as Array<"hero_carousel" | "promotional_card" | "homepage_middle" | "sidebar">;
				conditions.push(inArray(banners.placement, placements));
			}

			// Fetch banners
			const allBanners = await db
				.select({
					id: banners.id,
					titleEn: banners.titleEn,
					titleBn: banners.titleBn,
					subtitleEn: banners.subtitleEn,
					subtitleBn: banners.subtitleBn,
					imageUrl: banners.imageUrl,
					s3Key: banners.s3Key,
					linkUrl: banners.linkUrl,
					priceLabel: banners.priceLabel,
					badgeText: banners.badgeText,
					badgeColor: banners.badgeColor,
					ctaText: banners.ctaText,
					discountPercentage: banners.discountPercentage,
					placement: banners.placement,
					sortOrder: banners.sortOrder,
					startsAt: banners.startsAt,
					endsAt: banners.endsAt,
				})
				.from(banners)
				.where(and(...conditions))
				.orderBy(banners.sortOrder);

			// Filter by scheduling (check startsAt/endsAt)
			const activeBanners = allBanners.filter((banner) => {
				if (banner.startsAt && banner.startsAt > now) return false;
				if (banner.endsAt && banner.endsAt < now) return false;
				return true;
			});

			// Remove scheduling/internal fields, generate fresh URL from s3Key
			const response: BannerDTO[] = activeBanners.map(({ startsAt, endsAt, s3Key, ...banner }) => ({
				...banner,
				imageUrl: s3Key ? getS3Url(s3Key) : banner.imageUrl,
			}));

			return c.json(response, 200);
		}
	);

export { bannersRouter };
export type BannersRouterType = typeof bannersRouter;
