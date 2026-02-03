import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/use-language";
import { Check } from "lucide-react";
import type { WizardStep } from "@/stores/vendor-application-store";
import type { Language } from "@/lib/i18n/translations";

interface WizardStepperProps {
  currentStep: WizardStep;
  completedSteps: number[];
  onStepClick: (step: WizardStep) => void;
  canNavigateTo: (step: WizardStep) => boolean;
}

const STEPS: { step: WizardStep }[] = [
  { step: 1 },
  { step: 2 },
  { step: 3 },
  { step: 4 },
  { step: 5 },
];

const STEP_LABELS: Record<Language, string[]> = {
  en: ["Business Info", "Address", "Documents", "Payment", "Review"],
  bn: ["ব্যবসার তথ্য", "ঠিকানা", "ডকুমেন্ট", "পেমেন্ট", "পর্যালোচনা"],
};

export function WizardStepper({
  currentStep,
  completedSteps,
  onStepClick,
  canNavigateTo,
}: WizardStepperProps) {
  const { language } = useLanguage();

  const getLabel = (index: number) => {
    return STEP_LABELS[language][index];
  };

  return (
    <nav aria-label="Progress" className="w-full">
      {/* Desktop view */}
      <ol className="hidden md:flex items-center justify-between">
        {STEPS.map((stepInfo, index) => {
          const isCompleted = completedSteps.includes(stepInfo.step);
          const isCurrent = currentStep === stepInfo.step;
          const isClickable = canNavigateTo(stepInfo.step);

          return (
            <li key={stepInfo.step} className="flex-1 relative">
              <button
                onClick={() => isClickable && onStepClick(stepInfo.step)}
                disabled={!isClickable}
                className={cn(
                  "group flex flex-col items-center w-full",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed"
                )}
              >
                {/* Connector line */}
                {index > 0 && (
                  <div
                    className={cn(
                      "absolute top-5 -left-1/2 w-full h-0.5",
                      isCompleted || isCurrent ? "bg-primary" : "bg-muted"
                    )}
                    style={{ zIndex: 0 }}
                  />
                )}

                {/* Step circle */}
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary bg-background text-primary"
                        : "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{stepInfo.step}</span>
                  )}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {getLabel(index)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Mobile view - simplified */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {language === "en" ? "Step" : "ধাপ"} {currentStep} {language === "en" ? "of" : "এর"} 5
          </span>
          <span className="text-sm font-medium">{getLabel(currentStep - 1)}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-2">
          {STEPS.map((stepInfo) => {
            const isCompleted = completedSteps.includes(stepInfo.step);
            const isCurrent = currentStep === stepInfo.step;

            return (
              <button
                key={stepInfo.step}
                onClick={() => canNavigateTo(stepInfo.step) && onStepClick(stepInfo.step)}
                disabled={!canNavigateTo(stepInfo.step)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "bg-primary/20 text-primary border border-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepInfo.step}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
