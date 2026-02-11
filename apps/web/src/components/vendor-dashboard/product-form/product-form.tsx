import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, Title, Group, Button, Alert } from "@mantine/core";
import { ArrowLeft, Save, Send } from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { toast } from "sonner";
import { useVendorTheme } from "@/lib/vendor-theme";
import { getS3Url } from "@/lib/s3-helpers";

// Import types and helpers
import {
  type ProductFormProps,
  type FormState,
  type FormOption,
  type FormSku,
  type FormErrorMap,
  labels,
  buildInitialState,
  buildLeafCategoryOptionGroups,
  normalizeCategoryResponse,
  sanitizeFormOptions,
  normalizeSkuOptionValues,
  validateProductForm,
  getValidationSummary,
  getFirstInvalidField,
  parseApiErrorPayload,
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
  const [fieldErrors, setFieldErrors] = useState<FormErrorMap>({});
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Fetch categories if not provided
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.categories.$get({ query: {} });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: !initialCategories,
    staleTime: 1000 * 60 * 10,
  });

  const categories =
    initialCategories || (categoriesData ? normalizeCategoryResponse(categoriesData) : []);
  const categoryOptions = useMemo(
    () => buildLeafCategoryOptionGroups(categories),
    [categories]
  );

  const clearErrorsForKeys = useCallback((keys: string[]) => {
    setFieldErrors((prev) => {
      if (keys.length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const key of keys) {
        if (!key) continue;
        for (const errorKey of Object.keys(next)) {
          if (errorKey === key || errorKey.startsWith(`${key}.`)) {
            delete next[errorKey];
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
    setFormErrors([]);
  }, []);

  const focusFirstInvalidField = useCallback((fieldKey: string | null) => {
    if (!fieldKey || typeof document === "undefined") return;

    requestAnimationFrame(() => {
      const selector = `[data-field-key="${fieldKey}"] input, [data-field-key="${fieldKey}"] textarea, [data-field-key="${fieldKey}"] button`;
      const target = document.querySelector(selector) as HTMLElement | null;
      const container = document.querySelector(
        `[data-field-key="${fieldKey}"]`
      ) as HTMLElement | null;
      const elementToScroll = target || container;

      if (elementToScroll) {
        elementToScroll.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      if (target) {
        target.focus();
      }
    });
  }, []);

  // Generic field updater
  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      const keys = [String(field)];
      if (field === "ageRangeMin" || field === "ageRangeMax") {
        keys.push("ageRangeMax");
      }
      if (field === "categoryId" || field === "expiryDate") {
        keys.push("expiryDate");
      }
      clearErrorsForKeys(keys);
    },
    [clearErrorsForKeys]
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
            const data = (await response.json()) as {
              s3Key?: string;
              url?: string;
              variant?: "original" | "medium" | "thumbnail";
            };

            if (!data.s3Key) {
              toast.error("Image upload response is missing file key");
              continue;
            }

            const stableUrl = getS3Url(data.s3Key);

            setForm((prev) => ({
              ...prev,
              images: [
                ...prev.images,
                {
                  s3Key: data.s3Key,
                  url: stableUrl,
                  fallbackUrl: data.url,
                  variant: data.variant || "original",
                  sortOrder: prev.images.length,
                },
              ],
            }));
            clearErrorsForKeys(["images"]);
          } else {
            const errorPayload = await response.json().catch(() => null);
            const parsed = parseApiErrorPayload(
              errorPayload,
              "Failed to upload image"
            );
            toast.error(parsed.messages[0] || "Failed to upload image");
          }
        } catch (error) {
          toast.error(
            error instanceof Error && error.message
              ? error.message
              : "Failed to upload image"
          );
        }
      }
    },
    [form.images.length, clearErrorsForKeys]
  );

  const removeImage = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    clearErrorsForKeys(["images"]);
  }, [clearErrorsForKeys]);

  // Options management
  const setOptions = useCallback(
    (options: FormOption[]) => {
      setForm((prev) => ({
        ...prev,
        options,
      }));
      clearErrorsForKeys(["options", "skus"]);
    },
    [clearErrorsForKeys]
  );

  // Generate SKU combinations from options
  const generateSkus = useCallback(() => {
    const sanitizedOptions = sanitizeFormOptions(form.options);
    const validOptions = sanitizedOptions.filter((o) => o.name && o.values.length > 0);
    const validOptionNames = validOptions.map((option) => option.name);

    if (validOptions.length === 0) {
      setForm((prev) => ({
        ...prev,
        options: sanitizedOptions,
        skus: [
          {
            sku: prev.skus[0]?.sku?.trim() || "",
            optionValues: {},
            priceAmount: prev.skus[0]?.priceAmount || 0,
            compareAtAmount: prev.skus[0]?.compareAtAmount || null,
            stockQty: prev.skus[0]?.stockQty || 0,
            isAvailable: true,
          },
        ],
      }));
      clearErrorsForKeys(["options", "skus"]);
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

    const normalizedExistingSkus = form.skus.map((sku) => ({
      ...sku,
      optionValues: normalizeSkuOptionValues(sku.optionValues, validOptionNames),
    }));

    setForm((prev) => ({
      ...prev,
      options: sanitizedOptions,
      skus: combinations.map((combo) => {
        const existing = normalizedExistingSkus.find((s) =>
          validOptionNames.every((optionName) => s.optionValues[optionName] === combo[optionName])
        );
        return {
          sku: existing?.sku?.trim() || Object.values(combo).join("-").replace(/\s+/g, "-"),
          optionValues: combo,
          priceAmount: existing?.priceAmount || 0,
          compareAtAmount: existing?.compareAtAmount || null,
          stockQty: existing?.stockQty || 0,
          isAvailable: existing?.isAvailable ?? true,
        };
      }),
    }));
    clearErrorsForKeys(["options", "skus"]);
  }, [form.options, form.skus, clearErrorsForKeys]);

  const updateSku = useCallback(
    <K extends keyof FormSku>(index: number, field: K, value: FormSku[K]) => {
      setForm((prev) => ({
        ...prev,
        skus: prev.skus.map((s, i) =>
          i === index ? { ...s, [field]: value } : s
        ),
      }));
      clearErrorsForKeys([
        `skus.${index}.${String(field)}`,
        `skus.${index}.optionValues`,
      ]);
    },
    [clearErrorsForKeys]
  );

  const replaceSkus = useCallback(
    (nextSkus: FormSku[]) => {
      setForm((prev) => ({
        ...prev,
        skus: nextSkus,
      }));
      clearErrorsForKeys(["skus"]);
    },
    [clearErrorsForKeys]
  );

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (status: "draft" | "pending") => {
      const sanitizedOptions = sanitizeFormOptions(form.options);
      const validOptions = sanitizedOptions.filter(
        (option) => option.name && option.values.length > 0
      );
      const validOptionNames = validOptions.map((option) => option.name);

      const payload = {
        title: form.title.trim(),
        titleBn: form.titleBn.trim() || undefined,
        categoryId: form.categoryId,
        brand: form.brand.trim() || undefined,
        shortDescription: form.shortDescription.trim() || undefined,
        shortDescriptionBn: form.shortDescriptionBn.trim() || undefined,
        description: form.description.trim() || undefined,
        descriptionBn: form.descriptionBn.trim() || undefined,
        ageRangeMin: form.ageRangeMin ?? undefined,
        ageRangeMax: form.ageRangeMax ?? undefined,
        isBpaFree: form.isBpaFree,
        isOrganic: form.isOrganic,
        isHypoallergenic: form.isHypoallergenic,
        hasSmallParts: form.hasSmallParts,
        safetyWarningEn: form.safetyWarningEn.trim() || undefined,
        safetyWarningBn: form.safetyWarningBn.trim() || undefined,
        safetyCertifications:
          form.safetyCertifications.length > 0
            ? form.safetyCertifications
            : undefined,
        weightLimitKg: form.weightLimitKg ?? undefined,
        expiryDate: form.expiryDate.trim() || undefined,
        images: form.images.map((img, i) => ({
          s3Key: img.s3Key?.trim() || "",
          variant: img.variant || "original",
          sortOrder: i,
        })),
        options: validOptions
          .map((o, i) => ({
            name: o.name,
            nameBn: o.nameBn.trim() || undefined,
            values: o.values,
            valuesBn: o.valuesBn.length > 0 ? o.valuesBn : undefined,
            sortOrder: i,
          })),
        skus: form.skus.map((s) => ({
          sku: s.sku.trim(),
          optionValues:
            Object.keys(normalizeSkuOptionValues(s.optionValues, validOptionNames)).length > 0
              ? normalizeSkuOptionValues(s.optionValues, validOptionNames)
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
          const parsed = parseApiErrorPayload(
            errorBody,
            "Failed to update product"
          );
          const error = new Error(parsed.messages[0] || "Failed to update product") as Error & {
            messages?: string[];
            fieldErrors?: FormErrorMap;
          };
          error.messages = parsed.messages;
          error.fieldErrors = parsed.fieldErrors;
          throw error;
        }
        return res.json();
      } else {
        const res = await api.vendorDashboard.products.$post({
          json: payload as any,
        });
        if (!res.ok) {
          const errorBody = await res.json().catch(() => null);
          const parsed = parseApiErrorPayload(
            errorBody,
            "Failed to create product"
          );
          const error = new Error(parsed.messages[0] || "Failed to create product") as Error & {
            messages?: string[];
            fieldErrors?: FormErrorMap;
          };
          error.messages = parsed.messages;
          error.fieldErrors = parsed.fieldErrors;
          throw error;
        }
        return res.json();
      }
    },
    onSuccess: () => {
      setFieldErrors({});
      setFormErrors([]);
      toast.success(t.saveSuccess);
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({
        queryKey: ["vendor-dashboard-overview"],
      });
      navigate({ to: "/vendor/products" });
    },
    onError: (error: Error & { messages?: string[]; fieldErrors?: FormErrorMap }) => {
      if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors((prev) => ({ ...prev, ...error.fieldErrors }));
      }

      const parsedMessages = error.messages && error.messages.length > 0
        ? error.messages
        : [error.message || t.saveFailed];

      setFormErrors(parsedMessages);
      toast.error(parsedMessages[0] || t.saveFailed);
      focusFirstInvalidField(getFirstInvalidField(error.fieldErrors || {}));
    },
  });

  const handleSubmit = useCallback(
    (status: "draft" | "pending") => {
      const validation = validateProductForm(form, status, categories);

      if (!validation.isValid) {
        setFieldErrors(validation.fieldErrors);
        setFormErrors(validation.formErrors);
        const summary = validation.formErrors[0] || getValidationSummary(validation.fieldErrors);
        toast.error(summary);
        focusFirstInvalidField(getFirstInvalidField(validation.fieldErrors));
        return;
      }

      setFieldErrors({});
      setFormErrors([]);
      saveMutation.mutate(status);
    },
    [categories, form, focusFirstInvalidField, saveMutation]
  );

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
            onClick={() => handleSubmit("draft")}
            loading={saveMutation.isPending}
          >
            {t.saveDraft}
          </Button>
          <Button
            color="teal"
            leftSection={<Send size={16} />}
            onClick={() => handleSubmit("pending")}
            loading={saveMutation.isPending}
          >
            {t.publish}
          </Button>
        </Group>
      </Group>

      <Alert color="blue" variant="light" title={t.submitGuideTitle}>
        {t.submitGuideBody}
      </Alert>

      {formErrors.length > 0 && (
        <Alert color="red" variant="light" title="Submission issues">
          {formErrors[0]}
        </Alert>
      )}

      {/* Form Sections - All Visible (No Accordion) */}
      <BasicInfoSection
        form={form}
        updateField={updateField}
        categoryOptions={categoryOptions}
        isDark={isDark}
        errors={fieldErrors}
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
        errors={fieldErrors}
        t={t}
      />

      <VariantsSection
        options={form.options}
        skusCount={form.skus.length}
        setOptions={setOptions}
        generateSkus={generateSkus}
        isDark={isDark}
        errors={fieldErrors}
        t={t}
      />

      <PricingInventorySection
        options={form.options}
        skus={form.skus}
        updateSku={updateSku}
        replaceSkus={replaceSkus}
        isDark={isDark}
        errors={fieldErrors}
        t={t}
      />

      <BabyInfoSection
        form={form}
        updateField={updateField}
        isDark={isDark}
        errors={fieldErrors}
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
          onClick={() => handleSubmit("draft")}
          loading={saveMutation.isPending}
        >
          {t.saveDraft}
        </Button>
        <Button
          color="teal"
          leftSection={<Send size={16} />}
          onClick={() => handleSubmit("pending")}
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
