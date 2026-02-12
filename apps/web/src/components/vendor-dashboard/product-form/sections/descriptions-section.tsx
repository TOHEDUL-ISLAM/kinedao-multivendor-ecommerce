import { SimpleGrid, Textarea } from "@mantine/core";
import { FileText } from "lucide-react";
import { FormSectionCard } from "../form-section-card";
import { vendorColors } from "@/lib/vendor-theme";
import type { FormState } from "../form-types";

interface DescriptionsSectionProps {
  form: FormState;
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  isDark: boolean;
  t: {
    descriptions: string;
    descEn: string;
    descBn: string;
  };
}

export function DescriptionsSection({
  form,
  updateField,
  isDark,
  t,
}: DescriptionsSectionProps) {
  const inputStyles = {
    input: {
      background: vendorColors.input(isDark).background,
      border: vendorColors.input(isDark).border,
      color: vendorColors.input(isDark).color,
    },
  };

  return (
    <FormSectionCard title={t.descriptions} icon={<FileText size={20} />}>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Textarea
          label={t.descEn}
          value={form.description}
          onChange={(e) => updateField("description", e.currentTarget.value)}
          rows={6}
          styles={inputStyles}
        />
        <Textarea
          label={t.descBn}
          value={form.descriptionBn}
          onChange={(e) => updateField("descriptionBn", e.currentTarget.value)}
          rows={6}
          styles={inputStyles}
        />
      </SimpleGrid>
    </FormSectionCard>
  );
}
