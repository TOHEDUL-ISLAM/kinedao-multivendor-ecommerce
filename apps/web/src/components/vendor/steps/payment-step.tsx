import { useForm } from "@tanstack/react-form";
import { useLanguage } from "@/lib/i18n/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { paymentSchema, type PaymentInput } from "@kineDao.com/api-types/vendor";
import { useVendorApplicationStore } from "@/stores/vendor-application-store";
import { Building2, Smartphone } from "lucide-react";
import type { Language } from "@/lib/i18n/translations";

interface PaymentStepProps {
  onNext: () => void;
  onBack: () => void;
}

interface PaymentLabels {
  title: string;
  subtitle: string;
  notice: string;
  bankSection: string;
  bankName: string;
  bankNamePlaceholder: string;
  accountNumber: string;
  accountNumberPlaceholder: string;
  accountName: string;
  accountNamePlaceholder: string;
  mfsSection: string;
  bkash: string;
  bkashPlaceholder: string;
  nagad: string;
  nagadPlaceholder: string;
  next: string;
  back: string;
}

export function PaymentStep({ onNext, onBack }: PaymentStepProps) {
  const { language } = useLanguage();
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

  const t: Record<Language, PaymentLabels> = {
    en: {
      title: "Payment Information",
      subtitle: "How would you like to receive payments?",
      notice: "At least one payment method is required",
      bankSection: "Bank Account",
      bankName: "Bank Name",
      bankNamePlaceholder: "e.g., Dutch Bangla Bank",
      accountNumber: "Account Number",
      accountNumberPlaceholder: "Enter bank account number",
      accountName: "Account Holder Name",
      accountNamePlaceholder: "Name as per bank records",
      mfsSection: "Mobile Financial Services",
      bkash: "bKash Number",
      bkashPlaceholder: "01XXXXXXXXX",
      nagad: "Nagad Number",
      nagadPlaceholder: "01XXXXXXXXX",
      next: "Next",
      back: "Back",
    },
    bn: {
      title: "পেমেন্ট তথ্য",
      subtitle: "আপনি কিভাবে পেমেন্ট পেতে চান?",
      notice: "অন্তত একটি পেমেন্ট পদ্ধতি প্রয়োজন",
      bankSection: "ব্যাংক অ্যাকাউন্ট",
      bankName: "ব্যাংকের নাম",
      bankNamePlaceholder: "যেমন, ডাচ বাংলা ব্যাংক",
      accountNumber: "অ্যাকাউন্ট নম্বর",
      accountNumberPlaceholder: "ব্যাংক অ্যাকাউন্ট নম্বর লিখুন",
      accountName: "অ্যাকাউন্ট হোল্ডারের নাম",
      accountNamePlaceholder: "ব্যাংক রেকর্ড অনুযায়ী নাম",
      mfsSection: "মোবাইল ফিন্যান্সিয়াল সার্ভিস",
      bkash: "বিকাশ নম্বর",
      bkashPlaceholder: "01XXXXXXXXX",
      nagad: "নগদ নম্বর",
      nagadPlaceholder: "01XXXXXXXXX",
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
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">{labels.notice}</p>
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
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-medium">
            <Building2 className="w-5 h-5" />
            {labels.bankSection}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
            {/* Bank Name */}
            <form.Field name="bankName">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>{labels.bankName}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={labels.bankNamePlaceholder}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-sm text-red-500">
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
                  <Label htmlFor={field.name}>{labels.accountNumber}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={labels.accountNumberPlaceholder}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-sm text-red-500">
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
                  <Label htmlFor={field.name}>{labels.accountName}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value || ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={labels.accountNamePlaceholder}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-sm text-red-500">
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>
        </div>

        {/* MFS Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-medium">
            <Smartphone className="w-5 h-5" />
            {labels.mfsSection}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
            {/* bKash */}
            <form.Field name="bkashNumber">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>{labels.bkash}</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 rounded-full bg-[#E2136E] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">b</span>
                      </div>
                    </div>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="tel"
                      value={field.state.value || ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={labels.bkashPlaceholder}
                      className="pl-12"
                    />
                  </div>
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-sm text-red-500">
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
                  <Label htmlFor={field.name}>{labels.nagad}</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <div className="w-6 h-6 rounded-full bg-[#F6921E] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">n</span>
                      </div>
                    </div>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="tel"
                      value={field.state.value || ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={labels.nagadPlaceholder}
                      className="pl-12"
                    />
                  </div>
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-sm text-red-500">
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
                <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
                </div>
              );
            }
            return null;
          }}
        </form.Subscribe>

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
