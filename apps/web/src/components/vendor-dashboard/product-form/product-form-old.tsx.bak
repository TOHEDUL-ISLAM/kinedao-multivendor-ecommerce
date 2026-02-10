import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Stack,
  Title,
  Card,
  Group,
  Button,
  TextInput,
  Textarea,
  Select,
  NumberInput,
  Switch,
  Text,
  SimpleGrid,
  ActionIcon,
  Badge,
  Table,
  Box,
  Divider,
  Accordion,
  MultiSelect,
  Image,
  CloseButton,
  Paper,
} from "@mantine/core";
import {
  Plus,
  Trash2,
  Save,
  Send,
  ArrowLeft,
  Upload,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { toast } from "sonner";
import type { VendorProductDetailDTO } from "@kineDao.com/api-types/vendor-dashboard";
import type { CategoryDTO } from "@kineDao.com/api-types/catalog";
import { useVendorTheme, vendorColors } from "@/lib/vendor-theme";
import { getS3Url } from "@/lib/s3-helpers";

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: VendorProductDetailDTO;
  initialCategories?: CategoryDTO[];
}

interface FormImage {
  id?: string;
  s3Key?: string; // For existing images
  url: string; // Display URL (generated from s3Key or presigned)
  variant?: "original" | "medium" | "thumbnail";
  sortOrder: number;
  file?: File; // For new uploads
  uploading?: boolean;
}

interface FormOption {
  name: string;
  nameBn: string;
  values: string[];
  valuesBn: string[];
}

interface FormSku {
  sku: string;
  optionValues: Record<string, string>;
  priceAmount: number;
  compareAtAmount: number | null;
  stockQty: number;
  isAvailable: boolean;
}

interface FormState {
  title: string;
  titleBn: string;
  categoryId: string;
  brand: string;
  shortDescription: string;
  shortDescriptionBn: string;
  description: string;
  descriptionBn: string;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  isBpaFree: boolean;
  isOrganic: boolean;
  isHypoallergenic: boolean;
  hasSmallParts: boolean;
  safetyWarningEn: string;
  safetyWarningBn: string;
  safetyCertifications: string[];
  weightLimitKg: number | null;
  expiryDate: string;
  images: FormImage[];
  options: FormOption[];
  skus: FormSku[];
}

const ageRangeOptions = [
  { value: "0", label: "0 months" },
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "9", label: "9 months" },
  { value: "12", label: "12 months" },
  { value: "18", label: "18 months" },
  { value: "24", label: "24 months" },
  { value: "36", label: "36 months" },
];

const safetyCertOptions = [
  { value: "BSTI", label: "BSTI" },
  { value: "CE", label: "CE Mark" },
  { value: "ASTM F963", label: "ASTM F963" },
  { value: "ISO 8124", label: "ISO 8124" },
  { value: "EN 71", label: "EN 71" },
  { value: "FDA", label: "FDA Approved" },
  { value: "BPA-Free Certified", label: "BPA-Free Certified" },
];

const labels = {
  en: {
    createTitle: "Add New Product",
    editTitle: "Edit Product",
    back: "Back to Products",
    basicInfo: "Basic Information",
    titleEn: "Product Title (English)",
    titleBn: "Product Title (Bangla)",
    category: "Category",
    selectCategory: "Select category",
    brand: "Brand",
    descriptions: "Descriptions",
    shortDescEn: "Short Description (English)",
    shortDescBn: "Short Description (Bangla)",
    descEn: "Full Description (English)",
    descBn: "Full Description (Bangla)",
    babyInfo: "Baby Information",
    ageRangeMin: "Age Range Min",
    ageRangeMax: "Age Range Max",
    bpaFree: "BPA Free",
    organic: "Organic",
    hypoallergenic: "Hypoallergenic",
    hasSmallParts: "Has Small Parts (Choking Hazard)",
    weightLimit: "Weight Limit (kg)",
    expiryDate: "Expiry Date",
    safety: "Safety & Certifications",
    certifications: "Safety Certifications",
    safetyWarningEn: "Safety Warning (English)",
    safetyWarningBn: "Safety Warning (Bangla)",
    images: "Product Images",
    uploadImages: "Upload Images",
    maxImages: "Max 5 images. First image is the primary.",
    pricingInventory: "Pricing & Inventory",
    options: "Product Options",
    addOption: "Add Option",
    optionName: "Option Name (e.g., Size)",
    optionNameBn: "Option Name (Bangla)",
    optionValues: "Values (comma separated, e.g., S, M, L)",
    optionValuesBn: "Values Bangla",
    removeOption: "Remove",
    generateSkus: "Generate SKUs",
    skuCode: "SKU Code",
    price: "Price (BDT)",
    compareAt: "Compare At",
    stock: "Stock",
    available: "Available",
    saveDraft: "Save Draft",
    publish: "Submit for Approval",
    saving: "Saving...",
    saveSuccess: "Product saved successfully",
    saveFailed: "Failed to save product",
    noImages: "No images uploaded yet",
  },
  bn: {
    createTitle: "নতুন পণ্য যোগ করুন",
    editTitle: "পণ্য সম্পাদনা",
    back: "পণ্য তালিকায় ফিরুন",
    basicInfo: "মৌলিক তথ্য",
    titleEn: "পণ্যের শিরোনাম (ইংরেজি)",
    titleBn: "পণ্যের শিরোনাম (বাংলা)",
    category: "ক্যাটেগরি",
    selectCategory: "ক্যাটেগরি নির্বাচন করুন",
    brand: "ব্র্যান্ড",
    descriptions: "বিবরণ",
    shortDescEn: "সংক্ষিপ্ত বিবরণ (ইংরেজি)",
    shortDescBn: "সংক্ষিপ্ত বিবরণ (বাংলা)",
    descEn: "পূর্ণ বিবরণ (ইংরেজি)",
    descBn: "পূর্ণ বিবরণ (বাংলা)",
    babyInfo: "শিশুর তথ্য",
    ageRangeMin: "বয়সের পরিসর (ন্যূনতম)",
    ageRangeMax: "বয়সের পরিসর (সর্বোচ্চ)",
    bpaFree: "BPA মুক্ত",
    organic: "জৈব",
    hypoallergenic: "হাইপোঅ্যালার্জেনিক",
    hasSmallParts: "ছোট অংশ আছে (শ্বাসরোধের ঝুঁকি)",
    weightLimit: "ওজন সীমা (কেজি)",
    expiryDate: "মেয়াদ শেষ",
    safety: "নিরাপত্তা ও সার্টিফিকেশন",
    certifications: "নিরাপত্তা সার্টিফিকেশন",
    safetyWarningEn: "নিরাপত্তা সতর্কতা (ইংরেজি)",
    safetyWarningBn: "নিরাপত্তা সতর্কতা (বাংলা)",
    images: "পণ্যের ছবি",
    uploadImages: "ছবি আপলোড করুন",
    maxImages: "সর্বোচ্চ ৫টি ছবি। প্রথম ছবিটি প্রাথমিক।",
    pricingInventory: "মূল্য ও ইনভেন্টরি",
    options: "পণ্যের অপশন",
    addOption: "অপশন যোগ করুন",
    optionName: "অপশনের নাম (যেমন, সাইজ)",
    optionNameBn: "অপশনের নাম (বাংলা)",
    optionValues: "মানগুলি (কমা দ্বারা পৃথক, যেমন: S, M, L)",
    optionValuesBn: "মানগুলি বাংলা",
    removeOption: "সরান",
    generateSkus: "SKU তৈরি করুন",
    skuCode: "SKU কোড",
    price: "দাম (টাকা)",
    compareAt: "তুলনামূলক দাম",
    stock: "স্টক",
    available: "উপলব্ধ",
    saveDraft: "খসড়া সংরক্ষণ",
    publish: "অনুমোদনের জন্য জমা দিন",
    saving: "সংরক্ষণ হচ্ছে...",
    saveSuccess: "পণ্য সফলভাবে সংরক্ষিত",
    saveFailed: "পণ্য সংরক্ষণ ব্যর্থ",
    noImages: "এখনো কোনো ছবি আপলোড হয়নি",
  },
} as const;

function buildInitialState(data?: VendorProductDetailDTO): FormState {
  if (!data) {
    return {
      title: "",
      titleBn: "",
      categoryId: "",
      brand: "",
      shortDescription: "",
      shortDescriptionBn: "",
      description: "",
      descriptionBn: "",
      ageRangeMin: null,
      ageRangeMax: null,
      isBpaFree: false,
      isOrganic: false,
      isHypoallergenic: false,
      hasSmallParts: false,
      safetyWarningEn: "",
      safetyWarningBn: "",
      safetyCertifications: [],
      weightLimitKg: null,
      expiryDate: "",
      images: [],
      options: [],
      skus: [
        {
          sku: "",
          optionValues: {},
          priceAmount: 0,
          compareAtAmount: null,
          stockQty: 0,
          isAvailable: true,
        },
      ],
    };
  }

  return {
    title: data.title,
    titleBn: data.titleBn || "",
    categoryId: data.categoryId,
    brand: data.brand || "",
    shortDescription: data.shortDescription || "",
    shortDescriptionBn: data.shortDescriptionBn || "",
    description: data.description || "",
    descriptionBn: data.descriptionBn || "",
    ageRangeMin: data.ageRangeMin,
    ageRangeMax: data.ageRangeMax,
    isBpaFree: data.isBpaFree,
    isOrganic: data.isOrganic,
    isHypoallergenic: data.isHypoallergenic,
    hasSmallParts: data.hasSmallParts,
    safetyWarningEn: data.safetyWarningEn || "",
    safetyWarningBn: data.safetyWarningBn || "",
    safetyCertifications: data.safetyCertifications || [],
    weightLimitKg: data.weightLimitKg,
    expiryDate: data.expiryDate || "",
    images: data.images.map((img) => ({
      id: img.id,
      s3Key: img.s3Key,
      url: getS3Url(img.s3Key), // Generate URL from S3 key
      variant: img.variant,
      sortOrder: img.sortOrder || 0,
    })),
    options: data.options.map((opt) => ({
      name: opt.name,
      nameBn: opt.nameBn || "",
      values: opt.values || [],
      valuesBn: opt.valuesBn || [],
    })),
    skus: data.skus.map((sku) => ({
      sku: sku.sku,
      optionValues: sku.optionValues || {},
      priceAmount: sku.priceAmount,
      compareAtAmount: sku.compareAtAmount,
      stockQty: sku.stockQty,
      isAvailable: sku.isAvailable ?? true,
    })),
  };
}

function normalizeCategoryResponse(data: unknown): CategoryDTO[] {
  if (Array.isArray(data)) {
    return data as CategoryDTO[];
  }

  if (
    data &&
    typeof data === "object" &&
    "categories" in data &&
    Array.isArray((data as { categories?: unknown[] }).categories)
  ) {
    return (data as { categories: CategoryDTO[] }).categories;
  }

  return [];
}

export function ProductForm({
  mode,
  initialData,
  initialCategories,
}: ProductFormProps) {
  const { language } = useLanguage();
  const t = labels[language];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isDark } = useVendorTheme();

  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(initialData)
  );

  // Dark mode input styles
  const inputStyles = {
    input: {
      backgroundColor: vendorColors.input(isDark).background,
      borderColor: isDark ? "oklch(0.3 0.02 260 / 0.4)" : undefined,
      color: vendorColors.input(isDark).color,
    },
    label: {
      color: vendorColors.text.primary(isDark),
    },
  };

  // Fetch categories for select
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-for-product-form"],
    queryFn: async () => {
      const res = await api.categories.$get({ query: {} });
      if (!res.ok) return [];
      const data = await res.json();
      return normalizeCategoryResponse(data);
    },
    initialData: initialCategories,
    staleTime: 1000 * 60 * 10,
  });

  const categoryOptions = (categoriesData ?? [])
    .filter((category) => category.id && category.name)
    .map((category) => ({
      value: category.id,
      label: category.name,
    }));

  // Update a form field
  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Image upload
  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const remainingSlots = 5 - form.images.length;
      const filesToUpload = Array.from(files).slice(0, remainingSlots);

      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch(
            `${import.meta.env.VITE_SERVER_URL}/api/upload?category=product-images`,
            {
              method: "POST",
              body: formData,
              credentials: "include",
            }
          );

          if (response.ok) {
            const data = await response.json();
            setForm((prev) => ({
              ...prev,
              images: [
                ...prev.images,
                {
                  s3Key: data.s3Key, // Store S3 key for API submission
                  url: data.url, // Display URL
                  variant: data.variant || "original",
                  sortOrder: prev.images.length,
                },
              ],
            }));
          } else {
            toast.error("Failed to upload image");
          }
        } catch {
          toast.error("Failed to upload image");
        }
      }
    },
    [form.images.length]
  );

  const removeImage = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }, []);

  // Options management
  const addOption = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { name: "", nameBn: "", values: [], valuesBn: [] },
      ],
    }));
  }, []);

  const removeOption = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  }, []);

  const updateOption = useCallback(
    (index: number, field: keyof FormOption, value: any) => {
      setForm((prev) => ({
        ...prev,
        options: prev.options.map((opt, i) =>
          i === index ? { ...opt, [field]: value } : opt
        ),
      }));
    },
    []
  );

  // Generate SKU combinations from options
  const generateSkus = useCallback(() => {
    const validOptions = form.options.filter(
      (o) => o.name && o.values.length > 0
    );

    if (validOptions.length === 0) {
      setForm((prev) => ({
        ...prev,
        skus: [
          {
            sku: "",
            optionValues: {},
            priceAmount: prev.skus[0]?.priceAmount || 0,
            compareAtAmount: prev.skus[0]?.compareAtAmount || null,
            stockQty: prev.skus[0]?.stockQty || 0,
            isAvailable: true,
          },
        ],
      }));
      return;
    }

    // Generate cartesian product of option values
    const combinations = validOptions.reduce<Record<string, string>[]>(
      (acc, option) => {
        if (acc.length === 0) {
          return option.values.map((v) => ({ [option.name]: v }));
        }
        const result: Record<string, string>[] = [];
        for (const existing of acc) {
          for (const val of option.values) {
            result.push({ ...existing, [option.name]: val });
          }
        }
        return result;
      },
      []
    );

    setForm((prev) => ({
      ...prev,
      skus: combinations.map((combo) => {
        // Try to match existing SKU
        const existing = prev.skus.find((s) => {
          return Object.entries(combo).every(
            ([k, v]) => s.optionValues[k] === v
          );
        });
        return {
          sku: existing?.sku || Object.values(combo).join("-"),
          optionValues: combo,
          priceAmount: existing?.priceAmount || 0,
          compareAtAmount: existing?.compareAtAmount || null,
          stockQty: existing?.stockQty || 0,
          isAvailable: existing?.isAvailable ?? true,
        };
      }),
    }));
  }, [form.options]);

  const updateSku = useCallback(
    (index: number, field: keyof FormSku, value: any) => {
      setForm((prev) => ({
        ...prev,
        skus: prev.skus.map((s, i) =>
          i === index ? { ...s, [field]: value } : s
        ),
      }));
    },
    []
  );

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (status: "draft" | "pending") => {
      const payload = {
        title: form.title,
        titleBn: form.titleBn || undefined,
        categoryId: form.categoryId,
        brand: form.brand || undefined,
        shortDescription: form.shortDescription || undefined,
        shortDescriptionBn: form.shortDescriptionBn || undefined,
        description: form.description || undefined,
        descriptionBn: form.descriptionBn || undefined,
        ageRangeMin: form.ageRangeMin ?? undefined,
        ageRangeMax: form.ageRangeMax ?? undefined,
        isBpaFree: form.isBpaFree,
        isOrganic: form.isOrganic,
        isHypoallergenic: form.isHypoallergenic,
        hasSmallParts: form.hasSmallParts,
        safetyWarningEn: form.safetyWarningEn || undefined,
        safetyWarningBn: form.safetyWarningBn || undefined,
        safetyCertifications:
          form.safetyCertifications.length > 0
            ? form.safetyCertifications
            : undefined,
        weightLimitKg: form.weightLimitKg ?? undefined,
        expiryDate: form.expiryDate || undefined,
        images: form.images.map((img, i) => ({
          s3Key: img.s3Key || "", // Will be populated after upload
          variant: img.variant || "original",
          sortOrder: i,
        })),
        options: form.options
          .filter((o) => o.name && o.values.length > 0)
          .map((o, i) => ({
            name: o.name,
            nameBn: o.nameBn || undefined,
            values: o.values,
            valuesBn: o.valuesBn.length > 0 ? o.valuesBn : undefined,
            sortOrder: i,
          })),
        skus: form.skus.map((s) => ({
          sku: s.sku,
          optionValues:
            Object.keys(s.optionValues).length > 0
              ? s.optionValues
              : undefined,
          priceAmount: s.priceAmount,
          compareAtAmount: s.compareAtAmount ?? undefined,
          stockQty: s.stockQty,
          isAvailable: s.isAvailable,
        })),
        isDraft: status === "draft",
      };

      if (mode === "edit" && initialData) {
        const res = await api.vendorDashboard.products[":productId"].$put({
          param: { productId: initialData.id },
          json: payload as any,
        });
        if (!res.ok) {
          const errorBody = await res.json().catch(() => null);
          throw new Error(
            (errorBody as any)?.error || "Failed to update product"
          );
        }
        return res.json();
      } else {
        const res = await api.vendorDashboard.products.$post({
          json: payload as any,
        });
        if (!res.ok) {
          const errorBody = await res.json().catch(() => null);
          throw new Error(
            (errorBody as any)?.error || "Failed to create product"
          );
        }
        return res.json();
      }
    },
    onSuccess: () => {
      toast.success(t.saveSuccess);
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({
        queryKey: ["vendor-dashboard-overview"],
      });
      navigate({ to: "/vendor/products" });
    },
    onError: (error: Error) => {
      toast.error(error.message || t.saveFailed);
    },
  });

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Group>
          <Button
            variant="subtle"
            color="gray"
            leftSection={<ArrowLeft size={18} />}
            onClick={() => navigate({ to: "/vendor/products" })}
          >
            {t.back}
          </Button>
          <Title order={3}>
            {mode === "create" ? t.createTitle : t.editTitle}
          </Title>
        </Group>
        <Group visibleFrom="sm">
          <Button
            variant="default"
            leftSection={<Save size={16} />}
            onClick={() => saveMutation.mutate("draft")}
            loading={saveMutation.isPending}
          >
            {t.saveDraft}
          </Button>
          <Button
            color="teal"
            leftSection={<Send size={16} />}
            onClick={() => saveMutation.mutate("pending")}
            loading={saveMutation.isPending}
          >
            {t.publish}
          </Button>
        </Group>
      </Group>

      {/* Form Sections - Accordion on mobile, stacked cards on desktop */}
      <Accordion
        variant="separated"
        radius="md"
        defaultValue={["basic-info", "descriptions", "pricing", "images"]}
        multiple
        styles={{
          item: {
            background: vendorColors.card(isDark).background,
            border: vendorColors.card(isDark).border,
            boxShadow: vendorColors.card(isDark).boxShadow,
          },
          control: {
            color: vendorColors.text.primary(isDark),
          },
          label: {
            fontWeight: 600,
            color: vendorColors.text.primary(isDark),
          },
          content: {
            color: vendorColors.text.primary(isDark),
          },
        }}
      >
        {/* Basic Information */}
        <Accordion.Item value="basic-info">
          <Accordion.Control>{t.basicInfo}</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label={t.titleEn}
                  value={form.title}
                  onChange={(e) => updateField("title", e.currentTarget.value)}
                  required
                  styles={inputStyles}
                />
                <TextInput
                  label={t.titleBn}
                  value={form.titleBn}
                  onChange={(e) => updateField("titleBn", e.currentTarget.value)}
                  styles={inputStyles}
                />
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Select
                  label={t.category}
                  placeholder={t.selectCategory}
                  data={categoryOptions}
                  value={form.categoryId}
                  onChange={(val) => updateField("categoryId", val || "")}
                  searchable
                  required
                  styles={inputStyles}
                />
                <TextInput
                  label={t.brand}
                  value={form.brand}
                  onChange={(e) => updateField("brand", e.currentTarget.value)}
                  styles={inputStyles}
                />
              </SimpleGrid>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Descriptions */}
        <Accordion.Item value="descriptions">
          <Accordion.Control>{t.descriptions}</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Textarea
                  label={t.shortDescEn}
                  value={form.shortDescription}
                  onChange={(e) =>
                    updateField("shortDescription", e.currentTarget.value)
                  }
                  rows={3}
                  styles={inputStyles}
                />
                <Textarea
                  label={t.shortDescBn}
                  value={form.shortDescriptionBn}
                  onChange={(e) =>
                    updateField("shortDescriptionBn", e.currentTarget.value)
                  }
                  rows={3}
                  styles={inputStyles}
                />
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Textarea
                  label={t.descEn}
                  value={form.description}
                  onChange={(e) =>
                    updateField("description", e.currentTarget.value)
                  }
                  rows={6}
                  styles={inputStyles}
                />
                <Textarea
                  label={t.descBn}
                  value={form.descriptionBn}
                  onChange={(e) =>
                    updateField("descriptionBn", e.currentTarget.value)
                  }
                  rows={6}
                  styles={inputStyles}
                />
              </SimpleGrid>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Images */}
        <Accordion.Item value="images">
          <Accordion.Control>{t.images}</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                {t.maxImages}
              </Text>
              <Group gap="sm" wrap="wrap">
                {form.images.map((img, index) => (
                  <Paper
                    key={index}
                    withBorder
                    radius="md"
                    p={4}
                    pos="relative"
                    style={{ width: 120, height: 120 }}
                  >
                    <Image
                      src={img.url}
                      alt={`Product image ${index + 1}`}
                      w={112}
                      h={112}
                      radius="sm"
                      fit="cover"
                    />
                    <CloseButton
                      size="xs"
                      pos="absolute"
                      top={4}
                      right={4}
                      onClick={() => removeImage(index)}
                      style={{
                        backgroundColor: "rgba(0,0,0,0.6)",
                        color: "white",
                      }}
                    />
                    {index === 0 && (
                      <Badge
                        size="xs"
                        pos="absolute"
                        bottom={8}
                        left={8}
                        color="teal"
                      >
                        Primary
                      </Badge>
                    )}
                  </Paper>
                ))}

                {form.images.length < 5 && (
                  <Paper
                    withBorder
                    radius="md"
                    p="md"
                    style={{
                      width: 120,
                      height: 120,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      borderStyle: "dashed",
                      background: isDark ? "oklch(0.22 0.02 260)" : undefined,
                      borderColor: isDark
                        ? "oklch(0.4 0.02 260 / 0.5)"
                        : undefined,
                    }}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/jpeg,image/png,image/webp";
                      input.multiple = true;
                      input.onchange = () => handleImageUpload(input.files);
                      input.click();
                    }}
                  >
                    <Stack align="center" gap={4}>
                      <Upload
                        size={24}
                        color={
                          isDark
                            ? vendorColors.text.secondary(isDark)
                            : "var(--mantine-color-dimmed)"
                        }
                      />
                      <Text
                        size="xs"
                        style={{ color: vendorColors.text.secondary(isDark) }}
                      >
                        {t.uploadImages}
                      </Text>
                    </Stack>
                  </Paper>
                )}
              </Group>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Pricing & Inventory */}
        <Accordion.Item value="pricing">
          <Accordion.Control>{t.pricingInventory}</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              {/* Options */}
              <Box>
                <Group justify="space-between" mb="sm">
                  <Text fw={500}>{t.options}</Text>
                  <Button
                    variant="light"
                    color="teal"
                    size="xs"
                    leftSection={<Plus size={14} />}
                    onClick={addOption}
                  >
                    {t.addOption}
                  </Button>
                </Group>

                {form.options.map((option, index) => (
                  <Card
                    key={index}
                    withBorder
                    radius="sm"
                    p="sm"
                    mb="sm"
                    style={{
                      background: isDark ? "oklch(0.22 0.02 260)" : undefined,
                      borderColor: isDark
                        ? "oklch(0.3 0.02 260 / 0.3)"
                        : undefined,
                    }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" fw={500}>
                        Option {index + 1}
                      </Text>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 size={14} />
                      </ActionIcon>
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2 }} mb="xs">
                      <TextInput
                        placeholder={t.optionName}
                        value={option.name}
                        onChange={(e) =>
                          updateOption(index, "name", e.currentTarget.value)
                        }
                        size="sm"
                      />
                      <TextInput
                        placeholder={t.optionNameBn}
                        value={option.nameBn}
                        onChange={(e) =>
                          updateOption(index, "nameBn", e.currentTarget.value)
                        }
                        size="sm"
                      />
                    </SimpleGrid>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                      <TextInput
                        placeholder={t.optionValues}
                        value={option.values.join(", ")}
                        onChange={(e) =>
                          updateOption(
                            index,
                            "values",
                            e.currentTarget.value
                              .split(",")
                              .map((v) => v.trim())
                              .filter(Boolean)
                          )
                        }
                        size="sm"
                      />
                      <TextInput
                        placeholder={t.optionValuesBn}
                        value={option.valuesBn.join(", ")}
                        onChange={(e) =>
                          updateOption(
                            index,
                            "valuesBn",
                            e.currentTarget.value
                              .split(",")
                              .map((v) => v.trim())
                              .filter(Boolean)
                          )
                        }
                        size="sm"
                      />
                    </SimpleGrid>
                  </Card>
                ))}

                {form.options.length > 0 && (
                  <Button
                    variant="light"
                    color="teal"
                    size="xs"
                    onClick={generateSkus}
                    mb="md"
                  >
                    {t.generateSkus}
                  </Button>
                )}
              </Box>

              <Divider />

              {/* SKU Table */}
              <Box style={{ overflowX: "auto" }}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      {form.options.length > 0 &&
                        form.options
                          .filter((o) => o.name)
                          .map((o) => (
                            <Table.Th key={o.name}>{o.name}</Table.Th>
                          ))}
                      <Table.Th>{t.skuCode}</Table.Th>
                      <Table.Th>{t.price}</Table.Th>
                      <Table.Th>{t.compareAt}</Table.Th>
                      <Table.Th>{t.stock}</Table.Th>
                      <Table.Th>{t.available}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {form.skus.map((sku, index) => (
                      <Table.Tr key={index}>
                        {form.options
                          .filter((o) => o.name)
                          .map((o) => (
                            <Table.Td key={o.name}>
                              <Badge variant="light" size="sm">
                                {sku.optionValues[o.name] || "-"}
                              </Badge>
                            </Table.Td>
                          ))}
                        <Table.Td>
                          <TextInput
                            value={sku.sku}
                            onChange={(e) =>
                              updateSku(index, "sku", e.currentTarget.value)
                            }
                            size="xs"
                            style={{ minWidth: 100 }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            value={sku.priceAmount / 100}
                            onChange={(val) =>
                              updateSku(
                                index,
                                "priceAmount",
                                Math.round((Number(val) || 0) * 100)
                              )
                            }
                            size="xs"
                            min={0}
                            prefix="৳"
                            style={{ minWidth: 100 }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            value={
                              sku.compareAtAmount
                                ? sku.compareAtAmount / 100
                                : undefined
                            }
                            onChange={(val) =>
                              updateSku(
                                index,
                                "compareAtAmount",
                                val ? Math.round(Number(val) * 100) : null
                              )
                            }
                            size="xs"
                            min={0}
                            prefix="৳"
                            placeholder="-"
                            style={{ minWidth: 100 }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <NumberInput
                            value={sku.stockQty}
                            onChange={(val) =>
                              updateSku(index, "stockQty", Number(val) || 0)
                            }
                            size="xs"
                            min={0}
                            style={{ minWidth: 80 }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Switch
                            checked={sku.isAvailable}
                            onChange={(e) =>
                              updateSku(
                                index,
                                "isAvailable",
                                e.currentTarget.checked
                              )
                            }
                            size="sm"
                            color="teal"
                          />
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Baby Info */}
        <Accordion.Item value="baby-info">
          <Accordion.Control>{t.babyInfo}</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Select
                  label={t.ageRangeMin}
                  data={ageRangeOptions}
                  value={
                    form.ageRangeMin != null ? String(form.ageRangeMin) : null
                  }
                  onChange={(val) =>
                    updateField("ageRangeMin", val ? Number(val) : null)
                  }
                  clearable
                />
                <Select
                  label={t.ageRangeMax}
                  data={ageRangeOptions}
                  value={
                    form.ageRangeMax != null ? String(form.ageRangeMax) : null
                  }
                  onChange={(val) =>
                    updateField("ageRangeMax", val ? Number(val) : null)
                  }
                  clearable
                />
              </SimpleGrid>
              <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <Switch
                  label={t.bpaFree}
                  checked={form.isBpaFree}
                  onChange={(e) =>
                    updateField("isBpaFree", e.currentTarget.checked)
                  }
                  color="teal"
                />
                <Switch
                  label={t.organic}
                  checked={form.isOrganic}
                  onChange={(e) =>
                    updateField("isOrganic", e.currentTarget.checked)
                  }
                  color="teal"
                />
                <Switch
                  label={t.hypoallergenic}
                  checked={form.isHypoallergenic}
                  onChange={(e) =>
                    updateField("isHypoallergenic", e.currentTarget.checked)
                  }
                  color="teal"
                />
                <Switch
                  label={t.hasSmallParts}
                  checked={form.hasSmallParts}
                  onChange={(e) =>
                    updateField("hasSmallParts", e.currentTarget.checked)
                  }
                  color="red"
                />
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <NumberInput
                  label={t.weightLimit}
                  value={form.weightLimitKg ?? undefined}
                  onChange={(val) =>
                    updateField("weightLimitKg", val ? Number(val) : null)
                  }
                  min={0}
                  suffix=" kg"
                />
                <TextInput
                  label={t.expiryDate}
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    updateField("expiryDate", e.currentTarget.value)
                  }
                />
              </SimpleGrid>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Safety */}
        <Accordion.Item value="safety">
          <Accordion.Control>{t.safety}</Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <MultiSelect
                label={t.certifications}
                data={safetyCertOptions}
                value={form.safetyCertifications}
                onChange={(val) => updateField("safetyCertifications", val)}
              />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Textarea
                  label={t.safetyWarningEn}
                  value={form.safetyWarningEn}
                  onChange={(e) =>
                    updateField("safetyWarningEn", e.currentTarget.value)
                  }
                  rows={3}
                />
                <Textarea
                  label={t.safetyWarningBn}
                  value={form.safetyWarningBn}
                  onChange={(e) =>
                    updateField("safetyWarningBn", e.currentTarget.value)
                  }
                  rows={3}
                />
              </SimpleGrid>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      {/* Mobile Sticky Bottom Bar */}
      <Box
        hiddenFrom="sm"
        pos="fixed"
        bottom={0}
        left={0}
        right={0}
        p="md"
        style={{
          backgroundColor: "white",
          borderTop: "1px solid var(--mantine-color-gray-3)",
          zIndex: 100,
        }}
      >
        <Group grow>
          <Button
            variant="default"
            leftSection={<Save size={16} />}
            onClick={() => saveMutation.mutate("draft")}
            loading={saveMutation.isPending}
          >
            {t.saveDraft}
          </Button>
          <Button
            color="teal"
            leftSection={<Send size={16} />}
            onClick={() => saveMutation.mutate("pending")}
            loading={saveMutation.isPending}
          >
            {t.publish}
          </Button>
        </Group>
      </Box>

      {/* Spacer for mobile bottom bar */}
      <Box hiddenFrom="sm" h={80} />
    </Stack>
  );
}
