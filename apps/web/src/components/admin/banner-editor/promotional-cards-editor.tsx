import { useMemo, useState } from "react";
import { Paper, Text, Badge, Button } from "@mantine/core";
import { Plus, GripVertical } from "lucide-react";
import { useTheme } from "next-themes";
import { EditablePromoCard } from "./editable-promo-card";
import { EditableHeroSlide } from "./editable-hero-slide";
import { ImageUploadOverlay } from "./image-upload-overlay";
import type {
	BannerDraft,
	UseBannerEditorStateReturn,
} from "./use-banner-editor-state";
import type { AdminBannerListItemDTO } from "@kineDao.com/api-types/admin";
import type { BannerDTO } from "@kineDao.com/api-types/catalog";
import { useLanguage } from "@/lib/i18n/use-language";
import { HeroBanners } from "@/components/homepage/hero-banners";
import {
	PROMO_CARD_FRAME_CLASS,
	PROMO_CARD_RADIUS_CLASS,
	PROMO_CARD_SHADOW_CLASS,
	PROMO_CARD_STACK_GAP_CLASS,
} from "./promo-card-layout";

type ActiveSection = "hero" | "promo" | "arrival" | null;

interface PromotionalCardsEditorProps {
	editorState: UseBannerEditorStateReturn;
	isUploading: boolean;
	allPromoBanners: AdminBannerListItemDTO[];
	allHeroBanners: AdminBannerListItemDTO[];
	allArrivalBanners: AdminBannerListItemDTO[];
	previewPromoBanners: Array<AdminBannerListItemDTO | null>;
	previewHeroBanners: AdminBannerListItemDTO[];
	previewArrivalBanners: Array<AdminBannerListItemDTO | null>;
	selectedPromoPosition: number | null;
	selectedHeroBannerId: string | null;
	selectedArrivalPosition: number | null;
	activeSection: ActiveSection;
	onSelectPromoCard: (banner: AdminBannerListItemDTO | null, position: number) => void;
	onSelectHeroSlide: (
		banner: AdminBannerListItemDTO | null,
		position: number,
	) => void;
	onSelectArrivalSlot: (
		banner: AdminBannerListItemDTO | null,
		position: number,
	) => void;
	onAddHeroSlide: () => void;
	onHeroReorder: (orderedIds: string[]) => void;
}

interface PromoCardItem {
	position: number;
	sourceBanner: AdminBannerListItemDTO | null;
	displayBanner: AdminBannerListItemDTO | null;
	label: string;
}

interface ArrivalSlotItem {
	position: number;
	sourceBanner: AdminBannerListItemDTO | null;
	displayBanner: AdminBannerListItemDTO | null;
}

export function PromotionalCardsEditor({
	editorState,
	isUploading,
	allPromoBanners,
	allHeroBanners,
	allArrivalBanners,
	previewPromoBanners,
	previewHeroBanners,
	previewArrivalBanners,
	selectedPromoPosition,
	selectedHeroBannerId,
	selectedArrivalPosition,
	activeSection,
	onSelectPromoCard,
	onSelectHeroSlide,
	onSelectArrivalSlot,
	onAddHeroSlide,
	onHeroReorder,
}: PromotionalCardsEditorProps) {
	const { resolvedTheme } = useTheme();
	const { language } = useLanguage();
	const isDark = resolvedTheme === "dark";
	const [dragHeroId, setDragHeroId] = useState<string | null>(null);

	const promoCards = [
		{
			position: 1,
			sourceBanner: allPromoBanners[0] || null,
			displayBanner: previewPromoBanners[0] || null,
			label: "Card 1",
		},
		{
			position: 2,
			sourceBanner: allPromoBanners[1] || null,
			displayBanner: previewPromoBanners[1] || null,
			label: "Card 2",
		},
		{
			position: 3,
			sourceBanner: allPromoBanners[2] || null,
			displayBanner: previewPromoBanners[2] || null,
			label: "Card 3",
		},
	] satisfies PromoCardItem[];

	const arrivalSlots = Array.from({ length: 6 }, (_, index) => ({
		position: index + 1,
		sourceBanner: allArrivalBanners[index] || null,
		displayBanner: previewArrivalBanners[index] || null,
	})) satisfies ArrivalSlotItem[];

	const heroPreviewBanners: BannerDTO[] = useMemo(
		() => previewHeroBanners.map(mapAdminBannerToBanner),
		[previewHeroBanners],
	);

	const heroIds = allHeroBanners.map((banner) => banner.id);

	const moveHeroSlide = (targetId: string) => {
		if (!dragHeroId || dragHeroId === targetId) return;

		const sourceIndex = heroIds.indexOf(dragHeroId);
		const targetIndex = heroIds.indexOf(targetId);
		if (sourceIndex < 0 || targetIndex < 0) return;

		const nextIds = [...heroIds];
		const [moved] = nextIds.splice(sourceIndex, 1);
		if (!moved) return;
		nextIds.splice(targetIndex, 0, moved);
		onHeroReorder(nextIds);
		setDragHeroId(null);
	};

	return (
		<div className="space-y-4">
			<Paper
				p="md"
				radius="md"
				style={{
					background: isDark
						? "oklch(0.25 0.02 260 / 0.5)"
						: "oklch(0.95 0.02 175 / 0.5)",
					border: isDark
						? "1px solid oklch(0.35 0.02 260)"
						: "1px solid oklch(0.85 0.02 175)",
				}}
			>
				<Text size="sm" fw={500} mb="xs">
					📌 Homepage Interactive Editor
				</Text>
				<Text size="xs" c="dimmed">
					Click Hero, Promotional Cards, or New Arrivals slots directly in this preview
					to edit them. Stage multiple elements, then publish all together.
				</Text>
			</Paper>

			{/* Mobile fallback - stacked slots */}
			<div className="lg:hidden space-y-4">
				<PromoCardsStack
					cards={promoCards}
					editorState={editorState}
					isUploading={isUploading}
					onSelectCard={onSelectPromoCard}
					selectedPosition={selectedPromoPosition}
					language={language}
					isActive={activeSection === "promo"}
				/>
				<div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-2">
					{activeSection === "hero" ? (
						<EditableHeroSlide editorState={editorState} isUploading={isUploading} />
					) : (
						<HeroBanners banners={heroPreviewBanners} />
					)}
				</div>
				<ArrivalSlotsGrid
					slots={arrivalSlots}
					editorState={editorState}
					isUploading={isUploading}
					selectedPosition={selectedArrivalPosition}
					language={language}
					isActive={activeSection === "arrival"}
					onSelectSlot={onSelectArrivalSlot}
				/>
			</div>

			{/* Desktop unified dashboard */}
			<div className="hidden lg:grid lg:grid-cols-12 lg:gap-4">
				<div
					className={`lg:col-span-3 h-[420px] rounded-lg p-1 transition-all ${
						activeSection === "promo"
							? "ring-2 ring-teal-400"
							: "ring-1 ring-transparent"
					}`}
				>
					<PromoCardsStack
						cards={promoCards}
						editorState={editorState}
						isUploading={isUploading}
						onSelectCard={onSelectPromoCard}
						selectedPosition={selectedPromoPosition}
						language={language}
						fullHeight
						isActive={activeSection === "promo"}
					/>
				</div>

				<div
					className={`lg:col-span-6 rounded-lg p-1 transition-all ${
						activeSection === "hero"
							? "ring-2 ring-teal-400"
							: "ring-1 ring-transparent"
					}`}
				>
					{activeSection === "hero" ? (
						<EditableHeroSlide editorState={editorState} isUploading={isUploading} />
					) : (
						<div
							className="cursor-pointer"
							onClick={() => {
								const firstPreview = previewHeroBanners[0] || null;
								const firstSource = firstPreview
									? allHeroBanners.find((banner) => banner.id === firstPreview.id) || null
									: null;
								onSelectHeroSlide(firstSource, 1);
							}}
						>
							<div className="pointer-events-none">
								<HeroBanners banners={heroPreviewBanners} />
							</div>
						</div>
					)}

					<div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
						{previewHeroBanners.map((banner, index) => {
							const isSelected = selectedHeroBannerId === banner.id;
							const sourceBanner =
								allHeroBanners.find((candidate) => candidate.id === banner.id) || null;
							const isExistingSlide = !!sourceBanner;
							const title =
								language === "bn" && banner.titleBn
									? banner.titleBn
									: banner.titleEn;

							return (
								<button
									key={banner.id}
									type="button"
									draggable={isExistingSlide}
									onDragStart={() => {
										if (isExistingSlide) setDragHeroId(banner.id);
									}}
									onDragOver={(e) => e.preventDefault()}
									onDrop={() => {
										if (isExistingSlide) moveHeroSlide(banner.id);
									}}
									onClick={() => onSelectHeroSlide(sourceBanner, index + 1)}
									className={`relative min-w-[108px] rounded-md overflow-hidden border text-left ${
										isSelected
											? "border-teal-400 ring-2 ring-teal-300/60"
											: "border-zinc-200 dark:border-zinc-700"
									}`}
								>
									<img
										src={banner.imageUrl}
										alt={title}
										className="w-full h-16 object-cover"
									/>
									<div className="px-2 py-1 bg-white dark:bg-zinc-900">
										<Text size="xs" fw={600} lineClamp={1}>
											Slide {index + 1}
										</Text>
									</div>
									<div className="absolute top-1 left-1 rounded bg-black/50 p-0.5">
										<GripVertical size={12} className="text-white" />
									</div>
								</button>
							);
						})}

						<Button
							variant="light"
							color="teal"
							leftSection={<Plus size={14} />}
							size="xs"
							onClick={onAddHeroSlide}
						>
							Add Slide
						</Button>
					</div>
				</div>

				<div
					className={`lg:col-span-3 h-[420px] rounded-lg p-1 transition-all ${
						activeSection === "arrival"
							? "ring-2 ring-teal-400"
							: "ring-1 ring-transparent"
					}`}
				>
					<ArrivalSlotsGrid
						slots={arrivalSlots}
						editorState={editorState}
						isUploading={isUploading}
						selectedPosition={selectedArrivalPosition}
						language={language}
						isActive={activeSection === "arrival"}
						onSelectSlot={onSelectArrivalSlot}
					/>
				</div>
			</div>
		</div>
	);
}

function mapAdminBannerToBanner(banner: AdminBannerListItemDTO): BannerDTO {
	return {
		id: banner.id,
		titleEn: banner.titleEn,
		titleBn: banner.titleBn,
		subtitleEn: banner.subtitleEn,
		subtitleBn: banner.subtitleBn,
		imageUrl: banner.imageUrl,
		linkUrl: banner.linkUrl,
		priceLabel: banner.priceLabel,
		badgeText: banner.badgeText,
		badgeColor: banner.badgeColor,
		ctaText: banner.ctaText,
		discountPercentage: banner.discountPercentage,
		placement: banner.placement,
		sortOrder: banner.sortOrder,
	};
}

function PromoCardsStack({
	cards,
	editorState,
	isUploading,
	onSelectCard,
	selectedPosition,
	language,
	fullHeight,
	isActive,
}: {
	cards: PromoCardItem[];
	editorState: UseBannerEditorStateReturn;
	isUploading: boolean;
	onSelectCard: (banner: AdminBannerListItemDTO | null, position: number) => void;
	selectedPosition: number | null;
	language: string;
	fullHeight?: boolean;
	isActive: boolean;
}) {
	return (
		<div className={`flex flex-col ${PROMO_CARD_STACK_GAP_CLASS} ${fullHeight ? "h-full" : ""}`}>
			{cards.map(({ position, sourceBanner, displayBanner, label }) => {
				const isSelected = selectedPosition === position && isActive;
				const isEditing = isSelected;

				return (
					<div key={position} className={`relative ${fullHeight ? "flex-1 min-h-[120px]" : "min-h-[120px]"}`}>
						{isSelected && (
							<div
								className={`absolute -top-2 -left-2 -right-2 -bottom-2 ${PROMO_CARD_RADIUS_CLASS} pointer-events-none`}
								style={{
									border: "3px solid oklch(0.65 0.15 175)",
									boxShadow: "0 0 0 4px oklch(0.65 0.15 175 / 0.2)",
									zIndex: 1,
								}}
							/>
						)}

						{!isEditing && (
							<div
								onClick={() => onSelectCard(sourceBanner, position)}
								className={`absolute inset-0 ${PROMO_CARD_RADIUS_CLASS} cursor-pointer transition-all hover:ring-2 hover:ring-teal-400 hover:ring-opacity-30`}
								style={{ zIndex: 2 }}
							>
								<div className="absolute top-2 left-2 px-3 py-1.5 rounded-full font-semibold text-sm transition-all pointer-events-none bg-white/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300">
									{label}
								</div>

								{!displayBanner && (
									<div
										className={`absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 ${PROMO_CARD_RADIUS_CLASS} pointer-events-none`}
									>
										<Text size="sm" c="dimmed" ta="center" px="md">
											Click to create {label}
										</Text>
									</div>
								)}
							</div>
						)}

						{isEditing ? (
							<EditablePromoCard
								editorState={editorState}
								isUploading={isUploading}
							/>
						) : displayBanner ? (
							<StaticPromoCard banner={displayBanner} language={language} />
						) : (
							<EmptyPromoCard />
						)}
					</div>
				);
			})}
		</div>
	);
}

function ArrivalSlotsGrid({
	slots,
	editorState,
	isUploading,
	selectedPosition,
	language,
	isActive,
	onSelectSlot,
}: {
	slots: ArrivalSlotItem[];
	editorState: UseBannerEditorStateReturn;
	isUploading: boolean;
	selectedPosition: number | null;
	language: string;
	isActive: boolean;
	onSelectSlot: (banner: AdminBannerListItemDTO | null, position: number) => void;
}) {
	return (
		<div className="h-full flex flex-col">
			<Text size="xl" fw={700} mb={8} px={4}>
				New Arrivals
			</Text>
		<div className="grid grid-cols-3 gap-2 flex-1">
			{slots.map(({ position, sourceBanner, displayBanner }) => {
				const isSelected = selectedPosition === position && isActive;
				const isEditing = isSelected;

					return (
						<div
							key={position}
							className={`relative rounded-md overflow-hidden ${
								isSelected ? "ring-2 ring-teal-400" : ""
							}`}
						>
							{!isEditing ? (
								<button
									type="button"
									onClick={() => onSelectSlot(sourceBanner, position)}
									className="w-full h-full"
								>
									{displayBanner ? (
										<StaticArrivalSlot banner={displayBanner} language={language} />
									) : (
										<EmptyArrivalSlot position={position} />
									)}
								</button>
							) : (
								<EditableArrivalSlot
									draft={editorState.draft}
									editorLanguage={editorState.editorLanguage}
									isUploading={isUploading}
									onFileSelect={editorState.setImageFile}
								/>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}

function StaticArrivalSlot({
	banner,
	language,
}: {
	banner: AdminBannerListItemDTO;
	language: string;
}) {
	const title =
		language === "bn" && banner.titleBn
			? banner.titleBn
			: banner.titleEn;

	return (
		<div className="h-full flex flex-col">
			<div className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
				<img
					src={banner.imageUrl}
					alt={title}
					className="w-full h-full object-cover"
				/>
			</div>
			<p className="text-[11px] font-semibold mt-1 text-center text-red-500 truncate">
				#{title.split(" ").slice(0, 2).join("")}
			</p>
		</div>
	);
}

function EditableArrivalSlot({
	draft,
	editorLanguage,
	isUploading,
	onFileSelect,
}: {
	draft: BannerDraft;
	editorLanguage: "en" | "bn";
	isUploading: boolean;
	onFileSelect: (file: File | null) => void;
}) {
	const title = editorLanguage === "bn" ? draft.titleBn : draft.titleEn;
	const imageUrl = draft.imageUrl;

	return (
		<div className="h-full flex flex-col">
			<div className="relative aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={title || "New arrival slot"}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
						Click to upload
					</div>
				)}

				<ImageUploadOverlay
					onFileSelect={(file) => onFileSelect(file)}
					isUploading={isUploading}
					hasImage={!!imageUrl}
					forceCompact
				/>
				<div className="absolute top-1 left-1 px-2 py-0.5 text-[10px] rounded-full bg-white/80 text-zinc-700">
					{editorLanguage.toUpperCase()}
				</div>
			</div>
			<p className="text-[11px] font-semibold mt-1 text-center text-blue-500 truncate">
				#{(title || "NewArrival").split(" ").slice(0, 2).join("")}
			</p>
		</div>
	);
}

function EmptyArrivalSlot({ position }: { position: number }) {
	return (
		<div className="h-full flex flex-col">
			<div className="aspect-[4/5] rounded-sm border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center px-1 text-[10px] text-zinc-500 text-center">
				Click to create Slot {position}
			</div>
			<p className="text-[11px] font-semibold mt-1 text-center text-zinc-400">
				#Empty
			</p>
		</div>
	);
}

// Static preview card (shows existing banner data)
function StaticPromoCard({
	banner,
	language,
}: {
	banner: AdminBannerListItemDTO;
	language: string;
}) {
	const title =
		language === "bn" && banner.titleBn
			? banner.titleBn
			: banner.titleEn;
	const subtitle =
		language === "bn" && banner.subtitleBn
			? banner.subtitleBn
			: banner.subtitleEn;

	const BADGE_COLORS: Record<string, string> = {
		red: "bg-red-500",
		teal: "bg-teal-500",
		purple: "bg-purple-500",
		orange: "bg-orange-500",
		green: "bg-green-500",
	};

	const badgeColorClass = banner.badgeColor
		? BADGE_COLORS[banner.badgeColor] || "bg-teal-500"
		: "bg-teal-500";

	return (
		<div className={`relative ${PROMO_CARD_FRAME_CLASS} ${PROMO_CARD_SHADOW_CLASS}`}>
			<img
				src={banner.imageUrl}
				alt={banner.titleEn}
				className="absolute inset-0 w-full h-full object-cover"
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />

			{(banner.badgeText || banner.discountPercentage) && (
				<div className="absolute top-2 left-2">
					<span
						className={`inline-block px-2 py-0.5 rounded-full text-white text-xs font-bold ${badgeColorClass}`}
					>
						{banner.badgeText || `${banner.discountPercentage}% OFF`}
					</span>
				</div>
			)}

			<div className="absolute bottom-0 left-0 right-0 p-3">
				<h3 className="font-bold text-white leading-tight text-base lg:text-lg mb-1">
					{title}
				</h3>
				{subtitle && (
					<p className="text-xs text-white/75 line-clamp-1">
						{subtitle}
					</p>
				)}
			</div>

			{!banner.isActive && (
				<div className="absolute top-2 right-2">
					<Badge size="xs" color="gray">
						Inactive
					</Badge>
				</div>
			)}
		</div>
	);
}

function EmptyPromoCard() {
	return (
		<div
			className={`relative ${PROMO_CARD_FRAME_CLASS} ${PROMO_CARD_SHADOW_CLASS} border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/50`}
		>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<div className="text-zinc-400 dark:text-zinc-600 mb-2">
					<svg
						className="w-12 h-12"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</div>
				<Text size="sm" c="dimmed" ta="center">
					Empty slot
				</Text>
			</div>
		</div>
	);
}
