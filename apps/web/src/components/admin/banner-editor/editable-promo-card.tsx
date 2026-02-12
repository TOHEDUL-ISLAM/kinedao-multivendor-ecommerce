import { EditableTextField } from "./editable-text-field";
import { EditableBadge } from "./editable-badge";
import { ImageUploadOverlay } from "./image-upload-overlay";
import type { UseBannerEditorStateReturn } from "./use-banner-editor-state";
import { useLanguage } from "@/lib/i18n/use-language";
import { editorLabels } from "./banner-editor-labels";
import {
	PROMO_CARD_EDITING_SHADOW_CLASS,
	PROMO_CARD_FRAME_CLASS,
} from "./promo-card-layout";

interface EditablePromoCardProps {
	editorState: UseBannerEditorStateReturn;
	isUploading: boolean;
}

// Placeholder image for when no image is selected
const PLACEHOLDER_IMAGE =
	"data:image/svg+xml,%3Csvg width='600' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='600' height='400' fill='%23334155'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='20' font-family='system-ui'%3EClick to upload%3C/text%3E%3C/svg%3E";

export function EditablePromoCard({
	editorState,
	isUploading,
}: EditablePromoCardProps) {
	const { language } = useLanguage();
	const t = editorLabels[language];

	const {
		draft,
		editingField,
		editorLanguage,
		setField,
		setEditingField,
		setImageFile,
	} = editorState;

	const imageUrl = draft.imageUrl || PLACEHOLDER_IMAGE;
	const hasImage = !!draft.imageUrl;

	// Determine which language fields to display
	const title = editorLanguage === "en" ? draft.titleEn : draft.titleBn;
	const subtitle = editorLanguage === "en" ? draft.subtitleEn : draft.subtitleBn;
	const titleField = editorLanguage === "en" ? "titleEn" : "titleBn";
	const subtitleField = editorLanguage === "en" ? "subtitleEn" : "subtitleBn";

	return (
		<div
			className={`relative ${PROMO_CARD_FRAME_CLASS} ${PROMO_CARD_EDITING_SHADOW_CLASS}`}
		>
			{/* Background image */}
			<img
				src={imageUrl}
				alt="Promo banner preview"
				className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
				style={{ opacity: hasImage ? 1 : 0.3 }}
			/>

			{/* Gradient overlay from bottom */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10 pointer-events-none" />

			{/* Image upload overlay - covers top 60% of card (badge + empty space) */}
			<div className="absolute inset-0 bottom-[40%]" style={{ zIndex: 5 }}>
				<ImageUploadOverlay
					onFileSelect={setImageFile}
					isUploading={isUploading}
					hasImage={hasImage}
					forceCompact
				/>
			</div>

			{/* Badge - top left */}
			<div className="absolute top-2 left-2" style={{ zIndex: 30 }}>
				{(draft.badgeText || editingField === "badgeText") && (
					<EditableBadge
						text={draft.badgeText}
						color={draft.badgeColor}
						onTextChange={(value) => setField("badgeText", value)}
						onColorChange={(value) => setField("badgeColor", value)}
						isEditing={editingField === "badgeText"}
						onStartEdit={() => setEditingField("badgeText")}
						onFinishEdit={() => setEditingField(null)}
						placeholder={t.badgePlaceholder}
					/>
				)}

				{/* Discount badge (if no custom badge and discount exists) */}
				{!draft.badgeText &&
					editingField !== "badgeText" &&
					draft.discountPercentage && (
						<span className="inline-block px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-bold">
							{draft.discountPercentage}% OFF
						</span>
					)}
			</div>

			{/* Content - bottom section (HIGHEST z-index - must be clickable) */}
			<div className="absolute bottom-0 left-0 right-0 p-3" style={{ zIndex: 40 }}>
				{/* Title */}
				<EditableTextField
					value={title}
					onChange={(value) => setField(titleField as any, value)}
					isEditing={editingField === titleField}
					onStartEdit={() => setEditingField(titleField)}
					onFinishEdit={() => setEditingField(null)}
					placeholder={t.titlePlaceholder}
					className="font-bold text-white leading-tight text-base lg:text-lg mb-1"
					as="h2"
					maxLength={200}
				/>

				{/* Subtitle */}
				<EditableTextField
					value={subtitle}
					onChange={(value) => setField(subtitleField as any, value)}
					isEditing={editingField === subtitleField}
					onStartEdit={() => setEditingField(subtitleField)}
					onFinishEdit={() => setEditingField(null)}
					placeholder={t.subtitlePlaceholder}
					className="text-xs text-white/75 line-clamp-1"
					as="p"
					maxLength={300}
				/>
			</div>

			{/* Corner indicator showing which language is being edited */}
			<div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium pointer-events-none" style={{ zIndex: 40 }}>
				{editorLanguage.toUpperCase()}
			</div>
		</div>
	);
}
