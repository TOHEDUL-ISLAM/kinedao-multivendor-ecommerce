import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  SimpleGrid,
  Paper,
  Group,
  Text,
  Stack,
  Skeleton,
  Title,
  Alert,
  Box,
} from "@mantine/core";
import {
  DollarSign,
  Wallet,
  CreditCard,
  TrendingUp,
  Info,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";

export const Route = createFileRoute("/vendor/_dashboard/earnings")({
  component: EarningsPage,
});

function formatBDT(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const labels = {
  en: {
    title: "Earnings",
    totalEarnings: "Total Earnings",
    thisMonth: "This Month",
    pendingPayout: "Pending Payout",
    totalPaidOut: "Total Paid Out",
    deliveredOrders: "Delivered Orders",
    comingSoon: "Detailed earnings analytics and payout history coming soon.",
    payoutInfo: "Payouts are processed automatically. Contact support for any payout-related queries.",
  },
  bn: {
    title: "আয়",
    totalEarnings: "মোট আয়",
    thisMonth: "এই মাসে",
    pendingPayout: "অপেক্ষমাণ পেমেন্ট",
    totalPaidOut: "মোট পরিশোধ",
    deliveredOrders: "ডেলিভারড অর্ডার",
    comingSoon: "বিস্তারিত আয় বিশ্লেষণ এবং পেমেন্ট ইতিহাস শীঘ্রই আসছে।",
    payoutInfo: "পেমেন্ট স্বয়ংক্রিয়ভাবে প্রসেস হয়। পেমেন্ট সম্পর্কিত যেকোনো প্রশ্নের জন্য সাপোর্টে যোগাযোগ করুন।",
  },
} as const;

function EarningsPage() {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = labels[language];

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-earnings"],
    queryFn: async () => {
      const res = await api.vendorDashboard.earnings.$get();
      if (!res.ok) throw new Error("Failed to fetch earnings");
      return res.json();
    },
  });

  return (
    <Stack gap="xl">
      {/* Title */}
      <Box>
        <Title
          order={2}
          fw={700}
          style={{
            background: isDark
              ? "linear-gradient(to right, oklch(0.75 0.08 260), oklch(0.8 0.08 200))"
              : "linear-gradient(to right, oklch(0.4 0.08 260), oklch(0.5 0.08 200))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent",
            letterSpacing: "-0.5px",
            display: "block",
          }}
        >
          {t.title}
        </Title>
        <Text
          size="sm"
          mt={4}
          fw={500}
          style={{
            color: isDark ? "oklch(0.6 0.02 260)" : "oklch(0.5 0.02 260)",
          }}
        >
          {new Date().toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
            year: "numeric",
            month: "long",
          })}
        </Text>
      </Box>

      {/* Stat Cards */}
      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <EarningsStatCard
          icon={DollarSign}
          label={t.totalEarnings}
          value={formatBDT(data?.totalEarnings ?? 0)}
          color="green"
          loading={isLoading}
          isDark={isDark}
        />
        <EarningsStatCard
          icon={TrendingUp}
          label={t.thisMonth}
          value={formatBDT(data?.thisMonthEarnings ?? 0)}
          color="blue"
          loading={isLoading}
          isDark={isDark}
        />
        <EarningsStatCard
          icon={Wallet}
          label={t.pendingPayout}
          value={formatBDT(data?.pendingPayout ?? 0)}
          color="teal"
          loading={isLoading}
          isDark={isDark}
        />
        <EarningsStatCard
          icon={CreditCard}
          label={t.totalPaidOut}
          value={formatBDT(data?.totalPaidOut ?? 0)}
          color="violet"
          loading={isLoading}
          isDark={isDark}
        />
      </SimpleGrid>

      {/* Info Alert */}
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
            background: "linear-gradient(135deg, oklch(0.6 0.15 240) 0%, oklch(0.65 0.13 230) 100%)",
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
        {t.payoutInfo}
      </Alert>
    </Stack>
  );
}

// Earnings Stat Card Component
interface EarningsStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  loading?: boolean;
  isDark?: boolean;
}

const colorGradients: Record<
  string,
  { light: { gradient: string; iconColor: string; shadow: string }; dark: { gradient: string; iconColor: string; shadow: string } }
> = {
  green: {
    light: {
      gradient: "linear-gradient(135deg, oklch(0.96 0.03 145) 0%, oklch(0.98 0.015 155) 100%)",
      iconColor: "oklch(0.6 0.15 145)",
      shadow: "0 4px 20px oklch(0.6 0.15 145 / 0.12)",
    },
    dark: {
      gradient: "linear-gradient(135deg, oklch(0.22 0.04 145) 0%, oklch(0.2 0.03 155) 100%)",
      iconColor: "oklch(0.7 0.15 145)",
      shadow: "0 4px 20px oklch(0 0 0 / 0.3)",
    },
  },
  blue: {
    light: {
      gradient: "linear-gradient(135deg, oklch(0.96 0.02 240) 0%, oklch(0.98 0.01 220) 100%)",
      iconColor: "oklch(0.6 0.15 240)",
      shadow: "0 4px 20px oklch(0.6 0.15 240 / 0.12)",
    },
    dark: {
      gradient: "linear-gradient(135deg, oklch(0.22 0.04 240) 0%, oklch(0.2 0.03 220) 100%)",
      iconColor: "oklch(0.7 0.15 240)",
      shadow: "0 4px 20px oklch(0 0 0 / 0.3)",
    },
  },
  teal: {
    light: {
      gradient: "linear-gradient(135deg, oklch(0.96 0.03 175) 0%, oklch(0.98 0.015 165) 100%)",
      iconColor: "oklch(0.65 0.15 175)",
      shadow: "0 4px 20px oklch(0.65 0.15 175 / 0.15)",
    },
    dark: {
      gradient: "linear-gradient(135deg, oklch(0.22 0.04 175) 0%, oklch(0.2 0.03 165) 100%)",
      iconColor: "oklch(0.75 0.15 175)",
      shadow: "0 4px 20px oklch(0 0 0 / 0.3)",
    },
  },
  violet: {
    light: {
      gradient: "linear-gradient(135deg, oklch(0.96 0.03 290) 0%, oklch(0.98 0.015 280) 100%)",
      iconColor: "oklch(0.6 0.15 290)",
      shadow: "0 4px 20px oklch(0.6 0.15 290 / 0.12)",
    },
    dark: {
      gradient: "linear-gradient(135deg, oklch(0.22 0.04 290) 0%, oklch(0.2 0.03 280) 100%)",
      iconColor: "oklch(0.7 0.15 290)",
      shadow: "0 4px 20px oklch(0 0 0 / 0.3)",
    },
  },
};

function EarningsStatCard({ icon: Icon, label, value, color, loading, isDark = false }: EarningsStatCardProps) {
  const colorStyle = (colorGradients[color] || colorGradients.teal)[isDark ? "dark" : "light"];

  return (
    <Paper
      shadow="sm"
      radius="lg"
      p="lg"
      style={{
        background: colorStyle.gradient,
        border: `1px solid ${colorStyle.iconColor}20`,
        boxShadow: colorStyle.shadow,
        transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 30px ${colorStyle.iconColor}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = colorStyle.shadow;
      }}
    >
      {/* Decorative background circle */}
      <Box
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: `${colorStyle.iconColor}08`,
          filter: "blur(20px)",
        }}
      />

      <Group justify="space-between" mb="md" style={{ position: "relative" }}>
        <Box
          style={{
            padding: "12px",
            borderRadius: "12px",
            background: `${colorStyle.iconColor}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            size={24}
            strokeWidth={2.5}
            style={{
              color: colorStyle.iconColor,
              filter: `drop-shadow(0 2px 4px ${colorStyle.iconColor}30)`,
            }}
          />
        </Box>
      </Group>

      {loading ? (
        <Skeleton height={32} width="70%" radius="sm" mb={6} />
      ) : (
        <Text
          fw={700}
          size="28px"
          lh={1}
          mb={6}
          style={{
            color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)",
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </Text>
      )}

      <Text
        size="sm"
        fw={500}
        style={{
          color: isDark ? "oklch(0.65 0.02 260)" : "oklch(0.5 0.02 260)",
        }}
      >
        {label}
      </Text>
    </Paper>
  );
}
