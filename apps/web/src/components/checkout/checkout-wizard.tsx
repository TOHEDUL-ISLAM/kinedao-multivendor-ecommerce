import { useCheckoutStore } from "@/stores/checkout-store";
import { CheckoutStepper } from "./checkout-stepper";
import { OrderSummarySidebar } from "./order-summary-sidebar";
import { ShippingStep } from "./steps/shipping-step";
import { PaymentStep } from "./steps/payment-step";
import { ReviewStep } from "./steps/review-step";

export function CheckoutWizard() {
	const {
		currentStep,
		completedSteps,
		setCurrentStep,
		goToNextStep,
		goToPreviousStep,
		canNavigateTo,
	} = useCheckoutStore();

	return (
		<div className="space-y-5">
			<CheckoutStepper
				currentStep={currentStep}
				completedSteps={completedSteps}
				onStepClick={(step) => canNavigateTo(step) && setCurrentStep(step)}
				canNavigateTo={canNavigateTo}
			/>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
				<div className="bg-card border border-border rounded-2xl shadow-soft p-5 md:p-6">
					{currentStep === 1 && <ShippingStep onNext={goToNextStep} />}
					{currentStep === 2 && (
						<PaymentStep onNext={goToNextStep} onBack={goToPreviousStep} />
					)}
					{currentStep === 3 && (
						<ReviewStep onBack={goToPreviousStep} onEditStep={setCurrentStep} />
					)}
				</div>

				<div className="hidden lg:block">
					<OrderSummarySidebar />
				</div>
			</div>

			{/* Mobile summary at bottom */}
			<div className="lg:hidden">
				<OrderSummarySidebar />
			</div>
		</div>
	);
}
