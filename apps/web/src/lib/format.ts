import type { Language } from "@/lib/i18n/translations";

/**
 * Format price amount (stored in paisa/minor units) to display format
 * @param amount - Amount in minor units (paisa)
 * @param currency - Currency code (default: BDT)
 * @param language - Display language for number formatting
 */
export function formatPrice(
  amount: number,
  currency: string = "BDT",
  language: Language = "en"
): string {
  const majorUnits = amount / 100;

  if (currency === "BDT") {
    // Bengali Taka formatting
    const formatted = new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-BD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(majorUnits);

    return `৳${formatted}`;
  }

  // Generic currency formatting
  return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(majorUnits);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercent(
  originalAmount: number,
  saleAmount: number
): number {
  if (originalAmount <= 0 || saleAmount >= originalAmount) return 0;
  return Math.round(((originalAmount - saleAmount) / originalAmount) * 100);
}

/**
 * Format rating to display with single decimal
 */
export function formatRating(rating: number | null): string {
  if (rating === null || rating === undefined) return "0.0";
  return rating.toFixed(1);
}

/**
 * Format number with locale
 */
export function formatNumber(num: number, language: Language = "en"): string {
  return new Intl.NumberFormat(language === "bn" ? "bn-BD" : "en-US").format(num);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
