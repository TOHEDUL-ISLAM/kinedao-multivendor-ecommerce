import { Badge, Group, SimpleGrid, TextInput, Select, Text, Textarea } from "@mantine/core";
import { Info } from "lucide-react";
import { FormSectionCard } from "../form-section-card";
import { vendorColors } from "@/lib/vendor-theme";
import type {
  FormState,
  FormErrorMap,
  CategorySelectGroup,
} from "../form-types";

interface BasicInfoSectionProps {
  form: FormState;
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  categoryOptions: CategorySelectGroup[];
  isDark: boolean;
  errors?: FormErrorMap;
  t: {
    basicInfo: string;
    titleEn: string;
    titleBn: string;
    category: string;
    selectCategory: string;
    brand: string;
    shortDescEn: string;
    shortDescBn: string;
    requiredAlways: string;
    optionalField: string;
  };
}

export function BasicInfoSection({
  form,
  updateField,
  categoryOptions,
  isDark,
  errors,
  t,
}: BasicInfoSectionProps) {
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
    <FormSectionCard title={t.basicInfo} icon={<Info size={20} />}>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <TextInput
          label={buildFieldLabel(t.titleEn, t.requiredAlways, "teal")}
          value={form.title}
          onChange={(e) => updateField("title", e.currentTarget.value)}
          error={errors?.title}
          data-field-key="title"
          wrapperProps={{ "data-field-key": "title" }}
          styles={inputStyles}
        />
        <TextInput
          label={buildFieldLabel(t.titleBn, t.optionalField)}
          value={form.titleBn}
          onChange={(e) => updateField("titleBn", e.currentTarget.value)}
          styles={inputStyles}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Select
          label={buildFieldLabel(t.category, t.requiredAlways, "teal")}
          placeholder={t.selectCategory}
          data={categoryOptions}
          value={form.categoryId}
          onChange={(val) => updateField("categoryId", val || "")}
          searchable
          maxDropdownHeight={320}
          nothingFoundMessage="No category found"
          comboboxProps={{ zIndex: 400, withinPortal: false }}
          error={errors?.categoryId}
          data-field-key="categoryId"
          wrapperProps={{ "data-field-key": "categoryId", "data-lenis-prevent": true }}
          styles={{
            ...inputStyles,
            dropdown: {
              maxHeight: 320,
              overflowY: "auto",
            },
          }}
        />
        <TextInput
          label={buildFieldLabel(t.brand, t.optionalField)}
          value={form.brand}
          onChange={(e) => updateField("brand", e.currentTarget.value)}
          styles={inputStyles}
        />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Textarea
          label={buildFieldLabel(t.shortDescEn, t.optionalField)}
          value={form.shortDescription}
          onChange={(e) => updateField("shortDescription", e.currentTarget.value)}
          rows={3}
          styles={inputStyles}
        />
        <Textarea
          label={buildFieldLabel(t.shortDescBn, t.optionalField)}
          value={form.shortDescriptionBn}
          onChange={(e) => updateField("shortDescriptionBn", e.currentTarget.value)}
          rows={3}
          styles={inputStyles}
        />
      </SimpleGrid>
    </FormSectionCard>
  );
}
