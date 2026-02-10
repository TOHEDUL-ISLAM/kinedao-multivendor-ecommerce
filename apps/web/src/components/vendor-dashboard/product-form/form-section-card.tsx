import { Paper, Text, Group, Stack } from "@mantine/core";
import { useVendorTheme, vendorColors } from "@/lib/vendor-theme";
import type { ReactNode } from "react";

interface FormSectionCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function FormSectionCard({ title, icon, children }: FormSectionCardProps) {
  const { isDark } = useVendorTheme();
  const cardStyle = vendorColors.card(isDark);

  return (
    <Paper
      radius="lg"
      p="xl"
      style={{
        background: cardStyle.background,
        border: cardStyle.border,
        boxShadow: cardStyle.boxShadow,
      }}
    >
      <Stack gap="lg">
        {/* Section Header */}
        <Group gap="sm">
          {icon && (
            <div style={{ color: "oklch(0.65 0.15 175)" }}>
              {icon}
            </div>
          )}
          <Text
            size="lg"
            fw={600}
            style={{ color: "oklch(0.65 0.15 175)" }}
          >
            {title}
          </Text>
        </Group>

        {/* Section Content */}
        {children}
      </Stack>
    </Paper>
  );
}
