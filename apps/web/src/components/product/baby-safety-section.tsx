"use client";

import { Baby, Shield, Leaf, Sparkles, AlertTriangle, Weight, Calendar, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface BabySafetySectionProps {
  ageRange: string | null;
  isBpaFree: boolean;
  isOrganic: boolean;
  isHypoallergenic: boolean;
  hasSmallParts: boolean;
  safetyWarningEn: string | null;
  safetyWarningBn: string | null;
  weightLimitKg: number | null;
  expiryDate: string | null;
  safetyCertifications: string[];
  className?: string;
}

export function BabySafetySection({
  ageRange,
  isBpaFree,
  isOrganic,
  isHypoallergenic,
  hasSmallParts,
  safetyWarningEn,
  safetyWarningBn,
  weightLimitKg,
  expiryDate,
  safetyCertifications,
  className,
}: BabySafetySectionProps) {
  const { t, language } = useTranslation();

  // Calculate months until expiry
  const getExpiryWarning = () => {
    if (!expiryDate) return null;

    const datePart = expiryDate.slice(0, 10);
    let expiry: Date;

    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      const [year, month, day] = datePart.split("-").map(Number);
      expiry = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      const parsed = new Date(expiryDate);
      if (Number.isNaN(parsed.getTime())) return null;
      expiry = new Date(parsed);
      expiry.setHours(23, 59, 59, 999);
    }

    const now = new Date();
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / msPerDay);

    if (daysUntilExpiry <= 0) return { text: t("product.expired"), isExpired: true };
    if (daysUntilExpiry <= 90) {
      const monthsUntilExpiry = Math.max(1, Math.ceil(daysUntilExpiry / 30));
      return {
        text: `${t("product.expiresIn")} ${monthsUntilExpiry} ${t("product.months")}`,
        isExpired: false,
      };
    }

    return null;
  };

  const expiryWarning = getExpiryWarning();
  const safetyWarning = language === "bn" && safetyWarningBn ? safetyWarningBn : safetyWarningEn;

  // Check if there's any safety info to show
  const hasSafetyInfo =
    ageRange ||
    isBpaFree ||
    isOrganic ||
    isHypoallergenic ||
    hasSmallParts ||
    safetyWarning ||
    weightLimitKg ||
    expiryWarning ||
    safetyCertifications.length > 0;

  if (!hasSafetyInfo) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Age Range */}
      {ageRange && (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <Baby className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{t("product.suitableFor")}</p>
            <p className="text-sm text-muted-foreground">{ageRange}</p>
          </div>
        </div>
      )}

      {/* Safety Badges */}
      {(isBpaFree || isOrganic || isHypoallergenic) && (
        <div>
          <p className="text-sm font-medium mb-2">{t("product.safetyFeatures")}</p>
          <div className="flex flex-wrap gap-2">
            {isBpaFree && (
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <Shield className="h-3.5 w-3.5 text-success" />
                {t("product.bpaFree")}
              </Badge>
            )}
            {isOrganic && (
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <Leaf className="h-3.5 w-3.5 text-success" />
                {t("product.organic")}
              </Badge>
            )}
            {isHypoallergenic && (
              <Badge variant="secondary" className="gap-1.5 py-1.5 px-3">
                <Sparkles className="h-3.5 w-3.5 text-success" />
                {t("product.hypoallergenic")}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {(hasSmallParts || safetyWarning) && (
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("product.warnings")}</p>
          {hasSmallParts && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{t("product.chokingHazard")}</p>
            </div>
          )}
          {safetyWarning && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <p className="text-sm">{safetyWarning}</p>
            </div>
          )}
        </div>
      )}

      {/* Weight Limit */}
      {weightLimitKg && (
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
            <Weight className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">{t("product.weightLimit")}</p>
            <p className="text-sm text-muted-foreground">{weightLimitKg} kg</p>
          </div>
        </div>
      )}

      {/* Expiry Warning */}
      {expiryWarning && (
        <div
          className={cn(
            "flex items-start gap-2 p-3 rounded-lg border",
            expiryWarning.isExpired
              ? "bg-destructive/10 border-destructive/20"
              : "bg-warning/10 border-warning/20"
          )}
        >
          <Calendar
            className={cn(
              "h-4 w-4 mt-0.5 flex-shrink-0",
              expiryWarning.isExpired ? "text-destructive" : "text-warning"
            )}
          />
          <p
            className={cn(
              "text-sm",
              expiryWarning.isExpired ? "text-destructive" : "text-warning-foreground"
            )}
          >
            {expiryWarning.text}
          </p>
        </div>
      )}

      {/* Certifications */}
      {safetyCertifications.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">{t("product.certifications")}</p>
          <div className="flex flex-wrap gap-2">
            {safetyCertifications.map((cert) => (
              <Badge key={cert} variant="outline" className="gap-1.5">
                <Award className="h-3 w-3" />
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
