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
  Button,
  Card,
  Skeleton,
  Title,
  Box,
  Anchor,
} from "@mantine/core";
import { Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  Clock,
  DollarSign,
  Wallet,
  Package,
  AlertCircle,
  Plus,
  ArrowRight,
  AlertTriangle,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";
import type { VendorDashboardOverviewDTO } from "@kineDao.com/api-types/vendor-dashboard";

const VENDOR_DASHBOARD_OVERVIEW_QUERY_KEY = ["vendor-dashboard-overview"] as const;

async function fetchVendorDashboardOverview(): Promise<VendorDashboardOverviewDTO> {
  const response = await api.vendorDashboard.overview.$get();
  if (!response.ok) {
    throw new Error("Failed to fetch vendor dashboard overview");
  }
  return response.json();
}

export const Route = createFileRoute("/vendor/_dashboard/dashboard")({
  component: DashboardOverviewPage,
});

function formatBDT(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const labels = {
  en: {
    welcome: "Welcome back",
    totalOrders: "Total Orders",
    pendingOrders: "Pending Orders",
    totalEarnings: "Total Earnings",
    pendingPayout: "Pending Payout",
    productsListed: "Products Listed",
    pendingApproval: "Pending Approval",
    recentOrders: "Recent Orders",
    lowStockAlerts: "Low Stock Alerts",
    quickActions: "Quick Actions",
    addProduct: "Add Product",
    viewAllOrders: "View All Orders",
    viewAllProducts: "View All Products",
    orderNumber: "Order #",
    customer: "Customer",
    total: "Total",
    status: "Status",
    date: "Date",
    product: "Product",
    stock: "Stock",
    sku: "SKU",
    noRecentOrders: "No orders yet",
    noLowStock: "All products well stocked",
    viewOrder: "View",
  },
  bn: {
    welcome: "স্বাগতম",
    totalOrders: "মোট অর্ডার",
    pendingOrders: "অপেক্ষমাণ অর্ডার",
    totalEarnings: "মোট আয়",
    pendingPayout: "অপেক্ষমাণ পেমেন্ট",
    productsListed: "তালিকাভুক্ত পণ্য",
    pendingApproval: "অনুমোদনের অপেক্ষায়",
    recentOrders: "সাম্প্রতিক অর্ডার",
    lowStockAlerts: "স্টক কম সতর্কতা",
    quickActions: "দ্রুত কাজ",
    addProduct: "পণ্য যোগ করুন",
    viewAllOrders: "সকল অর্ডার দেখুন",
    viewAllProducts: "সকল পণ্য দেখুন",
    orderNumber: "অর্ডার #",
    customer: "গ্রাহক",
    total: "মোট",
    status: "স্ট্যাটাস",
    date: "তারিখ",
    product: "পণ্য",
    stock: "স্টক",
    sku: "SKU",
    noRecentOrders: "এখনো কোনো অর্ডার নেই",
    noLowStock: "সব পণ্যের স্টক ভালো",
    viewOrder: "দেখুন",
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

function DashboardOverviewPage() {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = labels[language];

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const { data, isLoading } = useQuery({
    queryKey: VENDOR_DASHBOARD_OVERVIEW_QUERY_KEY,
    queryFn: fetchVendorDashboardOverview,
  });

  return (
    <Stack gap="xl">
      {/* Welcome */}
      <Box>
        <Title
          order={2}
          fw={700}
          style={{
            color: isDark ? "oklch(0.88 0.03 250)" : "oklch(0.32 0.08 250)",
            letterSpacing: "-0.5px",
            display: "block",
          }}
        >
          {t.welcome}, {data?.vendor?.vendorName || ""}
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
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </Box>

      {/* Stat Cards */}
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md">
        <StatCard
          icon={ShoppingCart}
          label={t.totalOrders}
          value={data?.stats.totalOrders}
          color="blue"
          loading={isLoading}
          isDark={isDark}
        />
        <StatCard
          icon={Clock}
          label={t.pendingOrders}
          value={data?.stats.pendingOrders}
          color="orange"
          loading={isLoading}
          isDark={isDark}
        />
        <StatCard
          icon={DollarSign}
          label={t.totalEarnings}
          value={data?.stats.totalEarnings != null ? formatBDT(data.stats.totalEarnings) : undefined}
          color="green"
          loading={isLoading}
          isDark={isDark}
        />
        <StatCard
          icon={Wallet}
          label={t.pendingPayout}
          value={data?.stats.pendingPayout != null ? formatBDT(data.stats.pendingPayout) : undefined}
          color="teal"
          loading={isLoading}
          isDark={isDark}
        />
        <StatCard
          icon={Package}
          label={t.productsListed}
          value={data?.stats.productsListed}
          color="violet"
          loading={isLoading}
          isDark={isDark}
        />
        <StatCard
          icon={AlertCircle}
          label={t.pendingApproval}
          value={data?.stats.productsPendingApproval}
          color="red"
          loading={isLoading}
          isDark={isDark}
        />
      </SimpleGrid>

      {/* Content Grid */}
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md">
        {/* Recent Orders - 2/3 width */}
        <Box style={{ gridColumn: "span 1 / span 1" }} className="lg:col-span-2">
          <Card
            shadow="sm"
            radius="lg"
            p="lg"
            style={{
              background: isDark
                ? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
                : "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.98 0.01 160) 100%)",
              border: isDark
                ? "1px solid oklch(0.3 0.02 260 / 0.3)"
                : "1px solid oklch(0.92 0.01 260 / 0.2)",
              boxShadow: isDark
                ? "0 4px 20px oklch(0 0 0 / 0.3)"
                : "0 4px 20px oklch(0.65 0.15 175 / 0.08)",
            }}
          >
            <Group justify="space-between" mb="lg">
              <Group gap="xs">
                <Box
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.7 0.13 165) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ShoppingBag size={18} style={{ color: "white" }} />
                </Box>
                <Text
                  fw={700}
                  size="lg"
                  style={{
                    color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)",
                  }}
                >
                  {t.recentOrders}
                </Text>
              </Group>
              <Anchor
                component={Link}
                to="/vendor/orders"
                size="sm"
                fw={600}
                style={{
                  color: "oklch(0.65 0.15 175)",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "oklch(0.6 0.18 175)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "oklch(0.65 0.15 175)";
                }}
              >
                {t.viewAllOrders} <ArrowRight size={14} style={{ display: "inline", marginLeft: 4 }} />
              </Anchor>
            </Group>

            {isLoading ? (
              <Stack gap="xs">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height={40} radius="sm" />
                ))}
              </Stack>
            ) : data?.recentOrders && data.recentOrders.length > 0 ? (
              <Table
                highlightOnHover
                style={{
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <Table.Thead
                  style={{
                    background: isDark
                      ? "linear-gradient(135deg, oklch(0.25 0.02 260) 0%, oklch(0.23 0.02 250) 100%)"
                      : "linear-gradient(135deg, oklch(0.97 0.02 175) 0%, oklch(0.98 0.01 165) 100%)",
                  }}
                >
                  <Table.Tr>
                    <Table.Th
                      style={{
                        fontWeight: 700,
                        color: isDark ? "oklch(0.8 0.02 260)" : "oklch(0.4 0.02 260)",
                      }}
                    >
                      {t.orderNumber}
                    </Table.Th>
                    <Table.Th
                      style={{
                        fontWeight: 700,
                        color: isDark ? "oklch(0.8 0.02 260)" : "oklch(0.4 0.02 260)",
                      }}
                    >
                      {t.customer}
                    </Table.Th>
                    <Table.Th
                      style={{
                        fontWeight: 700,
                        color: isDark ? "oklch(0.8 0.02 260)" : "oklch(0.4 0.02 260)",
                      }}
                    >
                      {t.total}
                    </Table.Th>
                    <Table.Th
                      style={{
                        fontWeight: 700,
                        color: isDark ? "oklch(0.8 0.02 260)" : "oklch(0.4 0.02 260)",
                      }}
                    >
                      {t.status}
                    </Table.Th>
                    <Table.Th
                      style={{
                        fontWeight: 700,
                        color: isDark ? "oklch(0.8 0.02 260)" : "oklch(0.4 0.02 260)",
                      }}
                    >
                      {t.date}
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.recentOrders.map((order) => (
                    <Table.Tr key={order.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {order.orderNumber}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{order.customerName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {formatBDT(order.total)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          fw={600}
                          style={{
                            background: statusStyles[order.status]?.background || "oklch(0.9 0.01 260)",
                            color: statusStyles[order.status]?.color || "oklch(0.5 0.02 260)",
                            border: "none",
                            textTransform: "capitalize",
                          }}
                        >
                          {order.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {new Date(order.createdAt).toLocaleDateString(
                            language === "bn" ? "bn-BD" : "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                {t.noRecentOrders}
              </Text>
            )}
          </Card>
        </Box>

        {/* Right Column - Low Stock + Quick Actions */}
        <Stack gap="md">
          {/* Low Stock Alerts */}
          <Card
            shadow="sm"
            radius="lg"
            p="lg"
            style={{
              background: isDark
                ? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
                : "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.98 0.01 160) 100%)",
              border: isDark
                ? "1px solid oklch(0.3 0.02 260 / 0.3)"
                : "1px solid oklch(0.92 0.01 260 / 0.2)",
              boxShadow: isDark
                ? "0 4px 20px oklch(0 0 0 / 0.3)"
                : "0 4px 20px oklch(0.65 0.15 175 / 0.08)",
            }}
          >
            <Group justify="space-between" mb="lg">
              <Group gap="xs">
                <Box
                  style={{
                    padding: "8px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, oklch(0.7 0.12 50) 0%, oklch(0.75 0.1 55) 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={18} style={{ color: "white" }} />
                </Box>
                <Text
                  fw={700}
                  size="md"
                  style={{
                    color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)",
                  }}
                >
                  {t.lowStockAlerts}
                </Text>
              </Group>
            </Group>

            {isLoading ? (
              <Stack gap="xs">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} height={36} radius="sm" />
                ))}
              </Stack>
            ) : data?.lowStockProducts && data.lowStockProducts.length > 0 ? (
              <Stack gap="xs">
                {data.lowStockProducts.map((product) => (
                  <Group
                    key={product.id}
                    justify="space-between"
                    py={10}
                    px={12}
                    style={{
                      borderRadius: "12px",
                      background: isDark
                        ? "linear-gradient(135deg, oklch(0.25 0.03 10) 0%, oklch(0.23 0.02 5) 100%)"
                        : "linear-gradient(135deg, oklch(0.97 0.02 10) 0%, oklch(0.98 0.01 5) 100%)",
                      border: isDark
                        ? "1px solid oklch(0.75 0.15 10 / 0.2)"
                        : "1px solid oklch(0.65 0.15 10 / 0.15)",
                    }}
                  >
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        size="sm"
                        fw={600}
                        lineClamp={1}
                        style={{
                          color: isDark ? "oklch(0.85 0.02 260)" : "oklch(0.3 0.02 260)",
                        }}
                      >
                        {product.title}
                      </Text>
                      <Text
                        size="xs"
                        fw={500}
                        style={{
                          color: isDark ? "oklch(0.6 0.02 260)" : "oklch(0.5 0.02 260)",
                        }}
                      >
                        {t.sku}: {product.sku}
                      </Text>
                    </Box>
                    <Badge
                      size="sm"
                      fw={700}
                      style={{
                        background: "linear-gradient(135deg, oklch(0.65 0.15 10) 0%, oklch(0.7 0.13 5) 100%)",
                        color: "white",
                        border: "none",
                        boxShadow: "0 2px 8px oklch(0.65 0.15 10 / 0.3)",
                      }}
                    >
                      {product.stockQty} {t.stock}
                    </Badge>
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center" py="md" size="sm">
                {t.noLowStock}
              </Text>
            )}
          </Card>

          {/* Quick Actions */}
          <Card
            shadow="sm"
            radius="lg"
            p="lg"
            style={{
              background: isDark
                ? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
                : "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.98 0.01 160) 100%)",
              border: isDark
                ? "1px solid oklch(0.3 0.02 260 / 0.3)"
                : "1px solid oklch(0.92 0.01 260 / 0.2)",
              boxShadow: isDark
                ? "0 4px 20px oklch(0 0 0 / 0.3)"
                : "0 4px 20px oklch(0.65 0.15 175 / 0.08)",
            }}
          >
            <Group gap="xs" mb="lg">
              <Box
                style={{
                  padding: "8px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.7 0.13 165) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Package size={18} style={{ color: "white" }} />
              </Box>
              <Text
                fw={700}
                size="md"
                style={{
                  color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)",
                }}
              >
                {t.quickActions}
              </Text>
            </Group>
            <Stack gap="sm">
              <Button
                component={Link}
                to="/vendor/products/new"
                leftSection={<Plus size={18} />}
                fullWidth
                radius="md"
                size="md"
                style={{
                  background: "linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.7 0.13 165) 100%)",
                  border: "none",
                  boxShadow: "0 4px 12px oklch(0.65 0.15 175 / 0.3)",
                  transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px oklch(0.65 0.15 175 / 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px oklch(0.65 0.15 175 / 0.3)";
                }}
              >
                {t.addProduct}
              </Button>
              <Button
                component={Link}
                to="/vendor/orders"
                leftSection={<ShoppingBag size={18} />}
                fullWidth
                radius="md"
                size="md"
                variant="light"
                style={{
                  background: "oklch(0.96 0.03 175)",
                  color: "oklch(0.65 0.15 175)",
                  border: "1px solid oklch(0.65 0.15 175 / 0.2)",
                  transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "oklch(0.94 0.04 175)";
                  e.currentTarget.style.borderColor = "oklch(0.65 0.15 175 / 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "oklch(0.96 0.03 175)";
                  e.currentTarget.style.borderColor = "oklch(0.65 0.15 175 / 0.2)";
                }}
              >
                {t.viewAllOrders}
              </Button>
              <Button
                component={Link}
                to="/vendor/products"
                leftSection={<Package size={18} />}
                fullWidth
                radius="md"
                size="md"
                variant="outline"
                style={{
                  borderColor: "oklch(0.65 0.15 175)",
                  color: "oklch(0.65 0.15 175)",
                  transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "oklch(0.98 0.02 175)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {t.viewAllProducts}
              </Button>
            </Stack>
          </Card>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}

// Stat Card Component with gradient backgrounds
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value?: string | number;
  color: string;
  loading?: boolean;
  isDark?: boolean;
}

const colorGradients: Record<
  string,
  { light: { gradient: string; iconColor: string; shadow: string }; dark: { gradient: string; iconColor: string; shadow: string } }
> = {
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
  orange: {
    light: {
      gradient: "linear-gradient(135deg, oklch(0.96 0.03 60) 0%, oklch(0.98 0.015 50) 100%)",
      iconColor: "oklch(0.65 0.15 50)",
      shadow: "0 4px 20px oklch(0.65 0.15 50 / 0.12)",
    },
    dark: {
      gradient: "linear-gradient(135deg, oklch(0.22 0.04 60) 0%, oklch(0.2 0.03 50) 100%)",
      iconColor: "oklch(0.75 0.15 50)",
      shadow: "0 4px 20px oklch(0 0 0 / 0.3)",
    },
  },
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
  red: {
    light: {
      gradient: "linear-gradient(135deg, oklch(0.96 0.03 10) 0%, oklch(0.98 0.015 0) 100%)",
      iconColor: "oklch(0.65 0.15 10)",
      shadow: "0 4px 20px oklch(0.65 0.15 10 / 0.12)",
    },
    dark: {
      gradient: "linear-gradient(135deg, oklch(0.22 0.04 10) 0%, oklch(0.2 0.03 0) 100%)",
      iconColor: "oklch(0.75 0.15 10)",
      shadow: "0 4px 20px oklch(0 0 0 / 0.3)",
    },
  },
};

function StatCard({ icon: Icon, label, value, color, loading, isDark = false }: StatCardProps) {
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
          size="32px"
          lh={1}
          mb={6}
          style={{
            color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)",
            letterSpacing: "-0.5px",
          }}
        >
          {value ?? 0}
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
