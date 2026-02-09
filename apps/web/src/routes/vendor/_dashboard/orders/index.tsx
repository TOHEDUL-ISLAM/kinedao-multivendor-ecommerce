import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Group,
  Text,
  TextInput,
  Tabs,
  Table,
  Pagination,
  Badge,
  Button,
  Stack,
  Skeleton,
  Title,
  Box,
  Drawer,
  Divider,
  Modal,
  Paper,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  Search,
  Truck,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { VENDOR_STATUS_TRANSITIONS } from "@kineDao.com/api-types/vendor-dashboard";
import { toast } from "sonner";
import { useVendorTheme, vendorColors } from "@/lib/vendor-theme";

export const Route = createFileRoute("/vendor/_dashboard/orders/")({
  component: OrderListPage,
});

function formatBDT(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}


const statusTabs = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const labels = {
  en: {
    title: "Orders",
    searchPlaceholder: "Search by order number...",
    all: "All",
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    orderNumber: "Order #",
    customer: "Customer",
    items: "Items",
    total: "Total",
    status: "Status",
    date: "Date",
    noOrders: "No orders found",
    orderDetail: "Order Detail",
    shippingAddress: "Shipping Address",
    orderItems: "Order Items",
    orderSummary: "Order Summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    codFee: "COD Fee",
    trackingInfo: "Tracking Info",
    trackingNumber: "Tracking Number",
    trackingCarrier: "Carrier",
    updateStatus: "Update Status",
    confirmOrder: "Confirm Order",
    startProcessing: "Start Processing",
    markShipped: "Mark Shipped",
    markDelivered: "Mark Delivered",
    cancelOrder: "Cancel Order",
    confirmAction: "Confirm Action",
    confirmMessage: "Are you sure you want to update this order's status?",
    trackingRequired: "Tracking number is required for shipping",
    yes: "Yes, Update",
    cancel: "Cancel",
    statusUpdated: "Order status updated",
    statusUpdateFailed: "Failed to update status",
    showing: "Showing",
    of: "of",
    orders: "orders",
    qty: "Qty",
    customerNotes: "Customer Notes",
    phone: "Phone",
  },
  bn: {
    title: "অর্ডার",
    searchPlaceholder: "অর্ডার নম্বর দিয়ে খুঁজুন...",
    all: "সকল",
    pending: "অপেক্ষমাণ",
    confirmed: "নিশ্চিত",
    processing: "প্রসেসিং",
    shipped: "শিপড",
    delivered: "ডেলিভারড",
    cancelled: "বাতিল",
    orderNumber: "অর্ডার #",
    customer: "গ্রাহক",
    items: "আইটেম",
    total: "মোট",
    status: "স্ট্যাটাস",
    date: "তারিখ",
    noOrders: "কোনো অর্ডার পাওয়া যায়নি",
    orderDetail: "অর্ডার বিবরণ",
    shippingAddress: "শিপিং ঠিকানা",
    orderItems: "অর্ডার আইটেম",
    orderSummary: "অর্ডার সারাংশ",
    subtotal: "সাবটোটাল",
    shipping: "শিপিং",
    codFee: "COD ফি",
    trackingInfo: "ট্র্যাকিং তথ্য",
    trackingNumber: "ট্র্যাকিং নম্বর",
    trackingCarrier: "ক্যারিয়ার",
    updateStatus: "স্ট্যাটাস আপডেট",
    confirmOrder: "অর্ডার নিশ্চিত",
    startProcessing: "প্রসেসিং শুরু",
    markShipped: "শিপড করুন",
    markDelivered: "ডেলিভারড করুন",
    cancelOrder: "বাতিল করুন",
    confirmAction: "নিশ্চিত করুন",
    confirmMessage: "আপনি কি এই অর্ডারের স্ট্যাটাস আপডেট করতে চান?",
    trackingRequired: "শিপিংয়ের জন্য ট্র্যাকিং নম্বর প্রয়োজন",
    yes: "হ্যাঁ, আপডেট করুন",
    cancel: "বাতিল",
    statusUpdated: "অর্ডার স্ট্যাটাস আপডেট হয়েছে",
    statusUpdateFailed: "স্ট্যাটাস আপডেট ব্যর্থ",
    showing: "দেখানো হচ্ছে",
    of: "এর মধ্যে",
    orders: "অর্ডার",
    qty: "পরিমাণ",
    customerNotes: "গ্রাহকের নোট",
    phone: "ফোন",
  },
} as const;

const statusButtonLabels: Record<string, { en: string; bn: string }> = {
  confirmed: { en: "Confirm Order", bn: "অর্ডার নিশ্চিত" },
  processing: { en: "Start Processing", bn: "প্রসেসিং শুরু" },
  shipped: { en: "Mark Shipped", bn: "শিপড করুন" },
  delivered: { en: "Mark Delivered", bn: "ডেলিভারড করুন" },
  cancelled: { en: "Cancel Order", bn: "বাতিল করুন" },
};

const statusButtonColors: Record<string, string> = {
  confirmed: "blue",
  processing: "indigo",
  shipped: "cyan",
  delivered: "green",
  cancelled: "red",
};

function OrderListPage() {
  const { language } = useLanguage();
  const t = labels[language];
  const queryClient = useQueryClient();
  const { isDark } = useVendorTheme();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Selected order for drawer
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [confirmModalOpened, { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");

  // Order list query
  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders", search, statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
        status: statusFilter,
        sort: "newest",
      };
      if (search) params.search = search;

      const res = await api.vendorDashboard.orders.$get({ query: params });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  // Order detail query
  const { data: orderDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["vendor-order-detail", selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return null;
      const res = await api.vendorDashboard.orders[":orderId"].$get({
        param: { orderId: selectedOrderId },
      });
      if (!res.ok) throw new Error("Failed to fetch order detail");
      return res.json();
    },
    enabled: !!selectedOrderId,
  });

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      trackingNumber,
      trackingCarrier,
    }: {
      orderId: string;
      status: string;
      trackingNumber?: string;
      trackingCarrier?: string;
    }) => {
      const body: Record<string, string> = { status };
      if (trackingNumber) body.trackingNumber = trackingNumber;
      if (trackingCarrier) body.trackingCarrier = trackingCarrier;

      const res = await api.vendorDashboard.orders[":orderId"].status.$patch({
        param: { orderId },
        json: body as any,
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      toast.success(t.statusUpdated);
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-order-detail", selectedOrderId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard-overview"] });
      closeConfirmModal();
      setTrackingNumber("");
      setTrackingCarrier("");
    },
    onError: () => {
      toast.error(t.statusUpdateFailed);
    },
  });

  const handleStatusUpdate = (newStatus: string) => {
    setPendingStatus(newStatus);
    if (newStatus === "shipped") {
      setTrackingNumber("");
      setTrackingCarrier("");
    }
    openConfirmModal();
  };

  const confirmStatusUpdate = () => {
    if (!selectedOrderId || !pendingStatus) return;
    if (pendingStatus === "shipped" && !trackingNumber.trim()) {
      toast.error(t.trackingRequired);
      return;
    }
    updateStatusMutation.mutate({
      orderId: selectedOrderId,
      status: pendingStatus,
      trackingNumber: pendingStatus === "shipped" ? trackingNumber : undefined,
      trackingCarrier: pendingStatus === "shipped" ? trackingCarrier : undefined,
    });
  };

  const openOrderDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    openDrawer();
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const availableTransitions = orderDetail
    ? VENDOR_STATUS_TRANSITIONS[orderDetail.status] || []
    : [];

  return (
    <Stack gap="lg">
      <Title order={3} style={{ color: vendorColors.text.primary(isDark) }}>
        {t.title}
      </Title>

      <Paper
        shadow="sm"
        radius="md"
        p="md"
        style={{
          background: vendorColors.card(isDark).background,
          border: vendorColors.card(isDark).border,
          boxShadow: vendorColors.card(isDark).boxShadow,
        }}
      >
        {/* Search */}
        <TextInput
          placeholder={t.searchPlaceholder}
          leftSection={<Search size={16} />}
          value={search}
          onChange={(e) => {
            setSearch(e.currentTarget.value);
            setPage(1);
          }}
          mb="md"
          styles={{
            input: {
              backgroundColor: vendorColors.input(isDark).background,
              borderColor: isDark ? "oklch(0.3 0.02 260 / 0.4)" : undefined,
              color: vendorColors.input(isDark).color,
            },
          }}
        />

        {/* Status Tabs */}
        <Tabs
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val || "all");
            setPage(1);
          }}
          mb="md"
          styles={{
            list: {
              backgroundColor: isDark ? "oklch(0.2 0.02 260)" : undefined,
              borderColor: isDark
                ? "oklch(0.3 0.02 260 / 0.3)"
                : undefined,
            },
            tab: {
              color: isDark
                ? vendorColors.text.secondary(isDark)
                : undefined,
              "&[data-active]": {
                color: "oklch(0.65 0.15 175)",
                borderColor: "oklch(0.65 0.15 175)",
              },
            },
          }}
        >
          <Tabs.List>
            {statusTabs.map((tab) => (
              <Tabs.Tab key={tab} value={tab}>
                {t[tab as keyof typeof t]}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        {/* Table */}
        {isLoading ? (
          <Stack gap="xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={45} radius="sm" />
            ))}
          </Stack>
        ) : data?.orders && data.orders.length > 0 ? (
          <>
            <Table striped highlightOnHover>
              <Table.Thead
                style={{
                  background: vendorColors.table.header(isDark).background,
                }}
              >
                <Table.Tr>
                  <Table.Th
                    style={{
                      fontWeight: 700,
                      color: vendorColors.table.header(isDark).color,
                    }}
                  >
                    {t.orderNumber}
                  </Table.Th>
                  <Table.Th
                    visibleFrom="sm"
                    style={{
                      fontWeight: 700,
                      color: vendorColors.table.header(isDark).color,
                    }}
                  >
                    {t.customer}
                  </Table.Th>
                  <Table.Th
                    visibleFrom="md"
                    style={{
                      fontWeight: 700,
                      color: vendorColors.table.header(isDark).color,
                    }}
                  >
                    {t.items}
                  </Table.Th>
                  <Table.Th
                    style={{
                      fontWeight: 700,
                      color: vendorColors.table.header(isDark).color,
                    }}
                  >
                    {t.total}
                  </Table.Th>
                  <Table.Th
                    style={{
                      fontWeight: 700,
                      color: vendorColors.table.header(isDark).color,
                    }}
                  >
                    {t.status}
                  </Table.Th>
                  <Table.Th
                    visibleFrom="sm"
                    style={{
                      fontWeight: 700,
                      color: vendorColors.table.header(isDark).color,
                    }}
                  >
                    {t.date}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.orders.map((order) => (
                  <Table.Tr
                    key={order.id}
                    onClick={() => openOrderDetail(order.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {order.orderNumber}
                      </Text>
                    </Table.Td>
                    <Table.Td visibleFrom="sm">
                      <Text size="sm">{order.customerName}</Text>
                    </Table.Td>
                    <Table.Td visibleFrom="md">
                      <Text size="sm">{order.itemCount}</Text>
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
                        style={vendorColors.statusBadge(order.status, isDark)}
                      >
                        {order.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td visibleFrom="sm">
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

            {totalPages > 1 && (
              <Group justify="space-between" mt="md">
                <Text
                  size="sm"
                  style={{ color: vendorColors.text.secondary(isDark) }}
                >
                  {t.showing} {(page - 1) * limit + 1}-
                  {Math.min(page * limit, data.total)} {t.of} {data.total}{" "}
                  {t.orders}
                </Text>
                <Pagination
                  total={totalPages}
                  value={page}
                  onChange={setPage}
                  color="teal"
                  size="sm"
                />
              </Group>
            )}
          </>
        ) : (
          <Text
            ta="center"
            py="xl"
            style={{ color: vendorColors.text.secondary(isDark) }}
          >
            {t.noOrders}
          </Text>
        )}
      </Paper>

      {/* Order Detail Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title={
          <Text
            fw={600}
            size="lg"
            style={{ color: vendorColors.text.primary(isDark) }}
          >
            {t.orderDetail}
          </Text>
        }
        position="right"
        size="lg"
        padding="md"
        styles={{
          content: {
            backgroundColor: isDark ? "oklch(0.2 0.02 260)" : undefined,
          },
          header: {
            backgroundColor: isDark ? "oklch(0.22 0.02 260)" : undefined,
            borderBottom: isDark
              ? "1px solid oklch(0.3 0.02 260 / 0.3)"
              : undefined,
          },
        }}
      >
        {detailLoading ? (
          <Stack gap="md">
            <Skeleton height={30} />
            <Skeleton height={100} />
            <Skeleton height={200} />
          </Stack>
        ) : orderDetail ? (
          <Stack gap="md">
            {/* Order Header */}
            <Group justify="space-between">
              <Box>
                <Text fw={600}>{orderDetail.orderNumber}</Text>
                <Text size="sm" c="dimmed">
                  {new Date(orderDetail.createdAt).toLocaleDateString(
                    language === "bn" ? "bn-BD" : "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  )}
                </Text>
              </Box>
              <Badge
                size="lg"
                fw={600}
                style={vendorColors.statusBadge(orderDetail.status, isDark)}
              >
                {orderDetail.status}
              </Badge>
            </Group>

            <Divider />

            {/* Shipping Address */}
            <Box>
              <Text
                fw={600}
                mb="xs"
                style={{ color: vendorColors.text.primary(isDark) }}
              >
                <MapPin size={16} style={{ display: "inline", marginRight: 6 }} />
                {t.shippingAddress}
              </Text>
              <Paper
                p="sm"
                withBorder
                radius="sm"
                style={{
                  background: isDark ? "oklch(0.22 0.02 260)" : undefined,
                  borderColor: isDark
                    ? "oklch(0.3 0.02 260 / 0.3)"
                    : undefined,
                }}
              >
                <Stack gap={4}>
                  <Group gap="xs">
                    <User size={14} />
                    <Text size="sm" fw={500}>
                      {orderDetail.shippingAddress.fullName}
                    </Text>
                  </Group>
                  <Group gap="xs">
                    <Phone size={14} />
                    <Text size="sm">{orderDetail.shippingAddress.phone}</Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {orderDetail.shippingAddress.addressLine1}
                    {orderDetail.shippingAddress.addressLine2 && `, ${orderDetail.shippingAddress.addressLine2}`}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {orderDetail.shippingAddress.city}, {orderDetail.shippingAddress.district}
                    {orderDetail.shippingAddress.postalCode && ` - ${orderDetail.shippingAddress.postalCode}`}
                  </Text>
                </Stack>
              </Paper>
            </Box>

            {/* Customer Notes */}
            {orderDetail.customerNotes && (
              <Box>
                <Text
                  fw={600}
                  mb="xs"
                  style={{ color: vendorColors.text.primary(isDark) }}
                >
                  {t.customerNotes}
                </Text>
                <Paper
                  p="sm"
                  withBorder
                  radius="sm"
                  style={{
                    background: isDark ? "oklch(0.22 0.02 260)" : undefined,
                    borderColor: isDark
                      ? "oklch(0.3 0.02 260 / 0.3)"
                      : undefined,
                  }}
                >
                  <Text
                    size="sm"
                    style={{ color: vendorColors.text.secondary(isDark) }}
                  >
                    {orderDetail.customerNotes}
                  </Text>
                </Paper>
              </Box>
            )}

            <Divider />

            {/* Order Items */}
            <Box>
              <Text
                fw={600}
                mb="xs"
                style={{ color: vendorColors.text.primary(isDark) }}
              >
                {t.orderItems}
              </Text>
              <Stack gap="xs">
                {orderDetail.items.map((item) => (
                  <Group key={item.id} gap="sm" wrap="nowrap" py={4}>
                    {item.productSnapshot.image && (
                      <img
                        src={item.productSnapshot.image}
                        alt={item.productSnapshot.title}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 6,
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={500} lineClamp={1}>
                        {item.productSnapshot.title}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t.qty}: {item.quantity} x {formatBDT(item.unitPrice)}
                      </Text>
                    </Box>
                    <Text size="sm" fw={500}>
                      {formatBDT(item.lineTotal)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* Order Summary */}
            <Box>
              <Text
                fw={600}
                mb="xs"
                style={{ color: vendorColors.text.primary(isDark) }}
              >
                {t.orderSummary}
              </Text>
              <Stack gap={4}>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{t.subtotal}</Text>
                  <Text size="sm">{formatBDT(orderDetail.subtotal)}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">{t.shipping}</Text>
                  <Text size="sm">{formatBDT(orderDetail.shippingCost)}</Text>
                </Group>
                {orderDetail.codFee > 0 && (
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">{t.codFee}</Text>
                    <Text size="sm">{formatBDT(orderDetail.codFee)}</Text>
                  </Group>
                )}
                <Divider my={4} />
                <Group justify="space-between">
                  <Text fw={600}>{t.total}</Text>
                  <Text fw={700} size="lg" c="teal">
                    {formatBDT(orderDetail.total)}
                  </Text>
                </Group>
              </Stack>
            </Box>

            {/* Tracking Info */}
            {orderDetail.trackingNumber && (
              <>
                <Divider />
                <Box>
                  <Text
                    fw={600}
                    mb="xs"
                    style={{ color: vendorColors.text.primary(isDark) }}
                  >
                    <Truck size={16} style={{ display: "inline", marginRight: 6 }} />
                    {t.trackingInfo}
                  </Text>
                  <Paper
                    p="sm"
                    withBorder
                    radius="sm"
                    style={{
                      background: isDark ? "oklch(0.22 0.02 260)" : undefined,
                      borderColor: isDark
                        ? "oklch(0.3 0.02 260 / 0.3)"
                        : undefined,
                    }}
                  >
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t.trackingNumber}</Text>
                      <Text size="sm" fw={500}>{orderDetail.trackingNumber}</Text>
                    </Group>
                    {orderDetail.trackingCarrier && (
                      <Group justify="space-between" mt={4}>
                        <Text size="sm" c="dimmed">{t.trackingCarrier}</Text>
                        <Text size="sm">{orderDetail.trackingCarrier}</Text>
                      </Group>
                    )}
                  </Paper>
                </Box>
              </>
            )}

            {/* Status Update Actions */}
            {availableTransitions.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Text
                    fw={600}
                    mb="xs"
                    style={{ color: vendorColors.text.primary(isDark) }}
                  >
                    {t.updateStatus}
                  </Text>
                  <Group gap="sm">
                    {availableTransitions.map((nextStatus) => (
                      <Button
                        key={nextStatus}
                        color={statusButtonColors[nextStatus] || "gray"}
                        variant={nextStatus === "cancelled" ? "light" : "filled"}
                        size="sm"
                        onClick={() => handleStatusUpdate(nextStatus)}
                        loading={updateStatusMutation.isPending}
                      >
                        {statusButtonLabels[nextStatus]?.[language] || nextStatus}
                      </Button>
                    ))}
                  </Group>
                </Box>
              </>
            )}
          </Stack>
        ) : null}
      </Drawer>

      {/* Confirm Status Update Modal */}
      <Modal
        opened={confirmModalOpened}
        onClose={closeConfirmModal}
        title={t.confirmAction}
        centered
        styles={{
          content: {
            backgroundColor: isDark ? "oklch(0.2 0.02 260)" : undefined,
          },
          header: {
            backgroundColor: isDark ? "oklch(0.22 0.02 260)" : undefined,
            borderBottom: isDark
              ? "1px solid oklch(0.3 0.02 260 / 0.3)"
              : undefined,
          },
          title: {
            color: vendorColors.text.primary(isDark),
          },
        }}
      >
        <Stack gap="md">
          <Text size="sm">{t.confirmMessage}</Text>

          {pendingStatus === "shipped" && (
            <>
              <TextInput
                label={t.trackingNumber}
                placeholder="e.g. TRACK123456"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.currentTarget.value)}
                required
                styles={{
                  input: {
                    backgroundColor: vendorColors.input(isDark).background,
                    borderColor: isDark
                      ? "oklch(0.3 0.02 260 / 0.4)"
                      : undefined,
                    color: vendorColors.input(isDark).color,
                  },
                  label: {
                    color: vendorColors.text.primary(isDark),
                  },
                }}
              />
              <TextInput
                label={t.trackingCarrier}
                placeholder="e.g. Pathao, Steadfast"
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.currentTarget.value)}
                styles={{
                  input: {
                    backgroundColor: vendorColors.input(isDark).background,
                    borderColor: isDark
                      ? "oklch(0.3 0.02 260 / 0.4)"
                      : undefined,
                    color: vendorColors.input(isDark).color,
                  },
                  label: {
                    color: vendorColors.text.primary(isDark),
                  },
                }}
              />
            </>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeConfirmModal}>
              {t.cancel}
            </Button>
            <Button
              color={statusButtonColors[pendingStatus || ""] || "teal"}
              onClick={confirmStatusUpdate}
              loading={updateStatusMutation.isPending}
            >
              {t.yes}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
