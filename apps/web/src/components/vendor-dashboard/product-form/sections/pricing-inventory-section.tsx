import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Group,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from "@mantine/core";
import { DollarSign } from "lucide-react";
import { FormSectionCard } from "../form-section-card";
import { vendorColors } from "@/lib/vendor-theme";
import type { FormSku, FormOption, FormErrorMap } from "../form-types";

type DiscountMode = "from_price" | "from_compare";
type BulkAvailability = "keep" | "available" | "unavailable";

interface PricingInventorySectionProps {
  options: FormOption[];
  skus: FormSku[];
  updateSku: <K extends keyof FormSku>(
    index: number,
    field: K,
    value: FormSku[K]
  ) => void;
  replaceSkus: (nextSkus: FormSku[]) => void;
  isDark: boolean;
  errors?: FormErrorMap;
  t: {
    pricingInventory: string;
    skuCode: string;
    price: string;
    compareAt: string;
    stock: string;
    available: string;
    requiredSkuForSubmit: string;
    bulkEditTitle: string;
    bulkPrice: string;
    bulkCompareAt: string;
    bulkStock: string;
    bulkAvailability: string;
    bulkDiscount: string;
    discountMode: string;
    discountFromPrice: string;
    discountFromCompareAt: string;
    applyToAll: string;
    applyToSelected: string;
    clearBulk: string;
    selectAll: string;
    clearSelection: string;
    selectedRows: string;
    keepCurrent: string;
    setAvailable: string;
    setUnavailable: string;
  };
}

function toOptionalNumber(value: string | number): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return null;
}

function clampDiscount(value: number): number {
  return Math.min(Math.max(value, 0), 95);
}

function hasAnyBulkField(
  bulkPriceBdt: number | null,
  bulkCompareAtBdt: number | null,
  bulkStockQty: number | null,
  bulkAvailability: BulkAvailability,
  bulkDiscountPercent: number | null
): boolean {
  return (
    bulkPriceBdt != null ||
    bulkCompareAtBdt != null ||
    bulkStockQty != null ||
    bulkAvailability !== "keep" ||
    bulkDiscountPercent != null
  );
}

function applyBulkToSku(
  sku: FormSku,
  bulkPriceBdt: number | null,
  bulkCompareAtBdt: number | null,
  bulkStockQty: number | null,
  bulkAvailability: BulkAvailability,
  bulkDiscountPercent: number | null,
  discountMode: DiscountMode
): FormSku {
  const next: FormSku = { ...sku };

  if (bulkPriceBdt != null) {
    next.priceAmount = Math.round(Math.max(0, bulkPriceBdt) * 100);
  }

  if (bulkCompareAtBdt != null) {
    next.compareAtAmount = Math.round(Math.max(0, bulkCompareAtBdt) * 100);
  }

  if (bulkStockQty != null) {
    next.stockQty = Math.max(0, Math.floor(bulkStockQty));
  }

  if (bulkAvailability === "available") {
    next.isAvailable = true;
  } else if (bulkAvailability === "unavailable") {
    next.isAvailable = false;
  }

  if (bulkDiscountPercent != null) {
    const discount = clampDiscount(bulkDiscountPercent);
    const multiplier = 1 - discount / 100;

    if (discountMode === "from_price") {
      const basePricePaisa =
        bulkPriceBdt != null
          ? Math.round(Math.max(0, bulkPriceBdt) * 100)
          : next.priceAmount;
      if (basePricePaisa > 0 && multiplier > 0) {
        next.compareAtAmount = Math.round(basePricePaisa / multiplier);
      }
    } else {
      const compareAtPaisa =
        bulkCompareAtBdt != null
          ? Math.round(Math.max(0, bulkCompareAtBdt) * 100)
          : next.compareAtAmount;
      if (compareAtPaisa != null && compareAtPaisa > 0) {
        next.compareAtAmount = compareAtPaisa;
        next.priceAmount = Math.round(compareAtPaisa * multiplier);
      }
    }
  }

  return next;
}

export const __test__ = {
  hasAnyBulkField,
  applyBulkToSku,
};

export function PricingInventorySection({
  options,
  skus,
  updateSku,
  replaceSkus,
  isDark,
  errors,
  t,
}: PricingInventorySectionProps) {
  const tableHeaderStyle = vendorColors.table.header(isDark);
  const tableRowStyle = vendorColors.table.row(isDark);
  const optionColumns = useMemo(() => options.filter((option) => option.name), [options]);

  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
  const [bulkPriceInput, setBulkPriceInput] = useState<string | number>("");
  const [bulkCompareAtInput, setBulkCompareAtInput] = useState<string | number>(
    ""
  );
  const [bulkStockInput, setBulkStockInput] = useState<string | number>("");
  const [bulkDiscountInput, setBulkDiscountInput] = useState<string | number>("");
  const [bulkAvailability, setBulkAvailability] =
    useState<BulkAvailability>("keep");
  const [discountMode, setDiscountMode] = useState<DiscountMode>("from_price");

  useEffect(() => {
    setSelectedIndexes((prev) => {
      const next = new Set<number>();
      for (const index of prev) {
        if (index < skus.length) next.add(index);
      }
      return next;
    });
  }, [skus.length]);

  const bulkPriceBdt = toOptionalNumber(bulkPriceInput);
  const bulkCompareAtBdt = toOptionalNumber(bulkCompareAtInput);
  const bulkStockQty = toOptionalNumber(bulkStockInput);
  const bulkDiscountPercent = toOptionalNumber(bulkDiscountInput);

  const allSelected = skus.length > 0 && selectedIndexes.size === skus.length;
  const selectedCount = selectedIndexes.size;
  const hasBulkFields = hasAnyBulkField(
    bulkPriceBdt,
    bulkCompareAtBdt,
    bulkStockQty,
    bulkAvailability,
    bulkDiscountPercent
  );

  const toggleRowSelection = (index: number) => {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIndexes(new Set());
      return;
    }
    setSelectedIndexes(new Set(skus.map((_, index) => index)));
  };

  const handleApplyBulk = (mode: "all" | "selected") => {
    if (!hasBulkFields) return;

    const targetIndexes =
      mode === "all"
        ? new Set<number>(skus.map((_, index) => index))
        : selectedIndexes;

    if (targetIndexes.size === 0) return;

    const nextSkus = skus.map((sku, index) => {
      if (!targetIndexes.has(index)) return sku;
      return applyBulkToSku(
        sku,
        bulkPriceBdt,
        bulkCompareAtBdt,
        bulkStockQty,
        bulkAvailability,
        bulkDiscountPercent,
        discountMode
      );
    });

    replaceSkus(nextSkus);
  };

  const clearBulkFields = () => {
    setBulkPriceInput("");
    setBulkCompareAtInput("");
    setBulkStockInput("");
    setBulkDiscountInput("");
    setBulkAvailability("keep");
    setDiscountMode("from_price");
  };

  return (
    <FormSectionCard title={t.pricingInventory} icon={<DollarSign size={20} />}>
      <Text size="sm" c="dimmed" mb="sm">
        {t.requiredSkuForSubmit}
      </Text>

      <Paper
        withBorder
        radius="md"
        p="md"
        style={{
          background: isDark ? "oklch(0.22 0.02 260)" : undefined,
          borderColor: isDark ? "oklch(0.3 0.02 260 / 0.3)" : undefined,
        }}
      >
        <Stack gap="md">
          <Group justify="space-between" wrap="wrap">
            <Text fw={600} size="sm">
              {t.bulkEditTitle}
            </Text>
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                onClick={handleSelectAll}
                disabled={skus.length === 0}
              >
                {allSelected ? t.clearSelection : t.selectAll}
              </Button>
              <Badge size="sm" variant="light">
                {selectedCount} {t.selectedRows}
              </Badge>
            </Group>
          </Group>

          <Group grow>
            <NumberInput
              label={t.bulkPrice}
              value={bulkPriceInput}
              onChange={setBulkPriceInput}
              min={0}
              prefix="৳"
            />
            <NumberInput
              label={t.bulkCompareAt}
              value={bulkCompareAtInput}
              onChange={setBulkCompareAtInput}
              min={0}
              prefix="৳"
            />
            <NumberInput
              label={t.bulkStock}
              value={bulkStockInput}
              onChange={setBulkStockInput}
              min={0}
            />
            <Select
              label={t.bulkAvailability}
              data={[
                { value: "keep", label: t.keepCurrent },
                { value: "available", label: t.setAvailable },
                { value: "unavailable", label: t.setUnavailable },
              ]}
              value={bulkAvailability}
              onChange={(value) =>
                setBulkAvailability((value as BulkAvailability | null) ?? "keep")
              }
              allowDeselect={false}
            />
          </Group>

          <Group grow>
            <NumberInput
              label={t.bulkDiscount}
              value={bulkDiscountInput}
              onChange={setBulkDiscountInput}
              min={0}
              max={95}
              suffix="%"
            />
            <Select
              label={t.discountMode}
              data={[
                { value: "from_price", label: t.discountFromPrice },
                { value: "from_compare", label: t.discountFromCompareAt },
              ]}
              value={discountMode}
              onChange={(value) =>
                setDiscountMode((value as DiscountMode | null) ?? "from_price")
              }
              allowDeselect={false}
            />
          </Group>

          <Group justify="flex-end">
            <Button size="xs" variant="default" onClick={clearBulkFields}>
              {t.clearBulk}
            </Button>
            <Button
              size="xs"
              variant="light"
              onClick={() => handleApplyBulk("selected")}
              disabled={!hasBulkFields || selectedCount === 0}
            >
              {t.applyToSelected}
            </Button>
            <Button
              size="xs"
              color="teal"
              onClick={() => handleApplyBulk("all")}
              disabled={!hasBulkFields || skus.length === 0}
            >
              {t.applyToAll}
            </Button>
          </Group>
        </Stack>
      </Paper>

      <Box visibleFrom="sm" style={{ overflowX: "auto" }}>
        <Table>
          <Table.Thead style={tableHeaderStyle}>
            <Table.Tr>
              <Table.Th style={{ width: 44 }}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedCount > 0 && !allSelected}
                  onChange={handleSelectAll}
                  aria-label={t.selectAll}
                />
              </Table.Th>
              {optionColumns.map((option) => (
                <Table.Th key={option.name}>{option.name}</Table.Th>
              ))}
              <Table.Th>{t.skuCode}</Table.Th>
              <Table.Th>{t.price}</Table.Th>
              <Table.Th>{t.compareAt}</Table.Th>
              <Table.Th>{t.stock}</Table.Th>
              <Table.Th>{t.available}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {skus.map((sku, index) => (
              <Table.Tr key={index} style={tableRowStyle}>
                <Table.Td>
                  <Checkbox
                    checked={selectedIndexes.has(index)}
                    onChange={() => toggleRowSelection(index)}
                    aria-label={`Select SKU row ${index + 1}`}
                  />
                </Table.Td>
                {optionColumns.map((option) => (
                  <Table.Td key={option.name}>
                    <Badge variant="light" size="sm">
                      {sku.optionValues[option.name] || "-"}
                    </Badge>
                  </Table.Td>
                ))}
                <Table.Td>
                  <TextInput
                    value={sku.sku}
                    onChange={(event) =>
                      updateSku(index, "sku", event.currentTarget.value)
                    }
                    size="xs"
                    style={{ minWidth: 110 }}
                    error={errors?.[`skus.${index}.sku`]}
                    data-field-key={`skus.${index}.sku`}
                    wrapperProps={{ "data-field-key": `skus.${index}.sku` }}
                  />
                  {errors?.[`skus.${index}.optionValues`] && (
                    <Text
                      size="xs"
                      c="red"
                      mt={4}
                      data-field-key={`skus.${index}.optionValues`}
                    >
                      {errors[`skus.${index}.optionValues`]}
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={sku.priceAmount / 100}
                    onChange={(value) =>
                      updateSku(
                        index,
                        "priceAmount",
                        Math.round((Number(value) || 0) * 100)
                      )
                    }
                    size="xs"
                    min={0}
                    prefix="৳"
                    style={{ minWidth: 100 }}
                    error={errors?.[`skus.${index}.priceAmount`]}
                    data-field-key={`skus.${index}.priceAmount`}
                    wrapperProps={{ "data-field-key": `skus.${index}.priceAmount` }}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={sku.compareAtAmount ? sku.compareAtAmount / 100 : undefined}
                    onChange={(value) =>
                      updateSku(
                        index,
                        "compareAtAmount",
                        value ? Math.round(Number(value) * 100) : null
                      )
                    }
                    size="xs"
                    min={0}
                    prefix="৳"
                    placeholder="-"
                    style={{ minWidth: 100 }}
                    error={errors?.[`skus.${index}.compareAtAmount`]}
                    data-field-key={`skus.${index}.compareAtAmount`}
                    wrapperProps={{
                      "data-field-key": `skus.${index}.compareAtAmount`,
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={sku.stockQty}
                    onChange={(value) =>
                      updateSku(index, "stockQty", Number(value) || 0)
                    }
                    size="xs"
                    min={0}
                    style={{ minWidth: 90 }}
                    error={errors?.[`skus.${index}.stockQty`]}
                    data-field-key={`skus.${index}.stockQty`}
                    wrapperProps={{ "data-field-key": `skus.${index}.stockQty` }}
                  />
                </Table.Td>
                <Table.Td>
                  <Switch
                    checked={sku.isAvailable}
                    onChange={(event) =>
                      updateSku(index, "isAvailable", event.currentTarget.checked)
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

      <Box hiddenFrom="sm">
        <Stack gap="sm">
          {skus.map((sku, index) => (
            <Card
              key={index}
              withBorder
              radius="md"
              p="sm"
              style={{
                background: isDark ? "oklch(0.22 0.02 260)" : undefined,
                borderColor: isDark ? "oklch(0.3 0.02 260 / 0.3)" : undefined,
              }}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Checkbox
                    checked={selectedIndexes.has(index)}
                    onChange={() => toggleRowSelection(index)}
                    label={`SKU ${index + 1}`}
                  />
                  <Switch
                    checked={sku.isAvailable}
                    onChange={(event) =>
                      updateSku(index, "isAvailable", event.currentTarget.checked)
                    }
                    size="sm"
                    color="teal"
                  />
                </Group>

                <Group gap="xs" wrap="wrap">
                  {optionColumns.map((option) => (
                    <Badge key={`${option.name}-${index}`} size="sm" variant="light">
                      {option.name}: {sku.optionValues[option.name] || "-"}
                    </Badge>
                  ))}
                </Group>

                <TextInput
                  label={t.skuCode}
                  value={sku.sku}
                  onChange={(event) => updateSku(index, "sku", event.currentTarget.value)}
                  error={errors?.[`skus.${index}.sku`]}
                  data-field-key={`skus.${index}.sku`}
                  wrapperProps={{ "data-field-key": `skus.${index}.sku` }}
                />
                <NumberInput
                  label={t.price}
                  value={sku.priceAmount / 100}
                  onChange={(value) =>
                    updateSku(index, "priceAmount", Math.round((Number(value) || 0) * 100))
                  }
                  min={0}
                  prefix="৳"
                  error={errors?.[`skus.${index}.priceAmount`]}
                  data-field-key={`skus.${index}.priceAmount`}
                  wrapperProps={{ "data-field-key": `skus.${index}.priceAmount` }}
                />
                <NumberInput
                  label={t.compareAt}
                  value={sku.compareAtAmount ? sku.compareAtAmount / 100 : undefined}
                  onChange={(value) =>
                    updateSku(
                      index,
                      "compareAtAmount",
                      value ? Math.round(Number(value) * 100) : null
                    )
                  }
                  min={0}
                  prefix="৳"
                  error={errors?.[`skus.${index}.compareAtAmount`]}
                  data-field-key={`skus.${index}.compareAtAmount`}
                  wrapperProps={{ "data-field-key": `skus.${index}.compareAtAmount` }}
                />
                <NumberInput
                  label={t.stock}
                  value={sku.stockQty}
                  onChange={(value) => updateSku(index, "stockQty", Number(value) || 0)}
                  min={0}
                  error={errors?.[`skus.${index}.stockQty`]}
                  data-field-key={`skus.${index}.stockQty`}
                  wrapperProps={{ "data-field-key": `skus.${index}.stockQty` }}
                />
              </Stack>
            </Card>
          ))}
        </Stack>
      </Box>
    </FormSectionCard>
  );
}
