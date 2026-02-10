import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Stack,
  Title,
  TextInput,
  Table,
  Group,
  Text,
  Drawer,
  Paper,
  Select,
  SimpleGrid,
  Skeleton,
  Card,
  Divider,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { Search, Eye } from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";
import { StatusBadge } from "@/components/admin/status-badge";
import type { AdminOrderListItemDTO } from "@kineDao.com/api-types/admin";

export const Route = createFileRoute("/admin/_layout/orders")({
  component: AdminOrdersPage,
});

const labels = {
  en: {
    title: "Order Management",
    search: "Search by order number or customer name...",
    filterStatus: "Filter by Status",
    allStatuses: "All Statuses",
    orderNumber: "Order #",
    customer: "Customer",
    vendor: "Vendor",
    items: "Items",
    total: "Total",
    status: "Status",
    date: "Date",
    actions: "Actions",
    viewDetails: "View Details",
    noResults: "No orders found",
    orderDetails: "Order Details",
    orderInfo: "Order Information",
    customerInfo: "Customer Information",
    shippingAddress: "Shipping Address",
    orderItems: "Order Items",
    paymentMethod: "Payment Method",
    subtotal: "Subtotal",
    shippingCost: "Shipping Cost",
    codFee: "COD Fee",
    grandTotal: "Grand Total",
    trackingNumber: "Tracking Number",
    trackingCarrier: "Tracking Carrier",
    product: "Product",
    quantity: "Quantity",
    price: "Price",
    lineTotal: "Line Total",
    fullName: "Full Name",
    phone: "Phone",
    alternatePhone: "Alternate Phone",
    address: "Address",
    city: "City",
    district: "District",
    postalCode: "Postal Code",
    deliveryInstructions: "Delivery Instructions",
    customerNotes: "Customer Notes",
  },
  bn: {
    title: "অর্ডার ব্যবস্থাপনা",
    search: "অর্ডার নম্বর বা গ্রাহকের নাম দিয়ে খুঁজুন...",
    filterStatus: "স্ট্যাটাস দ্বারা ফিল্টার করুন",
    allStatuses: "সকল স্ট্যাটাস",
    orderNumber: "অর্ডার #",
    customer: "গ্রাহক",
    vendor: "বিক্রেতা",
    items: "আইটেম",
    total: "মোট",
    status: "অবস্থা",
    date: "তারিখ",
    actions: "কর্ম",
    viewDetails: "বিস্তারিত দেখুন",
    noResults: "কোনো অর্ডার পাওয়া যায়নি",
    orderDetails: "অর্ডারের বিবরণ",
    orderInfo: "অর্ডার তথ্য",
    customerInfo: "গ্রাহক তথ্য",
    shippingAddress: "শিপিং ঠিকানা",
    orderItems: "অর্ডার আইটেম",
    paymentMethod: "পেমেন্ট পদ্ধতি",
    subtotal: "উপমোট",
    shippingCost: "শিপিং খরচ",
    codFee: "COD ফি",
    grandTotal: "সর্বমোট",
    trackingNumber: "ট্র্যাকিং নম্বর",
    trackingCarrier: "ট্র্যাকিং ক্যারিয়ার",
    product: "পণ্য",
    quantity: "পরিমাণ",
    price: "মূল্য",
    lineTotal: "লাইন মোট",
    fullName: "সম্পূর্ণ নাম",
    phone: "ফোন",
    alternatePhone: "বিকল্প ফোন",
    address: "ঠিকানা",
    city: "শহর",
    district: "জেলা",
    postalCode: "পোস্টাল কোড",
    deliveryInstructions: "ডেলিভারি নির্দেশনা",
    customerNotes: "গ্রাহকের নোট",
  },
};

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function formatBDT(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
}

function AdminOrdersPage() {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const t = labels[language];
  const isDark = resolvedTheme === "dark";

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  // Fetch order list
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter, debouncedSearch],
    queryFn: async () => {
      const response = await api.admin.orders.$get({
        query: {
          status: statusFilter as any,
          search: debouncedSearch || undefined,
          page: "1",
          limit: "50",
          sort: "newest",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  // Fetch order detail
  const { data: orderDetail } = useQuery({
    queryKey: ["admin-order-detail", selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return null;
      const response = await api.admin.orders[":orderId"].$get({
        param: { orderId: selectedOrder },
      });
      if (!response.ok) throw new Error("Failed to fetch order detail");
      return response.json();
    },
    enabled: !!selectedOrder,
  });

  const handleViewDetails = (order: AdminOrderListItemDTO) => {
    setSelectedOrder(order.id);
    openDrawer();
  };

  return (
    <Stack gap="xl">
      <Title order={2} style={{ color: isDark ? "oklch(0.95 0.02 260)" : "oklch(0.25 0.02 260)" }}>
        {t.title}
      </Title>

      <Paper
        p="lg"
        radius="lg"
        style={{
          background: isDark
            ? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
            : "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 150) 100%)",
          border: isDark ? "1px solid oklch(0.3 0.02 260 / 0.3)" : "1px solid oklch(0.92 0.01 260 / 0.2)",
        }}
      >
        <Stack gap="lg">
          <Group>
            <TextInput
              placeholder={t.search}
              leftSection={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder={t.filterStatus}
              data={statusOptions}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || "all")}
              w={200}
            />
          </Group>

          {isLoading ? (
            <Stack gap="xs">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height={60} radius="md" />
              ))}
            </Stack>
          ) : orders && orders.orders.length > 0 ? (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t.orderNumber}</Table.Th>
                  <Table.Th>{t.customer}</Table.Th>
                  <Table.Th>{t.vendor}</Table.Th>
                  <Table.Th>{t.items}</Table.Th>
                  <Table.Th>{t.total}</Table.Th>
                  <Table.Th>{t.status}</Table.Th>
                  <Table.Th>{t.date}</Table.Th>
                  <Table.Th>{t.actions}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {orders.orders.map((order) => (
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
                      <Text size="sm">{order.vendorName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{order.itemCount}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {formatBDT(order.total)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge status={order.status} />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(order.createdAt).toLocaleDateString()}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Eye
                          size={18}
                          style={{ cursor: "pointer", color: "var(--mantine-color-blue-6)" }}
                          onClick={() => handleViewDetails(order)}
                        />
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          ) : (
            <Text c="dimmed" ta="center" py="xl">
              {t.noResults}
            </Text>
          )}
        </Stack>
      </Paper>

      {/* Order Detail Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title={t.orderDetails}
        position="right"
        size="xl"
      >
        {orderDetail && (
          <Stack gap="lg">
            {/* Order Info */}
            <Card padding="md" radius="md" withBorder>
              <Text fw={600} mb="md">{t.orderInfo}</Text>
              <SimpleGrid cols={2} spacing="md">
                <div>
                  <Text size="xs" c="dimmed">{t.orderNumber}</Text>
                  <Text size="sm" fw={500}>{orderDetail.orderNumber}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.status}</Text>
                  <StatusBadge status={orderDetail.status} />
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.vendor}</Text>
                  <Text size="sm">{orderDetail.vendorName}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.paymentMethod}</Text>
                  <Text size="sm">{orderDetail.paymentMethod}</Text>
                </div>
                {orderDetail.trackingNumber && (
                  <>
                    <div>
                      <Text size="xs" c="dimmed">{t.trackingNumber}</Text>
                      <Text size="sm">{orderDetail.trackingNumber}</Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">{t.trackingCarrier}</Text>
                      <Text size="sm">{orderDetail.trackingCarrier}</Text>
                    </div>
                  </>
                )}
              </SimpleGrid>
            </Card>

            {/* Customer Info */}
            <Card padding="md" radius="md" withBorder>
              <Text fw={600} mb="md">{t.customerInfo}</Text>
              <Stack gap="sm">
                <div>
                  <Text size="xs" c="dimmed">{t.fullName}</Text>
                  <Text size="sm">{orderDetail.customerName}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">Email</Text>
                  <Text size="sm">{orderDetail.customerEmail}</Text>
                </div>
              </Stack>
            </Card>

            {/* Shipping Address */}
            <Card padding="md" radius="md" withBorder>
              <Text fw={600} mb="md">{t.shippingAddress}</Text>
              <Stack gap="sm">
                <div>
                  <Text size="xs" c="dimmed">{t.fullName}</Text>
                  <Text size="sm">{orderDetail.shippingAddress.fullName}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.phone}</Text>
                  <Text size="sm">{orderDetail.shippingAddress.phone}</Text>
                </div>
                {orderDetail.shippingAddress.alternatePhone && (
                  <div>
                    <Text size="xs" c="dimmed">{t.alternatePhone}</Text>
                    <Text size="sm">{orderDetail.shippingAddress.alternatePhone}</Text>
                  </div>
                )}
                <div>
                  <Text size="xs" c="dimmed">{t.address}</Text>
                  <Text size="sm">{orderDetail.shippingAddress.addressLine1}</Text>
                  {orderDetail.shippingAddress.addressLine2 && (
                    <Text size="sm">{orderDetail.shippingAddress.addressLine2}</Text>
                  )}
                </div>
                <Group gap="md">
                  <div>
                    <Text size="xs" c="dimmed">{t.city}</Text>
                    <Text size="sm">{orderDetail.shippingAddress.city}</Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">{t.district}</Text>
                    <Text size="sm">{orderDetail.shippingAddress.district}</Text>
                  </div>
                  {orderDetail.shippingAddress.postalCode && (
                    <div>
                      <Text size="xs" c="dimmed">{t.postalCode}</Text>
                      <Text size="sm">{orderDetail.shippingAddress.postalCode}</Text>
                    </div>
                  )}
                </Group>
                {orderDetail.shippingAddress.deliveryInstructions && (
                  <div>
                    <Text size="xs" c="dimmed">{t.deliveryInstructions}</Text>
                    <Text size="sm">{orderDetail.shippingAddress.deliveryInstructions}</Text>
                  </div>
                )}
              </Stack>
            </Card>

            {/* Order Items */}
            <Card padding="md" radius="md" withBorder>
              <Text fw={600} mb="md">{t.orderItems}</Text>
              <Stack gap="md">
                {orderDetail.items.map((item) => (
                  <Group key={item.id} justify="space-between" wrap="nowrap">
                    <Group gap="md">
                      {item.productSnapshot.image && (
                        <img
                          src={item.productSnapshot.image}
                          alt={item.productSnapshot.title}
                          style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }}
                        />
                      )}
                      <div>
                        <Text size="sm" fw={500}>
                          {item.productSnapshot.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t.quantity}: {item.quantity}
                        </Text>
                      </div>
                    </Group>
                    <Text size="sm" fw={500}>
                      {formatBDT(item.lineTotal)}
                    </Text>
                  </Group>
                ))}
              </Stack>

              <Divider my="md" />

              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm">{t.subtotal}</Text>
                  <Text size="sm" fw={500}>{formatBDT(orderDetail.subtotal)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">{t.shippingCost}</Text>
                  <Text size="sm" fw={500}>{formatBDT(orderDetail.shippingCost)}</Text>
                </Group>
                {orderDetail.codFee > 0 && (
                  <Group justify="space-between">
                    <Text size="sm">{t.codFee}</Text>
                    <Text size="sm" fw={500}>{formatBDT(orderDetail.codFee)}</Text>
                  </Group>
                )}
                <Divider />
                <Group justify="space-between">
                  <Text size="md" fw={600}>{t.grandTotal}</Text>
                  <Text size="md" fw={700}>{formatBDT(orderDetail.total)}</Text>
                </Group>
              </Stack>
            </Card>

            {/* Customer Notes */}
            {orderDetail.customerNotes && (
              <Card padding="md" radius="md" withBorder>
                <Text fw={600} mb="md">{t.customerNotes}</Text>
                <Text size="sm">{orderDetail.customerNotes}</Text>
              </Card>
            )}
          </Stack>
        )}
      </Drawer>
    </Stack>
  );
}
