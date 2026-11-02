import webPush from "web-push";
import { env } from "@kineDao.com/env/server";
import { db } from "@kineDao.com/db";
import { pushSubscriptions } from "@kineDao.com/db/schema";
import { eq } from "drizzle-orm";

// Configure web-push with VAPID details (only if all keys are present)
const vapidConfigured =
	env.VAPID_SUBJECT && env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY;

if (vapidConfigured) {
	webPush.setVapidDetails(
		env.VAPID_SUBJECT!,
		env.VAPID_PUBLIC_KEY!,
		env.VAPID_PRIVATE_KEY!,
	);
}

export interface PushNotificationPayload {
	title: string;
	body: string;
	icon?: string;
	badge?: string;
	data?: {
		url?: string;
		[key: string]: unknown;
	};
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification(
	userId: string,
	payload: PushNotificationPayload,
): Promise<void> {
	if (!vapidConfigured) {
		console.warn("[PUSH] VAPID keys not configured — skipping push notification");
		return;
	}
	try {
		// Get all push subscriptions for this user
		const subscriptions = await db
			.select()
			.from(pushSubscriptions)
			.where(eq(pushSubscriptions.userId, userId));

		if (subscriptions.length === 0) {
			console.log(`No push subscriptions found for user ${userId}`);
			return;
		}

		// Send to all subscriptions in parallel
		const results = await Promise.allSettled(
			subscriptions.map(async (sub) => {
				try {
					const pushSubscription = {
						endpoint: sub.endpoint,
						keys: {
							p256dh: sub.p256dh,
							auth: sub.auth,
						},
					};

					const notificationPayload = JSON.stringify({
						title: payload.title,
						body: payload.body,
						icon: payload.icon || "/favicon.ico",
						badge: payload.badge || "/favicon.ico",
						data: payload.data || {},
					});

					await webPush.sendNotification(pushSubscription, notificationPayload);
					console.log(`Push sent to subscription ${sub.id}`);
				} catch (error: unknown) {
					// Handle expired or invalid subscriptions
					if (
						error &&
						typeof error === "object" &&
						"statusCode" in error &&
						(error.statusCode === 410 || error.statusCode === 404)
					) {
						console.log(
							`Removing invalid/expired subscription ${sub.id} (status: ${error.statusCode})`,
						);
						await db
							.delete(pushSubscriptions)
							.where(eq(pushSubscriptions.id, sub.id));
					} else {
						console.error(`Failed to send push to subscription ${sub.id}:`, error);
					}
					throw error;
				}
			}),
		);

		// Log results
		const successful = results.filter((r) => r.status === "fulfilled").length;
		const failed = results.filter((r) => r.status === "rejected").length;
		console.log(
			`Push notification sent: ${successful} successful, ${failed} failed`,
		);
	} catch (error) {
		console.error("Error sending push notification:", error);
		// Don't throw - push notifications should never block the main flow
	}
}

/**
 * Get VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string {
	if (!env.VAPID_PUBLIC_KEY) {
		throw new Error("VAPID_PUBLIC_KEY is not configured");
	}
	return env.VAPID_PUBLIC_KEY;
}
