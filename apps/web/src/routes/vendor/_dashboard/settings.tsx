import { createFileRoute } from "@tanstack/react-router";
import { Stack } from "@mantine/core";
import { useLanguage } from "@/lib/i18n/use-language";
import { useVendorTheme } from "@/lib/vendor-theme";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";

export const Route = createFileRoute("/vendor/_dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { language } = useLanguage();
  const { isDark } = useVendorTheme();

  return (
    <Stack gap="lg" maw={800}>
      <NotificationPreferences
        channel="vendor"
        language={language}
        isDark={isDark}
      />
    </Stack>
  );
}
