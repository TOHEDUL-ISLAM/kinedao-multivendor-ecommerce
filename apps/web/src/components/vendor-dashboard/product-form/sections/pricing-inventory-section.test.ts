import { describe, expect, it } from "bun:test";
import type { FormSku } from "../form-types";
import { __test__ } from "./pricing-inventory-section";

function createSku(overrides: Partial<FormSku> = {}): FormSku {
  return {
    sku: "SKU-1",
    optionValues: { Size: "M" },
    priceAmount: 10000,
    compareAtAmount: 12000,
    stockQty: 15,
    isAvailable: true,
    ...overrides,
  };
}

describe("pricing inventory bulk helpers", () => {
  it("detects when no bulk fields are set", () => {
    const hasChanges = __test__.hasAnyBulkField(
      null,
      null,
      null,
      "keep",
      null
    );
    expect(hasChanges).toBe(false);
  });

  it("applies bulk price and stock overrides", () => {
    const sku = createSku();
    const next = __test__.applyBulkToSku(
      sku,
      250,
      null,
      99,
      "keep",
      null,
      "from_price"
    );

    expect(next.priceAmount).toBe(25000);
    expect(next.stockQty).toBe(99);
    expect(next.compareAtAmount).toBe(12000);
  });

  it("computes compare-at from price and discount", () => {
    const sku = createSku({ priceAmount: 20000, compareAtAmount: null });
    const next = __test__.applyBulkToSku(
      sku,
      200,
      null,
      null,
      "keep",
      20,
      "from_price"
    );

    expect(next.priceAmount).toBe(20000);
    expect(next.compareAtAmount).toBe(25000);
  });

  it("computes price from compare-at and discount", () => {
    const sku = createSku({ priceAmount: 0, compareAtAmount: 30000 });
    const next = __test__.applyBulkToSku(
      sku,
      null,
      300,
      null,
      "keep",
      10,
      "from_compare"
    );

    expect(next.compareAtAmount).toBe(30000);
    expect(next.priceAmount).toBe(27000);
  });
});
