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
	Stack,
	Table,
	Text,
	ThemeIcon,
	Tooltip,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { GripVertical, ImageOff, Pencil, Trash2 } from "lucide-react";
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

interface SortableHeroCardProps {
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
		<Table.Tr
			ref={setNodeRef}
			style={style}
			className="transition-colors hover:bg-primary/5 dark:hover:bg-primary/10"
		>
			<Table.Td>
				<ActionIcon
					variant="light"
					size="lg"
					aria-label={labels.drag}
					radius="xl"
					className="cursor-grab active:cursor-grabbing"
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
					className="h-[52px] w-[92px] rounded-md border border-border/70 object-cover shadow-sm"
				/>
			</Table.Td>
			<Table.Td>
				<Tooltip label={banner.linkUrl} withArrow>
					<Text size="sm" fw={600} className="break-all" lineClamp={2}>
						{banner.linkUrl}
					</Text>
				</Tooltip>
			</Table.Td>
			<Table.Td>
				<Tooltip label={banner.altText} withArrow>
					<Text size="sm" fw={600} lineClamp={2}>
						{banner.altText}
					</Text>
				</Tooltip>
			</Table.Td>
			<Table.Td>
				<Badge color={statusColor(banner.status)} variant="light">
					{statusLabel(banner.status, labels)}
				</Badge>
			</Table.Td>
			<Table.Td>
				<Group gap="xs" justify="flex-end">
					<ActionIcon
						variant="light"
						aria-label={labels.edit}
						radius="xl"
						onClick={() => onEdit(banner)}
					>
						<Pencil size={16} />
					</ActionIcon>
					<ActionIcon
						variant="light"
						color="red"
						aria-label={labels.delete}
						radius="xl"
						onClick={() => onDelete(banner)}
					>
						<Trash2 size={16} />
					</ActionIcon>
				</Group>
			</Table.Td>
		</Table.Tr>
	);
}

function SortableHeroCard({
	banner,
	labels,
	onEdit,
	onDelete,
}: SortableHeroCardProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: banner.id });

	const style: CSSProperties = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.6 : 1,
	};

	return (
		<Paper
			ref={setNodeRef}
			withBorder
			p="sm"
			radius="md"
			style={style}
			className="bg-card/70"
		>
			<Group justify="space-between" align="center" mb={10}>
				<Group gap={8}>
					<ActionIcon
						variant="light"
						size="lg"
						aria-label={labels.drag}
						radius="xl"
						className="cursor-grab active:cursor-grabbing"
						{...attributes}
						{...listeners}
					>
						<GripVertical size={16} />
					</ActionIcon>
					<Badge color={statusColor(banner.status)} variant="light">
						{statusLabel(banner.status, labels)}
					</Badge>
				</Group>

				<Group gap={6}>
					<ActionIcon
						variant="light"
						aria-label={labels.edit}
						radius="xl"
						onClick={() => onEdit(banner)}
					>
						<Pencil size={16} />
					</ActionIcon>
					<ActionIcon
						variant="light"
						color="red"
						aria-label={labels.delete}
						radius="xl"
						onClick={() => onDelete(banner)}
					>
						<Trash2 size={16} />
					</ActionIcon>
				</Group>
			</Group>

			<Group align="flex-start" wrap="nowrap" gap="sm">
				<img
					src={banner.imageUrl}
					alt={banner.altText}
					className="h-[64px] w-[112px] rounded-md border border-border/70 object-cover shadow-sm"
				/>
				<Stack gap={2} flex={1}>
					<Text size="xs" c="dimmed" fw={600}>
						{labels.linkUrl}
					</Text>
					<Text size="sm" fw={500} lineClamp={1} className="break-all">
						{banner.linkUrl}
					</Text>
				</Stack>
			</Group>
		</Paper>
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
	const isMobile = useMediaQuery("(max-width: 48em)");
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
			<Paper
				withBorder
				p="xl"
				radius="lg"
				className="border-dashed border-border/80 bg-card/60"
			>
				<Group justify="center" gap="sm">
					<ThemeIcon variant="light" color="gray" radius="xl">
						<ImageOff size={16} />
					</ThemeIcon>
					<Text size="sm" c="dimmed">
						{labels.emptyHero}
					</Text>
				</Group>
			</Paper>
		);
	}

	return (
		<Paper withBorder p="sm" radius="lg" className="bg-card/70 backdrop-blur-sm">
			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleDragEnd}
			>
				<SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
					{isMobile ? (
						<Stack gap="sm">
							{banners.map((banner) => (
								<SortableHeroCard
									key={banner.id}
									banner={banner}
									labels={labels}
									onEdit={onEdit}
									onDelete={onDelete}
								/>
							))}
						</Stack>
					) : (
						<Table
							highlightOnHover
							verticalSpacing="sm"
							className="overflow-hidden rounded-md"
						>
							<colgroup>
								<col style={{ width: 72 }} />
								<col style={{ width: 124 }} />
								<col style={{ width: "34%" }} />
								<col style={{ width: "30%" }} />
								<col style={{ width: 120 }} />
								<col style={{ width: 120 }} />
							</colgroup>
							<Table.Thead>
								<Table.Tr className="bg-primary/5 dark:bg-primary/10">
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
					)}
				</SortableContext>
			</DndContext>
		</Paper>
	);
}
