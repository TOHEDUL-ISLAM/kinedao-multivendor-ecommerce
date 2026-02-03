import { useForm } from "@tanstack/react-form";
import { useLanguage } from "@/lib/i18n/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { documentsSchema, type DocumentsInput } from "@kineDao.com/api-types/vendor";
import { useVendorApplicationStore } from "@/stores/vendor-application-store";
import { FileUpload } from "../file-upload";
import type { Language } from "@/lib/i18n/translations";

interface DocumentsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function DocumentsStep({ onNext, onBack }: DocumentsStepProps) {
  const { language } = useLanguage();
  const { documents, setDocuments, markStepCompleted } = useVendorApplicationStore();

  const form = useForm({
    defaultValues: {
      nidNumber: documents.nidNumber || "",
      nidFrontUrl: documents.nidFrontUrl || "",
      nidBackUrl: documents.nidBackUrl || "",
      tradeLicenseUrl: documents.tradeLicenseUrl || "",
      shopLogoUrl: documents.shopLogoUrl || "",
    } as DocumentsInput,
    onSubmit: async ({ value }) => {
      setDocuments(value);
      markStepCompleted(3);
      onNext();
    },
    validators: {
      onSubmit: documentsSchema,
    },
  });

  interface DocumentsLabels {
    title: string;
    subtitle: string;
    nidNumber: string;
    nidNumberPlaceholder: string;
    nidFront: string;
    nidFrontDesc: string;
    nidBack: string;
    nidBackDesc: string;
    tradeLicense: string;
    tradeLicenseDesc: string;
    shopLogo: string;
    shopLogoDesc: string;
    next: string;
    back: string;
  }

  const t: Record<Language, DocumentsLabels> = {
    en: {
      title: "Documents",
      subtitle: "Upload required documents for verification",
      nidNumber: "NID Number",
      nidNumberPlaceholder: "10 or 17 digit NID number",
      nidFront: "NID Front Side",
      nidFrontDesc: "Clear photo of NID front side",
      nidBack: "NID Back Side",
      nidBackDesc: "Clear photo of NID back side",
      tradeLicense: "Trade License",
      tradeLicenseDesc: "Upload trade license (optional)",
      shopLogo: "Shop Logo",
      shopLogoDesc: "Upload your shop logo (optional)",
      next: "Next",
      back: "Back",
    },
    bn: {
      title: "ডকুমেন্ট",
      subtitle: "যাচাইকরণের জন্য প্রয়োজনীয় ডকুমেন্ট আপলোড করুন",
      nidNumber: "জাতীয় পরিচয়পত্র নম্বর",
      nidNumberPlaceholder: "১০ বা ১৭ সংখ্যার NID নম্বর",
      nidFront: "NID সামনের পাশ",
      nidFrontDesc: "NID এর সামনের দিকের স্পষ্ট ছবি",
      nidBack: "NID পিছনের পাশ",
      nidBackDesc: "NID এর পিছনের দিকের স্পষ্ট ছবি",
      tradeLicense: "ট্রেড লাইসেন্স",
      tradeLicenseDesc: "ট্রেড লাইসেন্স আপলোড করুন (ঐচ্ছিক)",
      shopLogo: "দোকানের লোগো",
      shopLogoDesc: "আপনার দোকানের লোগো আপলোড করুন (ঐচ্ছিক)",
      next: "পরবর্তী",
      back: "পিছনে",
    },
  };

  const labels = t[language];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{labels.title}</h2>
        <p className="text-muted-foreground text-sm">{labels.subtitle}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* NID Number */}
        <form.Field name="nidNumber">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                {labels.nidNumber} <span className="text-red-500">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={labels.nidNumberPlaceholder}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        {/* NID Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NID Front */}
          <form.Field name="nidFrontUrl">
            {(field) => (
              <FileUpload
                label={`${labels.nidFront} *`}
                description={labels.nidFrontDesc}
                value={field.state.value}
                onChange={(url) => field.handleChange(url)}
                onClear={() => field.handleChange("")}
                accept="image/*"
                maxSizeMB={5}
                error={field.state.meta.errors[0]?.message}
              />
            )}
          </form.Field>

          {/* NID Back */}
          <form.Field name="nidBackUrl">
            {(field) => (
              <FileUpload
                label={`${labels.nidBack} *`}
                description={labels.nidBackDesc}
                value={field.state.value}
                onChange={(url) => field.handleChange(url)}
                onClear={() => field.handleChange("")}
                accept="image/*"
                maxSizeMB={5}
                error={field.state.meta.errors[0]?.message}
              />
            )}
          </form.Field>
        </div>

        {/* Optional Documents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trade License */}
          <form.Field name="tradeLicenseUrl">
            {(field) => (
              <FileUpload
                label={labels.tradeLicense}
                description={labels.tradeLicenseDesc}
                value={field.state.value || ""}
                onChange={(url) => field.handleChange(url)}
                onClear={() => field.handleChange("")}
                accept="image/*,.pdf"
                maxSizeMB={5}
                error={field.state.meta.errors[0]?.message}
              />
            )}
          </form.Field>

          {/* Shop Logo */}
          <form.Field name="shopLogoUrl">
            {(field) => (
              <FileUpload
                label={labels.shopLogo}
                description={labels.shopLogoDesc}
                value={field.state.value || ""}
                onChange={(url) => field.handleChange(url)}
                onClear={() => field.handleChange("")}
                accept="image/*"
                maxSizeMB={2}
                error={field.state.meta.errors[0]?.message}
              />
            )}
          </form.Field>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            {labels.back}
          </Button>
          <form.Subscribe>
            {(state) => (
              <Button
                type="submit"
                disabled={!state.canSubmit || state.isSubmitting}
              >
                {state.isSubmitting
                  ? language === "en"
                    ? "Saving..."
                    : "সংরক্ষণ হচ্ছে..."
                  : labels.next}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}
