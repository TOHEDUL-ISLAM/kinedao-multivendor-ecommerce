import { describe, expect, it } from "bun:test";
import type { CategoryDTO } from "@kineDao.com/api-types/catalog";
import type { FormState } from "./form-types";
import {
  buildLeafCategoryOptionGroups,
  sanitizeFormOptions,
  normalizeSkuOptionValues,
  validateProductForm,
  parseApiErrorPayload,
} from "./form-types";

function createBaseFormState(): FormState {
  return {
    title: "Baby Bottle",
    titleBn: "",
    categoryId: "cat-1",
    brand: "Brand A",
    shortDescription: "",
    shortDescriptionBn: "",
    description: "",
    descriptionBn: "",
    ageRangeMin: 0,
    ageRangeMax: 12,
    isBpaFree: false,
    isOrganic: false,
    isHypoallergenic: false,
    hasSmallParts: false,
    safetyWarningEn: "",
    safetyWarningBn: "",
    safetyCertifications: [],
    weightLimitKg: null,
    expiryDate: "",
    images: [
      {
        s3Key: "products/p1/images/original/a.jpg",
        url: "http://localhost/image.jpg",
        variant: "original",
        sortOrder: 0,
      },
    ],
    options: [],
    skus: [
      {
        sku: "BB-001",
        optionValues: {},
        priceAmount: 2500,
        compareAtAmount: null,
        stockQty: 10,
        isAvailable: true,
      },
    ],
  };
}

const categories: CategoryDTO[] = [
  {
    id: "cat-1",
    name: "Baby Formula",
    nameBn: null,
    slug: "baby-formula",
    parentId: null,
    iconKey: null,
    imageUrl: null,
    sortOrder: 1,
  },
];

describe("product form helpers", () => {
  it("deduplicates and trims option values", () => {
    const options = sanitizeFormOptions([
      {
        name: "  Size  ",
        nameBn: " ",
        values: [" S ", "M", "m", "  "],
        valuesBn: [" এস ", " ", ""],
      },
    ]);

    expect(options[0].name).toBe("Size");
    expect(options[0].values).toEqual(["S", "M"]);
    expect(options[0].valuesBn).toEqual(["এস"]);
  });

  it("normalizes sku option keys to canonical option names", () => {
    const normalized = normalizeSkuOptionValues(
      { " size ": "L", COLOR: "Red", random: "x" },
      ["Size", "Color"]
    );

    expect(normalized).toEqual({ Size: "L", Color: "Red" });
  });

  it("builds grouped leaf-only category options with breadcrumb labels", () => {
    const grouped = buildLeafCategoryOptionGroups([
      {
        id: "root",
        name: "Feeding",
        nameBn: null,
        slug: "feeding",
        parentId: null,
        iconKey: null,
        imageUrl: null,
        sortOrder: 1,
      },
      {
        id: "mid",
        name: "Bottles",
        nameBn: null,
        slug: "bottles",
        parentId: "root",
        iconKey: null,
        imageUrl: null,
        sortOrder: 2,
      },
      {
        id: "leaf",
        name: "Glass Bottles",
        nameBn: null,
        slug: "glass-bottles",
        parentId: "mid",
        iconKey: null,
        imageUrl: null,
        sortOrder: 3,
      },
      {
        id: "leaf-2",
        name: "Sippers",
        nameBn: null,
        slug: "sippers",
        parentId: "root",
        iconKey: null,
        imageUrl: null,
        sortOrder: 4,
      },
    ]);

    expect(grouped.length).toBe(1);
    expect(grouped[0]?.group).toBe("Feeding");
    expect(grouped[0]?.items.some((item) => item.value === "root")).toBe(false);
    expect(grouped[0]?.items.some((item) => item.value === "mid")).toBe(false);
    expect(grouped[0]?.items.find((item) => item.value === "leaf")?.label).toBe(
      "Feeding > Bottles > Glass Bottles"
    );
    expect(grouped[0]?.items.find((item) => item.value === "leaf-2")?.label).toBe(
      "Feeding > Sippers"
    );
  });

  it("blocks pending submission when required data is missing", () => {
    const form = createBaseFormState();
    form.title = "";
    form.images = [];
    form.skus[0].priceAmount = 0;

    const result = validateProductForm(form, "pending", categories);
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.title).toBeDefined();
    expect(result.fieldErrors.images).toBeDefined();
    expect(result.fieldErrors["skus.0.priceAmount"]).toBeDefined();
  });

  it("allows draft save without images or skus when core fields are present", () => {
    const form = createBaseFormState();
    form.images = [];
    form.skus = [];

    const result = validateProductForm(form, "draft", categories);
    expect(result.isValid).toBe(true);
  });

  it("requires category even for draft saves", () => {
    const form = createBaseFormState();
    form.categoryId = "";

    const result = validateProductForm(form, "draft", categories);
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.categoryId).toBeDefined();
  });

  it("requires expiry date for consumable categories on pending submit", () => {
    const form = createBaseFormState();
    form.expiryDate = "";

    const result = validateProductForm(form, "pending", categories);
    expect(result.isValid).toBe(false);
    expect(result.fieldErrors.expiryDate).toBeDefined();
  });

  it("parses nested api error issues into readable messages and field errors", () => {
    const parsed = parseApiErrorPayload(
      {
        error: {
          issues: [
            { path: ["json", "skus", 0, "priceAmount"], message: "Price too low" },
          ],
        },
      },
      "fallback"
    );

    expect(parsed.messages.some((message) => message.includes("Price too low"))).toBe(
      true
    );
    expect(parsed.fieldErrors["skus.0.priceAmount"]).toBe("Price too low");
  });
});
