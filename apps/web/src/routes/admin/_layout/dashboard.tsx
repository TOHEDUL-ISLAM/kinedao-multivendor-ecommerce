import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  SimpleGrid,
  Paper,
  Group,
  Text,
  Stack,
  Table,
  Badge,
  Card,
  Skeleton,
  Title,
  Box,
} from "@mantine/core";
import {
  Users,
  Store,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";
import type { AdminOverviewDTO } from "@kineDao.com/api-types/admin";

const ADMIN_DASHBOARD_OVERVIEW_QUERY_KEY = ["admin-dashboard-overview"] as const;

async function fetchAdminDashboardOverview(): Promise<AdminOverviewDTO> {
  const response = await api.admin.overview.$get();
  if (!response.ok) {
    throw new Error("Failed to fetch admin dashboard overview");
  }
  return response.json();
}

export const Route = createFileRoute("/admin/_layout/dashboard")({
  component: AdminDashboardPage,
});

function formatBDT(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const labels = {
  en: {
    welcome: "Admin Dashboard",
    totalUsers: "Total Users",
    activeVendors: "Active Vendors",
    totalOrders: "Total Orders",
    totalRevenue: "Total Revenue",
    recentOrders: "Recent Orders",
    pendingActions: "Pending Actions",
    orderNumber: "Order #",
    customer: "Customer",
    vendor: "Vendor",
    amount: "Amount",
    status: "Status",
    vendorApplications: "Vendor Applications",
    productsToReview: "Products to Review",
    pendingPayouts: "Pending Payouts",
    noRecentOrders: "No orders yet",
    growth: "vs last month",
  },
  bn: {
    welcome: "প্রশাসক ড্যাশবোর্ড",
    totalUsers: "মোট ব্যবহারকারী",
    activeVendors: "সক্রিয় বিক্রেতা",
    totalOrders: "মোট অর্ডার",
    totalRevenue: "মোট রাজস্ব",
    recentOrders: "সাম্প্রতিক অর্ডার",
    pendingActions: "অপেক্ষমাণ কাজ",
    orderNumber: "অর্ডার #",
    customer: "গ্রাহক",
    vendor: "বিক্রেতা",
    amount: "পরিমাণ",
    status: "স্ট্যাটাস",
    vendorApplications: "বিক্রেতা আবেদন",
    productsToReview: "পণ্য পর্যালোচনা",
    pendingPayouts: "অপেক্ষমাণ পেআউট",
    noRecentOrders: "এখনো কোনো অর্ডার নেই",
    growth: "গত মাসের তুলনায়",
  },
} as const;

const statusStyles: Record<string, { background: string; color: string }> = {
  pending: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 80) 0%, oklch(0.92 0.04 70) 100%)",
    color: "oklch(0.5 0.12 70)",
  },
  confirmed: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 240) 0%, oklch(0.92 0.04 230) 100%)",
    color: "oklch(0.5 0.15 240)",
  },
  processing: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 270) 0%, oklch(0.92 0.04 260) 100%)",
    color: "oklch(0.5 0.15 270)",
  },
  shipped: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 200) 0%, oklch(0.92 0.04 190) 100%)",
    color: "oklch(0.5 0.15 195)",
  },
  delivered: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 145) 0%, oklch(0.92 0.04 140) 100%)",
    color: "oklch(0.5 0.15 145)",
  },
  cancelled: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 10) 0%, oklch(0.92 0.04 5) 100%)",
    color: "oklch(0.55 0.15 10)",
  },
};

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  growth?: number;
  gradient: string;
  isDark: boolean;
}

function StatCard({ icon: Icon, label, value, growth, gradient, isDark }: StatCardProps) {
  const { language } = useLanguage();
  const t = labels[language];

  return (
    <Paper
      p="xl"
      radius="lg"
      style={{
        background: isDark
          ? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
          : "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 150) 100%)",
        border: isDark
          ? "1px solid oklch(0.3 0.02 260 / 0.3)"
          : "1px solid oklch(0.92 0.01 260 / 0.2)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: gradient,
          opacity: isDark ? 0.08 : 0.05,
          filter: "blur(40px)",
        }}
      />
      <Group justify="space-between" align="flex-start" mb="md">
        <Box
          style={{
            padding: 12,
            borderRadius: 12,
            background: gradient,
          }}
        >
          <Icon size={24} color="white" strokeWidth={2.5} />
        </Box>
        {growth !== undefined && (
          <Group gap={4}>
            {growth >= 0 ? (
              <TrendingUp size={16} color="oklch(0.5 0.15 145)" />
            ) : (
              <TrendingDown size={16} color="oklch(0.55 0.15 10)" />
            )}
            <Text
              size="sm"
              fw={600}
              style={{
                color: growth >= 0 ? "oklch(0.5 0.15 145)" : "oklch(0.55 0.15 10)",
              }}
            >
              {growth >= 0 ? "+" : ""}{growth}%
            </Text>
          </Group>
        )}
      </Group>
      <Stack gap={4}>
        <Text
          size="xs"
          style={{
            color: isDark ? "oklch(0.6 0.02 260)" : "oklch(0.5 0.02 260)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </Text>
        <Text
          size="2rem"
          fw={700}
          style={{
            color: isDark ? "oklch(0.95 0.02 260)" : "oklch(0.25 0.02 260)",
          }}
        >
          {value}
        </Text>
        {growth !== undefined && (
          <Text
            size="xs"
            style={{
              color: isDark ? "oklch(0.55 0.02 260)" : "oklch(0.45 0.02 260)",
            }}
          >
            {t.growth}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

function AdminDashboardPage() {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = labels[language];

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const { data, isLoading } = useQuery({
    queryKey: ADMIN_DASHBOARD_OVERVIEW_QUERY_KEY,
    queryFn: fetchAdminDashboardOverview,
    staleTime: 1000 * 60, // 1 minute
  });

  if (isLoading) {
    return (
      <Stack gap="xl">
        <Title order={2}>{t.welcome}</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={160} radius="lg" />
          ))}
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <Skeleton height={400} radius="lg" />
          <Skeleton height={400} radius="lg" />
        </SimpleGrid>
      </Stack>
    );
  }

  if (!data) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Failed to load dashboard data
      </Text>
    );
  }

  return (
    <Stack gap="xl">
      <Title
        order={2}
        style={{
          color: isDark ? "oklch(0.95 0.02 260)" : "oklch(0.25 0.02 260)",
        }}
      >
        {t.welcome}
      </Title>

      {/* Stat Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        <StatCard
          icon={Users}
          label={t.totalUsers}
          value={data.totalUsers.toLocaleString()}
          growth={data.monthOverMonth.users}
          gradient="linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.7 0.13 165) 100%)"
          isDark={isDark}
        />
        <StatCard
          icon={Store}
          label={t.activeVendors}
          value={data.activeVendors.toLocaleString()}
          growth={data.monthOverMonth.vendors}
          gradient="linear-gradient(135deg, oklch(0.65 0.15 270) 0%, oklch(0.7 0.13 260) 100%)"
          isDark={isDark}
        />
        <StatCard
          icon={ShoppingBag}
          label={t.totalOrders}
          value={data.totalOrders.toLocaleString()}
          growth={data.monthOverMonth.orders}
          gradient="linear-gradient(135deg, oklch(0.65 0.15 240) 0%, oklch(0.7 0.13 230) 100%)"
          isDark={isDark}
        />
        <StatCard
          icon={DollarSign}
          label={t.totalRevenue}
          value={formatBDT(data.totalRevenue)}
          growth={data.monthOverMonth.revenue}
          gradient="linear-gradient(135deg, oklch(0.65 0.15 145) 0%, oklch(0.7 0.13 140) 100%)"
          isDark={isDark}
        />
      </SimpleGrid>

      {/* Recent Orders & Pending Actions */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        {/* Recent Orders */}
        <Card
          padding="lg"
          radius="lg"
          style={{
            background: isDark
              ? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
              : "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 150) 100%)",
            border: isDark
              ? "1px solid oklch(0.3 0.02 260 / 0.3)"
              : "1px solid oklch(0.92 0.01 260 / 0.2)",
          }}
        >
          <Title
            order={4}
            mb="md"
            style={{
              color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)",
            }}
          >
            {t.recentOrders}
          </Title>

          {data.recentOrders.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              {t.noRecentOrders}
            </Text>
          ) : (
            <Table
              highlightOnHover
              style={{
                "--table-hover-color": isDark
                  ? "oklch(0.25 0.02 260)"
                  : "oklch(0.96 0.01 175)",
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ color: isDark ? "oklch(0.65 0.02 260)" : "oklch(0.5 0.02 260)" }}>
                    {t.orderNumber}
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? "oklch(0.65 0.02 260)" : "oklch(0.5 0.02 260)" }}>
                    {t.customer}
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? "oklch(0.65 0.02 260)" : "oklch(0.5 0.02 260)" }}>
                    {t.vendor}
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? "oklch(0.65 0.02 260)" : "oklch(0.5 0.02 260)" }}>
                    {t.amount}
                  </Table.Th>
                  <Table.Th style={{ color: isDark ? "oklch(0.65 0.02 260)" : "oklch(0.5 0.02 260)" }}>
                    {t.status}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.recentOrders.map((order) => (
                  <Table.Tr key={order.id}>
                    <Table.Td>
                      <Text size="sm" fw={500} style={{ color: isDark ? "oklch(0.85 0.02 260)" : "oklch(0.35 0.02 260)" }}>
                        {order.orderNumber}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ color: isDark ? "oklch(0.75 0.02 260)" : "oklch(0.4 0.02 260)" }}>
                        {order.customerName}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" style={{ color: isDark ? "oklch(0.75 0.02 260)" : "oklch(0.4 0.02 260)" }}>
                        {order.vendorName}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500} style={{ color: isDark ? "oklch(0.85 0.02 260)" : "oklch(0.35 0.02 260)" }}>
                        {formatBDT(order.total)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        radius="md"
                        style={statusStyles[order.status] || statusStyles.pending}
                      >
                        {order.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>

        {/* Pending Actions */}
        <Card
          padding="lg"
          radius="lg"
          style={{
            background: isDark
              ? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
              : "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 150) 100%)",
            border: isDark
              ? "1px solid oklch(0.3 0.02 260 / 0.3)"
              : "1px solid oklch(0.92 0.01 260 / 0.2)",
          }}
        >
          <Title
            order={4}
            mb="md"
            style={{
              color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)",
            }}
          >
            {t.pendingActions}
          </Title>

          <Stack gap="md">
            {data.pendingVendors > 0 && (
              <Paper
                p="md"
                radius="md"
                style={{
                  background: isDark ? "oklch(0.25 0.02 260)" : "oklch(0.96 0.01 175)",
                  cursor: "pointer",
                  border: isDark
                    ? "1px solid oklch(0.3 0.02 260)"
                    : "1px solid oklch(0.92 0.01 260)",
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={4}>
                    <Text size="sm" fw={500} style={{ color: isDark ? "oklch(0.85 0.02 260)" : "oklch(0.35 0.02 260)" }}>
                      {t.vendorApplications}
                    </Text>
                  </Stack>
                  <Badge
                    size="lg"
                    radius="md"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.7 0.13 165) 100%)",
                      color: "white",
                    }}
                  >
                    {data.pendingVendors}
                  </Badge>
                </Group>
              </Paper>
            )}

            {data.pendingProducts > 0 && (
              <Paper
                p="md"
                radius="md"
                style={{
                  background: isDark ? "oklch(0.25 0.02 260)" : "oklch(0.96 0.01 175)",
                  cursor: "pointer",
                  border: isDark
                    ? "1px solid oklch(0.3 0.02 260)"
                    : "1px solid oklch(0.92 0.01 260)",
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={4}>
                    <Text size="sm" fw={500} style={{ color: isDark ? "oklch(0.85 0.02 260)" : "oklch(0.35 0.02 260)" }}>
                      {t.productsToReview}
                    </Text>
                  </Stack>
                  <Badge
                    size="lg"
                    radius="md"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.65 0.15 240) 0%, oklch(0.7 0.13 230) 100%)",
                      color: "white",
                    }}
                  >
                    {data.pendingProducts}
                  </Badge>
                </Group>
              </Paper>
            )}

            {data.pendingPayouts > 0 && (
              <Paper
                p="md"
                radius="md"
                style={{
                  background: isDark ? "oklch(0.25 0.02 260)" : "oklch(0.96 0.01 175)",
                  cursor: "pointer",
                  border: isDark
                    ? "1px solid oklch(0.3 0.02 260)"
                    : "1px solid oklch(0.92 0.01 260)",
                }}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Stack gap={4}>
                    <Text size="sm" fw={500} style={{ color: isDark ? "oklch(0.85 0.02 260)" : "oklch(0.35 0.02 260)" }}>
                      {t.pendingPayouts}
                    </Text>
                  </Stack>
                  <Badge
                    size="lg"
                    radius="md"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.65 0.15 145) 0%, oklch(0.7 0.13 140) 100%)",
                      color: "white",
                    }}
                  >
                    {data.pendingPayouts}
                  </Badge>
                </Group>
              </Paper>
            )}

            {data.pendingVendors === 0 && data.pendingProducts === 0 && data.pendingPayouts === 0 && (
              <Text c="dimmed" ta="center" py="xl">
                {language === "bn" ? "কোনো অপেক্ষমাণ কাজ নেই" : "No pending actions"}
              </Text>
            )}
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
