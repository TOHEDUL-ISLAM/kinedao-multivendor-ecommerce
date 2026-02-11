import { api } from "./api-client";

/**
 * Check if push notifications are supported in this browser
 */
export function isPushSupported(): boolean {
	return (
		"serviceWorker" in navigator &&
		"PushManager" in window &&
		"Notification" in window
	);
}

/**
 * Check current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
	if (!("Notification" in window)) {
		return "denied";
	}
	return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (!("Notification" in window)) {
		console.warn("Notifications not supported");
		return "denied";
	}

	if (Notification.permission === "granted") {
		return "granted";
	}

	if (Notification.permission === "denied") {
		return "denied";
	}

	// Request permission
	const permission = await Notification.requestPermission();
	return permission;
}

/**
 * Register service worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	if (!("serviceWorker" in navigator)) {
		console.warn("Service Worker not supported");
		return null;
	}

	try {
		const registration = await navigator.serviceWorker.register("/sw.js", {
			scope: "/",
		});

		console.log("Service Worker registered:", registration);

		// Wait for the service worker to be ready
		await navigator.serviceWorker.ready;

		return registration;
	} catch (error) {
		console.error("Service Worker registration failed:", error);
		return null;
	}
}

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
	if (!isPushSupported()) {
		console.warn("Push notifications not supported");
		return null;
	}

	try {
		// Get notification permission first
		const permission = await requestNotificationPermission();
		if (permission !== "granted") {
			console.log("Notification permission denied");
			return null;
		}

		// Register service worker
		const registration = await registerServiceWorker();
		if (!registration) {
			console.error("Failed to register service worker");
			return null;
		}

		// Get VAPID public key from server
		const vapidResponse = await api.notifications.push[
			"vapid-public-key"
		].$get();
		if (!vapidResponse.ok) {
			console.error("Failed to get VAPID public key");
			return null;
		}

		const { publicKey } = await vapidResponse.json();

		// Subscribe to push
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
		});

		console.log("Push subscription created:", subscription);

		// Send subscription to server
		const subscribeResponse = await api.notifications.push.subscribe.$post({
			json: {
				endpoint: subscription.endpoint,
				keys: {
					p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
					auth: arrayBufferToBase64(subscription.getKey("auth")),
				},
				userAgent: navigator.userAgent,
			},
		});

		if (!subscribeResponse.ok) {
			console.error("Failed to save subscription to server");
			return null;
		}

		return subscription;
	} catch (error) {
		console.error("Error subscribing to push notifications:", error);
		return null;
	}
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
	if (!("serviceWorker" in navigator)) {
		return false;
	}

	try {
		const registration = await navigator.serviceWorker.getRegistration();
		if (!registration) {
			return false;
		}

		const subscription = await registration.pushManager.getSubscription();
		if (!subscription) {
			return false;
		}

		// Unsubscribe from browser
		await subscription.unsubscribe();

		// Remove from server
		await api.notifications.push.unsubscribe.$post({
			json: {
				endpoint: subscription.endpoint,
			},
		});

		console.log("Unsubscribed from push notifications");
		return true;
	} catch (error) {
		console.error("Error unsubscribing from push notifications:", error);
		return false;
	}
}

/**
 * Check if user is currently subscribed to push
 */
export async function isSubscribedToPush(): Promise<boolean> {
	if (!("serviceWorker" in navigator)) {
		return false;
	}

	try {
		const registration = await navigator.serviceWorker.getRegistration();
		if (!registration) {
			return false;
		}

		const subscription = await registration.pushManager.getSubscription();
		return subscription !== null;
	} catch (error) {
		console.error("Error checking push subscription:", error);
		return false;
	}
}

/**
 * Helper to convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
	if (!buffer) return "";

	const bytes = new Uint8Array(buffer);
	let binary = "";
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}

/**
 * Show a test notification (requires permission)
 */
export async function showTestNotification(): Promise<void> {
	if (!("Notification" in window)) {
		console.warn("Notifications not supported");
		return;
	}

	if (Notification.permission !== "granted") {
		console.warn("Notification permission not granted");
		return;
	}

	const registration = await navigator.serviceWorker.getRegistration();
	if (!registration) {
		console.warn("Service worker not registered");
		return;
	}

	await registration.showNotification("Test Notification", {
		body: "This is a test notification from KineDao",
		icon: "/favicon.ico",
		badge: "/favicon.ico",
		tag: "test",
		requireInteraction: false,
	});
}
