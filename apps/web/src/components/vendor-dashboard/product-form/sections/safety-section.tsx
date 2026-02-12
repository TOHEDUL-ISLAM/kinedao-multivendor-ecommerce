import { SimpleGrid, MultiSelect, Textarea } from "@mantine/core";
import { Shield } from "lucide-react";
import { FormSectionCard } from "../form-section-card";
import { vendorColors } from "@/lib/vendor-theme";
import type { FormState } from "../form-types";
import { safetyCertOptions } from "../form-types";

interface SafetySectionProps {
  form: FormState;
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  isDark: boolean;
  t: {
    safety: string;
    certifications: string;
    safetyWarningEn: string;
    safetyWarningBn: string;
  };
}

export function SafetySection({
  form,
  updateField,
  isDark,
  t,
}: SafetySectionProps) {
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

  return (
    <FormSectionCard title={t.safety} icon={<Shield size={20} />}>
      <MultiSelect
        label={t.certifications}
        data={safetyCertOptions}
        value={form.safetyCertifications}
        onChange={(val) => updateField("safetyCertifications", val)}
        withScrollArea={false}
        maxDropdownHeight={240}
        searchable
        comboboxProps={{ zIndex: 410, withinPortal: true }}
        styles={inputStyles}
      />
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Textarea
          label={t.safetyWarningEn}
          value={form.safetyWarningEn}
          onChange={(e) => updateField("safetyWarningEn", e.currentTarget.value)}
          rows={3}
          styles={inputStyles}
        />
        <Textarea
          label={t.safetyWarningBn}
          value={form.safetyWarningBn}
          onChange={(e) => updateField("safetyWarningBn", e.currentTarget.value)}
          rows={3}
          styles={inputStyles}
        />
      </SimpleGrid>
    </FormSectionCard>
  );
}
