import { useNavigate } from "@tanstack/react-router";
import { useVendorApplicationStore, type WizardStep } from "@/stores/vendor-application-store";
import { WizardStepper } from "./wizard-stepper";
import { BusinessInfoStep } from "./steps/business-info-step";
import { AddressStep } from "./steps/address-step";
import { DocumentsStep } from "./steps/documents-step";
import { PaymentStep } from "./steps/payment-step";
import { ReviewStep } from "./steps/review-step";

export function ApplicationWizard() {
  const navigate = useNavigate();
  const {
    currentStep,
    completedSteps,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    canNavigateTo,
  } = useVendorApplicationStore();

  const handleStepClick = (step: WizardStep) => {
    if (canNavigateTo(step)) {
      setCurrentStep(step);
    }
  };

  const handleSubmitSuccess = () => {
    navigate({ to: "/vendor/apply/status" });
  };

  const handleEditStep = (step: 1 | 2 | 3 | 4) => {
    setCurrentStep(step);
  };

  return (
    <div className="space-y-8">
      <WizardStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
        canNavigateTo={canNavigateTo}
      />

      <div className="bg-card border rounded-lg p-6">
        {currentStep === 1 && <BusinessInfoStep onNext={goToNextStep} />}
        {currentStep === 2 && <AddressStep onNext={goToNextStep} onBack={goToPreviousStep} />}
        {currentStep === 3 && <DocumentsStep onNext={goToNextStep} onBack={goToPreviousStep} />}
        {currentStep === 4 && <PaymentStep onNext={goToNextStep} onBack={goToPreviousStep} />}
        {currentStep === 5 && (
          <ReviewStep
            onBack={goToPreviousStep}
            onSubmitSuccess={handleSubmitSuccess}
            onEditStep={handleEditStep}
          />
        )}
      </div>
    </div>
  );
}
