import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { Container, Stack } from "@mantine/core";
import { useTranslation } from "@/hooks/use-translation";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/account/notifications")({
	component: NotificationsSettingsPage,
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({
				to: "/login",
				search: { redirect: "/account/notifications" },
			});
		}
		return { session };
	},
});

function NotificationsSettingsPage() {
	const { language } = useTranslation();
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isDark = mounted ? resolvedTheme === "dark" : false;

	return (
		<Container size="md" py="xl">
			<Stack gap="lg">
				<NotificationPreferences
					channel="customer"
					language={language}
					isDark={isDark}
				/>
			</Stack>
		</Container>
	);
}
