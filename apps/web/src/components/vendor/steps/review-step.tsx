import { useLanguage } from "@/lib/i18n/use-language";
import { Button } from "@/components/ui/button";
import { useVendorApplicationStore } from "@/stores/vendor-application-store";
import type { BusinessType } from "@kineDao.com/api-types/vendor";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useState } from "react";
import {
  Building2,
  MapPin,
  FileText,
  CreditCard,
  Check,
  AlertCircle,
  Edit,
  Loader2,
} from "lucide-react";
import type { Language } from "@/lib/i18n/translations";

interface ReviewStepProps {
  onBack: () => void;
  onSubmitSuccess: () => void;
  onEditStep: (step: 1 | 2 | 3 | 4) => void;
}

const BUSINESS_TYPE_LABELS: Record<Language, Record<BusinessType, string>> = {
  en: {
    sole_proprietor: "Sole Proprietorship",
    partnership: "Partnership",
    company: "Limited Company",
  },
  bn: {
    sole_proprietor: "একক মালিকানা",
    partnership: "অংশীদারিত্ব",
    company: "লিমিটেড কোম্পানি",
  },
};

interface ReviewLabels {
  title: string;
  subtitle: string;
  businessInfo: string;
  address: string;
  documents: string;
  payment: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  businessType: string;
  addressLabel: string;
  district: string;
  city: string;
  postalCode: string;
  nidNumber: string;
  nidImages: string;
  tradeLicense: string;
  shopLogo: string;
  bankAccount: string;
  bkash: string;
  nagad: string;
  notProvided: string;
  uploaded: string;
  edit: string;
  back: string;
  submit: string;
  submitting: string;
  agreement: string;
  submitError: string;
}

export function ReviewStep({ onBack, onSubmitSuccess, onEditStep }: ReviewStepProps) {
  const { language } = useLanguage();
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

  const t: Record<Language, ReviewLabels> = {
    en: {
      title: "Review Your Application",
      subtitle: "Please review all information before submitting",
      businessInfo: "Business Information",
      address: "Business Address",
      documents: "Documents",
      payment: "Payment Information",
      shopName: "Shop Name",
      ownerName: "Owner Name",
      phone: "Phone",
      email: "Email",
      businessType: "Business Type",
      addressLabel: "Address",
      district: "District",
      city: "City",
      postalCode: "Postal Code",
      nidNumber: "NID Number",
      nidImages: "NID Images",
      tradeLicense: "Trade License",
      shopLogo: "Shop Logo",
      bankAccount: "Bank Account",
      bkash: "bKash",
      nagad: "Nagad",
      notProvided: "Not provided",
      uploaded: "Uploaded",
      edit: "Edit",
      back: "Back",
      submit: "Submit Application",
      submitting: "Submitting...",
      agreement: "By submitting, I confirm that all information provided is accurate and I agree to the vendor terms and conditions.",
      submitError: "Failed to submit application. Please try again.",
    },
    bn: {
      title: "আপনার আবেদন পর্যালোচনা করুন",
      subtitle: "জমা দেওয়ার আগে সমস্ত তথ্য পর্যালোচনা করুন",
      businessInfo: "ব্যবসার তথ্য",
      address: "ব্যবসার ঠিকানা",
      documents: "ডকুমেন্ট",
      payment: "পেমেন্ট তথ্য",
      shopName: "দোকানের নাম",
      ownerName: "মালিকের নাম",
      phone: "ফোন",
      email: "ইমেল",
      businessType: "ব্যবসার ধরন",
      addressLabel: "ঠিকানা",
      district: "জেলা",
      city: "শহর",
      postalCode: "পোস্টাল কোড",
      nidNumber: "NID নম্বর",
      nidImages: "NID ছবি",
      tradeLicense: "ট্রেড লাইসেন্স",
      shopLogo: "দোকানের লোগো",
      bankAccount: "ব্যাংক অ্যাকাউন্ট",
      bkash: "বিকাশ",
      nagad: "নগদ",
      notProvided: "প্রদান করা হয়নি",
      uploaded: "আপলোড করা হয়েছে",
      edit: "সম্পাদনা",
      back: "পিছনে",
      submit: "আবেদন জমা দিন",
      submitting: "জমা দেওয়া হচ্ছে...",
      agreement: "জমা দেওয়ার মাধ্যমে, আমি নিশ্চিত করছি যে প্রদত্ত সমস্ত তথ্য সঠিক এবং আমি বিক্রেতার শর্তাবলীতে সম্মত।",
      submitError: "আবেদন জমা দিতে ব্যর্থ। আবার চেষ্টা করুন।",
    },
  };

  const labels = t[language];

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
      toast.success(
        language === "en"
          ? "Application submitted successfully!"
          : "আবেদন সফলভাবে জমা হয়েছে!"
      );
      reset();
      onSubmitSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.submitError);
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
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between bg-muted/50 px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <h3 className="font-medium">{title}</h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEditStep(step)}
          className="h-8 gap-1"
        >
          <Edit className="w-3 h-3" />
          {labels.edit}
        </Button>
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  );

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-1">
      <span className="text-sm text-muted-foreground min-w-[140px]">{label}:</span>
      <span className="text-sm font-medium">{value || labels.notProvided}</span>
    </div>
  );

  const FileField = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-1">
      <span className="text-sm text-muted-foreground min-w-[140px]">{label}:</span>
      {value ? (
        <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
          <Check className="w-4 h-4" />
          {labels.uploaded}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">{labels.notProvided}</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{labels.title}</h2>
        <p className="text-muted-foreground text-sm">{labels.subtitle}</p>
      </div>

      <div className="space-y-4">
        {/* Business Info */}
        <Section icon={Building2} title={labels.businessInfo} step={1}>
          <Field label={labels.shopName} value={businessInfo.shopNameEn} />
          {businessInfo.shopNameBn && (
            <Field label={`${labels.shopName} (বাংলা)`} value={businessInfo.shopNameBn} />
          )}
          <Field label={labels.ownerName} value={businessInfo.ownerName} />
          <Field label={labels.phone} value={businessInfo.phone} />
          <Field label={labels.email} value={businessInfo.email} />
          <Field
            label={labels.businessType}
            value={
              businessInfo.businessType
                ? BUSINESS_TYPE_LABELS[language][businessInfo.businessType]
                : undefined
            }
          />
        </Section>

        {/* Address */}
        <Section icon={MapPin} title={labels.address} step={2}>
          <Field label={labels.addressLabel} value={address.addressLine1} />
          {address.addressLine2 && <Field label="" value={address.addressLine2} />}
          <Field label={labels.district} value={address.district} />
          <Field label={labels.city} value={address.city} />
          <Field label={labels.postalCode} value={address.postalCode} />
        </Section>

        {/* Documents */}
        <Section icon={FileText} title={labels.documents} step={3}>
          <Field label={labels.nidNumber} value={documents.nidNumber} />
          <FileField label={labels.nidImages} value={documents.nidFrontUrl && documents.nidBackUrl ? "yes" : null} />
          <FileField label={labels.tradeLicense} value={documents.tradeLicenseUrl} />
          <FileField label={labels.shopLogo} value={documents.shopLogoUrl} />
        </Section>

        {/* Payment */}
        <Section icon={CreditCard} title={labels.payment} step={4}>
          {payment.bankName && (
            <Field
              label={labels.bankAccount}
              value={`${payment.bankName} - ${payment.bankAccountNumber}`}
            />
          )}
          <Field label={labels.bkash} value={payment.bkashNumber} />
          <Field label={labels.nagad} value={payment.nagadNumber} />
        </Section>
      </div>

      {/* Agreement */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">{labels.agreement}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          {labels.back}
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {labels.submitting}
            </>
          ) : (
            labels.submit
          )}
        </Button>
      </div>
    </div>
  );
}
