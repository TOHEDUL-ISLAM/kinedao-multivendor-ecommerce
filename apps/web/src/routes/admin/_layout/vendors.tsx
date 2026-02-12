import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Stack,
  Title,
  Tabs,
  TextInput,
  Table,
  Group,
  Text,
  ActionIcon,
  Drawer,
  Badge,
  Paper,
  SimpleGrid,
  Image,
  Button,
  Skeleton,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { Search, Eye, Check, X, ExternalLink } from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmActionModal } from "@/components/admin/confirm-action-modal";
import { toast } from "sonner";
import type { AdminVendorListItemDTO } from "@kineDao.com/api-types/admin";

const VENDOR_COUNTS_QUERY_KEY = ["admin-vendor-counts"] as const;

export const Route = createFileRoute("/admin/_layout/vendors")({
  component: AdminVendorsPage,
});

const labels = {
  en: {
    title: "Vendor Management",
    search: "Search by name, email, or phone...",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    shopName: "Shop Name",
    owner: "Owner",
    email: "Email",
    phone: "Phone",
    status: "Status",
    appliedDate: "Applied",
    actions: "Actions",
    viewDetails: "View Details",
    approve: "Approve",
    reject: "Reject",
    noResults: "No vendors found",
    applicationDetails: "Application Details",
    businessInfo: "Business Information",
    addressInfo: "Address Information",
    documents: "Documents",
    paymentInfo: "Payment Information",
    businessType: "Business Type",
    district: "District",
    city: "City",
    postalCode: "Postal Code",
    nidNumber: "NID Number",
    nidFront: "NID Front",
    nidBack: "NID Back",
    tradeLicense: "Trade License",
    shopLogo: "Shop Logo",
    bankName: "Bank Name",
    accountNumber: "Account Number",
    accountName: "Account Name",
    bkashNumber: "bKash Number",
    nagadNumber: "Nagad Number",
    reviewNotes: "Review Notes",
    approveConfirm: "Approve Vendor Application",
    approveMessage: "Are you sure you want to approve this vendor application? This will create a vendor account.",
    rejectConfirm: "Reject Vendor Application",
    rejectMessage: "Please provide a reason for rejecting this application.",
    rejectionReason: "Rejection Reason",
    rejectionPlaceholder: "Explain why this application is being rejected...",
    approveSuccess: "Vendor application approved successfully",
    rejectSuccess: "Vendor application rejected",
    error: "Failed to update vendor status",
  },
  bn: {
    title: "বিক্রেতা ব্যবস্থাপনা",
    search: "নাম, ইমেইল, বা ফোন দিয়ে খুঁজুন...",
    pending: "অপেক্ষমাণ",
    approved: "অনুমোদিত",
    rejected: "প্রত্যাখ্যাত",
    shopName: "দোকানের নাম",
    owner: "মালিক",
    email: "ইমেইল",
    phone: "ফোন",
    status: "অবস্থা",
    appliedDate: "আবেদনের তারিখ",
    actions: "কর্ম",
    viewDetails: "বিস্তারিত দেখুন",
    approve: "অনুমোদন",
    reject: "প্রত্যাখ্যান",
    noResults: "কোনো বিক্রেতা পাওয়া যায়নি",
    applicationDetails: "আবেদনের বিবরণ",
    businessInfo: "ব্যবসায়িক তথ্য",
    addressInfo: "ঠিকানা তথ্য",
    documents: "নথিপত্র",
    paymentInfo: "পেমেন্ট তথ্য",
    businessType: "ব্যবসার ধরন",
    district: "জেলা",
    city: "শহর",
    postalCode: "পোস্টাল কোড",
    nidNumber: "এনআইডি নম্বর",
    nidFront: "এনআইডি সামনে",
    nidBack: "এনআইডি পিছনে",
    tradeLicense: "ট্রেড লাইসেন্স",
    shopLogo: "দোকানের লোগো",
    bankName: "ব্যাংকের নাম",
    accountNumber: "অ্যাকাউন্ট নম্বর",
    accountName: "অ্যাকাউন্টের নাম",
    bkashNumber: "বিকাশ নম্বর",
    nagadNumber: "নগদ নম্বর",
    reviewNotes: "পর্যালোচনা নোট",
    approveConfirm: "বিক্রেতা আবেদন অনুমোদন করুন",
    approveMessage: "আপনি কি নিশ্চিত যে আপনি এই বিক্রেতা আবেদন অনুমোদন করতে চান? এটি একটি বিক্রেতা অ্যাকাউন্ট তৈরি করবে।",
    rejectConfirm: "বিক্রেতা আবেদন প্রত্যাখ্যান করুন",
    rejectMessage: "দয়া করে এই আবেদন প্রত্যাখ্যান করার কারণ প্রদান করুন।",
    rejectionReason: "প্রত্যাখ্যানের কারণ",
    rejectionPlaceholder: "ব্যাখ্যা করুন কেন এই আবেদন প্রত্যাখ্যান করা হচ্ছে...",
    approveSuccess: "বিক্রেতা আবেদন সফলভাবে অনুমোদিত হয়েছে",
    rejectSuccess: "বিক্রেতা আবেদন প্রত্যাখ্যাত হয়েছে",
    error: "বিক্রেতার স্ট্যাটাস আপডেট করতে ব্যর্থ",
  },
};

function AdminVendorsPage() {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const t = labels[language];
  const isDark = resolvedTheme === "dark";
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string | null>("pending");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [approveModalOpened, { open: openApproveModal, close: closeApproveModal }] = useDisclosure(false);
  const [rejectModalOpened, { open: openRejectModal, close: closeRejectModal }] = useDisclosure(false);
  const [actionVendorId, setActionVendorId] = useState<string | null>(null);

  // Fetch vendor counts
  const { data: counts } = useQuery({
    queryKey: VENDOR_COUNTS_QUERY_KEY,
    queryFn: async () => {
      const response = await api.admin.vendors.counts.$get();
      if (!response.ok) throw new Error("Failed to fetch counts");
      return response.json();
    },
  });

  // Fetch vendor list
  const { data: vendors, isLoading } = useQuery({
    queryKey: ["admin-vendors", activeTab, debouncedSearch],
    queryFn: async () => {
      const response = await api.admin.vendors.$get({
        query: {
          status: activeTab === "all" ? "all" : (activeTab as any),
          search: debouncedSearch || undefined,
          page: "1",
          limit: "50",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch vendors");
      return response.json();
    },
  });

  // Fetch vendor detail
  const { data: vendorDetail } = useQuery({
    queryKey: ["admin-vendor-detail", selectedVendor],
    queryFn: async () => {
      if (!selectedVendor) return null;
      const response = await api.admin.vendors[":applicationId"].$get({
        param: { applicationId: selectedVendor },
      });
      if (!response.ok) throw new Error("Failed to fetch vendor detail");
      return response.json();
    },
    enabled: !!selectedVendor,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.admin.vendors[":applicationId"].status.$patch({
        param: { applicationId: id },
        json: { status: "approved", reviewNotes: notes },
      });
      if (!response.ok) throw new Error("Failed to approve vendor");
      return response.json();
    },
    onSuccess: () => {
      toast.success(t.approveSuccess);
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      queryClient.invalidateQueries({ queryKey: VENDOR_COUNTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-overview"] });
      closeApproveModal();
      closeDrawer();
    },
    onError: () => {
      toast.error(t.error);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await api.admin.vendors[":applicationId"].status.$patch({
        param: { applicationId: id },
        json: { status: "rejected", reviewNotes: notes },
      });
      if (!response.ok) throw new Error("Failed to reject vendor");
      return response.json();
    },
    onSuccess: () => {
      toast.success(t.rejectSuccess);
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      queryClient.invalidateQueries({ queryKey: VENDOR_COUNTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-overview"] });
      closeRejectModal();
      closeDrawer();
    },
    onError: () => {
      toast.error(t.error);
    },
  });

  const handleViewDetails = (vendor: AdminVendorListItemDTO) => {
    setSelectedVendor(vendor.id);
    openDrawer();
  };

  const handleApproveClick = (id: string) => {
    setActionVendorId(id);
    openApproveModal();
  };

  const handleRejectClick = (id: string) => {
    setActionVendorId(id);
    openRejectModal();
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
          <TextInput
            placeholder={t.search}
            leftSection={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="md"
          />

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab value="pending" rightSection={counts && <Badge size="sm">{counts.pending}</Badge>}>
                {t.pending}
              </Tabs.Tab>
              <Tabs.Tab value="approved" rightSection={counts && <Badge size="sm">{counts.approved}</Badge>}>
                {t.approved}
              </Tabs.Tab>
              <Tabs.Tab value="rejected" rightSection={counts && <Badge size="sm">{counts.rejected}</Badge>}>
                {t.rejected}
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value={activeTab || "pending"} pt="lg">
              {isLoading ? (
                <Stack gap="xs">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} height={60} radius="md" />
                  ))}
                </Stack>
              ) : vendors && vendors.vendors.length > 0 ? (
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t.shopName}</Table.Th>
                      <Table.Th>{t.owner}</Table.Th>
                      <Table.Th>{t.email}</Table.Th>
                      <Table.Th>{t.phone}</Table.Th>
                      <Table.Th>{t.status}</Table.Th>
                      <Table.Th>{t.appliedDate}</Table.Th>
                      <Table.Th>{t.actions}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {vendors.vendors.map((vendor) => (
                      <Table.Tr key={vendor.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {vendor.shopNameEn}
                          </Text>
                          {vendor.shopNameBn && (
                            <Text size="xs" c="dimmed">
                              {vendor.shopNameBn}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{vendor.ownerName}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{vendor.email}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{vendor.phone}</Text>
                        </Table.Td>
                        <Table.Td>
                          <StatusBadge status={vendor.status} />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{new Date(vendor.createdAt).toLocaleDateString()}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleViewDetails(vendor)}
                              title={t.viewDetails}
                            >
                              <Eye size={18} />
                            </ActionIcon>
                            {vendor.status === "pending" && (
                              <>
                                <ActionIcon
                                  variant="subtle"
                                  color="green"
                                  onClick={() => handleApproveClick(vendor.id)}
                                  title={t.approve}
                                >
                                  <Check size={18} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  onClick={() => handleRejectClick(vendor.id)}
                                  title={t.reject}
                                >
                                  <X size={18} />
                                </ActionIcon>
                              </>
                            )}
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
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Paper>

      {/* Vendor Detail Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title={t.applicationDetails}
        position="right"
        size="xl"
      >
        {vendorDetail && (
          <Stack gap="lg">
            {/* Status and Actions */}
            <Group justify="space-between">
              <StatusBadge status={vendorDetail.status} size="lg" />
              {vendorDetail.status === "pending" && (
                <Group gap="xs">
                  <Button
                    leftSection={<Check size={18} />}
                    color="green"
                    onClick={() => handleApproveClick(vendorDetail.id)}
                  >
                    {t.approve}
                  </Button>
                  <Button
                    leftSection={<X size={18} />}
                    color="red"
                    onClick={() => handleRejectClick(vendorDetail.id)}
                  >
                    {t.reject}
                  </Button>
                </Group>
              )}
            </Group>

            {/* Business Info */}
            <Paper p="md" radius="md" withBorder>
              <Text fw={600} mb="md">{t.businessInfo}</Text>
              <SimpleGrid cols={2} spacing="md">
                <div>
                  <Text size="xs" c="dimmed">{t.shopName}</Text>
                  <Text size="sm">{vendorDetail.shopNameEn}</Text>
                  {vendorDetail.shopNameBn && <Text size="sm">{vendorDetail.shopNameBn}</Text>}
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.owner}</Text>
                  <Text size="sm">{vendorDetail.ownerName}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.businessType}</Text>
                  <Text size="sm">{vendorDetail.businessType}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.email}</Text>
                  <Text size="sm">{vendorDetail.email}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.phone}</Text>
                  <Text size="sm">{vendorDetail.phone}</Text>
                </div>
              </SimpleGrid>
            </Paper>

            {/* Address Info */}
            <Paper p="md" radius="md" withBorder>
              <Text fw={600} mb="md">{t.addressInfo}</Text>
              <Stack gap="sm">
                <Text size="sm">{vendorDetail.addressLine1}</Text>
                {vendorDetail.addressLine2 && <Text size="sm">{vendorDetail.addressLine2}</Text>}
                <Group gap="md">
                  <Text size="sm">{vendorDetail.city}, {vendorDetail.district}</Text>
                  {vendorDetail.postalCode && <Text size="sm">- {vendorDetail.postalCode}</Text>}
                </Group>
              </Stack>
            </Paper>

            {/* Documents */}
            <Paper p="md" radius="md" withBorder>
              <Text fw={600} mb="md">{t.documents}</Text>
              <Stack gap="md">
                <div>
                  <Text size="xs" c="dimmed" mb="xs">{t.nidNumber}</Text>
                  <Text size="sm" fw={500}>{vendorDetail.nidNumber}</Text>
                </div>
                <SimpleGrid cols={2} spacing="md">
                  <div>
                    <Text size="xs" c="dimmed" mb="xs">{t.nidFront}</Text>
                    <Image
                      src={vendorDetail.nidFrontUrl}
                      alt="NID Front"
                      radius="md"
                      h={150}
                      fit="cover"
                    />
                    <Button
                      component="a"
                      href={vendorDetail.nidFrontUrl}
                      target="_blank"
                      size="xs"
                      variant="subtle"
                      leftSection={<ExternalLink size={14} />}
                      mt="xs"
                      fullWidth
                    >
                      View Full Size
                    </Button>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed" mb="xs">{t.nidBack}</Text>
                    <Image
                      src={vendorDetail.nidBackUrl}
                      alt="NID Back"
                      radius="md"
                      h={150}
                      fit="cover"
                    />
                    <Button
                      component="a"
                      href={vendorDetail.nidBackUrl}
                      target="_blank"
                      size="xs"
                      variant="subtle"
                      leftSection={<ExternalLink size={14} />}
                      mt="xs"
                      fullWidth
                    >
                      View Full Size
                    </Button>
                  </div>
                </SimpleGrid>
                {vendorDetail.tradeLicenseUrl && (
                  <div>
                    <Text size="xs" c="dimmed" mb="xs">{t.tradeLicense}</Text>
                    <Button
                      component="a"
                      href={vendorDetail.tradeLicenseUrl}
                      target="_blank"
                      size="sm"
                      variant="light"
                      leftSection={<ExternalLink size={16} />}
                    >
                      View Trade License
                    </Button>
                  </div>
                )}
                {vendorDetail.shopLogoUrl && (
                  <div>
                    <Text size="xs" c="dimmed" mb="xs">{t.shopLogo}</Text>
                    <Image
                      src={vendorDetail.shopLogoUrl}
                      alt="Shop Logo"
                      radius="md"
                      h={100}
                      w={100}
                      fit="contain"
                    />
                  </div>
                )}
              </Stack>
            </Paper>

            {/* Payment Info */}
            <Paper p="md" radius="md" withBorder>
              <Text fw={600} mb="md">{t.paymentInfo}</Text>
              <Stack gap="sm">
                {vendorDetail.bankName && (
                  <div>
                    <Text size="xs" c="dimmed">{t.bankName}</Text>
                    <Text size="sm">{vendorDetail.bankName}</Text>
                  </div>
                )}
                {vendorDetail.bankAccountNumber && (
                  <div>
                    <Text size="xs" c="dimmed">{t.accountNumber}</Text>
                    <Text size="sm">{vendorDetail.bankAccountNumber}</Text>
                  </div>
                )}
                {vendorDetail.bankAccountName && (
                  <div>
                    <Text size="xs" c="dimmed">{t.accountName}</Text>
                    <Text size="sm">{vendorDetail.bankAccountName}</Text>
                  </div>
                )}
                {vendorDetail.bkashNumber && (
                  <div>
                    <Text size="xs" c="dimmed">{t.bkashNumber}</Text>
                    <Text size="sm">{vendorDetail.bkashNumber}</Text>
                  </div>
                )}
                {vendorDetail.nagadNumber && (
                  <div>
                    <Text size="xs" c="dimmed">{t.nagadNumber}</Text>
                    <Text size="sm">{vendorDetail.nagadNumber}</Text>
                  </div>
                )}
              </Stack>
            </Paper>

            {/* Review Notes */}
            {vendorDetail.reviewNotes && (
              <Paper p="md" radius="md" withBorder>
                <Text fw={600} mb="md">{t.reviewNotes}</Text>
                <Text size="sm">{vendorDetail.reviewNotes}</Text>
              </Paper>
            )}
          </Stack>
        )}
      </Drawer>

      {/* Approve Modal */}
      <ConfirmActionModal
        opened={approveModalOpened}
        onClose={closeApproveModal}
        onConfirm={(notes) => actionVendorId && approveMutation.mutate({ id: actionVendorId, notes })}
        title={t.approveConfirm}
        message={t.approveMessage}
        confirmLabel={t.approve}
        showNotesField
        loading={approveMutation.isPending}
      />

      {/* Reject Modal */}
      <ConfirmActionModal
        opened={rejectModalOpened}
        onClose={closeRejectModal}
        onConfirm={(notes) => actionVendorId && rejectMutation.mutate({ id: actionVendorId, notes })}
        title={t.rejectConfirm}
        message={t.rejectMessage}
        confirmLabel={t.reject}
        showNotesField
        notesLabel={t.rejectionReason}
        notesPlaceholder={t.rejectionPlaceholder}
        notesRequired
        loading={rejectMutation.isPending}
        danger
      />
    </Stack>
  );
}
