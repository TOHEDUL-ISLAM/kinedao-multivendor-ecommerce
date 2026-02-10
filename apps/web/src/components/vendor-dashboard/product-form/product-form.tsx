import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, Title, Group, Button } from "@mantine/core";
import { ArrowLeft, Save, Send } from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { toast } from "sonner";
import { useVendorTheme } from "@/lib/vendor-theme";

// Import types and helpers
import {
  type ProductFormProps,
  type FormState,
  type FormOption,
  type FormSku,
  labels,
  buildInitialState,
  normalizeCategoryResponse,
} from "./form-types";

// Import section components
import { BasicInfoSection } from "./sections/basic-info-section";
import { DescriptionsSection } from "./sections/descriptions-section";
import { MediaSection } from "./sections/media-section";
import { VariantsSection } from "./sections/variants-section";
import { PricingInventorySection } from "./sections/pricing-inventory-section";
import { BabyInfoSection } from "./sections/baby-info-section";
import { SafetySection } from "./sections/safety-section";

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

  // Fetch categories if not provided
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.categories.$get();
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: !initialCategories,
    staleTime: 1000 * 60 * 10,
  });

  const categories = initialCategories || (categoriesData ? normalizeCategoryResponse(categoriesData) : []);
  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  // Generic field updater
  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Image upload handler
  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (form.images.length + files.length > 5) {
        toast.error("Maximum 5 images allowed");
        return;
      }

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        try {
          const formData = new FormData();
          formData.append("file", file);

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
                  s3Key: data.s3Key,
                  url: data.url,
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
    <K extends keyof FormOption>(index: number, field: K, value: FormOption[K]) => {
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

    // Generate cartesian product
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
        const existing = prev.skus.find((s) =>
          Object.entries(combo).every(([k, v]) => s.optionValues[k] === v)
        );
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
    <K extends keyof FormSku>(index: number, field: K, value: FormSku[K]) => {
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
          s3Key: img.s3Key || "",
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
    <Stack gap="xl">
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

      {/* Form Sections - All Visible (No Accordion) */}
      <BasicInfoSection
        form={form}
        updateField={updateField}
        categoryOptions={categoryOptions}
        isDark={isDark}
        t={t}
      />

      <DescriptionsSection
        form={form}
        updateField={updateField}
        isDark={isDark}
        t={t}
      />

      <MediaSection
        images={form.images}
        handleImageUpload={handleImageUpload}
        removeImage={removeImage}
        isDark={isDark}
        t={t}
      />

      <VariantsSection
        options={form.options}
        skusCount={form.skus.length}
        addOption={addOption}
        removeOption={removeOption}
        updateOption={updateOption}
        generateSkus={generateSkus}
        isDark={isDark}
        t={t}
      />

      <PricingInventorySection
        options={form.options}
        skus={form.skus}
        updateSku={updateSku}
        isDark={isDark}
        t={t}
      />

      <BabyInfoSection
        form={form}
        updateField={updateField}
        isDark={isDark}
        t={t}
      />

      <SafetySection
        form={form}
        updateField={updateField}
        isDark={isDark}
        t={t}
      />

      {/* Mobile Sticky Bottom Bar (Hidden on Desktop) */}
      <Group
        hiddenFrom="sm"
        pos="fixed"
        bottom={0}
        left={0}
        right={0}
        p="md"
        style={{
          backgroundColor: isDark ? "oklch(0.2 0.02 260)" : "white",
          borderTop: isDark
            ? "1px solid oklch(0.3 0.02 260 / 0.3)"
            : "1px solid var(--mantine-color-gray-3)",
          zIndex: 100,
        }}
        grow
      >
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

      {/* Spacer for mobile bottom bar */}
      <div style={{ height: 80, visibility: "hidden" }} />
    </Stack>
  );
}
