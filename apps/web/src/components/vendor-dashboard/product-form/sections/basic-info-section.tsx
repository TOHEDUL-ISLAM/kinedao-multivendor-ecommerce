import { SimpleGrid, TextInput, Select, Textarea } from "@mantine/core";
import { Info } from "lucide-react";
import { FormSectionCard } from "../form-section-card";
import { vendorColors } from "@/lib/vendor-theme";
import type { FormState } from "../form-types";

interface BasicInfoSectionProps {
  form: FormState;
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  categoryOptions: { value: string; label: string }[];
  isDark: boolean;
  t: {
    basicInfo: string;
    titleEn: string;
    titleBn: string;
    category: string;
    selectCategory: string;
    brand: string;
    shortDescEn: string;
    shortDescBn: string;
  };
}

export function BasicInfoSection({
  form,
  updateField,
  categoryOptions,
  isDark,
  t,
}: BasicInfoSectionProps) {
  const inputStyles = {
    input: {
      background: vendorColors.input(isDark).background,
      border: vendorColors.input(isDark).border,
      color: vendorColors.input(isDark).color,
    },
  };

  return (
    <FormSectionCard title={t.basicInfo} icon={<Info size={20} />}>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label={t.titleEn}
          value={form.title}
          onChange={(e) => updateField("title", e.currentTarget.value)}
          required
          styles={inputStyles}
        />
        <TextInput
          label={t.titleBn}
          value={form.titleBn}
          onChange={(e) => updateField("titleBn", e.currentTarget.value)}
          styles={inputStyles}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Select
          label={t.category}
          placeholder={t.selectCategory}
          data={categoryOptions}
          value={form.categoryId}
          onChange={(val) => updateField("categoryId", val || "")}
          searchable
          required
          styles={inputStyles}
        />
        <TextInput
          label={t.brand}
          value={form.brand}
          onChange={(e) => updateField("brand", e.currentTarget.value)}
          styles={inputStyles}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Textarea
          label={t.shortDescEn}
          value={form.shortDescription}
          onChange={(e) => updateField("shortDescription", e.currentTarget.value)}
          rows={3}
          styles={inputStyles}
        />
        <Textarea
          label={t.shortDescBn}
          value={form.shortDescriptionBn}
          onChange={(e) => updateField("shortDescriptionBn", e.currentTarget.value)}
          rows={3}
          styles={inputStyles}
        />
      </SimpleGrid>
    </FormSectionCard>
  );
}
