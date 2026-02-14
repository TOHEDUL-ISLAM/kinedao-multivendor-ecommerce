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
  Card,
  Box,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { Search, Eye, Check, X, Ban, RotateCcw, Store, Tag, Calendar } from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmActionModal } from "@/components/admin/confirm-action-modal";
import { toast } from "sonner";
import { getS3Url } from "@/lib/s3-helpers";
import type { AdminProductListItemDTO } from "@kineDao.com/api-types/admin";

const PRODUCT_COUNTS_QUERY_KEY = ["admin-product-counts"] as const;

export const Route = createFileRoute("/admin/_layout/products")({
  component: AdminProductsPage,
});

const labels = {
  en: {
    title: "Product Moderation",
    search: "Search by product name...",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    thumbnail: "Image",
    productName: "Product Name",
    vendor: "Vendor",
    category: "Category",
    price: "Price",
    status: "Status",
    submitted: "Submitted",
    actions: "Actions",
    viewDetails: "View Details",
    approve: "Approve",
    reject: "Reject",
    noResults: "No products found",
    productDetails: "Product Details",
    basicInfo: "Basic Information",
    babyInfo: "Baby-Specific Information",
    images: "Product Images",
    variants: "Variants & SKUs",
    brand: "Brand",
    description: "Description",
    shortDescription: "Short Description",
    ageRange: "Age Range",
    bpaFree: "BPA Free",
    organic: "Organic",
    hypoallergenic: "Hypoallergenic",
    hasSmallParts: "Has Small Parts",
    safetyWarning: "Safety Warning",
    safetyCertifications: "Safety Certifications",
    weightLimit: "Weight Limit",
    expiryDate: "Expiry Date",
    sku: "SKU",
    stock: "Stock",
    available: "Available",
    comparePrice: "Compare Price",
    submittedOn: "Submitted On",
    updatedOn: "Last Updated",
    updatedSubmission: "Updated",
    reviewNotes: "Review Notes",
    approveConfirm: "Approve Product",
    approveMessage: "Are you sure you want to approve this product? It will be visible to customers.",
    rejectConfirm: "Reject Product",
    rejectMessage: "Please provide a reason for rejecting this product.",
    rejectionReason: "Rejection Reason",
    rejectionPlaceholder: "Explain why this product is being rejected...",
    approveSuccess: "Product approved successfully",
    rejectSuccess: "Product rejected",
    deactivate: "Deactivate",
    reactivate: "Reactivate",
    active: "Active",
    inactive: "Inactive",
    deactivateConfirm: "Are you sure you want to deactivate this product?",
    reactivateConfirm: "Are you sure you want to reactivate this product?",
    deactivateSuccess: "Product deactivated",
    reactivateSuccess: "Product reactivated",
    error: "Failed to update product status",
  },
  bn: {
    title: "পণ্য পর্যালোচনা",
    search: "পণ্যের নাম দিয়ে খুঁজুন...",
    pending: "অপেক্ষমাণ",
    approved: "অনুমোদিত",
    rejected: "প্রত্যাখ্যাত",
    thumbnail: "ছবি",
    productName: "পণ্যের নাম",
    vendor: "বিক্রেতা",
    category: "বিভাগ",
    price: "মূল্য",
    status: "অবস্থা",
    submitted: "জমা দেওয়া",
    actions: "কর্ম",
    viewDetails: "বিস্তারিত দেখুন",
    approve: "অনুমোদন",
    reject: "প্রত্যাখ্যান",
    noResults: "কোনো পণ্য পাওয়া যায়নি",
    productDetails: "পণ্যের বিবরণ",
    basicInfo: "মৌলিক তথ্য",
    babyInfo: "শিশু-নির্দিষ্ট তথ্য",
    images: "পণ্যের ছবি",
    variants: "ভ্যারিয়েন্ট এবং SKU",
    brand: "ব্র্যান্ড",
    description: "বর্ণনা",
    shortDescription: "সংক্ষিপ্ত বর্ণনা",
    ageRange: "বয়স সীমা",
    bpaFree: "BPA মুক্ত",
    organic: "জৈব",
    hypoallergenic: "হাইপোঅ্যালার্জেনিক",
    hasSmallParts: "ছোট অংশ আছে",
    safetyWarning: "নিরাপত্তা সতর্কতা",
    safetyCertifications: "নিরাপত্তা সার্টিফিকেশন",
    weightLimit: "ওজন সীমা",
    expiryDate: "মেয়াদ শেষের তারিখ",
    sku: "SKU",
    stock: "স্টক",
    available: "উপলব্ধ",
    comparePrice: "তুলনা মূল্য",
    submittedOn: "জমা দেওয়ার তারিখ",
    updatedOn: "সর্বশেষ আপডেট",
    updatedSubmission: "আপডেটেড",
    reviewNotes: "রিভিউ নোট",
    approveConfirm: "পণ্য অনুমোদন করুন",
    approveMessage: "আপনি কি নিশ্চিত যে আপনি এই পণ্য অনুমোদন করতে চান? এটি গ্রাহকদের কাছে দৃশ্যমান হবে।",
    rejectConfirm: "পণ্য প্রত্যাখ্যান করুন",
    rejectMessage: "দয়া করে এই পণ্য প্রত্যাখ্যান করার কারণ প্রদান করুন।",
    rejectionReason: "প্রত্যাখ্যানের কারণ",
    rejectionPlaceholder: "ব্যাখ্যা করুন কেন এই পণ্য প্রত্যাখ্যান করা হচ্ছে...",
    approveSuccess: "পণ্য সফলভাবে অনুমোদিত হয়েছে",
    rejectSuccess: "পণ্য প্রত্যাখ্যাত হয়েছে",
    deactivate: "নিষ্ক্রিয়",
    reactivate: "সক্রিয় করুন",
    active: "সক্রিয়",
    inactive: "নিষ্ক্রিয়",
    deactivateConfirm: "আপনি কি নিশ্চিত যে আপনি এই পণ্যটি নিষ্ক্রিয় করতে চান?",
    reactivateConfirm: "আপনি কি নিশ্চিত যে আপনি এই পণ্যটি সক্রিয় করতে চান?",
    deactivateSuccess: "পণ্যটি নিষ্ক্রিয় হয়েছে",
    reactivateSuccess: "পণ্যটি সক্রিয় হয়েছে",
    error: "পণ্যের স্ট্যাটাস আপডেট করতে ব্যর্থ",
  },
};

function formatBDT(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function AdminProductsPage() {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const t = labels[language];
  const isDark = resolvedTheme === "dark";
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string | null>("pending");
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [approveModalOpened, { open: openApproveModal, close: closeApproveModal }] = useDisclosure(false);
  const [rejectModalOpened, { open: openRejectModal, close: closeRejectModal }] = useDisclosure(false);
  const [actionProductId, setActionProductId] = useState<string | null>(null);

  // Fetch product counts
  const { data: counts } = useQuery({
    queryKey: PRODUCT_COUNTS_QUERY_KEY,
    queryFn: async () => {
      const response = await api.admin.products.counts.$get();
      if (!response.ok) throw new Error("Failed to fetch counts");
      return response.json();
    },
  });

  // Fetch product list
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products", activeTab, debouncedSearch],
    queryFn: async () => {
      const response = await api.admin.products.$get({
        query: {
          status: activeTab === "all" ? "all" : (activeTab as any),
          search: debouncedSearch || undefined,
          page: "1",
          limit: "50",
          sort: "newest",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  // Fetch product detail
  const { data: productDetail } = useQuery({
    queryKey: ["admin-product-detail", selectedProduct],
    queryFn: async () => {
      if (!selectedProduct) return null;
      const response = await api.admin.products[":productId"].$get({
        param: { productId: selectedProduct },
      });
      if (!response.ok) throw new Error("Failed to fetch product detail");
      return response.json();
    },
    enabled: !!selectedProduct,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await api.admin.products[":productId"].status.$patch({
        param: { productId: id },
        json: { status: "approved" },
      });
      if (!response.ok) throw new Error("Failed to approve product");
      return response.json();
    },
    onSuccess: () => {
      toast.success(t.approveSuccess);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: PRODUCT_COUNTS_QUERY_KEY });
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
      const response = await api.admin.products[":productId"].status.$patch({
        param: { productId: id },
        json: { status: "rejected", reviewNotes: notes },
      });
      if (!response.ok) throw new Error("Failed to reject product");
      return response.json();
    },
    onSuccess: () => {
      toast.success(t.rejectSuccess);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: PRODUCT_COUNTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-overview"] });
      closeRejectModal();
      closeDrawer();
    },
    onError: () => {
      toast.error(t.error);
    },
  });

  // Active toggle mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.admin.products[":productId"].active.$patch({
        param: { productId: id },
        json: { isActive },
      });
      if (!response.ok) throw new Error("Failed to toggle product active state");
      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.isActive ? t.reactivateSuccess : t.deactivateSuccess);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product-detail"] });
      queryClient.invalidateQueries({ queryKey: PRODUCT_COUNTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-overview"] });
    },
    onError: () => {
      toast.error(t.error);
    },
  });

  const handleViewDetails = (product: AdminProductListItemDTO) => {
    setSelectedProduct(product.id);
    openDrawer();
  };

  const handleApproveClick = (id: string) => {
    setActionProductId(id);
    openApproveModal();
  };

  const handleRejectClick = (id: string) => {
    setActionProductId(id);
    openRejectModal();
  };

  const handleToggleActive = (id: string, isCurrentlyActive: boolean) => {
    const confirmMessage = isCurrentlyActive ? t.deactivateConfirm : t.reactivateConfirm;
    if (!window.confirm(confirmMessage)) return;
    toggleActiveMutation.mutate({ id, isActive: !isCurrentlyActive });
  };

  return (
    <Stack gap="xl">
      <Title
        order={2}
        className="text-xl sm:text-2xl"
        style={{ color: isDark ? "oklch(0.95 0.02 260)" : "oklch(0.25 0.02 260)" }}
      >
        {t.title}
      </Title>

      <Paper
        p={{ base: "sm", sm: "lg" }}
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
              <Tabs.Tab value="pending" rightSection={counts && <Badge size="xs">{counts.pending}</Badge>}>
                {t.pending}
              </Tabs.Tab>
              <Tabs.Tab value="approved" rightSection={counts && <Badge size="xs">{counts.approved}</Badge>}>
                {t.approved}
              </Tabs.Tab>
              <Tabs.Tab value="rejected" rightSection={counts && <Badge size="xs">{counts.rejected}</Badge>}>
                {t.rejected}
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value={activeTab || "pending"} pt="lg">
              {isLoading ? (
                <Stack gap="xs">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} height={80} radius="md" />
                  ))}
                </Stack>
              ) : products && products.products.length > 0 ? (
                <>
                  {/* Desktop table view */}
                  <Box visibleFrom="md">
                    <Table.ScrollContainer minWidth={900}>
                      <Table highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>{t.thumbnail}</Table.Th>
                            <Table.Th>{t.productName}</Table.Th>
                            <Table.Th>{t.vendor}</Table.Th>
                            <Table.Th>{t.category}</Table.Th>
                            <Table.Th>{t.price}</Table.Th>
                            <Table.Th>{t.status}</Table.Th>
                            <Table.Th>{t.submitted}</Table.Th>
                            <Table.Th>{t.actions}</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {products.products.map((product) => (
                            <Table.Tr key={product.id}>
                              <Table.Td>
                                <Image
                                  src={product.imageUrl || undefined}
                                  alt={product.title}
                                  w={50}
                                  h={50}
                                  radius="md"
                                  fit="cover"
                                />
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" fw={500} lineClamp={2} maw={300}>
                                  {product.title}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{product.vendorName}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{product.categoryName}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm" fw={500}>
                                  {formatBDT(product.priceAmount)}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Group gap="xs">
                                  <StatusBadge status={product.status} />
                                  <Badge size="sm" color={product.isActive ? "green" : "gray"} variant="light">
                                    {product.isActive ? t.active : t.inactive}
                                  </Badge>
                                  {product.hasVendorUpdate && (
                                    <Badge size="sm" color="violet" variant="light">
                                      {t.updatedSubmission}
                                    </Badge>
                                  )}
                                </Group>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{formatDate(product.submittedAt || product.createdAt)}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Group gap="xs">
                                  <ActionIcon
                                    variant="subtle"
                                    color="blue"
                                    onClick={() => handleViewDetails(product)}
                                    title={t.viewDetails}
                                  >
                                    <Eye size={18} />
                                  </ActionIcon>
                                  {product.status === "pending" && (
                                    <>
                                      <ActionIcon
                                        variant="subtle"
                                        color="green"
                                        onClick={() => handleApproveClick(product.id)}
                                        title={t.approve}
                                      >
                                        <Check size={18} />
                                      </ActionIcon>
                                      <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        onClick={() => handleRejectClick(product.id)}
                                        title={t.reject}
                                      >
                                        <X size={18} />
                                      </ActionIcon>
                                    </>
                                  )}
                                  <ActionIcon
                                    variant="subtle"
                                    color={product.isActive ? "red" : "teal"}
                                    onClick={() => handleToggleActive(product.id, product.isActive)}
                                    title={product.isActive ? t.deactivate : t.reactivate}
                                    loading={toggleActiveMutation.isPending}
                                  >
                                    {product.isActive ? <Ban size={18} /> : <RotateCcw size={18} />}
                                  </ActionIcon>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Table.ScrollContainer>
                  </Box>

                  {/* Mobile card view */}
                  <Stack gap="sm" hiddenFrom="md">
                    {products.products.map((product) => (
                      <Card
                        key={product.id}
                        padding="sm"
                        radius="md"
                        style={{
                          background: isDark ? "oklch(0.2 0.02 260)" : "oklch(0.99 0.005 260)",
                          border: isDark
                            ? "1px solid oklch(0.3 0.02 260 / 0.3)"
                            : "1px solid oklch(0.92 0.01 260 / 0.2)",
                        }}
                      >
                        <Group gap="sm" mb="xs" align="flex-start">
                          <Image
                            src={product.imageUrl || undefined}
                            alt={product.title}
                            w={56}
                            h={56}
                            radius="md"
                            fit="cover"
                            style={{ flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Text size="sm" fw={600} lineClamp={2}>
                              {product.title}
                            </Text>
                            <Text size="sm" fw={600} mt={2} style={{ color: "oklch(0.65 0.15 175)" }}>
                              {formatBDT(product.priceAmount)}
                            </Text>
                          </div>
                        </Group>

                        <Group gap={4} mb="xs" wrap="wrap">
                          <StatusBadge status={product.status} />
                          <Badge size="xs" color={product.isActive ? "green" : "gray"} variant="light">
                            {product.isActive ? t.active : t.inactive}
                          </Badge>
                          {product.hasVendorUpdate && (
                            <Badge size="xs" color="violet" variant="light">
                              {t.updatedSubmission}
                            </Badge>
                          )}
                        </Group>

                        <Group gap="md" mb="xs" wrap="wrap">
                          <Group gap={4}>
                            <Store size={12} style={{ opacity: 0.5 }} />
                            <Text size="xs" c="dimmed">{product.vendorName}</Text>
                          </Group>
                          <Group gap={4}>
                            <Tag size={12} style={{ opacity: 0.5 }} />
                            <Text size="xs" c="dimmed">{product.categoryName}</Text>
                          </Group>
                          <Group gap={4}>
                            <Calendar size={12} style={{ opacity: 0.5 }} />
                            <Text size="xs" c="dimmed">
                              {formatDate(product.submittedAt || product.createdAt)}
                            </Text>
                          </Group>
                        </Group>

                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => handleViewDetails(product)}
                            title={t.viewDetails}
                          >
                            <Eye size={16} />
                          </ActionIcon>
                          {product.status === "pending" && (
                            <>
                              <ActionIcon
                                variant="light"
                                color="green"
                                onClick={() => handleApproveClick(product.id)}
                                title={t.approve}
                              >
                                <Check size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => handleRejectClick(product.id)}
                                title={t.reject}
                              >
                                <X size={16} />
                              </ActionIcon>
                            </>
                          )}
                          <ActionIcon
                            variant="light"
                            color={product.isActive ? "red" : "teal"}
                            onClick={() => handleToggleActive(product.id, product.isActive)}
                            title={product.isActive ? t.deactivate : t.reactivate}
                            loading={toggleActiveMutation.isPending}
                          >
                            {product.isActive ? <Ban size={16} /> : <RotateCcw size={16} />}
                          </ActionIcon>
                        </Group>
                      </Card>
                    ))}
                  </Stack>
                </>
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  {t.noResults}
                </Text>
              )}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Paper>

      {/* Product Detail Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title={t.productDetails}
        position="right"
        size="xl"
        styles={{
          content: { maxWidth: "100vw" },
          body: {
            maxHeight: "calc(100vh - 72px)",
            overflowY: "auto",
            paddingBottom: 24,
          },
        }}
        className="[&_.mantine-Drawer-content]:w-full [&_.mantine-Drawer-content]:sm:w-auto"
      >
        {productDetail && (
          <Stack gap="lg" data-lenis-prevent onWheelCapture={(event) => event.stopPropagation()}>
            {/* Status and Actions */}
            <Stack gap="sm">
              <Group gap="xs" wrap="wrap">
                <StatusBadge status={productDetail.status} size="lg" />
                <Badge size="lg" color={productDetail.isActive ? "green" : "gray"} variant="light">
                  {productDetail.isActive ? t.active : t.inactive}
                </Badge>
                {productDetail.hasVendorUpdate && (
                  <Badge size="lg" color="violet" variant="light">
                    {t.updatedSubmission}
                  </Badge>
                )}
              </Group>
              <Group gap="xs" wrap="wrap">
                {productDetail.status === "pending" && (
                  <>
                    <Button
                      leftSection={<Check size={18} />}
                      color="green"
                      size="sm"
                      onClick={() => handleApproveClick(productDetail.id)}
                    >
                      {t.approve}
                    </Button>
                    <Button
                      leftSection={<X size={18} />}
                      color="red"
                      size="sm"
                      onClick={() => handleRejectClick(productDetail.id)}
                    >
                      {t.reject}
                    </Button>
                  </>
                )}
                <Button
                  variant="light"
                  size="sm"
                  color={productDetail.isActive ? "red" : "teal"}
                  leftSection={productDetail.isActive ? <Ban size={16} /> : <RotateCcw size={16} />}
                  onClick={() => handleToggleActive(productDetail.id, productDetail.isActive)}
                  loading={toggleActiveMutation.isPending}
                >
                  {productDetail.isActive ? t.deactivate : t.reactivate}
                </Button>
              </Group>
            </Stack>

            {/* Images */}
            <Paper p={{ base: "sm", sm: "md" }} radius="md" withBorder>
              <Text fw={600} mb="md">{t.images}</Text>
              <SimpleGrid cols={{ base: 2, xs: 3 }} spacing="md">
                {productDetail.images.map((img) => (
                  <Image
                    key={img.id}
                    src={getS3Url(img.s3Key)}
                    alt="Product"
                    radius="md"
                    h={120}
                    fit="cover"
                  />
                ))}
              </SimpleGrid>
            </Paper>

            {/* Basic Info */}
            <Paper p={{ base: "sm", sm: "md" }} radius="md" withBorder>
              <Text fw={600} mb="md">{t.basicInfo}</Text>
              <Stack gap="sm">
                <div>
                  <Text size="xs" c="dimmed">{t.productName}</Text>
                  <Text size="sm" fw={500}>{productDetail.title}</Text>
                  {productDetail.titleBn && <Text size="sm">{productDetail.titleBn}</Text>}
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.vendor}</Text>
                  <Text size="sm">{productDetail.vendorName}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.category}</Text>
                  <Text size="sm">{productDetail.categoryName}</Text>
                </div>
                {productDetail.brand && (
                  <div>
                    <Text size="xs" c="dimmed">{t.brand}</Text>
                    <Text size="sm">{productDetail.brand}</Text>
                  </div>
                )}
                {productDetail.shortDescription && (
                  <div>
                    <Text size="xs" c="dimmed">{t.shortDescription}</Text>
                    <Text size="sm">{productDetail.shortDescription}</Text>
                  </div>
                )}
                {productDetail.description && (
                  <div>
                    <Text size="xs" c="dimmed">{t.description}</Text>
                    <Text size="sm">{productDetail.description}</Text>
                  </div>
                )}
                <div>
                  <Text size="xs" c="dimmed">{t.submittedOn}</Text>
                  <Text size="sm">{formatDateTime(productDetail.submittedAt || productDetail.createdAt)}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.updatedOn}</Text>
                  <Text size="sm">{formatDateTime(productDetail.updatedAt)}</Text>
                </div>
                {productDetail.reviewNotes && (
                  <div>
                    <Text size="xs" c="dimmed">{t.reviewNotes}</Text>
                    <Text size="sm">{productDetail.reviewNotes}</Text>
                  </div>
                )}
              </Stack>
            </Paper>

            {/* Baby Info */}
            <Paper p={{ base: "sm", sm: "md" }} radius="md" withBorder>
              <Text fw={600} mb="md">{t.babyInfo}</Text>
              <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md">
                {productDetail.ageRange && (
                  <div>
                    <Text size="xs" c="dimmed">{t.ageRange}</Text>
                    <Text size="sm">{productDetail.ageRange}</Text>
                  </div>
                )}
                <div>
                  <Text size="xs" c="dimmed">{t.bpaFree}</Text>
                  <Text size="sm">{productDetail.isBpaFree ? "Yes" : "No"}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.organic}</Text>
                  <Text size="sm">{productDetail.isOrganic ? "Yes" : "No"}</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">{t.hypoallergenic}</Text>
                  <Text size="sm">{productDetail.isHypoallergenic ? "Yes" : "No"}</Text>
                </div>
                {productDetail.expiryDate && (
                  <div>
                    <Text size="xs" c="dimmed">{t.expiryDate}</Text>
                    <Text size="sm">{formatDate(productDetail.expiryDate)}</Text>
                  </div>
                )}
              </SimpleGrid>
              {productDetail.safetyWarningEn && (
                <div>
                  <Text size="xs" c="dimmed" mt="sm">{t.safetyWarning}</Text>
                  <Text size="sm">{productDetail.safetyWarningEn}</Text>
                </div>
              )}
              {productDetail.safetyCertifications && productDetail.safetyCertifications.length > 0 && (
                <div>
                  <Text size="xs" c="dimmed" mt="sm">{t.safetyCertifications}</Text>
                  <Group gap="xs" mt="xs" wrap="wrap">
                    {productDetail.safetyCertifications.map((cert, i) => (
                      <Badge key={i} size="sm">{cert}</Badge>
                    ))}
                  </Group>
                </div>
              )}
            </Paper>

            {/* SKUs */}
            <Paper p={{ base: "sm", sm: "md" }} radius="md" withBorder>
              <Text fw={600} mb="md">{t.variants}</Text>
              <Table.ScrollContainer minWidth={400}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t.sku}</Table.Th>
                      <Table.Th>{t.price}</Table.Th>
                      <Table.Th>{t.stock}</Table.Th>
                      <Table.Th>{t.available}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {productDetail.skus.map((sku) => (
                      <Table.Tr key={sku.id}>
                        <Table.Td>
                          <Text size="sm">{sku.sku}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>{formatBDT(sku.priceAmount)}</Text>
                          {sku.compareAtAmount && (
                            <Text size="xs" c="dimmed" td="line-through">
                              {formatBDT(sku.compareAtAmount)}
                            </Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{sku.stockQty}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={sku.isAvailable ? "green" : "red"} size="sm">
                            {sku.isAvailable ? "Yes" : "No"}
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          </Stack>
        )}
      </Drawer>

      {/* Approve Modal */}
      <ConfirmActionModal
        opened={approveModalOpened}
        onClose={closeApproveModal}
        onConfirm={() => actionProductId && approveMutation.mutate({ id: actionProductId })}
        title={t.approveConfirm}
        message={t.approveMessage}
        confirmLabel={t.approve}
        loading={approveMutation.isPending}
      />

      {/* Reject Modal */}
      <ConfirmActionModal
        opened={rejectModalOpened}
        onClose={closeRejectModal}
        onConfirm={(notes) => actionProductId && rejectMutation.mutate({ id: actionProductId, notes })}
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
