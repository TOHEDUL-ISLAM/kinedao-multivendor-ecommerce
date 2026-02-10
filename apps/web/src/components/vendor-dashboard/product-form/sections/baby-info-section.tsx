import { SimpleGrid, Select, Switch, NumberInput, TextInput } from "@mantine/core";
import { Baby } from "lucide-react";
import { FormSectionCard } from "../form-section-card";
import { vendorColors } from "@/lib/vendor-theme";
import type { FormState } from "../form-types";
import { ageRangeOptions } from "../form-types";

interface BabyInfoSectionProps {
  form: FormState;
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  isDark: boolean;
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
  };
}

export function BabyInfoSection({
  form,
  updateField,
  isDark,
  t,
}: BabyInfoSectionProps) {
  const inputStyles = {
    input: {
      background: vendorColors.input(isDark).background,
      border: vendorColors.input(isDark).border,
      color: vendorColors.input(isDark).color,
    },
  };

  return (
    <FormSectionCard title={t.babyInfo} icon={<Baby size={20} />}>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Select
          label={t.ageRangeMin}
          data={ageRangeOptions}
          value={form.ageRangeMin != null ? String(form.ageRangeMin) : null}
          onChange={(val) => updateField("ageRangeMin", val ? Number(val) : null)}
          clearable
          styles={inputStyles}
        />
        <Select
          label={t.ageRangeMax}
          data={ageRangeOptions}
          value={form.ageRangeMax != null ? String(form.ageRangeMax) : null}
          onChange={(val) => updateField("ageRangeMax", val ? Number(val) : null)}
          clearable
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
          label={t.weightLimit}
          value={form.weightLimitKg ?? undefined}
          onChange={(val) => updateField("weightLimitKg", val ? Number(val) : null)}
          min={0}
          suffix=" kg"
          styles={inputStyles}
        />
        <TextInput
          label={t.expiryDate}
          type="date"
          value={form.expiryDate}
          onChange={(e) => updateField("expiryDate", e.currentTarget.value)}
          styles={inputStyles}
        />
      </SimpleGrid>
    </FormSectionCard>
  );
}
