import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const SSE_RECONNECT_DELAY = 3000; // 3 seconds

export function useNotifications() {
	const queryClient = useQueryClient();
	const [isConnected, setIsConnected] = useState(false);
	const eventSourceRef = useRef<EventSource | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Fetch unread count
	const { data: unreadData } = useQuery({
		queryKey: ["notifications", "unread-count"],
		queryFn: async () => {
			const response = await api.notifications["unread-count"].$get();
			if (response.ok) {
				return response.json();
			}
			throw new Error("Failed to fetch unread count");
		},
		refetchInterval: 30000, // Refetch every 30s as fallback
	});

	// Fetch notification list
	const { data: notificationsData } = useQuery({
		queryKey: ["notifications", "list"],
		queryFn: async () => {
			const response = await api.notifications.$get({
				query: { page: "1", limit: "20" },
			});
			if (response.ok) {
				return response.json();
			}
			throw new Error("Failed to fetch notifications");
		},
	});

	// Mark single notification as read
	const markAsReadMutation = useMutation({
		mutationFn: async (notificationId: string) => {
			const response = await api.notifications[":id"].read.$patch({
				param: { id: notificationId },
			});
			if (!response.ok) {
				throw new Error("Failed to mark as read");
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});

	// Mark all as read
	const markAllAsReadMutation = useMutation({
		mutationFn: async () => {
			const response = await api.notifications["read-all"].$patch();
			if (!response.ok) {
				throw new Error("Failed to mark all as read");
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		},
	});

	// SSE connection setup
	const connectSSE = useCallback(() => {
		// Don't connect if already connected
		if (eventSourceRef.current?.readyState === EventSource.OPEN) {
			return;
		}

		try {
			const eventSource = new EventSource(
				`${import.meta.env.VITE_SERVER_URL}/api/notifications/stream`,
				{ withCredentials: true }
			);

			eventSource.onopen = () => {
				console.log("[SSE] Connected to notification stream");
				setIsConnected(true);
				// Clear any pending reconnect
				if (reconnectTimeoutRef.current) {
					clearTimeout(reconnectTimeoutRef.current);
					reconnectTimeoutRef.current = null;
				}
			};

			eventSource.addEventListener("notification", (event) => {
				try {
					const data = JSON.parse(event.data);
					console.log("[SSE] Received notification:", data);

					// Show toast notification
					toast.success(data.title, {
						description: data.body,
					});

					// Invalidate queries to refresh data
					queryClient.invalidateQueries({ queryKey: ["notifications"] });
				} catch (error) {
					console.error("[SSE] Failed to parse notification:", error);
				}
			});

			eventSource.addEventListener("system", (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data.type === "connected") {
						console.log("[SSE] System: connection confirmed");
					} else if (data.type === "heartbeat") {
						// Silent heartbeat
					}
				} catch (error) {
					console.error("[SSE] Failed to parse system event:", error);
				}
			});

			eventSource.onerror = (error) => {
				console.error("[SSE] Connection error:", error);
				setIsConnected(false);
				eventSource.close();

				// Attempt to reconnect after delay
				if (!reconnectTimeoutRef.current) {
					reconnectTimeoutRef.current = setTimeout(() => {
						console.log("[SSE] Attempting to reconnect...");
						reconnectTimeoutRef.current = null;
						connectSSE();
					}, SSE_RECONNECT_DELAY);
				}
			};

			eventSourceRef.current = eventSource;
		} catch (error) {
			console.error("[SSE] Failed to create EventSource:", error);
			setIsConnected(false);
		}
	}, [queryClient]);

	// Connect on mount, disconnect on unmount
	useEffect(() => {
		connectSSE();

		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
				eventSourceRef.current = null;
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
				reconnectTimeoutRef.current = null;
			}
		};
	}, [connectSSE]);

	return {
		// Data
		unreadCount: unreadData?.count ?? 0,
		notifications: notificationsData?.notifications ?? [],
		isConnected,

		// Actions
		markAsRead: (notificationId: string) =>
			markAsReadMutation.mutate(notificationId),
		markAllAsRead: () => markAllAsReadMutation.mutate(),

		// Loading states
		isMarkingAsRead: markAsReadMutation.isPending,
		isMarkingAllAsRead: markAllAsReadMutation.isPending,
	};
}
