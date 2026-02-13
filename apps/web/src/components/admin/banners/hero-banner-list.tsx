import {
	DndContext,
	closestCenter,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ActionIcon,
	Badge,
	Group,
	Paper,
	Table,
	Text,
} from "@mantine/core";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import type { AdminHeroBannerListItemDTO } from "@kineDao.com/api-types/admin";
import type { BannerLabels } from "./banner-labels";

interface HeroBannerListProps {
	banners: AdminHeroBannerListItemDTO[];
	labels: BannerLabels;
	onEdit: (banner: AdminHeroBannerListItemDTO) => void;
	onDelete: (banner: AdminHeroBannerListItemDTO) => void;
	onReorder: (orderedIds: string[]) => void;
	isReordering?: boolean;
}

interface SortableHeroRowProps {
	banner: AdminHeroBannerListItemDTO;
	labels: BannerLabels;
	onEdit: (banner: AdminHeroBannerListItemDTO) => void;
	onDelete: (banner: AdminHeroBannerListItemDTO) => void;
}

function statusColor(status: AdminHeroBannerListItemDTO["status"]) {
	switch (status) {
		case "active":
			return "green";
		case "scheduled":
			return "orange";
		default:
			return "gray";
	}
}

function statusLabel(
	status: AdminHeroBannerListItemDTO["status"],
	labels: BannerLabels,
) {
	switch (status) {
		case "active":
			return labels.active;
		case "scheduled":
			return labels.scheduled;
		default:
			return labels.inactive;
	}
}

function SortableHeroRow({
	banner,
	labels,
	onEdit,
	onDelete,
}: SortableHeroRowProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: banner.id });

	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	return (
		<Table.Tr ref={setNodeRef} style={style}>
			<Table.Td>
				<ActionIcon
					variant="subtle"
					size="lg"
					aria-label={labels.drag}
					{...attributes}
					{...listeners}
				>
					<GripVertical size={16} />
				</ActionIcon>
			</Table.Td>
			<Table.Td>
				<img
					src={banner.imageUrl}
					alt={banner.altText}
					className="h-[45px] w-[80px] rounded object-cover"
				/>
			</Table.Td>
			<Table.Td>
				<Text size="sm" lineClamp={1}>
					{banner.linkUrl}
				</Text>
			</Table.Td>
			<Table.Td>
				<Text size="sm" lineClamp={1}>
					{banner.altText}
				</Text>
			</Table.Td>
			<Table.Td>
				<Badge color={statusColor(banner.status)} variant="light">
					{statusLabel(banner.status, labels)}
				</Badge>
			</Table.Td>
			<Table.Td>
				<Group gap="xs" justify="flex-end">
					<ActionIcon
						variant="subtle"
						aria-label={labels.edit}
						onClick={() => onEdit(banner)}
					>
						<Pencil size={16} />
					</ActionIcon>
					<ActionIcon
						variant="subtle"
						color="red"
						aria-label={labels.delete}
						onClick={() => onDelete(banner)}
					>
						<Trash2 size={16} />
					</ActionIcon>
				</Group>
			</Table.Td>
		</Table.Tr>
	);
}

export function HeroBannerList({
	banners,
	labels,
	onEdit,
	onDelete,
	onReorder,
	isReordering = false,
}: HeroBannerListProps) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		}),
	);

	const orderedIds = banners.map((banner) => banner.id);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id || isReordering) {
			return;
		}

		const oldIndex = orderedIds.indexOf(String(active.id));
		const newIndex = orderedIds.indexOf(String(over.id));
		if (oldIndex === -1 || newIndex === -1) {
			return;
		}

		onReorder(arrayMove(orderedIds, oldIndex, newIndex));
	};

	if (banners.length === 0) {
		return (
			<Paper withBorder p="xl">
				<Text size="sm" c="dimmed">
					{labels.emptyHero}
				</Text>
			</Paper>
		);
	}

	return (
		<Paper withBorder p="sm">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
					<Table highlightOnHover verticalSpacing="sm">
						<Table.Thead>
							<Table.Tr>
								<Table.Th>{labels.drag}</Table.Th>
								<Table.Th>{labels.image}</Table.Th>
								<Table.Th>{labels.linkUrl}</Table.Th>
								<Table.Th>{labels.altText}</Table.Th>
								<Table.Th>{labels.status}</Table.Th>
								<Table.Th style={{ textAlign: "right" }}>{labels.actions}</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{banners.map((banner) => (
								<SortableHeroRow
									key={banner.id}
									banner={banner}
									labels={labels}
									onEdit={onEdit}
									onDelete={onDelete}
								/>
							))}
						</Table.Tbody>
					</Table>
				</SortableContext>
			</DndContext>
		</Paper>
	);
}
