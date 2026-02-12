import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  ArrowRightLeft,
  Clock3,
  Info,
  PackageSearch,
  Search,
  Store,
  Truck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { StatusBadge } from "@/components/admin/status-badge";
import type {
  AdminOrderDetailDTO,
  AdminOrderListItemDTO,
  AdminOrderListResponseDTO,
  AdminWalletSummaryDTO,
} from "@kineDao.com/api-types/admin";

export const Route = createFileRoute("/admin/_layout/orders")({
  component: AdminOrdersPage,
});

const labels = {
  en: {
    title: "Order Operations",
    subtitle:
      "Track fulfillment, reconcile courier cash, and move COD orders into the payout pipeline with confidence.",
    search: "Search by order number or customer name...",
    filterStatus: "Filter by Status",
    allStatuses: "All Statuses",
    listTitle: "Order Queue",
    noResults: "No orders found",
    selectOrderTitle: "Pick an order",
    selectOrderDesc:
      "Select any order card from the left to view full details and run reconciliation actions.",
    loadingDetail: "Loading order details...",
    orderNumber: "Order #",
    customer: "Customer",
    vendor: "Vendor",
    items: "Items",
    total: "Total",
    date: "Date",
    orderInfo: "Order Information",
    shippingAddress: "Shipping Address",
    orderItems: "Order Items",
    customerNotes: "Customer Notes",
    paymentMethod: "Payment Method",
    trackingNumber: "Tracking Number",
    trackingCarrier: "Tracking Carrier",
    subtotal: "Subtotal",
    shippingCost: "Shipping Cost",
    codFee: "COD Fee",
    grandTotal: "Grand Total",
    fullName: "Full Name",
    phone: "Phone",
    alternatePhone: "Alternate Phone",
    address: "Address",
    city: "City",
    district: "District",
    postalCode: "Postal Code",
    deliveryInstructions: "Delivery Instructions",
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    paidToAdmin: "Paid to Admin",
    completed: "Completed",
    returned: "Returned",
    cancelled: "Cancelled",
    reconcileCash: "Reconcile Cash Received",
    actualCourierCost: "Actual Courier Cost (BDT)",
    returnFee: "Return Fee (BDT)",
    deductDeliveryFromVendor: "Deduct delivery cost from vendor",
    deductDeliveryHint:
      "Turn on only when vendor policy says vendor bears delivery discrepancy.",
    deductReturnFromVendor: "Deduct return fee from vendor",
    deductReturnHint:
      "Use for RTS/return cases where vendor is liable for return charge.",
    autoReturnFee: "Auto-calculate Return Fee",
    autoReturnFeeHint:
      "Use courier default rate card (or 50% of delivery deduction fallback) for RTS/return charge.",
    courierName: "Courier Name",
    courierRef: "Courier Reference",
    reconcileNotes: "Notes",
    reconcileSuccess: "Order reconciled successfully",
    reconcileError: "Failed to reconcile order",
    cancel: "Cancel",
    reconcileSubtitle:
      "Confirm that courier cash has reached your account. This records financial entries and starts vendor clearing.",
    reconcileHowTitle: "What Happens After Save",
    reconcileStep1: "Order status moves from Delivered to Paid to Admin",
    reconcileStep2:
      "Ledger entries are created (Sale, Commission, plus optional Delivery/Return deductions)",
    reconcileStep3: "Vendor amount remains Pending until T+7 clearing",
    summaryTitle: "Reconciliation Preview",
    productSellingPrice: "Product Subtotal (Reference)",
    customerPaidTotal: "Customer Paid Total",
    orderShippingCost: "Order Shipping Cost",
    enteredCourierCost: "Entered Courier Cost",
    appliedDeliveryCost: "Courier Cost (Pass-through)",
    appliedReturnFee: "Vendor Return Fee Deduction",
    courierCostRecorded: "Courier Cost (Recorded for Admin)",
    commissionRate: "Commission Rate",
    commissionAmount: "Platform Charge Amount",
    estimatedVendorNet: "Estimated Vendor Net",
    formulaTitle: "Formula",
    formulaHint:
      "Vendor Net = Customer Paid Total - Platform Charge - Courier Cost - Vendor Return Deduction",
    noVendorDeduction: "Not deducted from vendor",
    negativeNetWarning:
      "Vendor net is negative. Reduce deductions or keep delivery/return as platform cost.",
    policyHint:
      "Courier cost is settled separately using the entered actual courier cost.",
    courierNamePlaceholder: "Select courier",
    courierRefPlaceholder: "Settlement sheet ID / invoice / transfer note",
    notePlaceholder:
      "Optional audit note (bank line, adjustment reason, etc.)",
    confirmReconcile: "Confirm & Save",
    requiredCost: "Actual courier cost is required",
    openForReconcile: "Ready for reconciliation",
  },
  bn: {
    title: "অর্ডার অপারেশন",
    subtitle:
      "ফুলফিলমেন্ট ট্র্যাক করুন, কুরিয়ার ক্যাশ সমন্বয় করুন এবং COD অর্ডারকে পেআউট পাইপলাইনে নিন।",
    search: "অর্ডার নম্বর বা গ্রাহকের নাম দিয়ে খুঁজুন...",
    filterStatus: "স্ট্যাটাস দ্বারা ফিল্টার করুন",
    allStatuses: "সকল স্ট্যাটাস",
    listTitle: "অর্ডার কিউ",
    noResults: "কোনো অর্ডার পাওয়া যায়নি",
    selectOrderTitle: "একটি অর্ডার নির্বাচন করুন",
    selectOrderDesc:
      "বাম দিক থেকে একটি অর্ডার নির্বাচন করলে ডান পাশে পূর্ণ বিবরণ ও সমন্বয় অপশন দেখা যাবে।",
    loadingDetail: "অর্ডার তথ্য লোড হচ্ছে...",
    orderNumber: "অর্ডার #",
    customer: "গ্রাহক",
    vendor: "বিক্রেতা",
    items: "আইটেম",
    total: "মোট",
    date: "তারিখ",
    orderInfo: "অর্ডার তথ্য",
    shippingAddress: "শিপিং ঠিকানা",
    orderItems: "অর্ডার আইটেম",
    customerNotes: "গ্রাহকের নোট",
    paymentMethod: "পেমেন্ট পদ্ধতি",
    trackingNumber: "ট্র্যাকিং নম্বর",
    trackingCarrier: "ট্র্যাকিং ক্যারিয়ার",
    subtotal: "উপমোট",
    shippingCost: "শিপিং খরচ",
    codFee: "COD ফি",
    grandTotal: "সর্বমোট",
    fullName: "সম্পূর্ণ নাম",
    phone: "ফোন",
    alternatePhone: "বিকল্প ফোন",
    address: "ঠিকানা",
    city: "শহর",
    district: "জেলা",
    postalCode: "পোস্টাল কোড",
    deliveryInstructions: "ডেলিভারি নির্দেশনা",
    pending: "অপেক্ষমাণ",
    confirmed: "নিশ্চিত",
    processing: "প্রসেসিং",
    shipped: "শিপড",
    delivered: "ডেলিভারড",
    paidToAdmin: "অ্যাডমিনে পেমেন্ট",
    completed: "সম্পন্ন",
    returned: "রিটার্নড",
    cancelled: "বাতিল",
    reconcileCash: "ক্যাশ রিসিভড সমন্বয় করুন",
    actualCourierCost: "প্রকৃত কুরিয়ার খরচ (BDT)",
    returnFee: "রিটার্ন ফি (BDT)",
    deductDeliveryFromVendor: "ডেলিভারি খরচ ভেন্ডর থেকে কাটুন",
    deductDeliveryHint:
      "ভেন্ডর পলিসি অনুযায়ী ডেলিভারি ডিসক্রেপেন্সি ভেন্ডর বহন করলে এটি চালু করুন।",
    deductReturnFromVendor: "রিটার্ন ফি ভেন্ডর থেকে কাটুন",
    deductReturnHint:
      "RTS/রিটার্নে ভেন্ডর দায়ী হলে রিটার্ন চার্জ কাটতে এটি ব্যবহার করুন।",
    autoReturnFee: "রিটার্ন ফি অটো-ক্যালকুলেট করুন",
    autoReturnFeeHint:
      "RTS/রিটার্ন চার্জের জন্য কুরিয়ার রেট কার্ড (না থাকলে ডেলিভারি ডিডাকশনের ৫০%) ব্যবহার করবে।",
    courierName: "কুরিয়ার নাম",
    courierRef: "কুরিয়ার রেফারেন্স",
    reconcileNotes: "নোট",
    reconcileSuccess: "অর্ডার সফলভাবে সমন্বয় হয়েছে",
    reconcileError: "অর্ডার সমন্বয় ব্যর্থ হয়েছে",
    cancel: "বাতিল",
    reconcileSubtitle:
      "কুরিয়ার থেকে টাকা আপনার অ্যাকাউন্টে এসেছে নিশ্চিত করে এই ধাপ সম্পন্ন করুন। এতে আর্থিক লেজার আপডেট হবে।",
    reconcileHowTitle: "সেভ করার পর যা হবে",
    reconcileStep1: "অর্ডার স্ট্যাটাস হবে Delivered থেকে Paid to Admin",
    reconcileStep2:
      "লেজার এন্ট্রি তৈরি হবে (Sale, Commission, এবং প্রয়োজন হলে Delivery/Return deduction)",
    reconcileStep3: "T+7 ক্লিয়ারিং না হওয়া পর্যন্ত টাকা Pending থাকবে",
    summaryTitle: "সমন্বয় প্রিভিউ",
    productSellingPrice: "পণ্যের উপমোট (রেফারেন্স)",
    customerPaidTotal: "গ্রাহক কর্তৃক পরিশোধিত মোট",
    orderShippingCost: "অর্ডারের শিপিং খরচ",
    enteredCourierCost: "আপনার দেওয়া কুরিয়ার খরচ",
    appliedDeliveryCost: "কুরিয়ার খরচ (পাস-থ্রু)",
    appliedReturnFee: "ভেন্ডর রিটার্ন ডিডাকশন",
    courierCostRecorded: "কুরিয়ার খরচ (অ্যাডমিন রেকর্ড)",
    commissionRate: "কমিশন রেট",
    commissionAmount: "প্ল্যাটফর্ম চার্জ পরিমাণ",
    estimatedVendorNet: "আনুমানিক ভেন্ডর নেট",
    formulaTitle: "ফর্মুলা",
    formulaHint:
      "ভেন্ডর নেট = গ্রাহকের মোট পরিশোধ - প্ল্যাটফর্ম চার্জ - কুরিয়ার খরচ - ভেন্ডর রিটার্ন ডিডাকশন",
    noVendorDeduction: "ভেন্ডর থেকে কাটা হবে না",
    negativeNetWarning:
      "ভেন্ডর নেট নেগেটিভ হচ্ছে। ডিডাকশন কমান বা ডেলিভারি/রিটার্ন প্ল্যাটফর্ম কস্ট হিসেবে রাখুন।",
    policyHint:
      "প্রকৃত কুরিয়ার খরচ কমিশন থেকে আলাদা পাস-থ্রু হিসেবে সমন্বয় করা হয়।",
    courierNamePlaceholder: "কুরিয়ার নির্বাচন করুন",
    courierRefPlaceholder: "সেটেলমেন্ট শীট আইডি / ইনভয়েস / ট্রান্সফার নোট",
    notePlaceholder: "ঐচ্ছিক অডিট নোট (ব্যাংক লাইন, সমন্বয় কারণ ইত্যাদি)",
    confirmReconcile: "নিশ্চিত করে সেভ করুন",
    requiredCost: "প্রকৃত কুরিয়ার খরচ আবশ্যক",
    openForReconcile: "সমন্বয়ের জন্য প্রস্তুত",
  },
};

function formatBDT(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-BD", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getAutoReturnFeeBdt(courierName: string, deliveryCostBdt: number): number {
  const normalized = courierName.trim().toLowerCase();
  const flatByCourier: Record<string, number> = {
    pathao: 30,
    steadfast: 30,
    redx: 25,
    ecourier: 30,
    paperfly: 30,
  };

  if (normalized && normalized in flatByCourier) {
    return flatByCourier[normalized];
  }

  return Math.max(0, Math.round(deliveryCostBdt * 0.5));
}

function AdminOrdersPage() {
  const { language } = useLanguage();
  const t = labels[language];
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  const [reconcileOpened, { open: openReconcile, close: closeReconcile }] =
    useDisclosure(false);
  const [actualCourierCost, setActualCourierCost] = useState("");
  const [returnFee, setReturnFee] = useState("0");
  const [deductReturnFeeFromVendor, setDeductReturnFeeFromVendor] = useState(false);
  const [autoReturnFee, setAutoReturnFee] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [courierRef, setCourierRef] = useState("");
  const [reconcileNotes, setReconcileNotes] = useState("");

  const courierOptions = [
    { value: "Pathao", label: "Pathao" },
    { value: "Steadfast", label: "Steadfast" },
    { value: "RedX", label: "RedX" },
    { value: "eCourier", label: "eCourier" },
    { value: "Paperfly", label: "Paperfly" },
  ];

  const statusOptions = useMemo(
    () => [
      { value: "all", label: t.allStatuses },
      { value: "pending", label: t.pending },
      { value: "confirmed", label: t.confirmed },
      { value: "processing", label: t.processing },
      { value: "shipped", label: t.shipped },
      { value: "delivered", label: t.delivered },
      { value: "paid_to_admin", label: t.paidToAdmin },
      { value: "completed", label: t.completed },
      { value: "returned", label: t.returned },
      { value: "cancelled", label: t.cancelled },
    ],
    [t],
  );

  const { data: ordersData, isLoading: isOrdersLoading } = useQuery<AdminOrderListResponseDTO>({
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
      return (await response.json()) as AdminOrderListResponseDTO;
    },
  });

  const orders = ordersData?.orders ?? [];

  useEffect(() => {
    if (orders.length === 0) {
      setSelectedOrder(null);
      return;
    }

    if (!selectedOrder || !orders.some((o) => o.id === selectedOrder)) {
      setSelectedOrder(orders[0].id);
    }
  }, [orders, selectedOrder]);

  const { data: orderDetail, isLoading: isOrderDetailLoading } = useQuery<AdminOrderDetailDTO | null>({
    queryKey: ["admin-order-detail", selectedOrder],
    queryFn: async () => {
      if (!selectedOrder) return null;
      const response = await api.admin.orders[":orderId"].$get({
        param: { orderId: selectedOrder },
      });
      if (!response.ok) throw new Error("Failed to fetch order detail");
      return (await response.json()) as AdminOrderDetailDTO;
    },
    enabled: !!selectedOrder,
  });

  const { data: walletSummary } = useQuery<AdminWalletSummaryDTO | null>({
    queryKey: ["admin-vendor-wallet-summary", orderDetail?.vendorId],
    queryFn: async () => {
      if (!orderDetail?.vendorId) return null;
      const response = await api.admin.vendors[":vendorId"]["wallet-summary"].$get({
        param: { vendorId: orderDetail.vendorId },
      });
      if (!response.ok) return null;
      return (await response.json()) as AdminWalletSummaryDTO;
    },
    enabled: !!orderDetail?.vendorId,
  });

  const reconcileMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) throw new Error("No order selected");

      const response = await api.admin.orders[":orderId"][
        "reconcile-courier-cash"
      ].$patch({
        param: { orderId: selectedOrder },
        json: {
          actualCourierCostPaisa: Math.round(actualCourierCostBdt * 100),
          returnFeePaisa: Math.round(returnFeeInputBdt * 100),
          deductReturnFeeFromVendor,
          courierName: courierName || undefined,
          courierOrderRef: courierRef || undefined,
          notes: reconcileNotes || undefined,
        },
      });

      if (!response.ok) {
        let errorMessage = t.reconcileError;
        try {
          const errorBody = (await response.json()) as { error?: string };
          if (errorBody?.error) {
            errorMessage = errorBody.error;
          }
        } catch {
          // Keep fallback error message
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success(t.reconcileSuccess);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-order-detail", selectedOrder],
      });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-payouts"] });
      closeReconcile();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t.reconcileError);
    },
  });

  const orderShippingCostBdt = orderDetail ? orderDetail.shippingCost / 100 : 0;
  const actualCourierCostBdt = Math.max(0, Number(actualCourierCost || "0") || 0);
  const effectiveCourierCostBdt = actualCourierCostBdt;
  const autoReturnFeeBdt = getAutoReturnFeeBdt(courierName, effectiveCourierCostBdt);
  const manualReturnFeeBdt = Math.max(0, Number(returnFee || "0") || 0);
  const returnFeeInputBdt = autoReturnFee ? autoReturnFeeBdt : manualReturnFeeBdt;
  const appliedDeliveryDeductionBdt = effectiveCourierCostBdt;
  const appliedReturnFeeBdt = deductReturnFeeFromVendor ? returnFeeInputBdt : 0;
  const commissionRatePercent = walletSummary?.commissionRatePercent ?? 12;
  const itemSubtotalBdt = orderDetail
    ? orderDetail.items.reduce((sum, item) => sum + item.lineTotal, 0) / 100
    : 0;
  const subtotalBdt = itemSubtotalBdt > 0 ? itemSubtotalBdt : orderDetail ? orderDetail.subtotal / 100 : 0;
  const customerPaidTotalBdt = orderDetail ? orderDetail.total / 100 : 0;
  const commissionAmountBdt = (customerPaidTotalBdt * commissionRatePercent) / 100;
  const estimatedVendorNetBdt =
    customerPaidTotalBdt -
    commissionAmountBdt -
    appliedDeliveryDeductionBdt -
    appliedReturnFeeBdt;

  return (
    <div className="space-y-6">
      <Paper
        radius="xl"
        className="overflow-hidden border border-cyan-200/60 bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 dark:border-cyan-900/50 dark:from-slate-900 dark:via-cyan-950/30 dark:to-emerald-950/20"
      >
        <div className="p-6 md:p-8">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <Title order={2} className="!tracking-tight">
                {t.title}
              </Title>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{t.subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge radius="sm" color="teal" variant="light">
                {orders.length} {t.items}
              </Badge>
              <Badge radius="sm" color="blue" variant="light">
                {statusOptions.find((s) => s.value === statusFilter)?.label}
              </Badge>
              {orderDetail?.status === "delivered" ? (
                <Badge radius="sm" color="orange" variant="light">
                  {t.openForReconcile}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <TextInput
              size="md"
              placeholder={t.search}
              leftSection={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              size="md"
              placeholder={t.filterStatus}
              data={statusOptions}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || "all")}
            />
          </div>
        </div>
      </Paper>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,1fr)]">
        <section className="space-y-3">
          <Group justify="space-between">
            <Text fw={700}>{t.listTitle}</Text>
            <Text size="sm" c="dimmed">
              {ordersData?.total ?? 0} {t.items}
            </Text>
          </Group>

          {isOrdersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} height={120} radius="md" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order: AdminOrderListItemDTO) => {
                const isActive = order.id === selectedOrder;
                return (
                  <Card
                    key={order.id}
                    withBorder
                    radius="lg"
                    padding="lg"
                    onClick={() => setSelectedOrder(order.id)}
                    className={`cursor-pointer transition-all duration-200 ${
                      isActive
                        ? "border-cyan-500/70 shadow-lg shadow-cyan-600/10"
                        : "border-slate-200 hover:border-cyan-300 hover:shadow-md dark:border-slate-800"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <Text fw={700}>{order.orderNumber}</Text>
                        <Text size="xs" c="dimmed" mt={2}>
                          {formatDate(order.createdAt)}
                        </Text>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>

                    <Divider my="sm" />

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div>
                        <Text size="xs" c="dimmed">{t.customer}</Text>
                        <Text size="sm" fw={500}>{order.customerName}</Text>
                      </div>
                      <div>
                        <Text size="xs" c="dimmed">{t.vendor}</Text>
                        <Text size="sm" fw={500}>{order.vendorName}</Text>
                      </div>
                      <div>
                        <Text size="xs" c="dimmed">{t.items}</Text>
                        <Text size="sm" fw={500}>{order.itemCount}</Text>
                      </div>
                      <div>
                        <Text size="xs" c="dimmed">{t.total}</Text>
                        <Text size="sm" fw={700}>{formatBDT(order.total)}</Text>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Paper radius="lg" p="xl" withBorder>
              <Text c="dimmed" ta="center">{t.noResults}</Text>
            </Paper>
          )}
        </section>

        <aside className="xl:sticky xl:top-6 h-fit">
          <Paper
            radius="xl"
            p="lg"
            withBorder
            className="min-h-[420px] border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/40"
          >
            {!selectedOrder ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <ThemeIcon variant="light" color="cyan" size={48} radius="xl" mb="md">
                  <PackageSearch size={24} />
                </ThemeIcon>
                <Text fw={700}>{t.selectOrderTitle}</Text>
                <Text size="sm" c="dimmed" mt="xs" maw={280}>
                  {t.selectOrderDesc}
                </Text>
              </div>
            ) : isOrderDetailLoading ? (
              <Stack gap="sm">
                <Text fw={600}>{t.loadingDetail}</Text>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} height={68} radius="md" />
                ))}
              </Stack>
            ) : orderDetail ? (
              <Stack gap="md">
                <div className="rounded-lg border border-cyan-200/70 bg-gradient-to-r from-cyan-50 to-emerald-50 p-4 dark:border-cyan-900/60 dark:from-cyan-950/30 dark:to-emerald-950/20">
                  <Group justify="space-between" align="start">
                    <div>
                      <Text size="xs" c="dimmed">{t.orderNumber}</Text>
                      <Text fw={800} size="lg">{orderDetail.orderNumber}</Text>
                    </div>
                    <StatusBadge status={orderDetail.status} />
                  </Group>
                  <Group justify="space-between" mt="sm">
                    <Text size="sm" c="dimmed">{formatDate(orderDetail.createdAt)}</Text>
                    <Text fw={700}>{formatBDT(orderDetail.total)}</Text>
                  </Group>
                  {orderDetail.status === "delivered" ? (
                    <Button
                      mt="md"
                      fullWidth
                      color="teal"
                    onClick={() => {
                      setActualCourierCost((orderDetail.shippingCost / 100).toString());
                      setReturnFee((orderDetail.returnFeePaisa / 100).toString());
                      setDeductReturnFeeFromVendor(false);
                      setAutoReturnFee(false);
                      setCourierName(orderDetail.courierName || "");
                      setCourierRef(orderDetail.courierOrderRef || "");
                      setReconcileNotes("");
                      openReconcile();
                      }}
                    >
                      {t.reconcileCash}
                    </Button>
                  ) : null}
                </div>

                <Card withBorder radius="md" padding="md">
                  <Text fw={700} mb="sm">{t.orderInfo}</Text>
                  <Stack gap={6}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t.vendor}</Text>
                      <Text size="sm" fw={600}>{orderDetail.vendorName}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t.customer}</Text>
                      <Text size="sm" fw={600}>{orderDetail.customerName}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t.paymentMethod}</Text>
                      <Text size="sm" fw={600}>{orderDetail.paymentMethod}</Text>
                    </Group>
                    {orderDetail.trackingNumber ? (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">{t.trackingNumber}</Text>
                        <Text size="sm" fw={600}>{orderDetail.trackingNumber}</Text>
                      </Group>
                    ) : null}
                    {orderDetail.trackingCarrier ? (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">{t.trackingCarrier}</Text>
                        <Text size="sm" fw={600}>{orderDetail.trackingCarrier}</Text>
                      </Group>
                    ) : null}
                  </Stack>
                </Card>

                <Card withBorder radius="md" padding="md">
                  <Text fw={700} mb="sm">{t.shippingAddress}</Text>
                  <Stack gap={6}>
                    <Group gap={6}>
                      <Store size={14} />
                      <Text size="sm" fw={600}>{orderDetail.shippingAddress.fullName}</Text>
                    </Group>
                    <Group gap={6}>
                      <Truck size={14} />
                      <Text size="sm">{orderDetail.shippingAddress.phone}</Text>
                    </Group>
                    <Text size="sm">{orderDetail.shippingAddress.addressLine1}</Text>
                    {orderDetail.shippingAddress.addressLine2 ? (
                      <Text size="sm">{orderDetail.shippingAddress.addressLine2}</Text>
                    ) : null}
                    <Text size="sm" c="dimmed">
                      {orderDetail.shippingAddress.city}, {orderDetail.shippingAddress.district}
                    </Text>
                    {orderDetail.shippingAddress.deliveryInstructions ? (
                      <Text size="xs" c="dimmed">
                        {t.deliveryInstructions}: {orderDetail.shippingAddress.deliveryInstructions}
                      </Text>
                    ) : null}
                  </Stack>
                </Card>

                <Card withBorder radius="md" padding="md">
                  <Text fw={700} mb="sm">{t.orderItems}</Text>
                  <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                    {orderDetail.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border border-slate-200/80 p-2 dark:border-slate-800"
                      >
                        <Group justify="space-between" align="start" wrap="nowrap">
                          <div className="min-w-0">
                            <Text size="sm" fw={600} lineClamp={1}>
                              {item.productSnapshot.title}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {t.items}: {item.quantity}
                            </Text>
                          </div>
                          <Text size="sm" fw={700}>{formatBDT(item.lineTotal)}</Text>
                        </Group>
                      </div>
                    ))}
                  </div>

                  <Divider my="sm" />

                  <Stack gap={4}>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t.subtotal}</Text>
                      <Text size="sm" fw={600}>{formatBDT(orderDetail.subtotal)}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">{t.shippingCost}</Text>
                      <Text size="sm" fw={600}>{formatBDT(orderDetail.shippingCost)}</Text>
                    </Group>
                    {orderDetail.codFee > 0 ? (
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">{t.codFee}</Text>
                        <Text size="sm" fw={600}>{formatBDT(orderDetail.codFee)}</Text>
                      </Group>
                    ) : null}
                    <Divider my={4} />
                    <Group justify="space-between">
                      <Text fw={700}>{t.grandTotal}</Text>
                      <Text fw={800}>{formatBDT(orderDetail.total)}</Text>
                    </Group>
                  </Stack>
                </Card>

                {orderDetail.customerNotes ? (
                  <Card withBorder radius="md" padding="md">
                    <Text fw={700} mb="xs">{t.customerNotes}</Text>
                    <Text size="sm" c="dimmed">{orderDetail.customerNotes}</Text>
                  </Card>
                ) : null}
              </Stack>
            ) : (
              <div className="flex min-h-[360px] items-center justify-center">
                <Text c="dimmed">{t.selectOrderDesc}</Text>
              </div>
            )}
          </Paper>
        </aside>
      </div>

      <Modal
        opened={reconcileOpened}
        onClose={closeReconcile}
        title={t.reconcileCash}
        size="lg"
        centered
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t.reconcileSubtitle}</p>

          <Alert
            icon={
              <ThemeIcon variant="light" radius="xl" color="blue">
                <Info size={14} />
              </ThemeIcon>
            }
            title={t.reconcileHowTitle}
            radius="md"
          >
            <div className="space-y-1 text-sm">
              <p>{t.reconcileStep1}</p>
              <p>{t.reconcileStep2}</p>
              <p>{t.reconcileStep3}</p>
            </div>
          </Alert>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextInput
              label={t.actualCourierCost}
              description={t.requiredCost}
              type="number"
              min={0}
              step="0.01"
              value={actualCourierCost}
              onChange={(e) => setActualCourierCost(e.target.value)}
              required
            />
            <TextInput
              label={t.returnFee}
              description={deductReturnFeeFromVendor ? undefined : t.noVendorDeduction}
              type="number"
              min={0}
              step="0.01"
              value={autoReturnFee ? String(autoReturnFeeBdt) : returnFee}
              onChange={(e) => setReturnFee(e.target.value)}
              disabled={!deductReturnFeeFromVendor || autoReturnFee}
            />
            <Select
              label={t.courierName}
              data={courierOptions}
              placeholder={t.courierNamePlaceholder}
              value={courierName || null}
              onChange={(value) => setCourierName(value || "")}
              searchable
              clearable
            />
            <TextInput
              label={t.courierRef}
              placeholder={t.courierRefPlaceholder}
              value={courierRef}
              onChange={(e) => setCourierRef(e.target.value)}
            />
          </div>

          <Paper
            p="sm"
            radius="md"
            className="border border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50"
          >
            <Stack gap={8}>
              <Checkbox
                checked={deductReturnFeeFromVendor}
                onChange={(e) => {
                  const checked = e.currentTarget.checked;
                  setDeductReturnFeeFromVendor(checked);
                  if (!checked) {
                    setAutoReturnFee(false);
                    setReturnFee("0");
                  }
                }}
                label={t.deductReturnFromVendor}
                description={t.deductReturnHint}
              />
            </Stack>
          </Paper>

          <Checkbox
            checked={autoReturnFee}
            onChange={(e) => setAutoReturnFee(e.currentTarget.checked)}
            label={t.autoReturnFee}
            description={`${t.autoReturnFeeHint} (৳${autoReturnFeeBdt.toLocaleString(
              "en-BD",
            )})`}
            disabled={!deductReturnFeeFromVendor}
          />

          <Textarea
            label={t.reconcileNotes}
            placeholder={t.notePlaceholder}
            value={reconcileNotes}
            onChange={(e) => setReconcileNotes(e.target.value)}
            minRows={2}
          />

          <Paper
            p="md"
            radius="md"
            className="border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-cyan-50 dark:border-emerald-800/60 dark:from-emerald-950/30 dark:to-cyan-950/20"
          >
            <Group justify="space-between" mb="xs">
              <Text fw={600}>{t.summaryTitle}</Text>
              <ThemeIcon radius="xl" color="teal" variant="light">
                <ArrowRightLeft size={14} />
              </ThemeIcon>
            </Group>
            <Stack gap={6}>
              <Group justify="space-between">
                <Text size="sm">{t.productSellingPrice}</Text>
                <Text size="sm" fw={700}>
                  ৳{subtotalBdt.toLocaleString("en-BD", { maximumFractionDigits: 2 })}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">{t.customerPaidTotal}</Text>
                <Text size="sm" fw={700}>
                  ৳{customerPaidTotalBdt.toLocaleString("en-BD", { maximumFractionDigits: 2 })}
                </Text>
              </Group>
              <Group justify="space-between">
                <Group gap={6}>
                  <Wallet size={14} />
                  <Text size="sm">{t.orderShippingCost}</Text>
                </Group>
                <Text size="sm" fw={600}>
                  ৳{orderShippingCostBdt.toLocaleString("en-BD")}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">{t.enteredCourierCost}</Text>
                <Text size="sm" fw={600}>
                  ৳{actualCourierCostBdt.toLocaleString("en-BD")}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">{t.courierCostRecorded}</Text>
                <Text size="sm" fw={600}>
                  ৳{effectiveCourierCostBdt.toLocaleString("en-BD")}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">{t.appliedDeliveryCost}</Text>
                <Text
                  size="sm"
                  fw={700}
                  c={appliedDeliveryDeductionBdt > 0 ? "teal" : "gray"}
                >
                  ৳{appliedDeliveryDeductionBdt.toLocaleString("en-BD")}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">{t.appliedReturnFee}</Text>
                <Text size="sm" fw={700} c={deductReturnFeeFromVendor ? "orange" : "gray"}>
                  {deductReturnFeeFromVendor
                    ? `৳${appliedReturnFeeBdt.toLocaleString("en-BD")}`
                    : t.noVendorDeduction}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">{t.commissionRate}</Text>
                <Text size="sm" fw={600}>
                  {commissionRatePercent.toFixed(2)}%
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm">{t.commissionAmount}</Text>
                <Text size="sm" fw={600}>
                  ৳{commissionAmountBdt.toLocaleString("en-BD", { maximumFractionDigits: 2 })}
                </Text>
              </Group>
              <Group justify="space-between">
                <Text size="sm" fw={600}>{t.formulaTitle}</Text>
                <Text size="xs" c="dimmed" ta="right" maw={280}>
                  {t.formulaHint}
                </Text>
              </Group>
              <Divider my={2} />
              <Group justify="space-between">
                <Text size="sm" fw={700}>{t.estimatedVendorNet}</Text>
                <Text size="sm" fw={800} c={estimatedVendorNetBdt >= 0 ? "teal" : "red"}>
                  ৳{estimatedVendorNetBdt.toLocaleString("en-BD", { maximumFractionDigits: 2 })}
                </Text>
              </Group>
              {estimatedVendorNetBdt < 0 ? (
                <Alert color="red" variant="light" title={t.negativeNetWarning}>
                  <Text size="xs">{t.negativeNetWarning}</Text>
                </Alert>
              ) : null}
              <Group gap={6} mt={4}>
                <Clock3 size={12} />
                <Text size="xs" c="dimmed">
                  {t.policyHint}
                </Text>
              </Group>
            </Stack>
          </Paper>

          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeReconcile}>
              {t.cancel}
            </Button>
            <Button
              loading={reconcileMutation.isPending}
              onClick={() => reconcileMutation.mutate()}
              disabled={
                !actualCourierCost ||
                Number(actualCourierCost) < 0 ||
                estimatedVendorNetBdt < 0
              }
            >
              {t.confirmReconcile}
            </Button>
          </Group>
        </div>
      </Modal>
    </div>
  );
}
