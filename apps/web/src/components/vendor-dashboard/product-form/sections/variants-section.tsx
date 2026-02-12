import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  MultiSelect,
  Stack,
  Text,
} from "@mantine/core";
import { Package } from "lucide-react";
import { FormSectionCard } from "../form-section-card";
import { vendorColors } from "@/lib/vendor-theme";
import type { FormErrorMap, FormOption } from "../form-types";

type PredefinedVariantType = "Size" | "Color" | "Age";

const PREDEFINED_VARIANT_TYPES: PredefinedVariantType[] = [
  "Size",
  "Color",
  "Age",
];

const PREDEFINED_VARIANT_VALUES: Record<PredefinedVariantType, string[]> = {
  Size: ["NB", "0-3M", "3-6M", "6-12M", "12-18M", "18-24M", "2Y", "3Y", "S", "M", "L"],
  Color: [
    "Red",
    "Blue",
    "Pink",
    "White",
    "Black",
    "Green",
    "Yellow",
    "Gray",
    "Beige",
  ],
  Age: ["0m", "3m", "6m", "9m", "12m", "18m", "24m", "36m"],
};

function isPredefinedVariantType(name: string): name is PredefinedVariantType {
  return PREDEFINED_VARIANT_TYPES.includes(name as PredefinedVariantType);
}

function createDefaultOption(type: PredefinedVariantType): FormOption {
  return {
    name: type,
    nameBn: "",
    values: [],
    valuesBn: [],
  };
}

interface VariantsSectionProps {
  options: FormOption[];
  skusCount: number;
  setOptions: (options: FormOption[]) => void;
  generateSkus: () => void;
  isDark: boolean;
  errors?: FormErrorMap;
  t: {
    variants: string;
    generateSkus: string;
    requiredForSubmit: string;
    variantPresetOnly: string;
    selectVariantValues: string;
    noVariantTypeSelected: string;
    legacyVariantWarning: string;
  };
}

export function VariantsSection({
  options,
  skusCount,
  setOptions,
  generateSkus,
  isDark,
  errors,
  t,
}: VariantsSectionProps) {
  const inputStyles = {
    input: {
      background: vendorColors.input(isDark).background,
      border: vendorColors.input(isDark).border,
      color: vendorColors.input(isDark).color,
    },
    dropdown: {
      maxHeight: 240,
      overflowY: "auto" as const,
    },
  };

  const knownOptionsMap = new Map<PredefinedVariantType, FormOption>();
  const unknownOptions: FormOption[] = [];
  const optionIndexByType = new Map<PredefinedVariantType, number>();

  options.forEach((option, index) => {
    if (isPredefinedVariantType(option.name)) {
      const variantType = option.name;
      knownOptionsMap.set(variantType, {
        ...option,
        values: option.values.filter((value) =>
          PREDEFINED_VARIANT_VALUES[variantType].includes(value)
        ),
      });
      optionIndexByType.set(variantType, index);
      return;
    }

    unknownOptions.push(option);
  });

  const selectedTypes = PREDEFINED_VARIANT_TYPES.filter((type) =>
    knownOptionsMap.has(type)
  );

  const canGenerateSkus =
    selectedTypes.length > 0 &&
    selectedTypes.every((type) => (knownOptionsMap.get(type)?.values.length ?? 0) > 0);

  const updateKnownOptions = (nextKnown: FormOption[]) => {
    setOptions([...nextKnown, ...unknownOptions]);
  };

  const handleTypeToggle = (type: PredefinedVariantType, checked: boolean) => {
    const nextSelected = checked
      ? PREDEFINED_VARIANT_TYPES.filter(
          (candidate) => candidate === type || selectedTypes.includes(candidate)
        )
      : PREDEFINED_VARIANT_TYPES.filter(
          (candidate) => candidate !== type && selectedTypes.includes(candidate)
        );

    const nextKnown = nextSelected.map((candidate) => {
      const existing = knownOptionsMap.get(candidate);
      if (!existing) {
        return createDefaultOption(candidate);
      }

      return {
        ...existing,
        name: candidate,
        values: existing.values.filter((value) =>
          PREDEFINED_VARIANT_VALUES[candidate].includes(value)
        ),
      };
    });

    updateKnownOptions(nextKnown);
  };

  const handleValuesChange = (
    type: PredefinedVariantType,
    nextValues: string[]
  ) => {
    const allowed = new Set(PREDEFINED_VARIANT_VALUES[type]);
    const sanitizedValues = nextValues.filter((value) => allowed.has(value));

    const nextKnown = PREDEFINED_VARIANT_TYPES.filter((candidate) =>
      selectedTypes.includes(candidate)
    ).map((candidate) => {
      if (candidate === type) {
        const existing = knownOptionsMap.get(candidate);
        return {
          ...(existing ?? createDefaultOption(candidate)),
          name: candidate,
          values: sanitizedValues,
        };
      }

      return knownOptionsMap.get(candidate) ?? createDefaultOption(candidate);
    });

    updateKnownOptions(nextKnown);
  };

  return (
    <FormSectionCard title={t.variants} icon={<Package size={20} />}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t.variantPresetOnly}
        </Text>
        <Text size="sm" c="dimmed">
          {t.requiredForSubmit}
        </Text>

        <Group justify="space-between" wrap="wrap">
          <Group gap="md" wrap="wrap">
            {PREDEFINED_VARIANT_TYPES.map((type) => (
              <Checkbox
                key={type}
                label={type}
                checked={selectedTypes.includes(type)}
                onChange={(event) =>
                  handleTypeToggle(type, event.currentTarget.checked)
                }
                color="teal"
              />
            ))}
          </Group>
          <Text size="sm" c="dimmed">
            {skusCount} SKU row{skusCount > 1 ? "s" : ""}
          </Text>
        </Group>

        {selectedTypes.length === 0 ? (
          <Text size="sm" c="dimmed">
            {t.noVariantTypeSelected}
          </Text>
        ) : (
          selectedTypes.map((type) => {
            const option = knownOptionsMap.get(type) ?? createDefaultOption(type);
            const optionIndex = optionIndexByType.get(type);
            const valuesError =
              optionIndex == null ? undefined : errors?.[`options.${optionIndex}.values`];

            return (
              <Card
                key={type}
                withBorder
                radius="sm"
                p="md"
                style={{
                  background: isDark ? "oklch(0.22 0.02 260)" : undefined,
                  borderColor: isDark ? "oklch(0.3 0.02 260 / 0.3)" : undefined,
                }}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Text size="sm" fw={600}>
                      {type}
                    </Text>
                    <Badge size="sm" variant="light" color="teal">
                      Predefined
                    </Badge>
                  </Group>
                  <MultiSelect
                    label={t.selectVariantValues}
                    placeholder={t.selectVariantValues}
                    data={PREDEFINED_VARIANT_VALUES[type]}
                    value={option.values}
                    onChange={(values) => handleValuesChange(type, values)}
                    searchable
                    clearable
                    hidePickedOptions
                    withScrollArea={false}
                    maxDropdownHeight={240}
                    nothingFoundMessage="No value found"
                    comboboxProps={{ zIndex: 410, withinPortal: true }}
                    styles={inputStyles}
                    data-field-key={
                      optionIndex == null ? `variant.${type}` : `options.${optionIndex}.values`
                    }
                    wrapperProps={{
                      "data-field-key":
                        optionIndex == null ? `variant.${type}` : `options.${optionIndex}.values`,
                      "data-lenis-prevent": true,
                    }}
                    error={valuesError}
                  />
                </Stack>
              </Card>
            );
          })
        )}

        {unknownOptions.length > 0 && (
          <Alert color="yellow" variant="light" title="Legacy variant data">
            <Stack gap={6}>
              <Text size="sm">{t.legacyVariantWarning}</Text>
              <Group gap="xs">
                {unknownOptions.map((option, index) => (
                  <Badge key={`${option.name}-${index}`} size="sm" variant="outline">
                    {option.name}
                  </Badge>
                ))}
              </Group>
            </Stack>
          </Alert>
        )}

        <Button
          variant="filled"
          color="teal"
          size="sm"
          onClick={generateSkus}
          disabled={!canGenerateSkus}
        >
          {t.generateSkus}
        </Button>
      </Stack>
    </FormSectionCard>
  );
}
