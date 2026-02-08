import { Button } from "@/components/ui/button";
import { useVendorApplicationStore } from "@/stores/vendor-application-store";
import type { BusinessType } from "@kineDao.com/api-types/vendor";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useState } from "react";
import {
  MapPin,
  FileText,
  Check,
  AlertCircle,
  Edit,
  Loader2,
  Store,
  Wallet,
} from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface ReviewStepProps {
  onBack: () => void;
  onSubmitSuccess: () => void;
  onEditStep: (step: 1 | 2 | 3 | 4) => void;
}

export function ReviewStep({ onBack, onSubmitSuccess, onEditStep }: ReviewStepProps) {
  const { t } = useTranslation();
  const {
    businessInfo,
    address,
    documents,
    payment,
    isSubmitting,
    setIsSubmitting,
    reset,
  } = useVendorApplicationStore();
  const [error, setError] = useState<string | null>(null);

  const businessTypeLabels: Record<BusinessType, string> = {
    sole_proprietor: t("vendor.form.business.type.sole_proprietor"),
    partnership: t("vendor.form.business.type.partnership"),
    company: t("vendor.form.business.type.company"),
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.vendor.application.$post({
        json: {
          // Business Info
          shopNameEn: businessInfo.shopNameEn!,
          shopNameBn: businessInfo.shopNameBn || undefined,
          ownerName: businessInfo.ownerName!,
          phone: businessInfo.phone!,
          email: businessInfo.email!,
          businessType: businessInfo.businessType!,
          // Address
          addressLine1: address.addressLine1!,
          addressLine2: address.addressLine2 || undefined,
          district: address.district!,
          city: address.city!,
          postalCode: address.postalCode || undefined,
          // Documents
          nidNumber: documents.nidNumber!,
          nidFrontUrl: documents.nidFrontUrl!,
          nidBackUrl: documents.nidBackUrl!,
          tradeLicenseUrl: documents.tradeLicenseUrl || undefined,
          shopLogoUrl: documents.shopLogoUrl || undefined,
          // Payment
          bankName: payment.bankName || undefined,
          bankAccountNumber: payment.bankAccountNumber || undefined,
          bankAccountName: payment.bankAccountName || undefined,
          bkashNumber: payment.bkashNumber || undefined,
          nagadNumber: payment.nagadNumber || undefined,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as any)?.error || "Submission failed");
      }

      // Success - clear the store and redirect
      toast.success(t("vendor.form.submitSuccess"));
      reset();
      onSubmitSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("vendor.form.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const Section = ({
    icon: Icon,
    title,
    step,
    children,
  }: {
    icon: React.ElementType;
    title: string;
    step: 1 | 2 | 3 | 4;
    children: React.ReactNode;
  }) => (
    <div className="bg-cream-50 rounded-xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEditStep(step)}
          className="h-8 gap-1 text-primary hover:text-primary hover:bg-teal-50"
        >
          <Edit className="w-3 h-3" />
          {t("vendor.form.review.edit")}
        </Button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-1">
      {label ? (
        <span className="text-sm text-muted-foreground min-w-[140px]">{label}:</span>
      ) : (
        <span className="min-w-[140px]" />
      )}
      <span className="text-sm font-medium text-foreground">{value || t("vendor.form.review.notProvided")}</span>
    </div>
  );

  const FileField = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-1">
      <span className="text-sm text-muted-foreground min-w-[140px]">{label}:</span>
      {value ? (
        <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
          <Check className="w-4 h-4" />
          {t("vendor.form.review.uploaded")}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">{t("vendor.form.review.notProvided")}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6 step-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t("vendor.form.review.title")}
        </h2>
        <p className="text-muted-foreground">{t("vendor.form.review.subtitle")}</p>
      </div>

      <div className="space-y-4">
        {/* Business Info */}
        <Section icon={Store} title={t("vendor.form.review.businessInfo")} step={1}>
          <Field label={t("vendor.form.review.shopName")} value={businessInfo.shopNameEn} />
          {businessInfo.shopNameBn && (
            <Field
              label={`${t("vendor.form.review.shopName")} (${t("vendor.form.review.shopNameBnSuffix")})`}
              value={businessInfo.shopNameBn}
            />
          )}
          <Field label={t("vendor.form.review.ownerName")} value={businessInfo.ownerName} />
          <Field label={t("vendor.form.review.phone")} value={businessInfo.phone} />
          <Field label={t("vendor.form.review.email")} value={businessInfo.email} />
          <Field
            label={t("vendor.form.review.businessType")}
            value={
              businessInfo.businessType
                ? businessTypeLabels[businessInfo.businessType]
                : undefined
            }
          />
        </Section>

        {/* Address */}
        <Section icon={MapPin} title={t("vendor.form.review.address")} step={2}>
          <Field label={t("vendor.form.review.addressLabel")} value={address.addressLine1} />
          {address.addressLine2 && <Field label="" value={address.addressLine2} />}
          <Field label={t("vendor.form.review.district")} value={address.district} />
          <Field label={t("vendor.form.review.city")} value={address.city} />
          <Field label={t("vendor.form.review.postalCode")} value={address.postalCode} />
        </Section>

        {/* Documents */}
        <Section icon={FileText} title={t("vendor.form.review.documents")} step={3}>
          <Field label={t("vendor.form.review.nidNumber")} value={documents.nidNumber} />
          <FileField
            label={t("vendor.form.review.nidImages")}
            value={documents.nidFrontUrl && documents.nidBackUrl ? "yes" : null}
          />
          <FileField label={t("vendor.form.review.tradeLicense")} value={documents.tradeLicenseUrl} />
          <FileField label={t("vendor.form.review.shopLogo")} value={documents.shopLogoUrl} />
        </Section>

        {/* Payment */}
        <Section icon={Wallet} title={t("vendor.form.review.payment")} step={4}>
          {payment.bankName && (
            <Field
              label={t("vendor.form.review.bankAccount")}
              value={`${payment.bankName} - ${payment.bankAccountNumber}`}
            />
          )}
          <Field label={t("vendor.form.review.bkash")} value={payment.bkashNumber} />
          <Field label={t("vendor.form.review.nagad")} value={payment.nagadNumber} />
        </Section>
      </div>

      {/* Agreement */}
      <div className="p-5 bg-card rounded-xl border border-border shadow-soft">
        <p className="text-sm text-muted-foreground">{t("vendor.form.review.agreement")}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting} className="rounded-xl">
          {t("vendor.form.back")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="ml-auto gap-2 gradient-primary hover:opacity-90 rounded-xl px-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("vendor.form.submitting")}
            </>
          ) : (
            t("vendor.form.submit")
          )}
        </Button>
      </div>
    </div>
  );
}
