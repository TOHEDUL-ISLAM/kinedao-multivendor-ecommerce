import { Button, Card, Group, Text, Select, ActionIcon, Stack, Box, TextInput, Badge, CloseButton } from "@mantine/core";
import { Package, Plus, Trash2 } from "lucide-react";
import { FormSectionCard } from "../form-section-card";
import { vendorColors } from "@/lib/vendor-theme";
import type { FormOption } from "../form-types";
import { useState } from "react";

interface VariantsSectionProps {
  options: FormOption[];
  skusCount: number;
  addOption: () => void;
  removeOption: (index: number) => void;
  updateOption: <K extends keyof FormOption>(
    index: number,
    field: K,
    value: FormOption[K]
  ) => void;
  generateSkus: () => void;
  isDark: boolean;
  t: {
    variants: string;
    addVariant: string;
    optionName: string;
    optionNameBn: string;
    optionValues: string;
    optionValuesBn: string;
    removeOption: string;
    generateSkus: string;
  };
}

// Preset variant types (like in your product details page)
const variantTypeOptions = [
  { value: "Size", label: "Size" },
  { value: "Color", label: "Color" },
  { value: "Material", label: "Material" },
  { value: "Style", label: "Style" },
  { value: "Pattern", label: "Pattern" },
  { value: "Age", label: "Age" },
];

export function VariantsSection({
  options,
  skusCount,
  addOption,
  removeOption,
  updateOption,
  generateSkus,
  isDark,
  t,
}: VariantsSectionProps) {
  const inputStyles = {
    input: {
      background: vendorColors.input(isDark).background,
      border: vendorColors.input(isDark).border,
      color: vendorColors.input(isDark).color,
    },
  };

  // Local state for adding values
  const [valueInputs, setValueInputs] = useState<Record<number, string>>({});

  // Calculate combinations preview
  const getCombinationsCount = () => {
    if (options.length === 0 || !options.every((o) => o.name && o.values.length > 0)) {
      return 0;
    }
    return options.reduce((acc, opt) => acc * opt.values.length, 1);
  };

  const combinationsCount = getCombinationsCount();

  const addValue = (optionIndex: number) => {
    const input = valueInputs[optionIndex]?.trim();
    if (!input) return;

    const currentValues = options[optionIndex].values;
    if (currentValues.includes(input)) {
      // Already exists, skip
      setValueInputs({ ...valueInputs, [optionIndex]: "" });
      return;
    }

    updateOption(optionIndex, "values", [...currentValues, input]);
    setValueInputs({ ...valueInputs, [optionIndex]: "" });
  };

  const removeValue = (optionIndex: number, valueIndex: number) => {
    const newValues = options[optionIndex].values.filter((_, i) => i !== valueIndex);
    updateOption(optionIndex, "values", newValues);
  };

  return (
    <FormSectionCard title={t.variants} icon={<Package size={20} />}>
      <Stack gap="md">
        <Group justify="space-between">
          <Button
            variant="light"
            color="teal"
            size="sm"
            leftSection={<Plus size={16} />}
            onClick={addOption}
          >
            {t.addVariant}
          </Button>
          {combinationsCount > 0 && (
            <Text size="sm" c="dimmed">
              {combinationsCount} combination{combinationsCount > 1 ? "s" : ""} will be generated
            </Text>
          )}
        </Group>

        {options.map((option, index) => (
          <Card
            key={index}
            withBorder
            radius="sm"
            p="md"
            style={{
              background: isDark ? "oklch(0.22 0.02 260)" : undefined,
              borderColor: isDark ? "oklch(0.3 0.02 260 / 0.3)" : undefined,
            }}
          >
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" fw={500} c="dimmed">
                  Variant {index + 1}
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

              {/* Variant Type Selector (like Sellzy design) */}
              <Group grow>
                <Select
                  label="Select Variant"
                  placeholder="Choose variant type"
                  data={variantTypeOptions}
                  value={option.name || null}
                  onChange={(val) => updateOption(index, "name", val || "")}
                  searchable
                  styles={inputStyles}
                />
                <TextInput
                  label="Bangla Name (Optional)"
                  placeholder="ভ্যারিয়েন্ট নাম"
                  value={option.nameBn}
                  onChange={(e) => updateOption(index, "nameBn", e.currentTarget.value)}
                  styles={inputStyles}
                />
              </Group>

              {/* Value Input - Add values with badges (like tags) */}
              <div>
                <Text size="sm" fw={500} mb={4}>
                  Values
                </Text>
                <Group gap="xs" mb="xs">
                  <TextInput
                    placeholder="Type value and press Enter (e.g., L, M, S)"
                    value={valueInputs[index] || ""}
                    onChange={(e) =>
                      setValueInputs({ ...valueInputs, [index]: e.currentTarget.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addValue(index);
                      }
                    }}
                    styles={inputStyles}
                    style={{ flex: 1 }}
                  />
                  <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    onClick={() => addValue(index)}
                  >
                    Add
                  </Button>
                </Group>

                {/* Display added values as badges with × remove (like Sellzy) */}
                {option.values.length > 0 && (
                  <Group gap="xs">
                    {option.values.map((val, valIndex) => (
                      <Badge
                        key={valIndex}
                        size="lg"
                        variant="light"
                        color="teal"
                        pr={3}
                        rightSection={
                          <CloseButton
                            size="xs"
                            onClick={() => removeValue(index, valIndex)}
                            style={{ marginLeft: 4 }}
                          />
                        }
                      >
                        {val}
                      </Badge>
                    ))}
                  </Group>
                )}
              </div>

              {/* Optional Bangla Values */}
              {option.values.length > 0 && (
                <TextInput
                  label="Bangla Values (Optional, comma separated)"
                  placeholder="এল, এম, এস"
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
                  styles={inputStyles}
                />
              )}
            </Stack>
          </Card>
        ))}

        {options.length > 0 && (
          <Button
            variant="filled"
            color="teal"
            size="sm"
            onClick={generateSkus}
          >
            {t.generateSkus}
          </Button>
        )}
      </Stack>
    </FormSectionCard>
  );
}
