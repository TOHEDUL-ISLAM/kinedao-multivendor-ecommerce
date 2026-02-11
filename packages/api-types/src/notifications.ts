import { z } from "zod";

// =====================
// Notification Types
// =====================

export const NOTIFICATION_TYPES = [
	// Customer notifications
	"order_placed",
	"order_confirmed",
	"order_processing",
	"order_shipped",
	"order_delivered",
	"order_cancelled",
	"cod_verification",
	// Vendor notifications
	"new_order",
	"cod_verified",
	"product_approved",
	"product_rejected",
	"vendor_approved",
	"low_stock",
	// Admin notifications
	"failed_delivery",
	"high_rejection_rate",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ["customer", "vendor", "admin"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

// =====================
// Notification DTOs
// =====================

export interface NotificationDTO {
	id: string;
	type: NotificationType;
	title: string;
	titleBn: string | null;
	body: string;
	bodyBn: string | null;
	data: Record<string, unknown> | null; // { orderId, orderNumber, productId, etc. }
	channel: NotificationChannel;
	isRead: boolean;
	readAt: string | null; // ISO timestamp
	createdAt: string; // ISO timestamp
}

export interface NotificationListResponseDTO {
	notifications: NotificationDTO[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface UnreadCountDTO {
	count: number;
}

// =====================
// Notification Preferences
// =====================

export interface NotificationPreferencesDTO {
	id: string;
	userId: string;
	emailEnabled: boolean;
	pushEnabled: boolean;
	orderUpdates: boolean;
	deliveryAlerts: boolean;
	promotions: boolean;
	newOrders: boolean;
	lowStock: boolean;
	soundEnabled: boolean;
	updatedAt: string; // ISO timestamp
}

export const notificationPreferencesUpdateSchema = z.object({
	emailEnabled: z.boolean().optional(),
	pushEnabled: z.boolean().optional(),
	orderUpdates: z.boolean().optional(),
	deliveryAlerts: z.boolean().optional(),
	promotions: z.boolean().optional(),
	newOrders: z.boolean().optional(),
	lowStock: z.boolean().optional(),
	soundEnabled: z.boolean().optional(),
});

export type NotificationPreferencesUpdateInput = z.infer<
	typeof notificationPreferencesUpdateSchema
>;

// =====================
// Push Subscriptions
// =====================

export const pushSubscriptionSchema = z.object({
	endpoint: z.string().min(1),
	keys: z.object({
		p256dh: z.string(),
		auth: z.string(),
	}),
	userAgent: z.string().optional(),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

// =====================
// Query Schemas
// =====================

export const notificationListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	channel: z.enum(NOTIFICATION_CHANNELS).optional(),
	unreadOnly: z.coerce.boolean().default(false),
});

export type NotificationListQuery = z.infer<
	typeof notificationListQuerySchema
>;
