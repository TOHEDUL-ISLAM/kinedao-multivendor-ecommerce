import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Group,
	Modal,
	Paper,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Title,
} from "@mantine/core";
import { GripVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import type {
	AdminHeroBannerFormInput,
	AdminHeroBannerListItemDTO,
} from "@kineDao.com/api-types/admin";
import { api } from "@/lib/api-client";
import type { BannerLabels } from "./banner-labels";
import {
	useCreateHeroBanner,
	useDeleteBanner,
	useReorderBanners,
	useUpdateHeroBanner,
	useUploadBannerImage,
} from "./use-banner-mutations";
import { HeroBannerList } from "./hero-banner-list";
import {
	HeroBannerModal,
	type HeroBannerModalSubmitInput,
} from "./hero-banner-modal";

interface HeroBannerTabProps {
	labels: BannerLabels;
}

export function HeroBannerTab({ labels }: HeroBannerTabProps) {
	const [modalOpened, setModalOpened] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [editingBanner, setEditingBanner] =
		useState<AdminHeroBannerListItemDTO | null>(null);
	const [bannerToDelete, setBannerToDelete] =
		useState<AdminHeroBannerListItemDTO | null>(null);

	const { data, isLoading, isError } = useQuery({
		queryKey: ["admin", "banners", "hero"],
		queryFn: async () => {
			const response = await api.admin.banners.hero.$get();
			if (!response.ok) {
				throw new Error("Failed to fetch hero banners");
			}
			return response.json() as Promise<AdminHeroBannerListItemDTO[]>;
		},
	});

	const uploadImageMutation = useUploadBannerImage();
	const createHeroMutation = useCreateHeroBanner();
	const updateHeroMutation = useUpdateHeroBanner();
	const deleteBannerMutation = useDeleteBanner();
	const reorderMutation = useReorderBanners();

	const heroBanners = [...(data || [])].sort((a, b) => a.sortOrder - b.sortOrder);
	const isSaving =
		uploadImageMutation.isPending ||
		createHeroMutation.isPending ||
		updateHeroMutation.isPending;

	const openCreateModal = () => {
		setModalMode("create");
		setEditingBanner(null);
		setModalOpened(true);
	};

	const openEditModal = (banner: AdminHeroBannerListItemDTO) => {
		setModalMode("edit");
		setEditingBanner(banner);
		setModalOpened(true);
	};

	const handleReorder = async (orderedIds: string[]) => {
		try {
			await reorderMutation.mutateAsync({
				banners: orderedIds.map((id, index) => ({
					id,
					sortOrder: index,
				})),
			});
			toast.success(labels.reorderSaved);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : labels.errorGeneric);
		}
	};

	const handleDelete = async () => {
		if (!bannerToDelete) return;
		try {
			await deleteBannerMutation.mutateAsync(bannerToDelete.id);
			toast.success(labels.heroDeleted);
			setBannerToDelete(null);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : labels.errorGeneric);
		}
	};

	const handleSubmit = async (input: HeroBannerModalSubmitInput) => {
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

			const payload: AdminHeroBannerFormInput = {
				imageUrl,
				s3Key,
				linkUrl: input.linkUrl,
				altText: input.altText || undefined,
				isActive: input.isActive,
				sortOrder: input.sortOrder,
				startsAt: input.startsAt ? input.startsAt.toISOString() : undefined,
				endsAt: input.endsAt ? input.endsAt.toISOString() : undefined,
			};

			if (modalMode === "edit" && editingBanner) {
				await updateHeroMutation.mutateAsync({
					bannerId: editingBanner.id,
					input: payload,
				});
				toast.success(labels.heroUpdated);
			} else {
				await createHeroMutation.mutateAsync(payload);
				toast.success(labels.heroCreated);
			}

			setModalOpened(false);
			setEditingBanner(null);
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
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<Group gap="sm">
						<ThemeIcon radius="xl" size={34} color="teal" variant="light">
							<GripVertical size={16} />
						</ThemeIcon>
						<div>
							<Title order={3}>{labels.heroSectionTitle}</Title>
							<Text size="sm" c="dimmed">
								{labels.dragHint}
							</Text>
						</div>
					</Group>
					<Button
						leftSection={<Plus size={16} />}
						onClick={openCreateModal}
						className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
					>
						{labels.addHero}
					</Button>
				</div>
			</Paper>

			{isLoading ? <Skeleton h={260} radius="lg" /> : null}
			{isError ? (
				<Alert color="red" radius="md" variant="light">
					{labels.loadError}
				</Alert>
			) : null}
			{!isLoading && !isError ? (
				<HeroBannerList
					banners={heroBanners}
					labels={labels}
					onEdit={openEditModal}
					onDelete={setBannerToDelete}
					onReorder={handleReorder}
					isReordering={reorderMutation.isPending}
				/>
			) : null}

			<HeroBannerModal
				opened={modalOpened}
				onClose={() => setModalOpened(false)}
				mode={modalMode}
				banner={editingBanner}
				defaultSortOrder={heroBanners.length}
				labels={labels}
				isSubmitting={isSaving}
				onSubmit={handleSubmit}
			/>

			<Modal
				opened={!!bannerToDelete}
				onClose={() => setBannerToDelete(null)}
				title={labels.confirmDeleteTitle}
				centered
			>
				<Stack>
					<Text size="sm">{labels.confirmDeleteMessage}</Text>
					<Group justify="flex-end">
						<Button variant="default" onClick={() => setBannerToDelete(null)}>
							{labels.cancel}
						</Button>
						<Button
							color="red"
							onClick={handleDelete}
							loading={deleteBannerMutation.isPending}
						>
							{deleteBannerMutation.isPending ? labels.deleting : labels.delete}
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Stack>
	);
}
