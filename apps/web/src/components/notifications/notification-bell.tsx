import { Bell } from "lucide-react";
import { Indicator, Popover, ScrollArea, ActionIcon, Text, Stack, Group, Badge, Button } from "@mantine/core";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import type { NotificationDTO } from "@kineDao.com/api-types";

export function NotificationBell() {
	const { unreadCount, notifications, markAsRead, markAllAsRead, isMarkingAllAsRead } = useNotifications();

	return (
		<Popover width={360} position="bottom-end" shadow="md">
			<Popover.Target>
				<ActionIcon variant="subtle" size="lg" aria-label="Notifications">
					<Indicator disabled={unreadCount === 0} label={unreadCount} size={16} color="red">
						<Bell size={20} />
					</Indicator>
				</ActionIcon>
			</Popover.Target>

			<Popover.Dropdown p={0}>
				<Stack gap={0}>
					{/* Header */}
					<Group justify="space-between" p="md" style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}>
						<Text fw={600} size="sm">Notifications</Text>
						{notifications.length > 0 && (
							<Button
								variant="subtle"
								size="compact-xs"
								onClick={() => markAllAsRead()}
								loading={isMarkingAllAsRead}
							>
								Mark all read
							</Button>
						)}
					</Group>

					{/* Notification List */}
					<ScrollArea h={400}>
						{notifications.length === 0 ? (
							<Stack align="center" justify="center" h={200} gap="xs">
								<Bell size={40} strokeWidth={1.5} opacity={0.3} />
								<Text size="sm" c="dimmed">No notifications yet</Text>
							</Stack>
						) : (
							<Stack gap={0}>
								{notifications.map((notification: NotificationDTO) => (
									<button
										key={notification.id}
										onClick={() => !notification.isRead && markAsRead(notification.id)}
										style={{
											all: "unset",
											cursor: "pointer",
											display: "block",
											padding: "12px 16px",
											borderBottom: "1px solid var(--mantine-color-gray-2)",
											backgroundColor: notification.isRead
												? "transparent"
												: "var(--mantine-color-blue-0)",
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
											<Stack gap={4} style={{ flex: 1 }}>
												<Group gap="xs">
													<Text size="sm" fw={notification.isRead ? 400 : 600} lineClamp={1}>
														{notification.title}
													</Text>
													{!notification.isRead && (
														<Badge size="xs" variant="filled" color="blue" circle />
													)}
												</Group>
												<Text size="xs" c="dimmed" lineClamp={2}>
													{notification.body}
												</Text>
												<Text size="xs" c="dimmed">
													{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
												</Text>
											</Stack>
										</Group>
									</button>
								))}
							</Stack>
						)}
					</ScrollArea>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
}
