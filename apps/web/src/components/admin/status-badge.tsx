import { Badge } from "@mantine/core";

interface StatusBadgeProps {
  status: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const statusStyles: Record<string, { background: string; color: string }> = {
  // Vendor/Product status
  pending: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 80) 0%, oklch(0.92 0.04 70) 100%)",
    color: "oklch(0.5 0.12 70)",
  },
  approved: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 145) 0%, oklch(0.92 0.04 140) 100%)",
    color: "oklch(0.5 0.15 145)",
  },
  rejected: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 10) 0%, oklch(0.92 0.04 5) 100%)",
    color: "oklch(0.55 0.15 10)",
  },
  // Order status
  confirmed: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 240) 0%, oklch(0.92 0.04 230) 100%)",
    color: "oklch(0.5 0.15 240)",
  },
  processing: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 270) 0%, oklch(0.92 0.04 260) 100%)",
    color: "oklch(0.5 0.15 270)",
  },
  shipped: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 200) 0%, oklch(0.92 0.04 190) 100%)",
    color: "oklch(0.5 0.15 195)",
  },
  delivered: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 145) 0%, oklch(0.92 0.04 140) 100%)",
    color: "oklch(0.5 0.15 145)",
  },
  paid_to_admin: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 175) 0%, oklch(0.92 0.04 165) 100%)",
    color: "oklch(0.52 0.14 175)",
  },
  completed: {
    background: "linear-gradient(135deg, oklch(0.88 0.04 130) 0%, oklch(0.9 0.03 120) 100%)",
    color: "oklch(0.45 0.13 130)",
  },
  returned: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 25) 0%, oklch(0.92 0.04 20) 100%)",
    color: "oklch(0.5 0.15 25)",
  },
  cancelled: {
    background: "linear-gradient(135deg, oklch(0.9 0.05 10) 0%, oklch(0.92 0.04 5) 100%)",
    color: "oklch(0.55 0.15 10)",
  },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.pending;

  return (
    <Badge
      size={size}
      radius="md"
      style={{
        background: style.background,
        color: style.color,
        fontWeight: 600,
      }}
    >
      {status}
    </Badge>
  );
}
