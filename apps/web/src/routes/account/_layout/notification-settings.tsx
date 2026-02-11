import { createFileRoute, redirect } from "@tanstack/react-router";
import { Container, Stack } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { getUser } from "@/functions/get-user";
import { useTranslation } from "@/hooks/use-translation";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";

export const Route = createFileRoute("/account/_layout/notification-settings")({
  component: NotificationSettingsPage,
  beforeLoad: async () => {
    const session = await getUser();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: "/account/notification-settings" },
      });
    }
    return { session };
  },
});

function NotificationSettingsPage() {
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
        <NotificationPreferences channel="customer" language={language} isDark={isDark} />
      </Stack>
    </Container>
  );
}
