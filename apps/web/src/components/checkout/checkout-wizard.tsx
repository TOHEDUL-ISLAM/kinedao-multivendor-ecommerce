import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";
import { CheckoutStepper } from "./checkout-stepper";
import { OrderSummarySidebar } from "./order-summary-sidebar";
import { ShippingStep } from "./steps/shipping-step";
import { PaymentStep } from "./steps/payment-step";
import { ReviewStep } from "./steps/review-step";

export function CheckoutWizard() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const fetchCart = useCartStore((state) => state.fetchCart);
	const {
		currentStep,
		completedSteps,
		setCurrentStep,
		markStepCompleted,
		goToNextStep,
		goToPreviousStep,
		canNavigateTo,
		selectedAddress,
		selectedAddressId,
		customerNotes,
		acceptedTerms,
		isPlacingOrder,
		setIsPlacingOrder,
		reset,
	} = useCheckoutStore();

	const handleContinue = () => {
		if (currentStep === 1) {
			if (!selectedAddressId) {
				toast.error(t("checkout.shipping.selectAddress"));
				return;
			}
			markStepCompleted(1);
		}

		if (currentStep === 2) {
			markStepCompleted(2);
		}

		goToNextStep();
	};

	const handlePlaceOrder = async () => {
		if (!selectedAddress || !acceptedTerms) {
			toast.error(t("checkout.missingInfo"));
			return;
		}

		if (!selectedAddress.id) {
			toast.error(t("checkout.shipping.selectAddress"));
			return;
		}

		setIsPlacingOrder(true);
		try {
			const response = await api.orders.place.$post({
				json: {
					shippingAddressId: selectedAddress.id,
					customerNotes: customerNotes || undefined,
					acceptedTerms: true,
				},
			});

			if (!response.ok) {
				const error = await response.json();
				console.error("Order placement failed:", error);
				const errorMessage = error.error || t("checkout.orderFailed");
				toast.error(errorMessage);
				return;
			}

			const data = await response.json();

			await fetchCart();
			reset();

			navigate({
				to: "/order-confirmation",
				search: { groupId: data.groupId },
			});
		} catch (error) {
			console.error("Order placement error:", error);
			toast.error(t("checkout.orderFailed"));
		} finally {
			setIsPlacingOrder(false);
		}
	};

	const handlePrimaryAction = () => {
		if (currentStep === 3) {
			void handlePlaceOrder();
			return;
		}

		handleContinue();
	};

	const isPrimaryDisabled =
		(currentStep === 1 && !selectedAddressId) ||
		(currentStep === 3 && (!acceptedTerms || isPlacingOrder));
	const primaryLabel =
		currentStep === 3
			? isPlacingOrder
				? t("checkout.review.placingOrder")
				: t("checkout.review.placeOrder")
			: t("checkout.continue");
	const showBackButton = currentStep > 1;

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
					{currentStep === 1 && <ShippingStep />}
					{currentStep === 2 && <PaymentStep />}
					{currentStep === 3 && <ReviewStep onEditStep={setCurrentStep} />}
				</div>

				<div className="hidden lg:block">
					<div className="sticky top-24 space-y-4">
						<OrderSummarySidebar />
						<CheckoutActionPanel
							showBackButton={showBackButton}
							onBack={goToPreviousStep}
							onPrimaryAction={handlePrimaryAction}
							isPrimaryDisabled={isPrimaryDisabled}
							isPlacingOrder={currentStep === 3 && isPlacingOrder}
							primaryLabel={primaryLabel}
							backLabel={t("checkout.back")}
						/>
					</div>
				</div>
			</div>

			{/* Mobile summary at bottom */}
			<div className="lg:hidden space-y-4">
				<OrderSummarySidebar />
				<CheckoutActionPanel
					showBackButton={showBackButton}
					onBack={goToPreviousStep}
					onPrimaryAction={handlePrimaryAction}
					isPrimaryDisabled={isPrimaryDisabled}
					isPlacingOrder={currentStep === 3 && isPlacingOrder}
					primaryLabel={primaryLabel}
					backLabel={t("checkout.back")}
				/>
			</div>
		</div>
	);
}

interface CheckoutActionPanelProps {
	showBackButton: boolean;
	onBack: () => void;
	onPrimaryAction: () => void;
	isPrimaryDisabled: boolean;
	isPlacingOrder: boolean;
	primaryLabel: string;
	backLabel: string;
}

function CheckoutActionPanel({
	showBackButton,
	onBack,
	onPrimaryAction,
	isPrimaryDisabled,
	isPlacingOrder,
	primaryLabel,
	backLabel,
}: CheckoutActionPanelProps) {
	return (
		<div className="bg-card border border-border rounded-2xl shadow-soft p-4">
			<div className="flex gap-3">
				{showBackButton && (
					<Button type="button" variant="outline" onClick={onBack}>
						{backLabel}
					</Button>
				)}
				<Button
					type="button"
					onClick={onPrimaryAction}
					disabled={isPrimaryDisabled}
					className="flex-1"
				>
					{isPlacingOrder && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
					{primaryLabel}
				</Button>
			</div>
		</div>
	);
}
