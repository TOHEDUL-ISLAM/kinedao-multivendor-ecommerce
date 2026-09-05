import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { db } from "@kineDao.com/db";
import {
	notifications,
	notificationPreferences,
	pushSubscriptions,
} from "@kineDao.com/db/schema";
import {
	type NotificationDTO,
	type NotificationListResponseDTO,
	type UnreadCountDTO,
	type NotificationPreferencesDTO,
	notificationListQuerySchema,
	notificationPreferencesUpdateSchema,
	pushSubscriptionSchema,
} from "@kineDao.com/api-types";
import { eq, and, desc } from "drizzle-orm";
import { streamSSE } from "hono/streaming";
import {
	addSSEConnection,
	removeSSEConnection,
} from "../lib/notification-service";
import type { AppEnv } from "../index";
import { getVapidPublicKey } from "../lib/web-push";

const notificationsRouter = new Hono<AppEnv>()
	// SSE stream endpoint for real-time notifications
	.get(
		"/stream",
		describeRoute({
			tags: ["Notifications"],
			summary: "SSE stream for real-time notifications",
			description:
				"Opens an SSE connection to receive real-time notification events",
			responses: {
				200: {
					description: "SSE stream established",
				},
				401: {
					description: "Unauthorized",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			return streamSSE(c, async (stream) => {
				// Add connection
				addSSEConnection(userId, stream);

				// Send initial connection confirmation
				await stream.writeSSE({
					data: JSON.stringify({ type: "connected" }),
					event: "system",
				});

				// Heartbeat every 30 seconds
				const heartbeatInterval = setInterval(async () => {
					try {
						await stream.write(": heartbeat\n\n");
					} catch (error) {
						console.error("Heartbeat error:", error);
						clearInterval(heartbeatInterval);
					}
				}, 30000);

				// Keep connection open
				stream.onAbort(() => {
					removeSSEConnection(userId, stream);
					clearInterval(heartbeatInterval);
				});

				// Keep stream alive indefinitely
				await new Promise(() => {
					// Never resolves - stream stays open until client disconnects
				});
			});
		},
	)

	// Get paginated notification list
	.get(
		"/",
		describeRoute({
			tags: ["Notifications"],
			summary: "Get notification list",
			description: "Returns paginated list of notifications for the current user",
			responses: {
				200: {
					description: "Notification list retrieved",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									notifications: z.array(z.any()),
									total: z.number(),
									page: z.number(),
									limit: z.number(),
									totalPages: z.number(),
								}),
							),
						},
					},
				},
			},
		}),
		zValidator("query", notificationListQuerySchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}
			const { page, limit, channel, unreadOnly } = c.req.valid("query");

			const offset = (page - 1) * limit;

			// Build where clause
			const conditions = [eq(notifications.userId, userId)];
			if (channel) {
				conditions.push(eq(notifications.channel, channel));
			}
			if (unreadOnly) {
				conditions.push(eq(notifications.isRead, false));
			}

			// Get notifications
			const notificationsList = await db
				.select()
				.from(notifications)
				.where(and(...conditions))
				.orderBy(desc(notifications.createdAt))
				.limit(limit)
				.offset(offset);

			// Get total count
			const total = await db.$count(notifications, and(...conditions));
			const totalPages = Math.ceil(total / limit);

			const response: NotificationListResponseDTO = {
				notifications: notificationsList.map(
					(n): NotificationDTO => ({
						id: n.id,
						type: n.type as NotificationDTO["type"],
						title: n.title,
						titleBn: n.titleBn,
						body: n.body,
						bodyBn: n.bodyBn,
						data: n.data as Record<string, unknown> | null,
						channel: n.channel as NotificationDTO["channel"],
						isRead: n.isRead,
						readAt: n.readAt?.toISOString() ?? null,
						createdAt: n.createdAt.toISOString(),
					}),
				),
				total,
				page,
				limit,
				totalPages,
			};

			return c.json(response, 200);
		},
	)

	// Get unread count
	.get(
		"/unread-count",
		describeRoute({
			tags: ["Notifications"],
			summary: "Get unread notification count",
			description: "Returns the number of unread notifications",
			responses: {
				200: {
					description: "Unread count retrieved",
					content: {
						"application/json": {
							schema: resolver(z.object({ count: z.number() })),
						},
					},
				},
			},
		}),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const count = await db.$count(
				notifications,
				and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
			);

			const response: UnreadCountDTO = { count };
			return c.json(response, 200);
		},
	)

	// Mark single notification as read
	.patch(
		"/:id/read",
		describeRoute({
			tags: ["Notifications"],
			summary: "Mark notification as read",
			description: "Marks a single notification as read",
			responses: {
				200: {
					description: "Notification marked as read",
					content: {
						"application/json": {
							schema: resolver(z.object({ success: z.boolean() })),
						},
					},
				},
				404: {
					description: "Notification not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}
			const notificationId = c.req.param("id");

			const result = await db
				.update(notifications)
				.set({ isRead: true, readAt: new Date() })
				.where(
					and(
						eq(notifications.id, notificationId),
						eq(notifications.userId, userId),
					),
				)
				.returning();

			if (!result[0]) {
				return c.json({ error: "Notification not found" }, 404);
			}

			return c.json({ success: true }, 200);
		},
	)

	// Mark all notifications as read
	.patch(
		"/read-all",
		describeRoute({
			tags: ["Notifications"],
			summary: "Mark all notifications as read",
			description: "Marks all unread notifications as read for the current user",
			responses: {
				200: {
					description: "All notifications marked as read",
					content: {
						"application/json": {
							schema: resolver(z.object({ count: z.number() })),
						},
					},
				},
			},
		}),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const result = await db
				.update(notifications)
				.set({ isRead: true, readAt: new Date() })
				.where(
					and(
						eq(notifications.userId, userId),
						eq(notifications.isRead, false),
					),
				)
				.returning();

			return c.json({ count: result.length }, 200);
		},
	)

	// Delete single notification
	.delete(
		"/:id",
		describeRoute({
			tags: ["Notifications"],
			summary: "Delete notification",
			description: "Deletes a single notification for the current user",
			responses: {
				200: {
					description: "Notification deleted",
					content: {
						"application/json": {
							schema: resolver(z.object({ success: z.boolean() })),
						},
					},
				},
				404: {
					description: "Notification not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}
			const notificationId = c.req.param("id");

			const result = await db
				.delete(notifications)
				.where(
					and(
						eq(notifications.id, notificationId),
						eq(notifications.userId, userId),
					),
				)
				.returning({ id: notifications.id });

			if (!result[0]) {
				return c.json({ error: "Notification not found" }, 404);
			}

			return c.json({ success: true }, 200);
		},
	)

	// Delete all notifications
	.delete(
		"/",
		describeRoute({
			tags: ["Notifications"],
			summary: "Delete all notifications",
			description: "Deletes all notifications for the current user",
			responses: {
				200: {
					description: "All notifications deleted",
					content: {
						"application/json": {
							schema: resolver(z.object({ count: z.number() })),
						},
					},
				},
			},
		}),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const result = await db
				.delete(notifications)
				.where(eq(notifications.userId, userId))
				.returning({ id: notifications.id });

			return c.json({ count: result.length }, 200);
		},
	)

	// Get notification preferences
	.get(
		"/preferences",
		describeRoute({
			tags: ["Notifications"],
			summary: "Get notification preferences",
			description:
				"Returns notification preferences for the current user (creates default if not exists)",
			responses: {
				200: {
					description: "Preferences retrieved",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
			},
		}),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// Get or create preferences
			let prefs = await db
				.select()
				.from(notificationPreferences)
				.where(eq(notificationPreferences.userId, userId))
				.limit(1);

			if (!prefs[0]) {
				// Create default preferences
				const [newPrefs] = await db
					.insert(notificationPreferences)
					.values({ userId })
					.returning();
				prefs = [newPrefs!];
			}

			const response: NotificationPreferencesDTO = {
				id: prefs[0]!.id,
				userId: prefs[0]!.userId,
				emailEnabled: prefs[0]!.emailEnabled,
				pushEnabled: prefs[0]!.pushEnabled,
				orderUpdates: prefs[0]!.orderUpdates,
				deliveryAlerts: prefs[0]!.deliveryAlerts,
				promotions: prefs[0]!.promotions,
				newOrders: prefs[0]!.newOrders,
				lowStock: prefs[0]!.lowStock,
				soundEnabled: prefs[0]!.soundEnabled,
				updatedAt: prefs[0]!.updatedAt.toISOString(),
			};

			return c.json(response, 200);
		},
	)

	// Update notification preferences
	.put(
		"/preferences",
		describeRoute({
			tags: ["Notifications"],
			summary: "Update notification preferences",
			description: "Updates notification preferences for the current user",
			responses: {
				200: {
					description: "Preferences updated",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
			},
		}),
		zValidator("json", notificationPreferencesUpdateSchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}
			const updates = c.req.valid("json");

			// Upsert preferences
			const [prefs] = await db
				.insert(notificationPreferences)
				.values({
					userId,
					...updates,
					updatedAt: new Date(),
				})
				.onConflictDoUpdate({
					target: notificationPreferences.userId,
					set: {
						...updates,
						updatedAt: new Date(),
					},
				})
				.returning();

			const response: NotificationPreferencesDTO = {
				id: prefs!.id,
				userId: prefs!.userId,
				emailEnabled: prefs!.emailEnabled,
				pushEnabled: prefs!.pushEnabled,
				orderUpdates: prefs!.orderUpdates,
				deliveryAlerts: prefs!.deliveryAlerts,
				promotions: prefs!.promotions,
				newOrders: prefs!.newOrders,
				lowStock: prefs!.lowStock,
				soundEnabled: prefs!.soundEnabled,
				updatedAt: prefs!.updatedAt.toISOString(),
			};

			return c.json(response, 200);
		},
	)

	// Get VAPID public key
	.get(
		"/push/vapid-public-key",
		describeRoute({
			tags: ["Notifications"],
			summary: "Get VAPID public key",
			description:
				"Returns the VAPID public key needed for push subscription on the client",
			responses: {
				200: {
					description: "VAPID public key",
					content: {
						"application/json": {
							schema: resolver(z.object({ publicKey: z.string() })),
						},
					},
				},
			},
		}),
		async (c) => {
			return c.json({ publicKey: getVapidPublicKey() }, 200);
		},
	)

	// Subscribe to push notifications
	.post(
		"/push/subscribe",
		describeRoute({
			tags: ["Notifications"],
			summary: "Subscribe to push notifications",
			description: "Registers a push notification subscription for the current user",
			responses: {
				200: {
					description: "Subscription registered",
					content: {
						"application/json": {
							schema: resolver(z.object({ success: z.boolean() })),
						},
					},
				},
			},
		}),
		zValidator("json", pushSubscriptionSchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}
			const subscription = c.req.valid("json");

			// Upsert subscription (update if endpoint already exists)
			await db
				.insert(pushSubscriptions)
				.values({
					userId,
					endpoint: subscription.endpoint,
					p256dh: subscription.keys.p256dh,
					auth: subscription.keys.auth,
					userAgent: subscription.userAgent ?? null,
				})
				.onConflictDoUpdate({
					target: pushSubscriptions.endpoint,
					set: {
						userId,
						p256dh: subscription.keys.p256dh,
						auth: subscription.keys.auth,
						userAgent: subscription.userAgent ?? null,
					},
				});

			return c.json({ success: true }, 200);
		},
	)

	// Unsubscribe from push notifications
	.post(
		"/push/unsubscribe",
		describeRoute({
			tags: ["Notifications"],
			summary: "Unsubscribe from push notifications",
			description: "Removes push notification subscription for the current user",
			responses: {
				200: {
					description: "Subscription removed",
					content: {
						"application/json": {
							schema: resolver(z.object({ success: z.boolean() })),
						},
					},
				},
			},
		}),
		zValidator("json", z.object({ endpoint: z.string() })),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}
			const { endpoint } = c.req.valid("json");

			await db
				.delete(pushSubscriptions)
				.where(
					and(
						eq(pushSubscriptions.endpoint, endpoint),
						eq(pushSubscriptions.userId, userId),
					),
				);

			return c.json({ success: true }, 200);
		},
	);

export { notificationsRouter };
export type NotificationsRouterType = typeof notificationsRouter;
