import { Table, Badge, TextInput, NumberInput, Switch, Box } from "@mantine/core";
import { DollarSign } from "lucide-react";
import { FormSectionCard } from "../form-section-card";
import { vendorColors } from "@/lib/vendor-theme";
import type { FormSku, FormOption } from "../form-types";

interface PricingInventorySectionProps {
  options: FormOption[];
  skus: FormSku[];
  updateSku: <K extends keyof FormSku>(
    index: number,
    field: K,
    value: FormSku[K]
  ) => void;
  isDark: boolean;
  t: {
    pricingInventory: string;
    skuCode: string;
    price: string;
    compareAt: string;
    stock: string;
    available: string;
  };
}

export function PricingInventorySection({
  options,
  skus,
  updateSku,
  isDark,
  t,
}: PricingInventorySectionProps) {
  const tableHeaderStyle = vendorColors.table.header(isDark);
  const tableRowStyle = vendorColors.table.row(isDark);

  return (
    <FormSectionCard title={t.pricingInventory} icon={<DollarSign size={20} />}>
      <Box style={{ overflowX: "auto" }}>
        <Table>
          <Table.Thead style={tableHeaderStyle}>
            <Table.Tr>
              {options
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
            {skus.map((sku, index) => (
              <Table.Tr key={index} style={tableRowStyle}>
                {options
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
                    onChange={(e) => updateSku(index, "sku", e.currentTarget.value)}
                    size="xs"
                    style={{ minWidth: 100 }}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={sku.priceAmount / 100}
                    onChange={(val) =>
                      updateSku(index, "priceAmount", Math.round((Number(val) || 0) * 100))
                    }
                    size="xs"
                    min={0}
                    prefix="৳"
                    style={{ minWidth: 100 }}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    value={sku.compareAtAmount ? sku.compareAtAmount / 100 : undefined}
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
                    onChange={(val) => updateSku(index, "stockQty", Number(val) || 0)}
                    size="xs"
                    min={0}
                    style={{ minWidth: 80 }}
                  />
                </Table.Td>
                <Table.Td>
                  <Switch
                    checked={sku.isAvailable}
                    onChange={(e) => updateSku(index, "isAvailable", e.currentTarget.checked)}
                    size="sm"
                    color="teal"
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>
    </FormSectionCard>
  );
}
