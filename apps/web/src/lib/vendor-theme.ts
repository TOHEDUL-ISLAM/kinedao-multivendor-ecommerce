import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Shared hook for vendor dashboard dark mode support.
 * Handles the mounted state to avoid hydration mismatch.
 */
export function useVendorTheme() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted ? resolvedTheme === "dark" : false;
  return { isDark, mounted };
}

/** Reusable OKLCH color tokens for vendor dashboard components */
export const vendorColors = {
  card: (isDark: boolean) => ({
    background: isDark
      ? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
      : "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.98 0.01 160) 100%)",
    border: isDark
      ? "1px solid oklch(0.3 0.02 260 / 0.3)"
      : "1px solid oklch(0.92 0.01 260 / 0.2)",
    boxShadow: isDark
      ? "0 4px 20px oklch(0 0 0 / 0.3)"
      : "0 4px 20px oklch(0.65 0.15 175 / 0.08)",
  }),
  input: (isDark: boolean) => ({
    background: isDark ? "oklch(0.2 0.02 260)" : undefined,
    border: isDark ? "1px solid oklch(0.3 0.02 260 / 0.4)" : undefined,
    color: isDark ? "oklch(0.9 0.02 260)" : undefined,
  }),
  text: {
    primary: (isDark: boolean) =>
      isDark ? "oklch(0.9 0.02 260)" : "oklch(0.2 0.02 260)",
    secondary: (isDark: boolean) =>
      isDark ? "oklch(0.65 0.02 260)" : "oklch(0.5 0.02 260)",
    muted: (isDark: boolean) =>
      isDark ? "oklch(0.55 0.02 260)" : "oklch(0.6 0.02 260)",
  },
  table: {
    header: (isDark: boolean) => ({
      background: isDark
        ? "linear-gradient(135deg, oklch(0.25 0.02 260) 0%, oklch(0.23 0.02 250) 100%)"
        : "linear-gradient(135deg, oklch(0.97 0.02 175) 0%, oklch(0.98 0.01 165) 100%)",
      color: isDark ? "oklch(0.8 0.02 260)" : "oklch(0.4 0.02 260)",
    }),
    row: (isDark: boolean) => ({
      borderBottom: isDark
        ? "1px solid oklch(0.3 0.02 260 / 0.2)"
        : "1px solid oklch(0.92 0.01 260 / 0.3)",
    }),
    rowHover: (isDark: boolean) => ({
      background: isDark ? "oklch(0.25 0.02 260)" : "oklch(0.97 0.01 175)",
    }),
  },
  /** Status badge styles (matching dashboard.tsx pattern) */
  statusBadge: (status: string, isDark: boolean) => {
    const map: Record<string, { bg: string; color: string }> = {
      pending: {
        bg: isDark
          ? "linear-gradient(135deg, oklch(0.3 0.05 80) 0%, oklch(0.28 0.04 70) 100%)"
          : "linear-gradient(135deg, oklch(0.9 0.05 80) 0%, oklch(0.92 0.04 70) 100%)",
        color: isDark ? "oklch(0.8 0.12 70)" : "oklch(0.5 0.12 70)",
      },
      confirmed: {
        bg: isDark
          ? "linear-gradient(135deg, oklch(0.3 0.05 240) 0%, oklch(0.28 0.04 230) 100%)"
          : "linear-gradient(135deg, oklch(0.9 0.05 240) 0%, oklch(0.92 0.04 230) 100%)",
        color: isDark ? "oklch(0.8 0.15 240)" : "oklch(0.5 0.15 240)",
      },
      processing: {
        bg: isDark
          ? "linear-gradient(135deg, oklch(0.3 0.05 270) 0%, oklch(0.28 0.04 260) 100%)"
          : "linear-gradient(135deg, oklch(0.9 0.05 270) 0%, oklch(0.92 0.04 260) 100%)",
        color: isDark ? "oklch(0.8 0.15 270)" : "oklch(0.5 0.15 270)",
      },
      shipped: {
        bg: isDark
          ? "linear-gradient(135deg, oklch(0.3 0.05 200) 0%, oklch(0.28 0.04 190) 100%)"
          : "linear-gradient(135deg, oklch(0.9 0.05 200) 0%, oklch(0.92 0.04 190) 100%)",
        color: isDark ? "oklch(0.8 0.15 195)" : "oklch(0.5 0.15 195)",
      },
      delivered: {
        bg: isDark
          ? "linear-gradient(135deg, oklch(0.3 0.05 145) 0%, oklch(0.28 0.04 140) 100%)"
          : "linear-gradient(135deg, oklch(0.9 0.05 145) 0%, oklch(0.92 0.04 140) 100%)",
        color: isDark ? "oklch(0.8 0.15 145)" : "oklch(0.5 0.15 145)",
      },
      cancelled: {
        bg: isDark
          ? "linear-gradient(135deg, oklch(0.3 0.05 10) 0%, oklch(0.28 0.04 5) 100%)"
          : "linear-gradient(135deg, oklch(0.9 0.05 10) 0%, oklch(0.92 0.04 5) 100%)",
        color: isDark ? "oklch(0.85 0.15 10)" : "oklch(0.55 0.15 10)",
      },
      approved: {
        bg: isDark
          ? "linear-gradient(135deg, oklch(0.3 0.05 145) 0%, oklch(0.28 0.04 140) 100%)"
          : "linear-gradient(135deg, oklch(0.9 0.05 145) 0%, oklch(0.92 0.04 140) 100%)",
        color: isDark ? "oklch(0.8 0.15 145)" : "oklch(0.5 0.15 145)",
      },
      rejected: {
        bg: isDark
          ? "linear-gradient(135deg, oklch(0.3 0.05 10) 0%, oklch(0.28 0.04 5) 100%)"
          : "linear-gradient(135deg, oklch(0.9 0.05 10) 0%, oklch(0.92 0.04 5) 100%)",
        color: isDark ? "oklch(0.85 0.15 10)" : "oklch(0.55 0.15 10)",
      },
      draft: {
        bg: isDark
          ? "linear-gradient(135deg, oklch(0.3 0.02 260) 0%, oklch(0.28 0.02 250) 100%)"
          : "linear-gradient(135deg, oklch(0.92 0.01 260) 0%, oklch(0.94 0.005 260) 100%)",
        color: isDark ? "oklch(0.7 0.02 260)" : "oklch(0.5 0.02 260)",
      },
    };
    const style = map[status] ?? map.draft;
    return {
      background: style.bg,
      color: style.color,
      border: "none",
      textTransform: "capitalize" as const,
    };
  },
};
