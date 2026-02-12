import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { Bell, Trash2 } from "lucide-react";
import { ActionIcon, Badge, Button, Card, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { formatDistanceToNow } from "date-fns";

import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationDTO } from "@kineDao.com/api-types";

export const Route = createFileRoute("/account/_layout/notifications")({
	component: NotificationsPage,
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({
				to: "/login",
				search: { redirect: "/account/notifications" },
			})
		}
		return { session };
	},
});

function getNotificationUrl(notification: NotificationDTO): string {
	const data = notification.data as Record<string, unknown> | null;
	const type = notification.type;

	if (["order_placed", "order_confirmed", "order_processing", "order_shipped", "order_delivered", "order_cancelled"].includes(type)) {
		return data?.orderId ? `/account/orders/${data.orderId}` : "/account/orders";
	}

	return "/";
}

function NotificationsPage() {
	const navigate = useNavigate();
	const {
		notifications,
		unreadCount,
		markAsRead,
		markAllAsRead,
		deleteNotification,
		deleteAllNotifications,
		isMarkingAllAsRead,
		isDeletingAllNotifications,
	} = useNotifications();

	return (
		<Card withBorder radius="lg" p="lg">
			<Stack gap="md">
				<Group justify="space-between" align="center">
					<div>
						<Text fw={700} size="xl">Notifications</Text>
						<Text size="sm" c="dimmed">View your recent updates and alerts</Text>
					</div>
					<Group gap="xs">
						<Button
							variant="outline"
							size="xs"
							component={Link}
							to="/account/notification-settings"
						>
							Notification Settings
						</Button>
						<Button
							variant="light"
							size="xs"
							onClick={() => markAllAsRead()}
							loading={isMarkingAllAsRead}
							disabled={notifications.length === 0}
						>
							Mark all read
						</Button>
						<Button
							variant="light"
							color="red"
							size="xs"
							onClick={() => deleteAllNotifications()}
							loading={isDeletingAllNotifications}
							disabled={notifications.length === 0}
						>
							Delete all
						</Button>
					</Group>
				</Group>

				{unreadCount > 0 ? (
					<Text size="sm" c="dimmed">{unreadCount} unread notification(s)</Text>
				) : null}

				<ScrollArea h={420}>
					{notifications.length === 0 ? (
						<Stack align="center" justify="center" h={280} gap="xs">
							<Bell size={38} strokeWidth={1.5} opacity={0.35} />
							<Text size="sm" c="dimmed">No notifications yet</Text>
						</Stack>
					) : (
						<Stack gap={0}>
							{notifications.map((notification: NotificationDTO) => (
								<div
									key={notification.id}
									style={{
										display: "block",
										padding: "12px 14px",
										borderBottom: "1px solid var(--mantine-color-gray-2)",
										backgroundColor: notification.isRead ? "transparent" : "var(--mantine-color-blue-0)",
										transition: "background-color 0.2s",
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = "var(--mantine-color-gray-1)";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor = notification.isRead
											? "transparent"
											: "var(--mantine-color-blue-0)";
									}}
								>
									<Group justify="space-between" align="flex-start" wrap="nowrap">
										<button
											type="button"
											onClick={() => {
												if (!notification.isRead) markAsRead(notification.id);
												navigate({ to: getNotificationUrl(notification) });
											}}
											style={{
												all: "unset",
												cursor: "pointer",
												display: "block",
												flex: 1,
											}}
										>
											<Stack gap={4}>
												<Group gap="xs">
													<Text size="sm" fw={notification.isRead ? 400 : 600} lineClamp={1}>
														{notification.title}
													</Text>
													{!notification.isRead ? (
														<Badge size="xs" variant="filled" color="blue" circle />
													) : null}
												</Group>
												<Text size="xs" c="dimmed" lineClamp={2}>
													{notification.body}
												</Text>
												<Text size="xs" c="dimmed">
													{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
												</Text>
											</Stack>
										</button>

										<ActionIcon
											variant="subtle"
											color="red"
											aria-label="Delete notification"
											onClick={() => deleteNotification(notification.id)}
										>
											<Trash2 size={16} />
										</ActionIcon>
									</Group>
								</div>
							))}
						</Stack>
					)}
				</ScrollArea>
			</Stack>
		</Card>
	)
}
