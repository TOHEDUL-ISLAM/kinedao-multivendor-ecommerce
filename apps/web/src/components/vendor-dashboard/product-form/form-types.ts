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
