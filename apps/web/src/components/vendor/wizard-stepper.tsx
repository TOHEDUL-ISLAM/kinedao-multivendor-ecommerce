import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { WizardStep } from "@/stores/vendor-application-store";
import { useTranslation } from "@/hooks/use-translation";

interface WizardStepperProps {
  currentStep: WizardStep;
  completedSteps: number[];
  onStepClick: (step: WizardStep) => void;
  canNavigateTo: (step: WizardStep) => boolean;
}

export function WizardStepper({
  currentStep,
  completedSteps,
  onStepClick,
  canNavigateTo,
}: WizardStepperProps) {
  const { t } = useTranslation();

  const steps = [
    {
      step: 1 as WizardStep,
      label: t("vendor.step.businessInfo"),
      shortLabel: t("vendor.step.short.businessInfo"),
    },
    {
      step: 2 as WizardStep,
      label: t("vendor.step.address"),
      shortLabel: t("vendor.step.short.address"),
    },
    {
      step: 3 as WizardStep,
      label: t("vendor.step.documents"),
      shortLabel: t("vendor.step.short.documents"),
    },
    {
      step: 4 as WizardStep,
      label: t("vendor.step.payment"),
      shortLabel: t("vendor.step.short.payment"),
    },
    {
      step: 5 as WizardStep,
      label: t("vendor.step.review"),
      shortLabel: t("vendor.step.short.review"),
    },
  ];

  const progressRatio = steps.length > 1 ? (currentStep - 1) / (steps.length - 1) : 0;
  const clampedProgress = Math.min(1, Math.max(0, progressRatio));
  const edgeInsetPercent = steps.length > 0 ? 100 / (steps.length * 2) : 0;
  const trackInset = `${edgeInsetPercent}%`;

  return (
    <nav aria-label="Progress" className="w-full py-6 px-4 md:px-6">
      <div className="hidden md:flex items-center relative">
        <div className="absolute top-5 h-0.5 bg-border" style={{ left: trackInset, right: trackInset }} />
        <div
          className="absolute top-5 h-0.5 bg-primary origin-left transition-transform duration-500"
          style={{ left: trackInset, right: trackInset, transform: `scaleX(${clampedProgress})` }}
        />

        {steps.map((stepInfo) => {
          const isCompleted = completedSteps.includes(stepInfo.step);
          const isCurrent = currentStep === stepInfo.step;
          const isClickable = canNavigateTo(stepInfo.step);

          return (
            <div key={stepInfo.step} className="flex-1 min-w-0 flex justify-center relative z-10 px-1">
              <button
                onClick={() => isClickable && onStepClick(stepInfo.step)}
                disabled={!isClickable}
                className={cn(
                  "w-full flex flex-col items-center transition-all duration-300",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                    !isCompleted && !isCurrent && "bg-card border-2 border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : stepInfo.step}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center max-w-full break-words leading-tight",
                    isCurrent && "text-primary",
                    isCompleted && "text-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {stepInfo.label}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t("vendor.step.step")} {currentStep} {t("vendor.step.of")} {steps.length}
          </span>
          <span className="text-sm font-medium">{steps[currentStep - 1]?.shortLabel}</span>
        </div>

        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        <div className="flex justify-between mt-2">
          {steps.map((stepInfo) => {
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
