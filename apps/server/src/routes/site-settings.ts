import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { db } from "@kineDao.com/db";
import { siteSettings } from "@kineDao.com/db/schema";
import { eq } from "drizzle-orm";
import { topBarAnnouncementSchema } from "@kineDao.com/api-types/site-settings";
import {
	DEFAULT_TOP_BAR_ANNOUNCEMENT,
	TOP_BAR_ANNOUNCEMENT_SETTING_KEY,
	parseTopBarAnnouncement,
} from "../lib/top-bar-announcement";

export const siteSettingsRouter = new Hono().get(
	"/top-bar-announcement",
	describeRoute({
		tags: ["Site Settings"],
		summary: "Get top bar announcement",
		description:
			"Fetches the public top bar announcement message configured by admins.",
		responses: {
			200: {
				description: "Top bar announcement",
				content: {
					"application/json": {
						schema: resolver(topBarAnnouncementSchema),
					},
				},
			},
		},
	}),
	async (c) => {
		const [setting] = await db
			.select({ value: siteSettings.value })
			.from(siteSettings)
			.where(eq(siteSettings.key, TOP_BAR_ANNOUNCEMENT_SETTING_KEY))
			.limit(1);

		if (!setting) {
			return c.json(DEFAULT_TOP_BAR_ANNOUNCEMENT, 200);
		}

		return c.json(parseTopBarAnnouncement(setting.value), 200);
	},
);

export type SiteSettingsRouterType = typeof siteSettingsRouter;
