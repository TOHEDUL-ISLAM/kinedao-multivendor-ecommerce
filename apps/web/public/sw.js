// Service Worker for Web Push Notifications
// This is a minimal service worker focused solely on push notifications
// It does NOT cache assets or provide offline functionality

const NOTIFICATION_ICON = "/favicon.ico";
const NOTIFICATION_BADGE = "/favicon.ico";

// Install event - activate immediately
self.addEventListener("install", (event) => {
	console.log("[Service Worker] Installing...");
	// Skip waiting to activate immediately
	self.skipWaiting();
});

// Activate event - claim all clients immediately
self.addEventListener("activate", (event) => {
	console.log("[Service Worker] Activating...");
	event.waitUntil(self.clients.claim());
});

// Push event - show notification
self.addEventListener("push", (event) => {
	console.log("[Service Worker] Push received");

	if (!event.data) {
		console.log("[Service Worker] Push event has no data");
		return;
	}

	try {
		const data = event.data.json();
		console.log("[Service Worker] Push data:", data);

		const title = data.title || "KineDao Notification";
		const options = {
			body: data.body || "",
			icon: data.icon || NOTIFICATION_ICON,
			badge: data.badge || NOTIFICATION_BADGE,
			data: data.data || {},
			tag: data.data?.type || "notification",
			requireInteraction: false,
			vibrate: [200, 100, 200],
		};

		event.waitUntil(self.registration.showNotification(title, options));
	} catch (error) {
		console.error("[Service Worker] Error parsing push data:", error);
	}
});

// Notification click event - open relevant URL
self.addEventListener("notificationclick", (event) => {
	console.log("[Service Worker] Notification clicked");

	event.notification.close();

	const urlToOpen = event.notification.data?.url || "/";

	event.waitUntil(
		self.clients
			.matchAll({
				type: "window",
				includeUncontrolled: true,
			})
			.then((clientList) => {
				// Check if there's already a window open with this URL
				for (const client of clientList) {
					if (client.url === urlToOpen && "focus" in client) {
						return client.focus();
					}
				}

				// If no window is open with the URL, open a new one
				if (self.clients.openWindow) {
					return self.clients.openWindow(urlToOpen);
				}
			}),
	);
});

// Handle push subscription changes
self.addEventListener("pushsubscriptionchange", (event) => {
	console.log("[Service Worker] Push subscription changed");

	event.waitUntil(
		// Attempt to resubscribe
		self.registration.pushManager
			.subscribe({
				userVisibleOnly: true,
				applicationServerKey: event.oldSubscription?.options?.applicationServerKey,
			})
			.then((subscription) => {
				console.log("[Service Worker] Resubscribed to push notifications");
				// In a real application, you would send the new subscription to your server
				// For now, we just log it
				return subscription;
			})
			.catch((error) => {
				console.error("[Service Worker] Failed to resubscribe:", error);
			}),
	);
});

console.log("[Service Worker] Loaded");
