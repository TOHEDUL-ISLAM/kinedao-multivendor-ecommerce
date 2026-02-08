import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addressSchema, type AddressInput } from "@kineDao.com/api-types/vendor";
import { useVendorApplicationStore } from "@/stores/vendor-application-store";
import { DistrictSelect } from "../district-select";
import { useTranslation } from "@/hooks/use-translation";
import { Building, Map, MapPin } from "lucide-react";

interface AddressStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function AddressStep({ onNext, onBack }: AddressStepProps) {
  const { t } = useTranslation();
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

  return (
    <div className="space-y-6 step-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t("vendor.form.address.title")}
        </h2>
        <p className="text-muted-foreground">{t("vendor.form.address.subtitle")}</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
        {/* Address Line 1 */}
        <form.Field name="addressLine1">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="flex items-center gap-2 text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                {t("vendor.form.address.line1")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("vendor.form.address.line1Placeholder")}
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

        {/* Address Line 2 */}
        <form.Field name="addressLine2">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="flex items-center gap-2 text-foreground">
                <Building className="w-4 h-4 text-primary" />
                {t("vendor.form.address.line2")}
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
                placeholder={t("vendor.form.address.line2Placeholder")}
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

        {/* District */}
        <form.Field name="district">
          {(field) => (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-foreground">
                <Map className="w-4 h-4 text-primary" />
                {t("vendor.form.address.district")}
                <span className="text-destructive ml-1">*</span>
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
              <Label htmlFor={field.name} className="flex items-center gap-2 text-foreground">
                <Building className="w-4 h-4 text-primary" />
                {t("vendor.form.address.city")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t("vendor.form.address.cityPlaceholder")}
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

        {/* Postal Code */}
        <form.Field name="postalCode">
          {(field) => (
            <div className="space-y-2 md:max-w-[220px]">
              <Label htmlFor={field.name} className="flex items-center gap-2 text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                {t("vendor.form.address.postalCode")}
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
                placeholder={t("vendor.form.address.postalCodePlaceholder")}
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
