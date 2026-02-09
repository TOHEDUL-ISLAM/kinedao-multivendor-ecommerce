import { createFileRoute } from "@tanstack/react-router";
import { Stack, Title, Alert } from "@mantine/core";
import { Info } from "lucide-react";
import { useLanguage } from "@/lib/i18n/use-language";
import { useVendorTheme, vendorColors } from "@/lib/vendor-theme";

export const Route = createFileRoute("/vendor/_dashboard/settings")({
  component: SettingsPage,
});

const labels = {
  en: {
    title: "Settings",
    comingSoon: "Settings Coming Soon",
    description: "Shop settings, profile management, and notification preferences will be available here.",
  },
  bn: {
    title: "সেটিংস",
    comingSoon: "সেটিংস শীঘ্রই আসছে",
    description: "দোকান সেটিংস, প্রোফাইল ম্যানেজমেন্ট এবং নোটিফিকেশন পছন্দ এখানে পাওয়া যাবে।",
  },
} as const;

function SettingsPage() {
  const { language } = useLanguage();
  const t = labels[language];
  const { isDark } = useVendorTheme();

  return (
    <Stack gap="lg">
      <Title order={3} style={{ color: vendorColors.text.primary(isDark) }}>
        {t.title}
      </Title>

      <Alert
        radius="lg"
        icon={<Info size={20} />}
        title={t.comingSoon}
        styles={{
          root: {
            background: isDark
              ? "linear-gradient(135deg, oklch(0.22 0.04 240) 0%, oklch(0.2 0.03 230) 100%)"
              : "linear-gradient(135deg, oklch(0.97 0.03 240) 0%, oklch(0.98 0.02 230) 100%)",
            border: isDark
              ? "1px solid oklch(0.7 0.15 240 / 0.2)"
              : "1px solid oklch(0.6 0.15 240 / 0.2)",
            boxShadow: isDark
              ? "0 4px 20px oklch(0 0 0 / 0.3)"
              : "0 4px 20px oklch(0.6 0.15 240 / 0.08)",
          },
          icon: {
            background:
              "linear-gradient(135deg, oklch(0.6 0.15 240) 0%, oklch(0.65 0.13 230) 100%)",
            color: "white",
          },
          title: {
            color: isDark ? "oklch(0.85 0.08 240)" : "oklch(0.4 0.08 240)",
            fontWeight: 700,
          },
          message: {
            color: isDark ? "oklch(0.7 0.06 240)" : "oklch(0.45 0.06 240)",
          },
        }}
      >
        {t.description}
      </Alert>
    </Stack>
  );
}
