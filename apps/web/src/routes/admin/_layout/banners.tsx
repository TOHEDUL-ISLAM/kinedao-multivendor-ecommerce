import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
	Stack,
	Title,
	Button,
	Table,
	Group,
	Text,
	Paper,
	Skeleton,
	Image,
	Badge,
	Modal,
	ActionIcon,
} from "@mantine/core";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import type { AdminBannerListItemDTO } from "@kineDao.com/api-types/admin";
import {
	useBannerEditorState,
	cloneBannerDraft,
	validateBannerDraft,
	type BannerDraft,
} from "@/components/admin/banner-editor/use-banner-editor-state";
import { BannerEditorToolbar } from "@/components/admin/banner-editor/banner-editor-toolbar";
import { PromotionalCardsEditor } from "@/components/admin/banner-editor/promotional-cards-editor";

export const Route = createFileRoute("/admin/_layout/banners")({
	component: AdminBannersPage,
});

const labels = {
	en: {
		title: "Banner Management",
		addBanner: "Add Banner",
		image: "Image",
		titleLabel: "Title",
		placement: "Placement",
		active: "Active",
		inactive: "Inactive",
		sortOrder: "Sort Order",
		actions: "Actions",
		noResults:
			"No banners found. Click 'Add Banner' to create your first banner.",
		edit: "Edit",
		delete: "Delete",

		// Delete modal
		deleteTitle: "Delete Banner",
		deleteMessage:
			"Are you sure you want to delete this banner? This action cannot be undone.",
		deleteConfirm: "Delete",
		deleting: "Deleting...",
		cancel: "Cancel",

		// Placements
		hero_carousel: "Hero Carousel",
		promotional_card: "Promotional Card",
		homepage_middle: "Homepage Middle",
		sidebar: "Sidebar",

		// Toast messages
		bannerCreated: "Banner created successfully",
		bannerUpdated: "Banner updated successfully",
		bannerDeleted: "Banner deleted successfully",
		error: "An error occurred",

		// Editor
		confirmDiscard: "Discard Changes?",
		confirmDiscardMessage:
			"You have unsaved changes. Are you sure you want to discard them?",
		discard: "Discard",
	},
	bn: {
		title: "ব্যানার ব্যবস্থাপনা",
		addBanner: "ব্যানার যোগ করুন",
		image: "ছবি",
		titleLabel: "শিরোনাম",
		placement: "অবস্থান",
		active: "সক্রিয়",
		inactive: "নিষ্ক্রিয়",
		sortOrder: "ক্রম",
		actions: "কার্যক্রম",
		noResults:
			"কোনো ব্যানার পাওয়া যায়নি। প্রথম ব্যানার তৈরি করতে 'ব্যানার যোগ করুন' ক্লিক করুন।",
		edit: "সম্পাদনা",
		delete: "মুছুন",

		// Delete modal
		deleteTitle: "ব্যানার মুছুন",
		deleteMessage:
			"আপনি কি নিশ্চিত যে আপনি এই ব্যানারটি মুছতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
		deleteConfirm: "মুছুন",
		deleting: "মুছছে...",
		cancel: "বাতিল",

		// Placements
		hero_carousel: "হিরো ক্যারোসেল",
		promotional_card: "প্রচারমূলক কার্ড",
		homepage_middle: "হোমপেজ মধ্য",
		sidebar: "সাইডবার",

		// Toast messages
		bannerCreated: "ব্যানার সফলভাবে তৈরি হয়েছে",
		bannerUpdated: "ব্যানার সফলভাবে আপডেট হয়েছে",
		bannerDeleted: "ব্যানার সফলভাবে মুছে ফেলা হয়েছে",
		error: "একটি ত্রুটি ঘটেছে",

		// Editor
		confirmDiscard: "পরিবর্তন বাতিল করবেন?",
		confirmDiscardMessage:
			"আপনার অসংরক্ষিত পরিবর্তন আছে। আপনি কি নিশ্চিত যে আপনি সেগুলি বাতিল করতে চান?",
		discard: "বাতিল",
	},
};

type EditorMode = "closed" | "create" | "edit";
type EditableSection = "hero" | "promo" | "arrival";

interface ActiveTarget {
	section: EditableSection;
	position: number;
	banner: AdminBannerListItemDTO | null;
}

interface StagedEntry {
	key: string;
	target: ActiveTarget;
	draft: BannerDraft;
}

function toIsoStringOrNull(value: unknown): string | null {
	if (!value) return null;
	if (value instanceof Date && !Number.isNaN(value.getTime())) {
		return value.toISOString();
	}
	if (typeof value === "string") {
		return value;
	}
	return null;
}

function buildPreviewBanner(params: {
	draft: BannerDraft;
	fallback: AdminBannerListItemDTO | null;
	section: EditableSection;
	position: number;
	idOverride?: string;
}): AdminBannerListItemDTO {
	const { draft, fallback, section, position, idOverride } = params;
	return {
		id:
			idOverride ||
			fallback?.id ||
			`__draft__${section}_${position}`,
		titleEn: draft.titleEn || fallback?.titleEn || "",
		titleBn: draft.titleBn || fallback?.titleBn || null,
		subtitleEn: draft.subtitleEn || fallback?.subtitleEn || null,
		subtitleBn: draft.subtitleBn || fallback?.subtitleBn || null,
		priceLabel: draft.priceLabel || fallback?.priceLabel || null,
		badgeText: draft.badgeText || fallback?.badgeText || null,
		badgeColor: draft.badgeColor || fallback?.badgeColor || null,
		ctaText: draft.ctaText || fallback?.ctaText || null,
		discountPercentage: draft.discountPercentage ?? fallback?.discountPercentage ?? null,
		imageUrl: draft.imageUrl || fallback?.imageUrl || "",
		s3Key: draft.existingS3Key || fallback?.s3Key || "",
		linkUrl: draft.linkUrl || fallback?.linkUrl || null,
		placement:
			section === "hero"
				? "hero_carousel"
				: section === "promo"
					? "promotional_card"
					: "sidebar",
		isActive: draft.isActive,
		sortOrder: draft.sortOrder ?? fallback?.sortOrder ?? position - 1,
		startsAt: toIsoStringOrNull(draft.startsAt) || fallback?.startsAt || null,
		endsAt: toIsoStringOrNull(draft.endsAt) || fallback?.endsAt || null,
		createdAt: fallback?.createdAt || "1970-01-01T00:00:00.000Z",
	};
}

function AdminBannersPage() {
	const { language } = useLanguage();
	const { resolvedTheme } = useTheme();
	const t = labels[language];
	const isDark = resolvedTheme === "dark";
	const queryClient = useQueryClient();

	// Editor state
	const editorState = useBannerEditorState();
	const [editorMode, setEditorMode] = useState<EditorMode>("closed");
	const [editingBanner, setEditingBanner] =
		useState<AdminBannerListItemDTO | null>(null);
	const [activeTarget, setActiveTarget] = useState<ActiveTarget | null>(null);
	const [stagedEntries, setStagedEntries] = useState<Record<string, StagedEntry>>({});
	const [stagedHeroOrder, setStagedHeroOrder] = useState<string[] | null>(null);
	const [isPublishingAll, setIsPublishingAll] = useState(false);

	// Delete modal state
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [bannerToDelete, setBannerToDelete] =
		useState<AdminBannerListItemDTO | null>(null);

	// Discard confirmation modal state
	const [discardModalOpen, setDiscardModalOpen] = useState(false);

	// Fetch banners
	const { data: banners, isLoading } = useQuery({
		queryKey: ["admin", "banners"],
		queryFn: async () => {
			const response = await api.admin.banners.$get();
			if (!response.ok) throw new Error("Failed to fetch banners");
			return response.json();
		},
	});

	// Upload image mutation
	const uploadImageMutation = useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			const response = await fetch(
				`${import.meta.env.VITE_SERVER_URL}/api/upload?category=banners`,
				{ method: "POST", body: formData, credentials: "include" },
			);
			if (!response.ok) throw new Error("Failed to upload image");
			return response.json();
		},
	});

	// Delete banner mutation
	const deleteBannerMutation = useMutation({
		mutationFn: async (bannerId: string) => {
			const response = await api.admin.banners[":bannerId"].$delete({
				param: { bannerId },
			});
			if (!response.ok) throw new Error("Failed to delete banner");
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
			toast.success(t.bannerDeleted);
			setDeleteModalOpen(false);
			setBannerToDelete(null);
		},
		onError: () => toast.error(t.error),
	});

	// Get promotional banners for the 3-card editor
	const promoBanners = banners?.filter(b => b.placement === "promotional_card")
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.slice(0, 3) || [];
	const heroBanners = banners?.filter((b) => b.placement === "hero_carousel")
		.sort((a, b) => a.sortOrder - b.sortOrder) || [];
	const arrivalBanners = banners?.filter((b) => b.placement === "sidebar")
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.slice(0, 6) || [];
	const orderedHeroBanners = stagedHeroOrder?.length
		? [
			...stagedHeroOrder
				.map((id) => heroBanners.find((banner) => banner.id === id))
				.filter((banner): banner is AdminBannerListItemDTO => !!banner),
			...heroBanners.filter((banner) => !stagedHeroOrder.includes(banner.id)),
		]
		: heroBanners;

	const sectionFromPlacement = (placement: string): EditableSection =>
		placement === "hero_carousel"
			? "hero"
			: placement === "sidebar"
				? "arrival"
				: "promo";

	const placementFromSection = (
		section: EditableSection,
	): "hero_carousel" | "promotional_card" | "sidebar" =>
		section === "hero"
			? "hero_carousel"
			: section === "promo"
				? "promotional_card"
				: "sidebar";

	const getTargetKey = (target: ActiveTarget) =>
		target.section === "hero" && target.banner?.id
			? `hero:${target.banner.id}`
			: `${target.section}:${target.position}`;
	const getTargetLabel = (target: ActiveTarget) =>
		target.section === "hero"
			? `Hero Slide ${target.position}`
			: target.section === "promo"
				? `Promotional Card ${target.position}`
				: `New Arrival Slot ${target.position}`;

	const stageCurrent = (showToast = true, validateBeforeStage = true): boolean => {
		if (!activeTarget) return true;
		if (!editorState.isDirty) return true;

		if (validateBeforeStage) {
			const errors = validateBannerDraft(editorState.draft, {
				requireImage: !activeTarget.banner,
			});
			if (errors) {
				const firstError = Object.values(errors)[0];
				toast.error(firstError);
				return false;
			}
		}

		const key = getTargetKey(activeTarget);
		const entry: StagedEntry = {
			key,
			target: activeTarget,
			draft: cloneBannerDraft(editorState.draft),
		};
		setStagedEntries((prev) => ({ ...prev, [key]: entry }));

		if (showToast) {
			toast.success("Changes staged");
		}
		return true;
	};

	const loadTarget = (target: ActiveTarget) => {
		const key = getTargetKey(target);
		const staged = stagedEntries[key];
		if (staged) {
			editorState.loadDraft(staged.draft, { markAsOriginal: true });
			setEditingBanner(target.banner);
			setEditorMode(target.banner ? "edit" : "create");
			setActiveTarget(target);
			return;
		}

		if (target.banner) {
			editorState.loadBanner(target.banner);
			setEditingBanner(target.banner);
			setEditorMode("edit");
		} else {
			editorState.resetToBlank();
			editorState.setField("placement", placementFromSection(target.section));
			editorState.setField("sortOrder", target.position - 1);
			setEditingBanner(null);
			setEditorMode("create");
		}
		setActiveTarget(target);
	};

	const switchTarget = (target: ActiveTarget) => {
		if (activeTarget && editorState.isDirty) {
			const ok = stageCurrent(false, false);
			if (!ok) return;
		}
		loadTarget(target);
	};

	// Editor actions
	function openAddEditor() {
		const firstHero = orderedHeroBanners[0] || null;
		switchTarget({
			section: "hero",
			position: 1,
			banner: firstHero,
		});

		// Scroll to editor
		setTimeout(() => {
			document.getElementById("banner-editor")?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}, 100);
	}

	function openEditEditor(banner: AdminBannerListItemDTO) {
		switchTarget({
			section: sectionFromPlacement(banner.placement),
			position: banner.sortOrder + 1,
			banner,
		});

		// Scroll to editor
		setTimeout(() => {
			document.getElementById("banner-editor")?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
		}, 100);
	}

	function handleSelectPromoCard(banner: AdminBannerListItemDTO | null, position: number) {
		switchTarget({ section: "promo", position, banner });
	}

	function handleSelectHeroSlide(
		banner: AdminBannerListItemDTO | null,
		position: number,
	) {
		switchTarget({ section: "hero", position, banner });
	}

	function handleSelectArrivalSlot(
		banner: AdminBannerListItemDTO | null,
		position: number,
	) {
		switchTarget({ section: "arrival", position, banner });
	}

	function handleAddHeroSlide() {
		switchTarget({
			section: "hero",
			position: orderedHeroBanners.length + 1,
			banner: null,
		});
	}

	function handleHeroReorder(orderedIds: string[]) {
		const currentIds = heroBanners.map((banner) => banner.id);
		const hasChanged = orderedIds.some((id, index) => id !== currentIds[index]);
		setStagedHeroOrder(hasChanged ? orderedIds : null);
		toast.success(hasChanged ? "Hero slide order staged" : "Hero slide order reset");
	}

	function closeEditor() {
		setEditorMode("closed");
		setEditingBanner(null);
		setActiveTarget(null);
		editorState.resetToBlank();
	}

	function handleCancelEditor() {
		if (editorState.isDirty) {
			setDiscardModalOpen(true);
		} else {
			closeEditor();
		}
	}

	async function persistStagedEntry(entry: StagedEntry) {
		const { draft, target } = entry;
		let imageUrl = draft.imageUrl;
		let s3Key = draft.existingS3Key;

		if (draft.imageFile) {
			const uploadResult = await uploadImageMutation.mutateAsync(draft.imageFile);
			imageUrl = uploadResult.url;
			s3Key = uploadResult.s3Key;
		}

		if (!imageUrl || !s3Key) {
			throw new Error("Image is required");
		}

		const payload = {
			titleEn: draft.titleEn,
			titleBn: draft.titleBn || undefined,
			subtitleEn: draft.subtitleEn || undefined,
			subtitleBn: draft.subtitleBn || undefined,
			priceLabel: draft.priceLabel || undefined,
			badgeText: draft.badgeText || undefined,
			badgeColor: (draft.badgeColor as
				| "red"
				| "teal"
				| "purple"
				| "orange"
				| "green"
				| undefined) || undefined,
			ctaText: draft.ctaText || undefined,
			discountPercentage: draft.discountPercentage || undefined,
			imageUrl,
			s3Key,
			linkUrl: draft.linkUrl || undefined,
			placement: placementFromSection(target.section),
			isActive: draft.isActive,
			sortOrder: draft.sortOrder,
			startsAt: draft.startsAt ? draft.startsAt.toISOString() : undefined,
			endsAt: draft.endsAt ? draft.endsAt.toISOString() : undefined,
		};

		if (target.banner?.id) {
			const response = await api.admin.banners[":bannerId"].$put({
				param: { bannerId: target.banner.id },
				json: payload,
			});
			if (!response.ok) {
				const errorData: any = await response.json();
				throw new Error(errorData.error || "Failed to update banner");
			}
			return;
		}

		const response = await api.admin.banners.$post({ json: payload });
		if (!response.ok) {
			const errorData: any = await response.json();
			throw new Error(errorData.error || "Failed to create banner");
		}
	}

	async function handlePublishAll() {
		const pendingMap: Record<string, StagedEntry> = { ...stagedEntries };

		if (activeTarget && editorState.isDirty) {
			const errors = editorState.validate();
			if (errors) {
				toast.error(Object.values(errors)[0]);
				return;
			}
			const key = getTargetKey(activeTarget);
			pendingMap[key] = {
				key,
				target: activeTarget,
				draft: cloneBannerDraft(editorState.draft),
			};
		}
		const stagedList = Object.values(pendingMap);
		for (const entry of stagedList) {
			const errors = validateBannerDraft(entry.draft, {
				requireImage: !entry.target.banner,
			});
			if (errors) {
				toast.error(
					`${getTargetLabel(entry.target)}: ${Object.values(errors)[0]}`,
				);
				return;
			}
		}

		if (stagedList.length === 0 && !stagedHeroOrder?.length) {
			toast.error("No staged changes to publish");
			return;
		}

		setIsPublishingAll(true);
		try {
			for (const entry of stagedList) {
				await persistStagedEntry(entry);
			}

			if (stagedHeroOrder?.length) {
				const response = await api.admin.banners.reorder.$patch({
					json: {
						banners: stagedHeroOrder.map((id, index) => ({
							id,
							sortOrder: index,
						})),
					},
				});

				if (!response.ok) {
					throw new Error("Failed to reorder hero slides");
				}
			}

			await queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
			await queryClient.invalidateQueries({ queryKey: ["banners"] });
			toast.success("Homepage changes published");
			setStagedEntries({});
			setStagedHeroOrder(null);
			closeEditor();
		} catch (error: any) {
			toast.error(error?.message || t.error);
		} finally {
			setIsPublishingAll(false);
		}
	}

	const isSubmitting = uploadImageMutation.isPending;

	const validationErrors = activeTarget
		? validateBannerDraft(editorState.draft, {
			requireImage: !activeTarget.banner,
		})
		: editorState.validate();
	const selectedPromoPosition =
		activeTarget?.section === "promo" ? activeTarget.position : null;
	const selectedArrivalPosition =
		activeTarget?.section === "arrival" ? activeTarget.position : null;
	const selectedHeroBannerId =
		activeTarget?.section === "hero" ? activeTarget.banner?.id || null : null;
	const activeTargetLabel = activeTarget ? getTargetLabel(activeTarget) : "None";
	const activeTargetKey = activeTarget ? getTargetKey(activeTarget) : null;
	const hasCurrentStaged = activeTargetKey ? !!stagedEntries[activeTargetKey] : false;
	const stagedCount =
		Object.keys(stagedEntries).length +
		(stagedHeroOrder?.length ? 1 : 0) +
		(activeTarget && editorState.isDirty && !hasCurrentStaged ? 1 : 0);
	const previewPromoBanners = [1, 2, 3].map((position) => {
		const source = promoBanners[position - 1] || null;
		const liveDraft =
			activeTarget?.section === "promo" &&
			activeTarget.position === position &&
			editorState.isDirty
				? editorState.draft
				: null;
		const stagedDraft = stagedEntries[`promo:${position}`]?.draft || null;
		const displayDraft = liveDraft || stagedDraft;
		if (!displayDraft) return source;
		return buildPreviewBanner({
			draft: displayDraft,
			fallback: source,
			section: "promo",
			position,
			idOverride: source?.id,
		});
	});
	const previewArrivalBanners = [1, 2, 3, 4, 5, 6].map((position) => {
		const source = arrivalBanners[position - 1] || null;
		const liveDraft =
			activeTarget?.section === "arrival" &&
			activeTarget.position === position &&
			editorState.isDirty
				? editorState.draft
				: null;
		const stagedDraft = stagedEntries[`arrival:${position}`]?.draft || null;
		const displayDraft = liveDraft || stagedDraft;
		if (!displayDraft) return source;
		return buildPreviewBanner({
			draft: displayDraft,
			fallback: source,
			section: "arrival",
			position,
			idOverride: source?.id,
		});
	});
	const previewHeroBanners = orderedHeroBanners.map((banner, index) => {
		const position = index + 1;
		const liveDraft =
			activeTarget?.section === "hero" &&
			activeTarget.banner?.id === banner.id &&
			editorState.isDirty
				? editorState.draft
				: null;
		const stagedDraft = stagedEntries[`hero:${banner.id}`]?.draft || null;
		const displayDraft = liveDraft || stagedDraft;
		if (!displayDraft) return banner;
		return buildPreviewBanner({
			draft: displayDraft,
			fallback: banner,
			section: "hero",
			position,
			idOverride: banner.id,
		});
	});

	// Keep staged/dirty "new hero slide" visible even when not actively selected.
	const stagedNewHeroByPosition = new Map<number, BannerDraft>();
	for (const entry of Object.values(stagedEntries)) {
		if (
			entry.target.section === "hero" &&
			!entry.target.banner &&
			entry.target.position > 0
		) {
			stagedNewHeroByPosition.set(entry.target.position, entry.draft);
		}
	}
	if (
		activeTarget?.section === "hero" &&
		!activeTarget.banner &&
		editorState.isDirty &&
		activeTarget.position > 0
	) {
		stagedNewHeroByPosition.set(activeTarget.position, editorState.draft);
	}
	const newHeroPositions = [...stagedNewHeroByPosition.keys()]
		.filter((position) => position > previewHeroBanners.length)
		.sort((a, b) => a - b);
	for (const position of newHeroPositions) {
		const draft = stagedNewHeroByPosition.get(position);
		if (!draft) continue;
		previewHeroBanners.push(
			buildPreviewBanner({
				draft,
				fallback: null,
				section: "hero",
				position,
				idOverride: `__draft__hero_${position}`,
			}),
		);
	}

	return (
		<Stack gap="lg">
			{/* Header */}
			<Group justify="space-between" wrap="wrap">
				<Title
					order={2}
					style={{
						color: isDark
							? "oklch(0.95 0.02 260)"
							: "oklch(0.25 0.02 260)",
					}}
				>
					{t.title}
				</Title>
				<Group gap="sm">
					<Button
						variant="light"
						color="orange"
						onClick={() => {
							// Open unified editor with first hero slide selected
							const firstHero = orderedHeroBanners[0] || null;
							handleSelectHeroSlide(firstHero, 1);
							setTimeout(() => {
								document.getElementById("banner-editor")?.scrollIntoView({
									behavior: "smooth",
									block: "start",
								});
							}, 100);
						}}
					>
						Open Interactive Editor
					</Button>
					<Button
						leftSection={<Plus size={18} />}
						onClick={openAddEditor}
						style={{
							background:
								"linear-gradient(135deg, oklch(0.65 0.15 175), oklch(0.55 0.15 200))",
							color: "white",
						}}
					>
						{t.addBanner}
					</Button>
				</Group>
			</Group>

			{/* Banner Table */}
			<Paper
				p="md"
				radius="lg"
				style={{
					background: isDark
						? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
						: "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 150) 100%)",
					border: isDark
						? "1px solid oklch(0.3 0.02 260 / 0.3)"
						: "1px solid oklch(0.92 0.01 260 / 0.2)",
				}}
			>
				{isLoading ? (
					<Stack gap="xs">
						{Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} height={60} radius="md" />
						))}
					</Stack>
				) : banners && banners.length > 0 ? (
					<Table highlightOnHover>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>{t.image}</Table.Th>
								<Table.Th>{t.titleLabel}</Table.Th>
								<Table.Th>{t.placement}</Table.Th>
								<Table.Th>{t.active}</Table.Th>
								<Table.Th>{t.sortOrder}</Table.Th>
								<Table.Th>{t.actions}</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{banners.map((banner) => (
								<Table.Tr
									key={banner.id}
									style={{
										background:
											editingBanner?.id === banner.id
												? isDark
													? "oklch(0.25 0.04 175 / 0.2)"
													: "oklch(0.95 0.03 175 / 0.3)"
												: undefined,
									}}
								>
									<Table.Td>
										<Image
											src={banner.imageUrl}
											alt={banner.titleEn}
											w={80}
											h={45}
											fit="cover"
											radius="sm"
											fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNDUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjQ1IiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtc2l6ZT0iMTAiPk5vIEltZzwvdGV4dD48L3N2Zz4="
										/>
									</Table.Td>
									<Table.Td>
										<Text size="sm" fw={500} lineClamp={1}>
											{language === "en"
												? banner.titleEn
												: banner.titleBn || banner.titleEn}
										</Text>
									</Table.Td>
									<Table.Td>
										<Badge
											size="xs"
											variant="light"
											color={
												banner.placement === "hero_carousel"
													? "blue"
													: banner.placement === "promotional_card"
														? "orange"
														: "gray"
											}
										>
											{t[banner.placement as keyof typeof t] as string}
										</Badge>
									</Table.Td>
									<Table.Td>
										<Badge
											size="xs"
											color={banner.isActive ? "green" : "gray"}
											radius="md"
										>
											{banner.isActive ? t.active : t.inactive}
										</Badge>
									</Table.Td>
									<Table.Td>
										<Text size="sm">{banner.sortOrder}</Text>
									</Table.Td>
									<Table.Td>
										<Group gap={4}>
											<ActionIcon
												variant="subtle"
												color="blue"
												size="sm"
												onClick={() => openEditEditor(banner)}
											>
												<Pencil size={14} />
											</ActionIcon>
											<ActionIcon
												variant="subtle"
												color="red"
												size="sm"
												onClick={() => {
													setBannerToDelete(banner);
													setDeleteModalOpen(true);
												}}
											>
												<Trash2 size={14} />
											</ActionIcon>
										</Group>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				) : (
					<Stack align="center" py="xl" gap="xs">
						<ImageIcon size={40} className="text-zinc-400 opacity-50" />
						<Text c="dimmed" ta="center" size="sm">
							{t.noResults}
						</Text>
					</Stack>
				)}
			</Paper>

			{/* Live Banner Editor (visible when editorMode !== "closed") */}
			{editorMode !== "closed" && (
				<Paper
					id="banner-editor"
					p="lg"
					radius="lg"
					style={{
						background: isDark
							? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
							: "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 150) 100%)",
						border: isDark
							? "2px solid oklch(0.4 0.1 175 / 0.4)"
							: "2px solid oklch(0.7 0.1 175 / 0.3)",
						boxShadow: "0 8px 32px oklch(0.65 0.15 175 / 0.15)",
					}}
				>
					{/* Toolbar */}
					<BannerEditorToolbar
						editorState={editorState}
						isEditing={editorMode === "edit"}
						isSubmitting={isSubmitting}
						onSave={() => stageCurrent(true)}
						onPublishAll={handlePublishAll}
						isPublishingAll={isPublishingAll}
						stagedCount={stagedCount}
						activeTargetLabel={activeTargetLabel}
						onCancel={handleCancelEditor}
						validationErrors={validationErrors}
						bannerTitle={editingBanner?.titleEn}
					/>

					{/* Unified interactive homepage dashboard */}
					<PromotionalCardsEditor
						editorState={editorState}
						isUploading={uploadImageMutation.isPending}
						allPromoBanners={promoBanners}
						allHeroBanners={orderedHeroBanners}
						allArrivalBanners={arrivalBanners}
						previewPromoBanners={previewPromoBanners}
						previewHeroBanners={previewHeroBanners}
						previewArrivalBanners={previewArrivalBanners}
						selectedPromoPosition={selectedPromoPosition}
						selectedHeroBannerId={selectedHeroBannerId}
						selectedArrivalPosition={selectedArrivalPosition}
						activeSection={activeTarget?.section || null}
						onSelectPromoCard={handleSelectPromoCard}
						onSelectHeroSlide={handleSelectHeroSlide}
						onSelectArrivalSlot={handleSelectArrivalSlot}
						onAddHeroSlide={handleAddHeroSlide}
						onHeroReorder={handleHeroReorder}
					/>
				</Paper>
			)}

			{/* Delete Confirmation Modal */}
			<Modal
				opened={deleteModalOpen}
				onClose={() => {
					setDeleteModalOpen(false);
					setBannerToDelete(null);
				}}
				title={t.deleteTitle}
			>
				<Stack gap="md">
					<Text>{t.deleteMessage}</Text>
					<Group justify="flex-end" gap="sm">
						<Button
							variant="default"
							onClick={() => {
								setDeleteModalOpen(false);
								setBannerToDelete(null);
							}}
						>
							{t.cancel}
						</Button>
						<Button
							color="red"
							loading={deleteBannerMutation.isPending}
							onClick={() =>
								bannerToDelete && deleteBannerMutation.mutate(bannerToDelete.id)
							}
						>
							{deleteBannerMutation.isPending ? t.deleting : t.deleteConfirm}
						</Button>
					</Group>
				</Stack>
			</Modal>

			{/* Discard Changes Confirmation Modal */}
			<Modal
				opened={discardModalOpen}
				onClose={() => setDiscardModalOpen(false)}
				title={t.confirmDiscard}
			>
				<Stack gap="md">
					<Text>{t.confirmDiscardMessage}</Text>
					<Group justify="flex-end" gap="sm">
						<Button variant="default" onClick={() => setDiscardModalOpen(false)}>
							{t.cancel}
						</Button>
						<Button
							color="red"
							onClick={() => {
								setDiscardModalOpen(false);
								closeEditor();
							}}
						>
							{t.discard}
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Stack>
	);
}
