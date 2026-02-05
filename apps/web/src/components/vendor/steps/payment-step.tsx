import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paymentSchema, type PaymentInput } from "@kineDao.com/api-types/vendor";
import { useVendorApplicationStore } from "@/stores/vendor-application-store";
import { Landmark, Smartphone, AlertCircle } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface PaymentStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function PaymentStep({ onNext, onBack }: PaymentStepProps) {
  const { t } = useTranslation();
  const { payment, setPayment, markStepCompleted } = useVendorApplicationStore();

  const form = useForm({
    defaultValues: {
      bankName: payment.bankName || "",
      bankAccountNumber: payment.bankAccountNumber || "",
      bankAccountName: payment.bankAccountName || "",
      bkashNumber: payment.bkashNumber || "",
      nagadNumber: payment.nagadNumber || "",
    } as PaymentInput,
    onSubmit: async ({ value }) => {
      setPayment(value);
      markStepCompleted(4);
      onNext();
    },
    validators: {
      onSubmit: paymentSchema,
    },
  });

  return (
    <div className="space-y-6 step-enter">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t("vendor.form.payment.title")}
        </h2>
        <p className="text-muted-foreground">{t("vendor.form.payment.subtitle")}</p>
        <div className="mt-4 flex items-start gap-3 p-4 bg-coral-50 border border-secondary/30 rounded-xl">
          <AlertCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
          <p className="text-sm text-secondary-foreground">{t("vendor.form.payment.notice")}</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Bank Account Section */}
        <div className="space-y-4 p-5 bg-cream-50 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Landmark className="w-5 h-5 text-primary" />
            {t("vendor.form.payment.bankSection")}
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {t("common.optional")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Name */}
            <form.Field name="bankName">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>{t("vendor.form.payment.bankName")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("vendor.form.payment.bankNamePlaceholder")}
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

            {/* Account Number */}
            <form.Field name="bankAccountNumber">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>{t("vendor.form.payment.accountNumber")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("vendor.form.payment.accountNumberPlaceholder")}
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

            {/* Account Holder Name */}
            <form.Field name="bankAccountName">
              {(field) => (
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={field.name}>{t("vendor.form.payment.accountName")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("vendor.form.payment.accountNamePlaceholder")}
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
          </div>
        </div>

        {/* MFS Section */}
        <div className="space-y-4 p-5 bg-cream-50 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Smartphone className="w-5 h-5 text-primary" />
            {t("vendor.form.payment.mfsSection")}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* bKash */}
            <form.Field name="bkashNumber">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="flex items-center gap-2">
                    <span className="inline-block w-5 h-5 rounded bg-pink-500 text-center text-xs font-bold text-primary-foreground leading-5">
                      b
                    </span>
                    {t("vendor.form.payment.bkash")}
                  </Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-xl text-muted-foreground text-sm">
                      +880
                    </span>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="tel"
                      value={field.state.value || ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={t("vendor.form.payment.bkashPlaceholder")}
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

            {/* Nagad */}
            <form.Field name="nagadNumber">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name} className="flex items-center gap-2">
                    <span className="inline-block w-5 h-5 rounded bg-orange-500 text-center text-xs font-bold text-primary-foreground leading-5">
                      N
                    </span>
                    {t("vendor.form.payment.nagad")}
                  </Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-muted border border-r-0 border-border rounded-l-xl text-muted-foreground text-sm">
                      +880
                    </span>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="tel"
                      value={field.state.value || ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={t("vendor.form.payment.nagadPlaceholder")}
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
          </div>
        </div>

        {/* Form-level errors (for the refine validation) */}
        <form.Subscribe>
          {(state) => {
            const formErrors = state.errors as Array<{ message?: string } | string | undefined> | undefined;
            const formError = formErrors?.find(
              (e) => typeof e === "string" || (e && typeof e === "object" && e.message?.includes("payment method"))
            );
            if (formError) {
              const message = typeof formError === "string" ? formError : (formError as { message?: string })?.message;
              return (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
                </div>
              );
            }
            return null;
          }}
        </form.Subscribe>

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
