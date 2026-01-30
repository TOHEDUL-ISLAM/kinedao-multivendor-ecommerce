"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/use-translation";

export interface AgeRangeOption {
  value: string;
  label: string;
  labelBn: string;
  count: number;
}

interface AgeRangeFilterProps {
  options: AgeRangeOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function AgeRangeFilter({
  options,
  selected,
  onChange,
}: AgeRangeFilterProps) {
  const { language } = useTranslation();

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const displayLabel = language === "bn" ? option.labelBn : option.label;
        const isChecked = selected.includes(option.value);

        return (
          <label
            key={option.value}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <Checkbox
              checked={isChecked}
              onCheckedChange={() => handleToggle(option.value)}
            />
            <span className="text-sm group-hover:text-primary transition-colors">
              {displayLabel}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              ({option.count})
            </span>
          </label>
        );
      })}
    </div>
  );
}
