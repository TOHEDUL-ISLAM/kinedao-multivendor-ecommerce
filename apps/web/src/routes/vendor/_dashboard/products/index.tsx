import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Group,
  Text,
  TextInput,
  Select,
  Table,
  Pagination,
  Badge,
  Button,
  Stack,
  Menu,
  ActionIcon,
  Image,
  Skeleton,
  Title,
  Box,
  Paper,
  ThemeIcon,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  RotateCcw,
  Package,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useVendorTheme, vendorColors } from "@/lib/vendor-theme";
import { toast } from "sonner";
import type { VendorProductListResponseDTO } from "@kineDao.com/api-types/vendor-dashboard";

export const Route = createFileRoute("/vendor/_dashboard/products/")({
  component: ProductListPage,
});

const labels = {
  en: {
    title: "Products",
    addProduct: "Add Product",
    searchPlaceholder: "Search products...",
    allStatuses: "All Statuses",
    visibility: "Visibility",
    allVisibility: "All Products",
    activeOnly: "Active Only",
    inactiveOnly: "Inactive Only",
    allCategories: "All Categories",
    sortBy: "Sort by",
    newest: "Newest",
    oldest: "Oldest",
    priceAsc: "Price: Low to High",
    priceDesc: "Price: High to Low",
    stockAsc: "Stock: Low to High",
    image: "Image",
    product: "Product",
    category: "Category",
    price: "Price",
    stock: "Stock",
    status: "Status",
    actions: "Actions",
    edit: "Edit",
    deactivate: "Deactivate",
    reactivate: "Reactivate",
    active: "Active",
    inactive: "Inactive",
    confirmDeactivate: "Deactivate this product?",
    confirmReactivate: "Reactivate this product?",
    deactivatedSuccess: "Product deactivated",
    reactivatedSuccess: "Product reactivated",
    actionFailed: "Failed to update product state",
    noProducts: "No products found",
    addFirstProduct: "Add your first product to start selling",
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    draft: "Draft",
    showing: "Showing",
    of: "of",
    products: "products",
  },
  bn: {
    title: "পণ্য",
    addProduct: "পণ্য যোগ করুন",
    searchPlaceholder: "পণ্য খুঁজুন...",
    allStatuses: "সকল স্ট্যাটাস",
    visibility: "ভিজিবিলিটি",
    allVisibility: "সব পণ্য",
    activeOnly: "সক্রিয়",
    inactiveOnly: "নিষ্ক্রিয়",
    allCategories: "সকল ক্যাটেগরি",
    sortBy: "সাজান",
    newest: "নতুন",
    oldest: "পুরাতন",
    priceAsc: "দাম: কম থেকে বেশি",
    priceDesc: "দাম: বেশি থেকে কম",
    stockAsc: "স্টক: কম থেকে বেশি",
    image: "ছবি",
    product: "পণ্য",
    category: "ক্যাটেগরি",
    price: "দাম",
    stock: "স্টক",
    status: "স্ট্যাটাস",
    actions: "অ্যাকশন",
    edit: "এডিট",
    deactivate: "নিষ্ক্রিয়",
    reactivate: "সক্রিয় করুন",
    active: "সক্রিয়",
    inactive: "নিষ্ক্রিয়",
    confirmDeactivate: "এই পণ্যটি নিষ্ক্রিয় করতে চান?",
    confirmReactivate: "এই পণ্যটি আবার সক্রিয় করতে চান?",
    deactivatedSuccess: "পণ্যটি নিষ্ক্রিয় করা হয়েছে",
    reactivatedSuccess: "পণ্যটি সক্রিয় করা হয়েছে",
    actionFailed: "পণ্যের অবস্থা আপডেট করা যায়নি",
    noProducts: "কোনো পণ্য পাওয়া যায়নি",
    addFirstProduct: "বিক্রয় শুরু করতে আপনার প্রথম পণ্য যোগ করুন",
    approved: "অনুমোদিত",
    pending: "অপেক্ষমাণ",
    rejected: "প্রত্যাখ্যাত",
    draft: "খসড়া",
    showing: "দেখানো হচ্ছে",
    of: "এর মধ্যে",
    products: "পণ্য",
  },
} as const;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 15;
const DEFAULT_SORT = "newest";

async function fetchVendorProducts(params: {
  page: number;
  limit: number;
  sort: string;
  active: string;
  search?: string;
  status?: string;
}): Promise<VendorProductListResponseDTO> {
  const query: Record<string, string> = {
    page: String(params.page),
    limit: String(params.limit),
    sort: params.sort,
  };

  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  if (params.active && params.active !== "all") query.active = params.active;

  const response = await api.vendorDashboard.products.$get({ query });
  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }
  return response.json();
}


function formatBDT(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function ProductListPage() {
  const { language } = useLanguage();
  const t = labels[language];
  const { isDark } = useVendorTheme();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [status, setStatus] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("active");
  const [sort, setSort] = useState<string>(DEFAULT_SORT);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const limit = DEFAULT_LIMIT;

  const toggleActiveMutation = useMutation({
    mutationFn: async ({
      productId,
      activate,
    }: {
      productId: string;
      activate: boolean;
    }) => {
      if (activate) {
        const response = await api.vendorDashboard.products[
          ":productId"
        ].reactivate.$patch({
          param: { productId },
        });
        if (!response.ok) throw new Error("Failed to reactivate product");
        return response.json();
      }

      const response = await api.vendorDashboard.products[":productId"].$delete({
        param: { productId },
      });
      if (!response.ok) throw new Error("Failed to deactivate product");
      return response.json();
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.activate ? t.reactivatedSuccess : t.deactivatedSuccess);
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard-overview"] });
    },
    onError: () => {
      toast.error(t.actionFailed);
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-products", debouncedSearch, status, activeFilter, sort, page, limit],
    queryFn: () =>
      fetchVendorProducts({
        page,
        limit,
        sort,
        active: activeFilter,
        search: debouncedSearch || undefined,
        status: status || undefined,
      }),
  });

  const handleToggleActive = (productId: string, activate: boolean) => {
    const confirmed = window.confirm(
      activate ? t.confirmReactivate : t.confirmDeactivate
    );
    if (!confirmed) return;
    toggleActiveMutation.mutate({ productId, activate });
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Title
          order={3}
          style={{ color: vendorColors.text.primary(isDark) }}
        >
          {t.title}
        </Title>
        <Button
          component={Link}
          to="/vendor/products/new"
          leftSection={<Plus size={18} />}
          style={{
            background:
              "linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.7 0.13 165) 100%)",
            border: "none",
            boxShadow: "0 4px 12px oklch(0.65 0.15 175 / 0.3)",
            transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 6px 20px oklch(0.65 0.15 175 / 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px oklch(0.65 0.15 175 / 0.3)";
          }}
        >
          {t.addProduct}
        </Button>
      </Group>

      {/* Filters */}
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
        <Group gap="md" grow preventGrowOverflow={false} wrap="wrap">
          <TextInput
            placeholder={t.searchPlaceholder}
            leftSection={<Search size={16} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
            style={{
              minWidth: 200,
              flex: 2,
              ...vendorColors.input(isDark),
            }}
            styles={{
              input: {
                backgroundColor: vendorColors.input(isDark).background,
                borderColor: isDark ? "oklch(0.3 0.02 260 / 0.4)" : undefined,
                color: vendorColors.input(isDark).color,
              },
            }}
          />
          <Select
            placeholder={t.allStatuses}
            data={[
              { value: "approved", label: t.approved },
              { value: "pending", label: t.pending },
              { value: "rejected", label: t.rejected },
              { value: "draft", label: t.draft },
            ]}
            value={status}
            onChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
            clearable
            style={{ minWidth: 150, flex: 1 }}
            styles={{
              input: {
                backgroundColor: vendorColors.input(isDark).background,
                borderColor: isDark ? "oklch(0.3 0.02 260 / 0.4)" : undefined,
                color: vendorColors.input(isDark).color,
              },
            }}
          />
          <Select
            placeholder={t.visibility}
            data={[
              { value: "all", label: t.allVisibility },
              { value: "active", label: t.activeOnly },
              { value: "inactive", label: t.inactiveOnly },
            ]}
            value={activeFilter}
            onChange={(val) => {
              setActiveFilter(val || "all");
              setPage(1);
            }}
            allowDeselect={false}
            style={{ minWidth: 150, flex: 1 }}
            styles={{
              input: {
                backgroundColor: vendorColors.input(isDark).background,
                borderColor: isDark ? "oklch(0.3 0.02 260 / 0.4)" : undefined,
                color: vendorColors.input(isDark).color,
              },
            }}
          />
          <Select
            placeholder={t.sortBy}
            data={[
              { value: "newest", label: t.newest },
              { value: "oldest", label: t.oldest },
              { value: "price_asc", label: t.priceAsc },
              { value: "price_desc", label: t.priceDesc },
              { value: "stock_asc", label: t.stockAsc },
            ]}
            value={sort}
            onChange={(val) => setSort(val || "newest")}
            style={{ minWidth: 150, flex: 1 }}
            styles={{
              input: {
                backgroundColor: vendorColors.input(isDark).background,
                borderColor: isDark ? "oklch(0.3 0.02 260 / 0.4)" : undefined,
                color: vendorColors.input(isDark).color,
              },
            }}
          />
        </Group>
      </Paper>

      {/* Product Table */}
      <Paper
        shadow="sm"
        radius="md"
        p={0}
        style={{
          background: vendorColors.card(isDark).background,
          border: vendorColors.card(isDark).border,
          boxShadow: vendorColors.card(isDark).boxShadow,
        }}
      >
        {isLoading ? (
          <Stack gap="xs" p="md">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={50} radius="sm" />
            ))}
          </Stack>
        ) : data?.products && data.products.length > 0 ? (
          <>
            {/* Desktop Table */}
            <Box visibleFrom="sm">
              <Table striped highlightOnHover>
                <Table.Thead
                  style={{
                    background: vendorColors.table.header(isDark).background,
                  }}
                >
                  <Table.Tr>
                    <Table.Th
                      style={{
                        width: 60,
                        fontWeight: 700,
                        color: vendorColors.table.header(isDark).color,
                      }}
                    >
                      {t.image}
                    </Table.Th>
                    <Table.Th
                      style={{
                        fontWeight: 700,
                        color: vendorColors.table.header(isDark).color,
                      }}
                    >
                      {t.product}
                    </Table.Th>
                    <Table.Th
                      style={{
                        fontWeight: 700,
                        color: vendorColors.table.header(isDark).color,
                      }}
                    >
                      {t.category}
                    </Table.Th>
                    <Table.Th
                      style={{
                        fontWeight: 700,
                        color: vendorColors.table.header(isDark).color,
                      }}
                    >
                      {t.price}
                    </Table.Th>
                    <Table.Th
                      style={{
                        fontWeight: 700,
                        color: vendorColors.table.header(isDark).color,
                      }}
                    >
                      {t.stock}
                    </Table.Th>
                    <Table.Th
                      style={{
                        fontWeight: 700,
                        color: vendorColors.table.header(isDark).color,
                      }}
                    >
                      {t.status}
                    </Table.Th>
                    <Table.Th style={{ width: 60 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.products.map((product) => (
                    <Table.Tr key={product.id}>
                      <Table.Td>
                        <Image
                          src={product.imageUrl || undefined}
                          alt={product.title}
                          w={40}
                          h={40}
                          radius="sm"
                          fit="cover"
                          fallbackSrc="https://placehold.co/40x40?text=No+Img"
                        />
                      </Table.Td>
                      <Table.Td>
                        <Box>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {product.title}
                          </Text>
                          {product.slug && (
                            <Text size="xs" c="dimmed">
                              {product.slug}
                            </Text>
                          )}
                        </Box>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {product.categoryName || "-"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          {formatBDT(product.priceAmount)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={product.totalStock <= 5 ? "red" : "green"}
                          variant="light"
                          size="sm"
                        >
                          {product.totalStock}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6}>
                          <Badge
                            size="sm"
                            fw={600}
                            style={vendorColors.statusBadge(product.status, isDark)}
                          >
                            {product.status}
                          </Badge>
                          <Badge
                            size="sm"
                            color={product.isActive ? "green" : "gray"}
                            variant="light"
                          >
                            {product.isActive ? t.active : t.inactive}
                          </Badge>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Menu shadow="md" position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <MoreVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<Edit size={14} />}
                              component={Link}
                              to={`/vendor/products/${product.id}/edit`}
                            >
                              {t.edit}
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<Trash2 size={14} />}
                              color="red"
                              onClick={() => handleToggleActive(product.id, false)}
                              disabled={toggleActiveMutation.isPending || !product.isActive}
                            >
                              {t.deactivate}
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<RotateCcw size={14} />}
                              color="teal"
                              onClick={() => handleToggleActive(product.id, true)}
                              disabled={toggleActiveMutation.isPending || product.isActive}
                            >
                              {t.reactivate}
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>

            {/* Mobile Cards */}
            <Box hiddenFrom="sm" p="md">
              <Stack gap="sm">
                {data.products.map((product) => (
                  <Paper
                    key={product.id}
                    shadow="xs"
                    radius="md"
                    p="sm"
                    style={{
                      background: isDark ? "oklch(0.25 0.02 260)" : undefined,
                      borderColor: isDark
                        ? "oklch(0.3 0.02 260 / 0.3)"
                        : undefined,
                    }}
                    withBorder
                  >
                    <Group gap="sm" wrap="nowrap">
                      <Image
                        src={product.imageUrl || undefined}
                        alt={product.title}
                        w={56}
                        h={56}
                        radius="sm"
                        fit="cover"
                        fallbackSrc="https://placehold.co/56x56?text=No+Img"
                      />
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {product.title}
                        </Text>
                        <Group gap="xs" mt={4}>
                          <Text size="sm" fw={600}>
                            {formatBDT(product.priceAmount)}
                          </Text>
                          <Badge
                            size="xs"
                            fw={600}
                            style={vendorColors.statusBadge(product.status, isDark)}
                          >
                            {product.status}
                          </Badge>
                          <Badge
                            size="xs"
                            color={product.isActive ? "green" : "gray"}
                            variant="light"
                          >
                            {product.isActive ? t.active : t.inactive}
                          </Badge>
                          <Badge
                            color={product.totalStock <= 5 ? "red" : "green"}
                            variant="light"
                            size="xs"
                          >
                            {t.stock}: {product.totalStock}
                          </Badge>
                        </Group>
                      </Box>
                      <Menu shadow="md" position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <MoreVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<Edit size={14} />}
                            component={Link}
                            to={`/vendor/products/${product.id}/edit`}
                          >
                            {t.edit}
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<Trash2 size={14} />}
                            color="red"
                            onClick={() => handleToggleActive(product.id, false)}
                            disabled={toggleActiveMutation.isPending || !product.isActive}
                          >
                            {t.deactivate}
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<RotateCcw size={14} />}
                            color="teal"
                            onClick={() => handleToggleActive(product.id, true)}
                            disabled={toggleActiveMutation.isPending || product.isActive}
                          >
                            {t.reactivate}
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Group justify="space-between" p="md" pt={0}>
                <Text
                  size="sm"
                  style={{ color: vendorColors.text.secondary(isDark) }}
                >
                  {t.showing} {(page - 1) * limit + 1}-
                  {Math.min(page * limit, data.total)} {t.of} {data.total}{" "}
                  {t.products}
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
          <Stack align="center" py="xl" gap="md">
            <ThemeIcon
              variant="light"
              size={64}
              radius="xl"
              style={{
                background: isDark
                  ? "oklch(0.3 0.02 260)"
                  : "oklch(0.95 0.02 260)",
                color: isDark ? "oklch(0.7 0.02 260)" : "oklch(0.5 0.02 260)",
              }}
            >
              <Package size={32} />
            </ThemeIcon>
            <Box ta="center">
              <Text
                fw={500}
                style={{ color: vendorColors.text.primary(isDark) }}
              >
                {t.noProducts}
              </Text>
              <Text size="sm" c="dimmed">
                {t.addFirstProduct}
              </Text>
            </Box>
            <Button
              component={Link}
              to="/vendor/products/new"
              leftSection={<Plus size={18} />}
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.65 0.15 175) 0%, oklch(0.7 0.13 165) 100%)",
                border: "none",
                boxShadow: "0 4px 12px oklch(0.65 0.15 175 / 0.3)",
                transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px oklch(0.65 0.15 175 / 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px oklch(0.65 0.15 175 / 0.3)";
              }}
            >
              {t.addProduct}
            </Button>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
