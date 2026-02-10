import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Stack,
  Title,
  Paper,
  Group,
  Text,
  Button,
  Card,
  SimpleGrid,
  Table,
  Modal,
  TextInput,
  Select,
  Textarea,
  Divider,
  Skeleton,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Wallet, CheckCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import type { AdminPendingPayoutDTO } from "@kineDao.com/api-types/admin";

export const Route = createFileRoute("/admin/_layout/payouts")({
  component: AdminPayoutsPage,
});

const labels = {
  en: {
    title: "Payout Management",
    pendingPayouts: "Pending Payouts",
    payoutHistory: "Payout History",
    vendorName: "Vendor",
    orderCount: "Orders",
    pendingAmount: "Pending Amount",
    paymentMethod: "Payment Method",
    lastPayout: "Last Payout",
    markAsPaid: "Mark as Paid",
    noPendingPayouts: "No pending payouts",
    amount: "Amount",
    reference: "Payment Reference",
    notes: "Notes (Optional)",
    periodStart: "Period Start",
    periodEnd: "Period End",
    cancel: "Cancel",
    confirm: "Confirm Payment",
    processPayoutTitle: "Process Payout",
    amountLabel: "Amount (BDT)",
    paymentMethodLabel: "Payment Method",
    referenceLabel: "Payment Reference",
    referencePlaceholder: "Transaction ID or reference number...",
    notesPlaceholder: "Add any additional notes...",
    periodStartLabel: "Period Start Date",
    periodEndLabel: "Period End Date",
    processedBy: "Processed By",
    processedDate: "Processed Date",
    noHistory: "No payout history",
    payoutSuccess: "Payout processed successfully",
    payoutError: "Failed to process payout",
    bank: "Bank",
    bkash: "bKash",
    nagad: "Nagad",
  },
  bn: {
    title: "পেআউট ব্যবস্থাপনা",
    pendingPayouts: "অপেক্ষমাণ পেআউট",
    payoutHistory: "পেআউট ইতিহাস",
    vendorName: "বিক্রেতা",
    orderCount: "অর্ডার",
    pendingAmount: "অপেক্ষমাণ পরিমাণ",
    paymentMethod: "পেমেন্ট পদ্ধতি",
    lastPayout: "শেষ পেআউট",
    markAsPaid: "পেইড চিহ্নিত করুন",
    noPendingPayouts: "কোনো অপেক্ষমাণ পেআউট নেই",
    amount: "পরিমাণ",
    reference: "পেমেন্ট রেফারেন্স",
    notes: "নোট (ঐচ্ছিক)",
    periodStart: "সময়কাল শুরু",
    periodEnd: "সময়কাল শেষ",
    cancel: "বাতিল",
    confirm: "পেমেন্ট নিশ্চিত করুন",
    processPayoutTitle: "পেআউট প্রক্রিয়া করুন",
    amountLabel: "পরিমাণ (BDT)",
    paymentMethodLabel: "পেমেন্ট পদ্ধতি",
    referenceLabel: "পেমেন্ট রেফারেন্স",
    referencePlaceholder: "লেনদেন আইডি বা রেফারেন্স নম্বর...",
    notesPlaceholder: "কোনো অতিরিক্ত নোট যোগ করুন...",
    periodStartLabel: "সময়কাল শুরুর তারিখ",
    periodEndLabel: "সময়কাল শেষের তারিখ",
    processedBy: "প্রক্রিয়াকারী",
    processedDate: "প্রক্রিয়ার তারিখ",
    noHistory: "কোনো পেআউট ইতিহাস নেই",
    payoutSuccess: "পেআউট সফলভাবে প্রক্রিয়া করা হয়েছে",
    payoutError: "পেআউট প্রক্রিয়া করতে ব্যর্থ",
    bank: "ব্যাংক",
    bkash: "বিকাশ",
    nagad: "নগদ",
  },
};

const paymentMethodOptions = [
  { value: "bank", label: "Bank Transfer" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
];

function formatBDT(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
}

function AdminPayoutsPage() {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const t = labels[language];
  const isDark = resolvedTheme === "dark";
  const queryClient = useQueryClient();

  const [selectedPayout, setSelectedPayout] = useState<AdminPendingPayoutDTO | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  // Form state
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "bkash" | "nagad">("bank");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  // Fetch pending payouts
  const { data: pendingPayouts, isLoading: isLoadingPending } = useQuery({
    queryKey: ["admin-pending-payouts"],
    queryFn: async () => {
      const response = await api.admin.payouts.pending.$get();
      if (!response.ok) throw new Error("Failed to fetch pending payouts");
      return response.json();
    },
  });

  // Fetch payout history
  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["admin-payout-history"],
    queryFn: async () => {
      const response = await api.admin.payouts.history.$get({
        query: { page: "1", limit: "50" },
      });
      if (!response.ok) throw new Error("Failed to fetch payout history");
      return response.json();
    },
  });

  // Process payout mutation
  const processPayoutMutation = useMutation({
    mutationFn: async (data: {
      vendorId: string;
      amountPaisa: number;
      paymentMethod: "bank" | "bkash" | "nagad";
      paymentReference: string;
      notes?: string;
      periodStart: string;
      periodEnd: string;
    }) => {
      const response = await api.admin.payouts.$post({ json: data });
      if (!response.ok) throw new Error("Failed to process payout");
      return response.json();
    },
    onSuccess: () => {
      toast.success(t.payoutSuccess);
      queryClient.invalidateQueries({ queryKey: ["admin-pending-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payout-history"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-overview"] });
      closeModal();
      resetForm();
    },
    onError: () => {
      toast.error(t.payoutError);
    },
  });

  const handleMarkAsPaid = (payout: AdminPendingPayoutDTO) => {
    setSelectedPayout(payout);
    setAmount((payout.pendingAmount / 100).toString());
    setPaymentMethod(payout.paymentMethod as "bank" | "bkash" | "nagad");
    setPeriodStart(new Date().toISOString().split("T")[0]);
    setPeriodEnd(new Date().toISOString().split("T")[0]);
    openModal();
  };

  const handleSubmit = () => {
    if (!selectedPayout || !reference.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    processPayoutMutation.mutate({
      vendorId: selectedPayout.vendorId,
      amountPaisa: Math.round(parseFloat(amount) * 100),
      paymentMethod,
      paymentReference: reference,
      notes: notes || undefined,
      periodStart,
      periodEnd,
    });
  };

  const resetForm = () => {
    setSelectedPayout(null);
    setAmount("");
    setPaymentMethod("bank");
    setReference("");
    setNotes("");
    setPeriodStart("");
    setPeriodEnd("");
  };

  return (
    <Stack gap="xl">
      <Title order={2} style={{ color: isDark ? "oklch(0.95 0.02 260)" : "oklch(0.25 0.02 260)" }}>
        {t.title}
      </Title>

      {/* Pending Payouts */}
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
        <Title order={4} mb="md" style={{ color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)" }}>
          {t.pendingPayouts}
        </Title>

        {isLoadingPending ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={180} radius="md" />
            ))}
          </SimpleGrid>
        ) : pendingPayouts && pendingPayouts.length > 0 ? (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {pendingPayouts.map((payout) => (
              <Card
                key={payout.vendorId}
                padding="lg"
                radius="md"
                withBorder
                style={{
                  background: isDark ? "oklch(0.25 0.02 260)" : "oklch(0.96 0.01 175)",
                }}
              >
                <Stack gap="md">
                  <Group justify="space-between">
                    <div>
                      <Text fw={600} size="lg">
                        {payout.vendorName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {payout.orderCount} {t.orderCount}
                      </Text>
                    </div>
                    <Wallet size={32} color="oklch(0.65 0.15 175)" />
                  </Group>

                  <Divider />

                  <SimpleGrid cols={2} spacing="sm">
                    <div>
                      <Text size="xs" c="dimmed">{t.pendingAmount}</Text>
                      <Text size="xl" fw={700} style={{ color: "oklch(0.65 0.15 145)" }}>
                        {formatBDT(payout.pendingAmount)}
                      </Text>
                    </div>
                    <div>
                      <Text size="xs" c="dimmed">{t.paymentMethod}</Text>
                      <Badge size="lg" mt="xs">
                        {payout.paymentMethod === "bank" ? t.bank : payout.paymentMethod === "bkash" ? t.bkash : t.nagad}
                      </Badge>
                    </div>
                  </SimpleGrid>

                  {payout.lastPayoutDate && (
                    <div>
                      <Text size="xs" c="dimmed">{t.lastPayout}</Text>
                      <Text size="sm">
                        {formatBDT(payout.lastPayoutAmount || 0)} on{" "}
                        {new Date(payout.lastPayoutDate).toLocaleDateString()}
                      </Text>
                    </div>
                  )}

                  <Button
                    fullWidth
                    leftSection={<CheckCircle size={18} />}
                    onClick={() => handleMarkAsPaid(payout)}
                    style={{
                      background: "linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.7 0.13 165) 100%)",
                    }}
                  >
                    {t.markAsPaid}
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            {t.noPendingPayouts}
          </Text>
        )}
      </Paper>

      {/* Payout History */}
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
        <Title order={4} mb="md" style={{ color: isDark ? "oklch(0.9 0.02 260)" : "oklch(0.3 0.02 260)" }}>
          {t.payoutHistory}
        </Title>

        {isLoadingHistory ? (
          <Stack gap="xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={60} radius="md" />
            ))}
          </Stack>
        ) : history && history.payouts.length > 0 ? (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t.vendorName}</Table.Th>
                <Table.Th>{t.amount}</Table.Th>
                <Table.Th>{t.paymentMethod}</Table.Th>
                <Table.Th>{t.reference}</Table.Th>
                <Table.Th>{t.processedBy}</Table.Th>
                <Table.Th>{t.processedDate}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {history.payouts.map((payout) => (
                <Table.Tr key={payout.id}>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {payout.vendorName}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {formatBDT(payout.amountPaisa)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm">{payout.paymentMethod}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{payout.paymentReference || "-"}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{payout.processedByName || "-"}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">
                      {payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : "-"}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            {t.noHistory}
          </Text>
        )}
      </Paper>

      {/* Process Payout Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          closeModal();
          resetForm();
        }}
        title={t.processPayoutTitle}
        size="md"
        centered
      >
        <Stack gap="md">
          {selectedPayout && (
            <Card padding="sm" radius="md" withBorder>
              <Text size="sm" fw={600}>
                {selectedPayout.vendorName}
              </Text>
              <Text size="xs" c="dimmed">
                {selectedPayout.orderCount} delivered orders
              </Text>
            </Card>
          )}

          <TextInput
            label={t.amountLabel}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="0.01"
            required
            leftSection={<Text size="sm">৳</Text>}
          />

          <Select
            label={t.paymentMethodLabel}
            data={paymentMethodOptions}
            value={paymentMethod}
            onChange={(value) => setPaymentMethod((value as "bank" | "bkash" | "nagad") || "bank")}
            required
          />

          <TextInput
            label={t.referenceLabel}
            placeholder={t.referencePlaceholder}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            required
          />

          <Group grow>
            <TextInput
              label={t.periodStartLabel}
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              required
            />
            <TextInput
              label={t.periodEndLabel}
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              required
            />
          </Group>

          <Textarea
            label={t.notes}
            placeholder={t.notesPlaceholder}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            minRows={3}
          />

          <Group justify="flex-end">
            <Button
              variant="subtle"
              onClick={() => {
                closeModal();
                resetForm();
              }}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              loading={processPayoutMutation.isPending}
              disabled={!reference.trim()}
            >
              {t.confirm}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
