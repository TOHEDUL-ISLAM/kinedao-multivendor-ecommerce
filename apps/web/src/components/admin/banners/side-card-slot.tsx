import { Badge, Button, Group, Paper, Stack, Text } from "@mantine/core";
import type { AdminSideCardListItemDTO } from "@kineDao.com/api-types/admin";
import type { BannerLabels } from "./banner-labels";

interface SideCardSlotProps {
	slotIndex: number;
	card: AdminSideCardListItemDTO | null;
	labels: BannerLabels;
	onConfigure: (slotIndex: number, card: AdminSideCardListItemDTO | null) => void;
}

function slotTitle(slotIndex: number, labels: BannerLabels) {
	if (slotIndex === 0) return labels.slotTop;
	if (slotIndex === 1) return labels.slotMiddle;
	return labels.slotBottom;
}

export function SideCardSlot({
	slotIndex,
	card,
	labels,
	onConfigure,
}: SideCardSlotProps) {
	const title = slotTitle(slotIndex, labels);

	if (!card) {
		return (
			<Paper withBorder p="md" style={{ borderStyle: "dashed" }}>
				<Group justify="space-between" align="center">
					<div>
						<Text fw={600}>{title}</Text>
						<Text size="sm" c="dimmed">
							{labels.configure}
						</Text>
					</div>
					<Button variant="light" onClick={() => onConfigure(slotIndex, null)}>
						{labels.configure}
					</Button>
				</Group>
			</Paper>
		);
	}

	return (
		<Paper withBorder p="md">
			<Group align="center" justify="space-between" wrap="nowrap">
				<Group align="center" wrap="nowrap">
					<img
						src={card.imageUrl}
						alt={card.titleEn}
						className="h-16 w-28 rounded object-cover"
					/>
					<Stack gap={2}>
						<Text fw={600}>{title}</Text>
						<Text size="sm" lineClamp={1}>
							{card.titleEn}
						</Text>
						{card.badgeText ? (
							<Badge color={card.badgeColor || "teal"} variant="light" w="fit-content">
								{card.badgeText}
							</Badge>
						) : null}
					</Stack>
				</Group>
				<Button variant="light" onClick={() => onConfigure(slotIndex, card)}>
					{labels.edit}
				</Button>
			</Group>
		</Paper>
	);
}
