import { cn } from "@/lib/utils";
import { Check, MapPin, CreditCard, ClipboardCheck } from "lucide-react";
import type { CheckoutStep } from "@/stores/checkout-store";
import { useTranslation } from "@/hooks/use-translation";

interface CheckoutStepperProps {
	currentStep: CheckoutStep;
	completedSteps: number[];
	onStepClick: (step: CheckoutStep) => void;
	canNavigateTo: (step: CheckoutStep) => boolean;
}

export function CheckoutStepper({
	currentStep,
	completedSteps,
	onStepClick,
	canNavigateTo,
}: CheckoutStepperProps) {
	const { t } = useTranslation();

	const steps = [
		{
			step: 1 as CheckoutStep,
			label: t("checkout.step.shipping"),
			shortLabel: t("checkout.step.short.shipping"),
			icon: MapPin,
		},
		{
			step: 2 as CheckoutStep,
			label: t("checkout.step.payment"),
			shortLabel: t("checkout.step.short.payment"),
			icon: CreditCard,
		},
		{
			step: 3 as CheckoutStep,
			label: t("checkout.step.review"),
			shortLabel: t("checkout.step.short.review"),
			icon: ClipboardCheck,
		},
	];

	const progressRatio =
		steps.length > 1 ? (currentStep - 1) / (steps.length - 1) : 0;
	const clampedProgress = Math.min(1, Math.max(0, progressRatio));
	const edgeInsetPercent = steps.length > 0 ? 100 / (steps.length * 2) : 0;
	const trackInset = `${edgeInsetPercent}%`;

	return (
		<nav aria-label="Checkout progress" className="w-full py-6 px-4 md:px-6">
			{/* Desktop stepper */}
			<div className="hidden md:flex items-center relative">
				<div
					className="absolute top-5 h-0.5 bg-border"
					style={{ left: trackInset, right: trackInset }}
				/>
				<div
					className="absolute top-5 h-0.5 bg-primary origin-left transition-transform duration-500"
					style={{
						left: trackInset,
						right: trackInset,
						transform: `scaleX(${clampedProgress})`,
					}}
				/>

				{steps.map((stepInfo) => {
					const isCompleted = completedSteps.includes(stepInfo.step);
					const isCurrent = currentStep === stepInfo.step;
					const isClickable = canNavigateTo(stepInfo.step);
					const Icon = stepInfo.icon;

					return (
						<div
							key={stepInfo.step}
							className="flex-1 min-w-0 flex justify-center relative z-10 px-1"
						>
							<button
								type="button"
								onClick={() => isClickable && onStepClick(stepInfo.step)}
								disabled={!isClickable}
								className={cn(
									"w-full flex flex-col items-center transition-all duration-300",
									isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60",
								)}
							>
								<div
									className={cn(
										"w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
										isCompleted && "bg-primary text-primary-foreground",
										isCurrent &&
											"bg-primary text-primary-foreground ring-4 ring-primary/15",
										!isCompleted &&
											!isCurrent &&
											"bg-card border-2 border-border text-muted-foreground",
									)}
								>
									{isCompleted ? (
										<Check className="w-5 h-5" />
									) : (
										<Icon className="w-5 h-5" />
									)}
								</div>
								<span
									className={cn(
										"mt-2 text-xs font-medium text-center max-w-full break-words leading-tight",
										isCurrent && "text-primary",
										isCompleted && "text-foreground",
										!isCompleted && !isCurrent && "text-muted-foreground",
									)}
								>
									{stepInfo.label}
								</span>
							</button>
						</div>
					);
				})}
			</div>

			{/* Mobile stepper */}
			<div className="md:hidden">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium text-muted-foreground">
						Step {currentStep} of {steps.length}
					</span>
					<span className="text-sm font-medium">
						{steps[currentStep - 1]?.shortLabel}
					</span>
				</div>

				<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
					<div
						className="h-full bg-primary transition-all duration-300"
						style={{ width: `${clampedProgress * 100}%` }}
					/>
				</div>

				<div className="flex justify-between mt-2">
					{steps.map((stepInfo) => {
						const isCompleted = completedSteps.includes(stepInfo.step);
						const isCurrent = currentStep === stepInfo.step;
						const Icon = stepInfo.icon;

						return (
							<div
								key={stepInfo.step}
								className={cn(
									"flex items-center gap-1 text-xs",
									isCurrent && "text-primary font-medium",
									isCompleted && "text-foreground",
									!isCompleted && !isCurrent && "text-muted-foreground",
								)}
							>
								{isCompleted ? (
									<Check className="w-3 h-3" />
								) : (
									<Icon className="w-3 h-3" />
								)}
								<span className="hidden sm:inline">{stepInfo.shortLabel}</span>
							</div>
						);
					})}
				</div>
			</div>
		</nav>
	);
}
