import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { businessInfoSchema, BUSINESS_TYPES, type BusinessInfoInput, type BusinessType } from "@kineDao.com/api-types/vendor";
import { useVendorApplicationStore } from "@/stores/vendor-application-store";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { Mail, Phone, Store, User } from "lucide-react";

interface BusinessInfoStepProps {
  onNext: () => void;
}

export function BusinessInfoStep({ onNext }: BusinessInfoStepProps) {
  const { t } = useTranslation();
  const { businessInfo, setBusinessInfo, markStepCompleted } = useVendorApplicationStore();

  const form = useForm({
    defaultValues: {
      shopNameEn: businessInfo.shopNameEn || "",
      shopNameBn: businessInfo.shopNameBn || "",
      ownerName: businessInfo.ownerName || "",
      phone: businessInfo.phone || "",
      email: businessInfo.email || "",
      businessType: businessInfo.businessType || undefined,
    } as BusinessInfoInput,
    onSubmit: async ({ value }) => {
      setBusinessInfo(value);
      markStepCompleted(1);
      onNext();
    },
    validators: {
      onSubmit: businessInfoSchema,
    },
  });

  const businessTypeLabels: Record<BusinessType, string> = {
    sole_proprietor: t("vendor.form.business.type.sole_proprietor"),
    partnership: t("vendor.form.business.type.partnership"),
    company: t("vendor.form.business.type.company"),
  };

  return (
    <div className="space-y-6 step-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t("vendor.form.business.title")}
        </h2>
        <p className="text-muted-foreground">{t("vendor.form.business.subtitle")}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
        {/* Shop Name (English) - Required */}
        <form.Field name="shopNameEn">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="flex items-center gap-2 text-foreground">
                <Store className="w-4 h-4 text-primary" />
                {t("vendor.form.business.shopNameEn")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("vendor.form.business.shopNameEnPlaceholder")}
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

        {/* Shop Name (Bangla) - Optional */}
        <form.Field name="shopNameBn">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="flex items-center gap-2 text-foreground">
                <Store className="w-4 h-4 text-primary" />
                {t("vendor.form.business.shopNameBn")}
                <span className="text-muted-foreground text-xs">
                  ({t("common.optional")})
                </span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("vendor.form.business.shopNameBnPlaceholder")}
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

        {/* Owner Name */}
        <form.Field name="ownerName">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="flex items-center gap-2 text-foreground">
                <User className="w-4 h-4 text-primary" />
                {t("vendor.form.business.ownerName")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("vendor.form.business.ownerNamePlaceholder")}
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

        {/* Phone */}
        <form.Field name="phone">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="flex items-center gap-2 text-foreground">
                <Phone className="w-4 h-4 text-primary" />
                {t("vendor.form.business.phone")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <div className="flex">
                <span className="inline-flex items-center px-4 bg-muted border border-r-0 border-border rounded-l-xl text-muted-foreground text-sm font-medium">
                  +880
                </span>
                <Input
                  id={field.name}
                  name={field.name}
                  type="tel"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={t("vendor.form.business.phonePlaceholder")}
                  className="form-transition bg-card border-border focus:ring-2 focus:ring-primary/20 rounded-l-none rounded-r-xl h-12"
                />
              </div>
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        {/* Email */}
        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="flex items-center gap-2 text-foreground">
                <Mail className="w-4 h-4 text-primary" />
                {t("vendor.form.business.email")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("vendor.form.business.emailPlaceholder")}
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

        {/* Business Type */}
        <form.Field name="businessType">
          {(field) => (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-foreground">
                {t("vendor.form.business.businessType")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BUSINESS_TYPES.map((type: BusinessType) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => field.handleChange(type)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-sm font-medium transition-colors text-left bg-card",
                      field.state.value === type
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    {businessTypeLabels[type]}
                  </button>
                ))}
              </div>
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-destructive">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <div className="pt-4 flex justify-end">
          <form.Subscribe>
            {(state) => (
              <Button
                type="submit"
                className="w-full sm:w-auto gradient-primary hover:opacity-90 rounded-xl px-6"
                disabled={!state.canSubmit || state.isSubmitting}
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
