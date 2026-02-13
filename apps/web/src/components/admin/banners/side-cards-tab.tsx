import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Group, Paper, Skeleton, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { toast } from "sonner";
import { LayoutTemplate } from "lucide-react";
import type {
	AdminSideCardFormInput,
	AdminSideCardListItemDTO,
} from "@kineDao.com/api-types/admin";
import { api } from "@/lib/api-client";
import type { BannerLabels } from "./banner-labels";
import {
	useCreateSideCard,
	useUpdateSideCard,
	useUploadBannerImage,
} from "./use-banner-mutations";
import { SideCardSlot } from "./side-card-slot";
import {
	SideCardModal,
	type SideCardModalSubmitInput,
} from "./side-card-modal";

interface SideCardsTabProps {
	labels: BannerLabels;
}

export function SideCardsTab({ labels }: SideCardsTabProps) {
	const [modalOpened, setModalOpened] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
	const [editingCard, setEditingCard] = useState<AdminSideCardListItemDTO | null>(
		null,
	);

	const { data, isLoading, isError } = useQuery({
		queryKey: ["admin", "banners", "side-cards"],
		queryFn: async () => {
			const response = await api.admin.banners["side-cards"].$get();
			if (!response.ok) {
				throw new Error("Failed to fetch side cards");
			}
			return response.json() as Promise<AdminSideCardListItemDTO[]>;
		},
	});

	const uploadImageMutation = useUploadBannerImage();
	const createSideCardMutation = useCreateSideCard();
	const updateSideCardMutation = useUpdateSideCard();

	const cardsBySlot = useMemo(() => {
		const map = new Map<number, AdminSideCardListItemDTO>();
		(data || []).forEach((card) => {
			if (card.sortOrder >= 0 && card.sortOrder <= 2) {
				map.set(card.sortOrder, card);
			}
		});
		return map;
	}, [data]);

	const isSubmitting =
		uploadImageMutation.isPending ||
		createSideCardMutation.isPending ||
		updateSideCardMutation.isPending;

	const openConfigure = (slotIndex: number, card: AdminSideCardListItemDTO | null) => {
		setSelectedSlotIndex(slotIndex);
		setEditingCard(card);
		setModalMode(card ? "edit" : "create");
		setModalOpened(true);
	};

	const handleSubmit = async (input: SideCardModalSubmitInput) => {
		try {
			let imageUrl = input.currentImageUrl;
			let s3Key = input.currentS3Key;

			if (input.imageFile) {
				const uploadResult = await uploadImageMutation.mutateAsync(input.imageFile);
				imageUrl = uploadResult.url;
				s3Key = uploadResult.s3Key;
			}

			if (!imageUrl || !s3Key) {
				throw new Error(labels.imageRequired);
			}

			const payload: AdminSideCardFormInput = {
				titleEn: input.titleEn,
				titleBn: input.titleBn || undefined,
				subtitleEn: input.subtitleEn || undefined,
				subtitleBn: input.subtitleBn || undefined,
				imageUrl,
				s3Key,
				linkUrl: input.linkUrl || undefined,
				discountPercentage: input.discountPercentage || undefined,
				badgeText: input.badgeText || undefined,
				badgeColor: input.badgeColor || undefined,
				isActive: input.isActive,
				sortOrder: input.sortOrder,
			};

			if (modalMode === "edit" && editingCard) {
				await updateSideCardMutation.mutateAsync({
					bannerId: editingCard.id,
					input: payload,
				});
				toast.success(labels.sideUpdated);
			} else {
				await createSideCardMutation.mutateAsync(payload);
				toast.success(labels.sideCreated);
			}

			setModalOpened(false);
			setEditingCard(null);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : labels.errorGeneric);
		}
	};

	return (
		<Stack gap="md">
			<Paper
				withBorder
				radius="lg"
				p="md"
				className="border-border/70 bg-card/70 backdrop-blur-sm"
			>
				<Group gap="sm">
					<ThemeIcon radius="xl" size={34} color="teal" variant="light">
						<LayoutTemplate size={16} />
					</ThemeIcon>
					<div>
						<Title order={3}>{labels.sideSectionTitle}</Title>
						<Text size="sm" c="dimmed">
							{labels.sideSlotsHint}
						</Text>
					</div>
				</Group>
			</Paper>

			{isLoading ? <Skeleton h={220} radius="lg" /> : null}
			{isError ? (
				<Alert color="red" radius="md" variant="light">
					{labels.loadError}
				</Alert>
			) : null}

			{!isLoading && !isError ? (
				<Stack gap="sm">
					{[0, 1, 2].map((slotIndex) => (
						<SideCardSlot
							key={slotIndex}
							slotIndex={slotIndex}
							card={cardsBySlot.get(slotIndex) || null}
							labels={labels}
							onConfigure={openConfigure}
						/>
					))}
				</Stack>
			) : null}

			<SideCardModal
				opened={modalOpened}
				onClose={() => setModalOpened(false)}
				mode={modalMode}
				banner={editingCard}
				slotIndex={selectedSlotIndex}
				labels={labels}
				isSubmitting={isSubmitting}
				onSubmit={handleSubmit}
			/>
		</Stack>
	);
}
