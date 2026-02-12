import { CheckCircle, Circle, X } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";

interface StatusTimelineProps {
	status: string;
	createdAt: string;
	confirmedAt?: string | null;
	shippedAt?: string | null;
	deliveredAt?: string | null;
	cancelledAt?: string | null;
}

export function StatusTimeline({
	status: _status,
	createdAt,
	confirmedAt,
	shippedAt,
	deliveredAt,
	cancelledAt,
}: StatusTimelineProps) {
	const { t, language } = useTranslation();

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString(language === "bn" ? "bn-BD" : "en-BD", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const steps = [
		{
			label: t("order.detail.orderPlaced"),
			timestamp: createdAt,
			completed: true,
		},
		{
			label: t("order.detail.status.confirmed"),
			timestamp: confirmedAt,
			completed: !!confirmedAt,
		},
		{
			label: t("order.detail.status.shipped"),
			timestamp: shippedAt,
			completed: !!shippedAt,
		},
		{
			label: t("order.detail.status.delivered"),
			timestamp: deliveredAt,
			completed: !!deliveredAt,
		},
	];

	// If cancelled, replace timeline with cancel step
	if (cancelledAt) {
		return (
			<div className="p-6 bg-red-50 border border-red-200 rounded-lg">
				<div className="flex items-start gap-3">
					<div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
						<X className="w-5 h-5 text-red-600" />
					</div>
					<div>
						<h4 className="font-semibold text-red-900">{t("order.detail.status.cancelled")}</h4>
						<p className="text-sm text-red-700">{formatDate(cancelledAt)}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-background rounded-lg p-6 border">
			<h3 className="text-lg font-semibold mb-6">{t("order.detail.timeline")}</h3>

			<div className="space-y-4">
				{steps.map((step, index) => (
					<div key={index} className="flex gap-4 relative">
						{/* Icon with connecting line */}
						<div className="flex flex-col items-center">
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center ${
									step.completed
										? "bg-green-100"
										: "bg-gray-100"
								}`}
							>
								{step.completed ? (
									<CheckCircle className="w-5 h-5 text-green-600" />
								) : (
									<Circle className="w-5 h-5 text-gray-400" />
								)}
							</div>
							{index < steps.length - 1 && (
								<div
									className={`w-0.5 h-full min-h-[40px] my-1 ${
										step.completed ? "bg-green-200" : "bg-gray-200"
									}`}
								/>
							)}
						</div>

						{/* Content */}
						<div className="flex-1 pb-2">
							<h4
								className={`font-semibold text-sm ${
									step.completed ? "text-green-700" : "text-gray-500"
								}`}
							>
								{step.label}
							</h4>
							{step.timestamp && (
								<p className="text-xs text-muted-foreground mt-1">
									{formatDate(step.timestamp)}
								</p>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
