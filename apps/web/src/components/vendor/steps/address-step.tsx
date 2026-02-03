import { useForm } from "@tanstack/react-form";
import { useLanguage } from "@/lib/i18n/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addressSchema, type AddressInput } from "@kineDao.com/api-types/vendor";
import type { Language } from "@/lib/i18n/translations";
import { useVendorApplicationStore } from "@/stores/vendor-application-store";
import { DistrictSelect } from "../district-select";

interface AddressStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function AddressStep({ onNext, onBack }: AddressStepProps) {
  const { language } = useLanguage();
  const { address, setAddress, markStepCompleted } = useVendorApplicationStore();

  const form = useForm({
    defaultValues: {
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      district: address.district || undefined,
      city: address.city || "",
      postalCode: address.postalCode || "",
    } as AddressInput,
    onSubmit: async ({ value }) => {
      setAddress(value);
      markStepCompleted(2);
      onNext();
    },
    validators: {
      onSubmit: addressSchema,
    },
  });

  interface AddressLabels {
    title: string;
    subtitle: string;
    addressLine1: string;
    addressLine1Placeholder: string;
    addressLine2: string;
    addressLine2Placeholder: string;
    district: string;
    city: string;
    cityPlaceholder: string;
    postalCode: string;
    postalCodePlaceholder: string;
    next: string;
    back: string;
  }

  const t: Record<Language, AddressLabels> = {
    en: {
      title: "Business Address",
      subtitle: "Where is your business located?",
      addressLine1: "Address Line 1",
      addressLine1Placeholder: "Street address, building name",
      addressLine2: "Address Line 2",
      addressLine2Placeholder: "Area, landmark (optional)",
      district: "District",
      city: "City / Upazila",
      cityPlaceholder: "Enter city or upazila name",
      postalCode: "Postal Code",
      postalCodePlaceholder: "e.g., 1205",
      next: "Next",
      back: "Back",
    },
    bn: {
      title: "ব্যবসার ঠিকানা",
      subtitle: "আপনার ব্যবসার অবস্থান কোথায়?",
      addressLine1: "ঠিকানা লাইন ১",
      addressLine1Placeholder: "রাস্তার ঠিকানা, বিল্ডিং এর নাম",
      addressLine2: "ঠিকানা লাইন ২",
      addressLine2Placeholder: "এলাকা, ল্যান্ডমার্ক (ঐচ্ছিক)",
      district: "জেলা",
      city: "শহর / উপজেলা",
      cityPlaceholder: "শহর বা উপজেলার নাম লিখুন",
      postalCode: "পোস্টাল কোড",
      postalCodePlaceholder: "যেমন, ১২০৫",
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
        className="space-y-4"
      >
        {/* Address Line 1 */}
        <form.Field name="addressLine1">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                {labels.addressLine1} <span className="text-red-500">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={labels.addressLine1Placeholder}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        {/* Address Line 2 */}
        <form.Field name="addressLine2">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>{labels.addressLine2}</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={labels.addressLine2Placeholder}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        {/* District */}
        <form.Field name="district">
          {(field) => (
            <div className="space-y-2">
              <Label>
                {labels.district} <span className="text-red-500">*</span>
              </Label>
              <DistrictSelect
                value={field.state.value}
                onChange={(value) => field.handleChange(value)}
                error={field.state.meta.errors[0]?.message}
              />
            </div>
          )}
        </form.Field>

        {/* City */}
        <form.Field name="city">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                {labels.city} <span className="text-red-500">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={labels.cityPlaceholder}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        {/* Postal Code */}
        <form.Field name="postalCode">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>{labels.postalCode}</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value || ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={labels.postalCodePlaceholder}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

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
