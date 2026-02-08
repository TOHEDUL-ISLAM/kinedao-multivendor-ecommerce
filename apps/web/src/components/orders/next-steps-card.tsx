import { CheckCircle, Package, Truck, Banknote } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { Card } from "@/components/ui/card";

export function NextStepsCard() {
	const { t } = useTranslation();

	const steps = [
		{
			icon: CheckCircle,
			title: t("checkout.nextSteps.step1"),
			description: t("checkout.nextSteps.step1.desc"),
			completed: true,
		},
		{
			icon: Package,
			title: t("checkout.nextSteps.step2"),
			description: t("checkout.nextSteps.step2.desc"),
			completed: false,
		},
		{
			icon: Truck,
			title: t("checkout.nextSteps.step3"),
			description: t("checkout.nextSteps.step3.desc"),
			completed: false,
		},
		{
			icon: Banknote,
			title: t("checkout.nextSteps.step4"),
			description: t("checkout.nextSteps.step4.desc"),
			completed: false,
		},
	];

	return (
		<Card className="p-6 mb-6">
			<h2 className="text-lg font-semibold mb-6">{t("checkout.nextSteps.title")}</h2>

			{/* Desktop: Horizontal */}
			<div className="hidden md:flex items-start justify-between gap-4">
				{steps.map((step, index) => {
					const Icon = step.icon;
					return (
						<div key={index} className="flex-1 relative">
							<div className="flex flex-col items-center text-center">
								{/* Icon */}
								<div
									className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
										step.completed
											? "bg-green-100 text-green-600"
											: "bg-gray-100 text-gray-400"
									}`}
								>
									<Icon className="w-6 h-6" />
								</div>

								{/* Title */}
								<h3 className={`font-semibold text-sm mb-1 ${step.completed ? "text-green-700" : "text-gray-700"}`}>
									{step.title}
								</h3>

								{/* Description */}
								<p className="text-xs text-muted-foreground">
									{step.description}
								</p>
							</div>

							{/* Connecting line */}
							{index < steps.length - 1 && (
								<div className="absolute top-6 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 bg-gray-200" />
							)}
						</div>
					);
				})}
			</div>

			{/* Mobile: Vertical */}
			<div className="flex md:hidden flex-col gap-4">
				{steps.map((step, index) => {
					const Icon = step.icon;
					return (
						<div key={index} className="flex gap-4 relative">
							{/* Icon with connecting line */}
							<div className="flex flex-col items-center">
								<div
									className={`w-10 h-10 rounded-full flex items-center justify-center ${
										step.completed
											? "bg-green-100 text-green-600"
											: "bg-gray-100 text-gray-400"
									}`}
								>
									<Icon className="w-5 h-5" />
								</div>
								{index < steps.length - 1 && (
									<div className="w-0.5 h-full min-h-[40px] bg-gray-200 my-2" />
								)}
							</div>

							{/* Content */}
							<div className="flex-1 pb-4">
								<h3 className={`font-semibold text-sm mb-1 ${step.completed ? "text-green-700" : "text-gray-700"}`}>
									{step.title}
								</h3>
								<p className="text-xs text-muted-foreground">
									{step.description}
								</p>
							</div>
						</div>
					);
				})}
			</div>
		</Card>
	);
}
