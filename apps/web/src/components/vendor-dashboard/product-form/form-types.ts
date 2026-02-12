import type { VendorProductDetailDTO } from "@kineDao.com/api-types/vendor-dashboard";
import type { CategoryDTO } from "@kineDao.com/api-types/catalog";
import { getS3Url } from "@/lib/s3-helpers";

// =====================
// Form Props
// =====================

export interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: VendorProductDetailDTO;
  initialCategories?: CategoryDTO[];
}

// =====================
// Form State Types
// =====================

export interface FormImage {
  id?: string;
  s3Key?: string; // For existing images
  url: string; // Display URL (generated from s3Key or presigned)
  fallbackUrl?: string; // Temporary fallback (e.g., presigned upload URL)
  variant?: "original" | "medium" | "thumbnail";
  sortOrder: number;
  file?: File; // For new uploads
  uploading?: boolean;
}

export interface FormOption {
  name: string;
  nameBn: string;
  values: string[];
  valuesBn: string[];
}

export interface FormSku {
  sku: string;
  optionValues: Record<string, string>;
  priceAmount: number;
  compareAtAmount: number | null;
  stockQty: number;
  isAvailable: boolean;
}

export interface FormState {
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

export interface CategorySelectItem {
  value: string;
  label: string;
}

export interface CategorySelectGroup {
  group: string;
  items: CategorySelectItem[];
}

export type FormSubmitStatus = "draft" | "pending";

export type FormErrorMap = Record<string, string>;

export interface FormValidationResult {
  isValid: boolean;
  fieldErrors: FormErrorMap;
  formErrors: string[];
}

export interface ParsedApiError {
  messages: string[];
  fieldErrors: FormErrorMap;
}

// =====================
// Constants
// =====================

export const ageRangeOptions = [
  { value: "0", label: "0 months" },
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "9", label: "9 months" },
  { value: "12", label: "12 months" },
  { value: "18", label: "18 months" },
  { value: "24", label: "24 months" },
  { value: "36", label: "36 months" },
];

export const safetyCertOptions = [
  { value: "BSTI", label: "BSTI" },
  { value: "CE", label: "CE Mark" },
  { value: "ASTM F963", label: "ASTM F963" },
  { value: "ISO 8124", label: "ISO 8124" },
  { value: "EN 71", label: "EN 71" },
  { value: "FDA", label: "FDA Approved" },
  { value: "BPA-Free Certified", label: "BPA-Free Certified" },
];

const CONSUMABLE_CATEGORY_HINTS = [
  "formula",
  "food",
  "snack",
  "cereal",
  "puree",
  "milk",
  "supplement",
  "lotion",
  "cream",
  "shampoo",
  "wash",
  "oil",
  "ointment",
  "powder",
  "wipes",
  "skincare",
  "diaper-cream",
  "feeding-food",
];

// =====================
// Labels (i18n)
// =====================

export const labels = {
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
    uploadCover: "Upload Cover Photo",
    uploadProductPhoto: "Upload Product Photo",
    maxImages: "Max 5 images. First image is the primary.",
    coverPhoto: "Cover Photo",
    productPhotos: "Product Photos",
    pricingInventory: "Pricing & Inventory",
    variants: "Product Variants",
    addVariant: "Add Variant",
    variantType: "Variant Type (e.g., Size, Color)",
    variantValues: "Values (comma separated)",
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
    submitGuideTitle: "Mandatory vs optional fields",
    submitGuideBody:
      "Required now: Title (English), Category. Required before submit: at least 1 image, at least 1 SKU with SKU code and price >= 1 BDT. Expiry date is required for consumable categories.",
    requiredAlways: "Required",
    optionalField: "Optional",
    requiredForSubmit: "Required for submit",
    requiredSkuForSubmit: "At least one valid SKU is required for submit",
    requiredForConsumables: "Required for consumables on submit",
    bulkEditTitle: "Bulk pricing tools",
    bulkPrice: "Bulk price (BDT)",
    bulkCompareAt: "Bulk compare-at (BDT)",
    bulkStock: "Bulk stock",
    bulkAvailability: "Bulk availability",
    bulkDiscount: "Bulk discount (%)",
    discountMode: "Discount mode",
    discountFromPrice: "Compute compare-at from price",
    discountFromCompareAt: "Compute price from compare-at",
    applyToAll: "Apply to all rows",
    applyToSelected: "Apply to selected rows",
    clearBulk: "Clear bulk fields",
    selectAll: "Select all",
    clearSelection: "Clear selection",
    selectedRows: "selected",
    keepCurrent: "Keep current value",
    setAvailable: "Set available",
    setUnavailable: "Set unavailable",
    variantPresetOnly: "Only predefined variant types and values are allowed.",
    selectVariantValues: "Select predefined values",
    noVariantTypeSelected: "Select at least one variant type",
    legacyVariantWarning:
      "This product has older custom variant types. They are preserved but cannot be edited here.",
    noImages: "No images uploaded yet",
    primary: "Primary",
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
    uploadCover: "কভার ফটো আপলোড করুন",
    uploadProductPhoto: "পণ্যের ফটো আপলোড করুন",
    maxImages: "সর্বোচ্চ ৫টি ছবি। প্রথম ছবিটি প্রাথমিক।",
    coverPhoto: "কভার ফটো",
    productPhotos: "পণ্যের ফটো",
    pricingInventory: "মূল্য ও ইনভেন্টরি",
    variants: "পণ্যের ভ্যারিয়েন্ট",
    addVariant: "ভ্যারিয়েন্ট যোগ করুন",
    variantType: "ভ্যারিয়েন্ট টাইপ (যেমন, সাইজ, রঙ)",
    variantValues: "মানগুলি (কমা দ্বারা পৃথক)",
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
    submitGuideTitle: "আবশ্যিক ও ঐচ্ছিক ফিল্ড",
    submitGuideBody:
      "এখন আবশ্যিক: শিরোনাম (ইংরেজি), ক্যাটেগরি। জমা দেওয়ার আগে আবশ্যিক: কমপক্ষে ১টি ছবি, SKU কোডসহ কমপক্ষে ১টি SKU এবং মূল্য >= ১ টাকা। ভোগ্যপণ্যের জন্য মেয়াদ শেষের তারিখ আবশ্যিক।",
    requiredAlways: "আবশ্যিক",
    optionalField: "ঐচ্ছিক",
    requiredForSubmit: "জমা দেওয়ার জন্য আবশ্যিক",
    requiredSkuForSubmit: "জমা দেওয়ার জন্য কমপক্ষে ১টি বৈধ SKU আবশ্যিক",
    requiredForConsumables: "ভোগ্যপণ্যের জন্য জমার সময় আবশ্যিক",
    bulkEditTitle: "বাল্ক প্রাইসিং টুলস",
    bulkPrice: "বাল্ক দাম (টাকা)",
    bulkCompareAt: "বাল্ক তুলনামূলক দাম (টাকা)",
    bulkStock: "বাল্ক স্টক",
    bulkAvailability: "বাল্ক এভেইলেবিলিটি",
    bulkDiscount: "বাল্ক ডিসকাউন্ট (%)",
    discountMode: "ডিসকাউন্ট মোড",
    discountFromPrice: "দাম থেকে তুলনামূলক দাম হিসাব করুন",
    discountFromCompareAt: "তুলনামূলক দাম থেকে দাম হিসাব করুন",
    applyToAll: "সব রো-তে প্রয়োগ করুন",
    applyToSelected: "নির্বাচিত রো-তে প্রয়োগ করুন",
    clearBulk: "বাল্ক ফিল্ড পরিষ্কার করুন",
    selectAll: "সব নির্বাচন করুন",
    clearSelection: "নির্বাচন বাতিল",
    selectedRows: "নির্বাচিত",
    keepCurrent: "বর্তমান মান রাখুন",
    setAvailable: "উপলব্ধ করুন",
    setUnavailable: "অনুপলব্ধ করুন",
    variantPresetOnly: "শুধুমাত্র পূর্বনির্ধারিত ভ্যারিয়েন্ট টাইপ এবং মান ব্যবহার করা যাবে।",
    selectVariantValues: "পূর্বনির্ধারিত মান নির্বাচন করুন",
    noVariantTypeSelected: "কমপক্ষে একটি ভ্যারিয়েন্ট টাইপ নির্বাচন করুন",
    legacyVariantWarning:
      "এই পণ্যে পুরোনো কাস্টম ভ্যারিয়েন্ট টাইপ আছে। এগুলো সংরক্ষিত থাকবে কিন্তু এখানে সম্পাদনা করা যাবে না।",
    noImages: "এখনো কোনো ছবি আপলোড হয়নি",
    primary: "প্রাথমিক",
  },
} as const;

// =====================
// Helper Functions
// =====================

export function buildInitialState(data?: VendorProductDetailDTO): FormState {
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
      url: getS3Url(img.s3Key),
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

export function normalizeCategoryResponse(data: unknown): CategoryDTO[] {
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

function buildCategoryPath(
  categoryId: string,
  categoryMap: Map<string, CategoryDTO>
): CategoryDTO[] {
  const path: CategoryDTO[] = [];
  const visited = new Set<string>();
  let current = categoryMap.get(categoryId);

  while (current && !visited.has(current.id)) {
    path.unshift(current);
    visited.add(current.id);
    current = current.parentId ? categoryMap.get(current.parentId) : undefined;
  }

  return path;
}

export function buildLeafCategoryOptionGroups(
  categories: CategoryDTO[]
): CategorySelectGroup[] {
  if (categories.length === 0) return [];

  const categoryMap = new Map<string, CategoryDTO>(
    categories.map((category) => [category.id, category])
  );
  const parentIds = new Set<string>();

  for (const category of categories) {
    if (category.parentId) {
      parentIds.add(category.parentId);
    }
  }

  const groups = new Map<string, CategorySelectItem[]>();

  for (const category of categories) {
    if (parentIds.has(category.id)) continue;

    const path = buildCategoryPath(category.id, categoryMap);
    if (path.length === 0) continue;

    const rootName = path[0]?.name?.trim() || "Other";
    const label = path.map((item) => item.name).join(" > ");

    if (!groups.has(rootName)) {
      groups.set(rootName, []);
    }

    groups.get(rootName)!.push({
      value: category.id,
      label,
    });
  }

  return Array.from(groups.entries())
    .map(([group, items]) => ({
      group,
      items: items.sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.group.localeCompare(b.group));
}

export function normalizeOptionName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeOptionValue(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function dedupeOptionValues(values: string[]): string[] {
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const raw of values) {
    const normalized = normalizeOptionValue(raw);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(normalized);
  }

  return unique;
}

export function sanitizeFormOptions(options: FormOption[]): FormOption[] {
  return options.map((option) => ({
    name: normalizeOptionName(option.name),
    nameBn: option.nameBn.trim(),
    values: dedupeOptionValues(option.values),
    valuesBn: option.valuesBn
      .map((value) => normalizeOptionValue(value))
      .filter(Boolean),
  }));
}

export function normalizeSkuOptionValues(
  optionValues: Record<string, string>,
  validOptionNames: string[]
): Record<string, string> {
  const normalized: Record<string, string> = {};
  const validNameMap = new Map<string, string>();

  for (const optionName of validOptionNames) {
    validNameMap.set(optionName.toLowerCase(), optionName);
  }

  for (const [rawKey, rawValue] of Object.entries(optionValues)) {
    const key = normalizeOptionName(rawKey);
    const value = normalizeOptionValue(rawValue);
    if (!key || !value) continue;
    const canonicalName = validNameMap.get(key.toLowerCase());
    if (!canonicalName) continue;
    normalized[canonicalName] = value;
  }

  return normalized;
}

function findCategoryById(
  categoryId: string,
  categories: CategoryDTO[]
): CategoryDTO | undefined {
  return categories.find((category) => category.id === categoryId);
}

function isConsumableCategory(category?: CategoryDTO): boolean {
  if (!category) return false;
  const source = `${category.slug} ${category.name}`.toLowerCase();
  return CONSUMABLE_CATEGORY_HINTS.some((hint) => source.includes(hint));
}

function setFirstError(
  fieldErrors: FormErrorMap,
  fieldKey: string,
  message: string
) {
  if (!fieldErrors[fieldKey]) {
    fieldErrors[fieldKey] = message;
  }
}

function hasAnyValue(option: FormOption): boolean {
  return (
    Boolean(normalizeOptionName(option.name)) ||
    option.values.some((value) => Boolean(normalizeOptionValue(value)))
  );
}

export function getFirstInvalidField(fieldErrors: FormErrorMap): string | null {
  const first = Object.keys(fieldErrors)[0];
  return first ?? null;
}

export function getValidationSummary(fieldErrors: FormErrorMap): string {
  const count = Object.keys(fieldErrors).length;
  if (count <= 0) return "Please review the form and try again.";
  return count === 1
    ? "Please fix 1 required field."
    : `Please fix ${count} required fields.`;
}

export function validateProductForm(
  form: FormState,
  status: FormSubmitStatus,
  categories: CategoryDTO[]
): FormValidationResult {
  const fieldErrors: FormErrorMap = {};
  const formErrors: string[] = [];
  const isPendingSubmit = status === "pending";

  const trimmedTitle = form.title.trim();
  if (!trimmedTitle) {
    setFirstError(fieldErrors, "title", "Product title is required.");
  } else if (isPendingSubmit && trimmedTitle.length < 3) {
    setFirstError(
      fieldErrors,
      "title",
      "Product title must be at least 3 characters."
    );
  }

  if (!form.categoryId) {
    setFirstError(fieldErrors, "categoryId", "Category is required.");
  }

  if (isPendingSubmit && form.images.length < 1) {
    setFirstError(fieldErrors, "images", "At least one product image is required.");
  }

  if (form.images.length > 5) {
    setFirstError(fieldErrors, "images", "Maximum 5 product images are allowed.");
  }

  const invalidImageIndex = form.images.findIndex((image) => !image.s3Key?.trim());
  if (invalidImageIndex !== -1) {
    setFirstError(
      fieldErrors,
      "images",
      "One or more images failed to upload. Please re-upload the image."
    );
  }

  if (
    form.ageRangeMin != null &&
    form.ageRangeMax != null &&
    form.ageRangeMin > form.ageRangeMax
  ) {
    setFirstError(
      fieldErrors,
      "ageRangeMax",
      "Age range max must be greater than or equal to age range min."
    );
  }

  const matchedCategory = findCategoryById(form.categoryId, categories);
  if (
    isPendingSubmit &&
    isConsumableCategory(matchedCategory) &&
    !form.expiryDate.trim()
  ) {
    setFirstError(
      fieldErrors,
      "expiryDate",
      "Expiry date is required for consumable products."
    );
  }

  const sanitizedOptions = sanitizeFormOptions(form.options);
  const validOptionNames: string[] = [];
  const seenOptionNames = new Set<string>();

  sanitizedOptions.forEach((option, index) => {
    const optionHasAnyValue = hasAnyValue(option);
    if (!optionHasAnyValue) {
      return;
    }

    if (!option.name) {
      setFirstError(
        fieldErrors,
        `options.${index}.name`,
        "Variant name is required when values are provided."
      );
    }

    if (option.values.length < 1) {
      setFirstError(
        fieldErrors,
        `options.${index}.values`,
        "Add at least one variant value."
      );
    }

    if (option.name) {
      const key = option.name.toLowerCase();
      if (seenOptionNames.has(key)) {
        setFirstError(
          fieldErrors,
          `options.${index}.name`,
          "Variant names must be unique."
        );
      } else {
        seenOptionNames.add(key);
        validOptionNames.push(option.name);
      }
    }
  });

  if (isPendingSubmit && form.skus.length < 1) {
    setFirstError(fieldErrors, "skus", "At least one SKU is required.");
  }

  form.skus.forEach((sku, index) => {
    if (isPendingSubmit && !sku.sku.trim()) {
      setFirstError(fieldErrors, `skus.${index}.sku`, "SKU code is required.");
    }

    if (isPendingSubmit && sku.priceAmount < 100) {
      setFirstError(
        fieldErrors,
        `skus.${index}.priceAmount`,
        "Price must be at least 1 BDT."
      );
    }

    if (sku.stockQty < 0) {
      setFirstError(
        fieldErrors,
        `skus.${index}.stockQty`,
        "Stock quantity cannot be negative."
      );
    }

    if (sku.compareAtAmount != null && sku.compareAtAmount < 0) {
      setFirstError(
        fieldErrors,
        `skus.${index}.compareAtAmount`,
        "Compare-at price cannot be negative."
      );
    }

    if (
      sku.compareAtAmount != null &&
      sku.compareAtAmount > 0 &&
      sku.compareAtAmount < sku.priceAmount
    ) {
      setFirstError(
        fieldErrors,
        `skus.${index}.compareAtAmount`,
        "Compare-at price should be greater than or equal to price."
      );
    }

    if (validOptionNames.length > 0) {
      const normalizedOptionValues = normalizeSkuOptionValues(
        sku.optionValues,
        validOptionNames
      );
      const missingValue = validOptionNames.some(
        (optionName) => !normalizedOptionValues[optionName]
      );

      if (missingValue) {
        setFirstError(
          fieldErrors,
          `skus.${index}.optionValues`,
          "SKU is missing one or more variant selections."
        );
      }
    }
  });

  if (Object.keys(fieldErrors).length > 0) {
    formErrors.push(getValidationSummary(fieldErrors));
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    formErrors,
  };
}

function addMessage(messages: string[], message: string) {
  const trimmed = message.trim();
  if (!trimmed || trimmed === "[object Object]") return;
  if (!messages.includes(trimmed)) {
    messages.push(trimmed);
  }
}

function parseIssues(
  issues: unknown[],
  messages: string[],
  fieldErrors: FormErrorMap
) {
  for (const issue of issues) {
    if (!issue || typeof issue !== "object") continue;
    const message =
      "message" in issue && typeof issue.message === "string"
        ? issue.message
        : "Validation error";
    const pathParts =
      "path" in issue && Array.isArray(issue.path)
        ? issue.path.map((part) => String(part))
        : [];
    const normalizedPathParts =
      pathParts[0] === "json" ? pathParts.slice(1) : pathParts;
    const path = normalizedPathParts.join(".");

    if (path) {
      setFirstError(fieldErrors, path, message);
      addMessage(messages, `${path}: ${message}`);
    } else {
      addMessage(messages, message);
    }
  }
}

export function parseApiErrorPayload(
  payload: unknown,
  fallbackMessage: string
): ParsedApiError {
  const messages: string[] = [];
  const fieldErrors: FormErrorMap = {};

  if (!payload) {
    return { messages: [fallbackMessage], fieldErrors };
  }

  if (typeof payload === "string") {
    addMessage(messages, payload);
    return { messages: messages.length > 0 ? messages : [fallbackMessage], fieldErrors };
  }

  if (typeof payload !== "object") {
    return { messages: [fallbackMessage], fieldErrors };
  }

  const data = payload as Record<string, unknown>;

  if (typeof data.error === "string") {
    addMessage(messages, data.error);
  }

  if (typeof data.message === "string") {
    addMessage(messages, data.message);
  }

  if (Array.isArray(data.issues)) {
    parseIssues(data.issues, messages, fieldErrors);
  }

  if (data.error && typeof data.error === "object") {
    const nestedError = data.error as Record<string, unknown>;
    if (typeof nestedError.message === "string") {
      addMessage(messages, nestedError.message);
    }
    if (Array.isArray(nestedError.issues)) {
      parseIssues(nestedError.issues, messages, fieldErrors);
    }
  }

  if (Array.isArray(data.errors)) {
    for (const errorValue of data.errors) {
      if (typeof errorValue === "string") {
        addMessage(messages, errorValue);
      }
    }
  }

  if (messages.length === 0) {
    addMessage(messages, fallbackMessage);
  }

  return { messages, fieldErrors };
}
