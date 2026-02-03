import { useForm } from "@tanstack/react-form";
import { useLanguage } from "@/lib/i18n/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { businessInfoSchema, BUSINESS_TYPES, type BusinessInfoInput, type BusinessType } from "@kineDao.com/api-types/vendor";
import { useVendorApplicationStore } from "@/stores/vendor-application-store";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n/translations";

interface BusinessInfoStepProps {
  onNext: () => void;
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

export function BusinessInfoStep({ onNext }: BusinessInfoStepProps) {
  const { language } = useLanguage();
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

  interface BusinessLabels {
    title: string;
    subtitle: string;
    shopNameEn: string;
    shopNameEnPlaceholder: string;
    shopNameBn: string;
    shopNameBnPlaceholder: string;
    ownerName: string;
    ownerNamePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    businessType: string;
    selectType: string;
    next: string;
  }

  const t: Record<Language, BusinessLabels> = {
    en: {
      title: "Business Information",
      subtitle: "Tell us about your business",
      shopNameEn: "Shop Name (English)",
      shopNameEnPlaceholder: "Enter your shop name in English",
      shopNameBn: "Shop Name (Bangla)",
      shopNameBnPlaceholder: "আপনার দোকানের নাম বাংলায় লিখুন",
      ownerName: "Owner Name",
      ownerNamePlaceholder: "Enter owner's full name",
      phone: "Phone Number",
      phonePlaceholder: "01XXXXXXXXX",
      email: "Email Address",
      emailPlaceholder: "your@email.com",
      businessType: "Business Type",
      selectType: "Select business type",
      next: "Next",
    },
    bn: {
      title: "ব্যবসার তথ্য",
      subtitle: "আপনার ব্যবসা সম্পর্কে বলুন",
      shopNameEn: "দোকানের নাম (ইংরেজি)",
      shopNameEnPlaceholder: "ইংরেজিতে আপনার দোকানের নাম লিখুন",
      shopNameBn: "দোকানের নাম (বাংলা)",
      shopNameBnPlaceholder: "বাংলায় আপনার দোকানের নাম লিখুন",
      ownerName: "মালিকের নাম",
      ownerNamePlaceholder: "মালিকের পুরো নাম লিখুন",
      phone: "ফোন নম্বর",
      phonePlaceholder: "01XXXXXXXXX",
      email: "ইমেল",
      emailPlaceholder: "your@email.com",
      businessType: "ব্যবসার ধরন",
      selectType: "ব্যবসার ধরন নির্বাচন করুন",
      next: "পরবর্তী",
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
        className="space-y-4"
      >
        {/* Shop Name (English) - Required */}
        <form.Field name="shopNameEn">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                {labels.shopNameEn} <span className="text-red-500">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={labels.shopNameEnPlaceholder}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
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
              <Label htmlFor={field.name}>{labels.shopNameBn}</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={labels.shopNameBnPlaceholder}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
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
              <Label htmlFor={field.name}>
                {labels.ownerName} <span className="text-red-500">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={labels.ownerNamePlaceholder}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
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
              <Label htmlFor={field.name}>
                {labels.phone} <span className="text-red-500">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="tel"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={labels.phonePlaceholder}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
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
              <Label htmlFor={field.name}>
                {labels.email} <span className="text-red-500">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={labels.emailPlaceholder}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
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
              <Label>
                {labels.businessType} <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BUSINESS_TYPES.map((type: BusinessType) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => field.handleChange(type)}
                    className={cn(
                      "p-3 rounded-lg border-2 text-sm font-medium transition-colors text-left",
                      field.state.value === type
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-muted hover:border-muted-foreground/50"
                    )}
                  >
                    {BUSINESS_TYPE_LABELS[language][type]}
                  </button>
                ))}
              </div>
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <div className="pt-4">
          <form.Subscribe>
            {(state) => (
              <Button
                type="submit"
                className="w-full sm:w-auto"
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
