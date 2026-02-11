import { Badge, Group, NumberInput, Select, SimpleGrid, Switch, Text, TextInput } from "@mantine/core";
import { Baby } from "lucide-react";
import { FormSectionCard } from "../form-section-card";
import { vendorColors } from "@/lib/vendor-theme";
import type { FormState, FormErrorMap } from "../form-types";
import { ageRangeOptions } from "../form-types";

interface BabyInfoSectionProps {
  form: FormState;
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  isDark: boolean;
  errors?: FormErrorMap;
  t: {
    babyInfo: string;
    ageRangeMin: string;
    ageRangeMax: string;
    bpaFree: string;
    organic: string;
    hypoallergenic: string;
    hasSmallParts: string;
    weightLimit: string;
    expiryDate: string;
    requiredForConsumables: string;
    optionalField: string;
  };
}

export function BabyInfoSection({
  form,
  updateField,
  isDark,
  errors,
  t,
}: BabyInfoSectionProps) {
  const inputStyles = {
    input: {
      background: vendorColors.input(isDark).background,
      border: vendorColors.input(isDark).border,
      color: vendorColors.input(isDark).color,
    },
  };

  const buildFieldLabel = (
    label: string,
    requirement: string,
    color: "teal" | "gray" | "yellow" = "gray"
  ) => (
    <Group gap={6}>
      <Text size="sm" fw={500}>
        {label}
      </Text>
      <Badge size="xs" variant="light" color={color}>
        {requirement}
      </Badge>
    </Group>
  );

  return (
    <FormSectionCard title={t.babyInfo} icon={<Baby size={20} />}>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Select
          label={buildFieldLabel(t.ageRangeMin, t.optionalField)}
          data={ageRangeOptions}
          value={form.ageRangeMin != null ? String(form.ageRangeMin) : null}
          onChange={(val) => updateField("ageRangeMin", val ? Number(val) : null)}
          clearable
          data-field-key="ageRangeMin"
          wrapperProps={{ "data-field-key": "ageRangeMin" }}
          styles={inputStyles}
        />
        <Select
          label={buildFieldLabel(t.ageRangeMax, t.optionalField)}
          data={ageRangeOptions}
          value={form.ageRangeMax != null ? String(form.ageRangeMax) : null}
          onChange={(val) => updateField("ageRangeMax", val ? Number(val) : null)}
          clearable
          error={errors?.ageRangeMax}
          data-field-key="ageRangeMax"
          wrapperProps={{ "data-field-key": "ageRangeMax" }}
          styles={inputStyles}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        <Switch
          label={t.bpaFree}
          checked={form.isBpaFree}
          onChange={(e) => updateField("isBpaFree", e.currentTarget.checked)}
          color="teal"
        />
        <Switch
          label={t.organic}
          checked={form.isOrganic}
          onChange={(e) => updateField("isOrganic", e.currentTarget.checked)}
          color="teal"
        />
        <Switch
          label={t.hypoallergenic}
          checked={form.isHypoallergenic}
          onChange={(e) => updateField("isHypoallergenic", e.currentTarget.checked)}
          color="teal"
        />
        <Switch
          label={t.hasSmallParts}
          checked={form.hasSmallParts}
          onChange={(e) => updateField("hasSmallParts", e.currentTarget.checked)}
          color="red"
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <NumberInput
          label={buildFieldLabel(t.weightLimit, t.optionalField)}
          value={form.weightLimitKg ?? undefined}
          onChange={(val) => updateField("weightLimitKg", val ? Number(val) : null)}
          min={0}
          suffix=" kg"
          styles={inputStyles}
        />
        <TextInput
          label={buildFieldLabel(t.expiryDate, t.requiredForConsumables, "yellow")}
          type="date"
          value={form.expiryDate}
          onChange={(e) => updateField("expiryDate", e.currentTarget.value)}
          error={errors?.expiryDate}
          data-field-key="expiryDate"
          wrapperProps={{ "data-field-key": "expiryDate" }}
          styles={inputStyles}
        />
      </SimpleGrid>
    </FormSectionCard>
  );
}
