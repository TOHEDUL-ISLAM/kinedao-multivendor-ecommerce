import { db } from "@kineDao.com/db";
import {
	adminUsers,
	notifications,
	notificationPreferences,
	user,
	vendorApplications,
} from "@kineDao.com/db/schema";
import type {
	NotificationChannel,
	NotificationType,
} from "@kineDao.com/api-types";
import { eq, sql } from "drizzle-orm";
import type { SSEStreamingApi } from "hono/streaming";
import * as NotificationEmails from "./notification-emails";
import { sendPushNotification } from "./web-push";

// SSE connection manager
const sseConnections = new Map<string, Set<SSEStreamingApi>>();

export function addSSEConnection(userId: string, stream: SSEStreamingApi) {
	if (!sseConnections.has(userId)) {
		sseConnections.set(userId, new Set());
	}
	sseConnections.get(userId)!.add(stream);
}

export function removeSSEConnection(userId: string, stream: SSEStreamingApi) {
	const userStreams = sseConnections.get(userId);
	if (userStreams) {
		userStreams.delete(stream);
		if (userStreams.size === 0) {
			sseConnections.delete(userId);
		}
	}
}

function broadcastSSE(
	userId: string,
	data: {
		type: string;
		id: string;
		title: string;
		body: string;
		unreadCount: number;
	},
) {
	const userStreams = sseConnections.get(userId);
	if (userStreams) {
		for (const stream of userStreams) {
			try {
				stream.writeSSE({
					data: JSON.stringify(data),
					event: "notification",
					id: data.id,
				});
			} catch (error) {
				console.error("SSE write error:", error);
				// Stream will be cleaned up by disconnect handler
			}
		}
	}
}

// Helper to determine notification click URL
function getNotificationUrl(
	type: NotificationType,
	data?: Record<string, unknown>,
): string {
	switch (type) {
		// Customer notifications - go to orders page
		case "order_placed":
		case "order_confirmed":
		case "order_processing":
		case "order_shipped":
		case "order_delivered":
		case "order_cancelled":
			return data?.orderId
				? `/account/orders/${data.orderId}`
				: "/account/orders";

		// Vendor notifications - go to vendor orders
		case "new_order":
		case "cod_verified":
			return data?.orderId
				? `/vendor/orders?orderId=${data.orderId}`
				: "/vendor/orders";

		// Product notifications - go to vendor products
		case "product_approved":
		case "product_rejected":
			return "/vendor/products";

		// Vendor application approved
		case "vendor_approved":
			return "/vendor/dashboard";

		// Low stock - go to vendor products
		case "low_stock":
			return "/vendor/products";
		case "new_review":
		case "review_moderated":
			return data?.reviewId
				? `/vendor/reviews?reviewId=${data.reviewId}`
				: "/vendor/reviews";

		// Admin notifications
		case "failed_delivery":
		case "high_rejection_rate":
			return "/admin/dashboard";

		default:
			return "/";
	}
}

// Email notification map
const EMAIL_NOTIFICATION_MAP: Record<NotificationType, boolean> = {
	// Customer notifications
	order_placed: true, // Already sent via order-email.ts
	order_confirmed: true,
	order_processing: false,
	order_shipped: true,
	order_delivered: true,
	order_cancelled: true,
	cod_verification: false,
	// Vendor notifications
	new_order: true,
	cod_verified: false,
	product_approved: true,
	product_rejected: true,
	vendor_approved: true,
	low_stock: true,
	new_review: false,
	review_moderated: false,
	// Admin notifications
	failed_delivery: true,
	high_rejection_rate: true,
};

interface NotifyParams {
	userId: string;
	type: NotificationType;
	title: string;
	titleBn?: string;
	body: string;
	bodyBn?: string;
	data?: Record<string, unknown>;
	channel: NotificationChannel;
	emailData?: {
		userEmail: string;
		userName: string;
		[key: string]: unknown;
	};
}

export async function notify(params: NotifyParams): Promise<void> {
	const {
		userId,
		type,
		title,
		titleBn,
		body,
		bodyBn,
		data,
		channel,
		emailData,
	} = params;

	try {
		// 1. Create notification record in DB
		const [notification] = await db
			.insert(notifications)
			.values({
				userId,
				type,
				title,
				titleBn: titleBn ?? null,
				body,
				bodyBn: bodyBn ?? null,
				data: data ?? null,
				channel,
			})
			.returning();

		if (!notification) {
			throw new Error("Failed to create notification");
		}

		// Get unread count for this user
		const unreadResult = await db
			.$count(notifications, eq(notifications.userId, userId));
		const unreadCount = unreadResult;

		// 2. Broadcast via SSE (real-time)
		broadcastSSE(userId, {
			type,
			id: notification.id,
			title,
			body,
			unreadCount,
		});

		// Get user preferences for email and push
		const prefs = await db
			.select()
			.from(notificationPreferences)
			.where(eq(notificationPreferences.userId, userId))
			.limit(1);

		const emailEnabled = prefs[0]?.emailEnabled ?? true;
		const pushEnabled = prefs[0]?.pushEnabled ?? true;

		// 3. Send email (if applicable)
		if (EMAIL_NOTIFICATION_MAP[type] && emailData && emailEnabled) {
			// Fire-and-forget email sends (non-blocking)
			sendNotificationEmail(type, emailData).catch((error) => {
				console.error(`Email send failed for ${type}:`, error);
			});
		}

		// 4. Send Web Push (if enabled)
		if (pushEnabled) {
			// Fire-and-forget push notification (non-blocking)
			sendPushNotification(userId, {
				title,
				body,
				icon: "/favicon.ico",
				data: {
					url: getNotificationUrl(type, data),
					type,
					...data,
				},
			}).catch((error) => {
				console.error(`Push notification failed for ${type}:`, error);
			});
		}
	} catch (error) {
		console.error("Notification service error:", error);
		// Don't throw - notifications are non-critical
	}
}

// Helper to send appropriate email based on notification type
async function sendNotificationEmail(
	type: NotificationType,
	data: Record<string, unknown>,
): Promise<void> {
	const email = data.userEmail as string;
	const name = data.userName as string;

	switch (type) {
		case "order_confirmed":
			await NotificationEmails.sendOrderConfirmedEmail(
				email,
				name,
				data.orderNumber as string,
			);
			break;

		case "order_shipped":
			await NotificationEmails.sendOrderShippedEmail(
				email,
				name,
				data.orderNumber as string,
				data.trackingNumber as string | undefined,
				data.trackingCarrier as string | undefined,
			);
			break;

		case "order_delivered":
			await NotificationEmails.sendOrderDeliveredEmail(
				email,
				name,
				data.orderNumber as string,
			);
			break;

		case "order_cancelled":
			await NotificationEmails.sendOrderCancelledEmail(
				email,
				name,
				data.orderNumber as string,
				data.reason as string | undefined,
			);
			break;

		case "new_order":
			await NotificationEmails.sendNewOrderVendorEmail(
				email,
				name,
				data.orderNumber as string,
				data.total as number,
				data.itemCount as number,
			);
			break;

		case "product_approved":
			await NotificationEmails.sendProductApprovedEmail(
				email,
				name,
				data.productTitle as string,
			);
			break;

		case "product_rejected":
			await NotificationEmails.sendProductRejectedEmail(
				email,
				name,
				data.productTitle as string,
				data.reviewNotes as string,
			);
			break;

		case "vendor_approved":
			await NotificationEmails.sendVendorApprovedEmail(
				email,
				name,
				data.shopName as string,
			);
			break;

		// Add more cases as needed
		default:
			// No email for this type
			break;
	}
}

// Notify vendor by vendorId (resolves userId from vendor_applications)
export async function notifyVendor(
	vendorId: string,
	params: Omit<NotifyParams, "userId" | "channel">,
): Promise<void> {
	try {
		// Resolve vendor's userId from vendor_applications
		const application = await db
			.select({ userId: vendorApplications.userId })
			.from(vendorApplications)
			.where(eq(vendorApplications.vendorId, vendorId))
			.limit(1);

		if (!application[0]) {
			console.error(`Vendor application not found for vendorId: ${vendorId}`);
			return;
		}

		await notify({
			...params,
			userId: application[0].userId,
			channel: "vendor",
		});
	} catch (error) {
		console.error("notifyVendor error:", error);
	}
}

// Notify all admins (placeholder - implement when admin role system exists)
export async function notifyAdmin(
	params: Omit<NotifyParams, "userId" | "channel">,
): Promise<void> {
	try {
		let admins = await db
			.select({ userId: user.id })
			.from(user)
			.where(sql`${user.roles} && ARRAY['admin', 'super_admin']::text[]`);

		// Backward compatibility fallback while admin_users is still present.
		if (admins.length === 0) {
			admins = await db
				.select({ userId: adminUsers.userId })
				.from(adminUsers);
		}

		if (admins.length === 0) {
			return;
		}

		await Promise.all(
			admins.map((admin) =>
				notify({
					...params,
					userId: admin.userId,
					channel: "admin",
				}),
			),
		);
	} catch (error) {
		console.error("notifyAdmin error:", error);
	}
}
