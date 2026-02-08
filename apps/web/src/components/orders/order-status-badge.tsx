import { Badge } from "@mantine/core";
import { useTranslation } from "@/hooks/use-translation";

interface OrderStatusBadgeProps {
	status: string;
}

const statusColors: Record<string, string> = {
	pending: "yellow",
	confirmed: "blue",
	processing: "blue",
	shipped: "grape",
	delivered: "green",
	cancelled: "red",
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
	const { t } = useTranslation();

	const color = statusColors[status] || "gray";
	const label = t(`order.detail.status.${status}` as any);

	return (
		<Badge color={color} variant="light" size="md">
			{label}
		</Badge>
	);
}
