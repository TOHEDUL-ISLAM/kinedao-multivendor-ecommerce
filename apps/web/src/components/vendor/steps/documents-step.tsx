import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { documentsSchema, type DocumentsInput } from "@kineDao.com/api-types/vendor";
import { useVendorApplicationStore } from "@/stores/vendor-application-store";
import { FileUpload } from "../file-upload";
import { useTranslation } from "@/hooks/use-translation";
import { CreditCard } from "lucide-react";

interface DocumentsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function DocumentsStep({ onNext, onBack }: DocumentsStepProps) {
  const { t } = useTranslation();
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

  // Sync form state with store when component mounts or store data changes
  // This ensures previews are maintained when navigating back from review
  useEffect(() => {
    if (documents.nidFrontUrl) {
      form.setFieldValue("nidFrontUrl", documents.nidFrontUrl);
    }
    if (documents.nidBackUrl) {
      form.setFieldValue("nidBackUrl", documents.nidBackUrl);
    }
    if (documents.tradeLicenseUrl) {
      form.setFieldValue("tradeLicenseUrl", documents.tradeLicenseUrl);
    }
    if (documents.shopLogoUrl) {
      form.setFieldValue("shopLogoUrl", documents.shopLogoUrl);
    }
    if (documents.nidNumber) {
      form.setFieldValue("nidNumber", documents.nidNumber);
    }
  }, [documents, form]);

  return (
    <div className="space-y-6 step-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t("vendor.form.documents.title")}
        </h2>
        <p className="text-muted-foreground">{t("vendor.form.documents.subtitle")}</p>
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
              <Label htmlFor={field.name} className="flex items-center gap-2 text-foreground">
                <CreditCard className="w-4 h-4 text-primary" />
                {t("vendor.form.documents.nidNumber")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("vendor.form.documents.nidNumberPlaceholder")}
                className="form-transition bg-card border-border focus:ring-2 focus:ring-primary/20 rounded-xl h-12"
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-destructive">
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
                label={`${t("vendor.form.documents.nidFront")} *`}
                description={t("vendor.form.documents.nidFrontDesc")}
                value={field.state.value}
                onChange={(url) => field.handleChange(url)}
                onClear={() => field.handleChange("")}
                accept="image/*"
                maxSizeMB={10}
                error={field.state.meta.errors[0]?.message}
              />
            )}
          </form.Field>

          {/* NID Back */}
          <form.Field name="nidBackUrl">
            {(field) => (
              <FileUpload
                label={`${t("vendor.form.documents.nidBack")} *`}
                description={t("vendor.form.documents.nidBackDesc")}
                value={field.state.value}
                onChange={(url) => field.handleChange(url)}
                onClear={() => field.handleChange("")}
                accept="image/*"
                maxSizeMB={10}
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
                label={t("vendor.form.documents.tradeLicense")}
                description={t("vendor.form.documents.tradeLicenseDesc")}
                value={field.state.value || ""}
                onChange={(url) => field.handleChange(url)}
                onClear={() => field.handleChange("")}
                accept="image/*,.pdf"
                maxSizeMB={20}
                error={field.state.meta.errors[0]?.message}
              />
            )}
          </form.Field>

          {/* Shop Logo */}
          <form.Field name="shopLogoUrl">
            {(field) => (
              <FileUpload
                label={t("vendor.form.documents.shopLogo")}
                description={t("vendor.form.documents.shopLogoDesc")}
                value={field.state.value || ""}
                onChange={(url) => field.handleChange(url)}
                onClear={() => field.handleChange("")}
                accept="image/*"
                maxSizeMB={10}
                error={field.state.meta.errors[0]?.message}
              />
            )}
          </form.Field>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onBack} className="rounded-xl">
            {t("vendor.form.back")}
          </Button>
          <form.Subscribe>
            {(state) => (
              <Button
                type="submit"
                disabled={!state.canSubmit || state.isSubmitting}
                className="ml-auto gradient-primary hover:opacity-90 rounded-xl px-6"
              >
                {state.isSubmitting ? t("vendor.form.saving") : t("vendor.form.next")}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </div>
  );
}
