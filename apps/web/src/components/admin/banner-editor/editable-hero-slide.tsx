import { EditableTextField } from "./editable-text-field";
import { EditableBadge } from "./editable-badge";
import { ImageUploadOverlay } from "./image-upload-overlay";
import type { UseBannerEditorStateReturn } from "./use-banner-editor-state";
import { useLanguage } from "@/lib/i18n/use-language";
import { editorLabels } from "./banner-editor-labels";

interface EditableHeroSlideProps {
	editorState: UseBannerEditorStateReturn;
	isUploading: boolean;
}

// Placeholder image for when no image is selected
const PLACEHOLDER_IMAGE =
	"data:image/svg+xml,%3Csvg width='1200' height='500' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1200' height='500' fill='%23334155'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='24' font-family='system-ui'%3EClick to upload image%3C/text%3E%3C/svg%3E";

export function EditableHeroSlide({
	editorState,
	isUploading,
}: EditableHeroSlideProps) {
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
		<div className="relative h-[280px] sm:h-[350px] lg:h-[420px] rounded-lg lg:rounded-xl overflow-hidden shadow-2xl">
			{/* Background image */}
			<img
				src={imageUrl}
				alt="Banner preview"
				className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
				style={{ opacity: hasImage ? 1 : 0.3 }}
			/>

			{/* Gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent pointer-events-none" style={{ zIndex: 1 }} />

			{/* Image upload overlay - only on the RIGHT SIDE where there's no text */}
			<div className="absolute inset-0 left-1/2 pointer-events-auto" style={{ zIndex: 5 }}>
				<ImageUploadOverlay
					onFileSelect={setImageFile}
					isUploading={isUploading}
					hasImage={hasImage}
					forceCompact
				/>
			</div>

			{/* Content overlay - left aligned (HIGHEST z-index so text is clickable) */}
			<div className="relative h-full flex flex-col justify-center px-6 sm:px-8 lg:px-12 max-w-md pointer-events-auto" style={{ zIndex: 30 }}>
				{/* Badge */}
				{(draft.badgeText || editingField === "badgeText") && (
					<div className="mb-3">
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
					</div>
				)}

				{/* Discount badge (if no custom badge and discount exists) */}
				{!draft.badgeText &&
					editingField !== "badgeText" &&
					draft.discountPercentage && (
						<span className="inline-block px-3 py-1 rounded-full bg-red-500 text-white text-xs sm:text-sm font-bold mb-3 w-fit">
							{draft.discountPercentage}% OFF
						</span>
					)}

				{/* Title */}
				<EditableTextField
					value={title}
					onChange={(value) => setField(titleField as any, value)}
					isEditing={editingField === titleField}
					onStartEdit={() => setEditingField(titleField)}
					onFinishEdit={() => setEditingField(null)}
					placeholder={t.titlePlaceholder}
					className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight"
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
					className="text-sm sm:text-base text-white/85 mb-2 line-clamp-2"
					as="p"
					maxLength={300}
					multiline
				/>

				{/* Price Label */}
				<EditableTextField
					value={draft.priceLabel}
					onChange={(value) => setField("priceLabel", value)}
					isEditing={editingField === "priceLabel"}
					onStartEdit={() => setEditingField("priceLabel")}
					onFinishEdit={() => setEditingField(null)}
					placeholder={t.pricePlaceholder}
					className="text-lg sm:text-xl lg:text-2xl font-bold text-teal-400 mb-4"
					as="p"
					maxLength={100}
				/>

				{/* CTA Button */}
				<div className="w-fit">
					<EditableTextField
						value={draft.ctaText}
						onChange={(value) => setField("ctaText", value)}
						isEditing={editingField === "ctaText"}
						onStartEdit={() => setEditingField("ctaText")}
						onFinishEdit={() => setEditingField(null)}
						placeholder={t.ctaPlaceholder}
						className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm sm:text-base px-6 py-2 sm:py-2.5 rounded-full transition-colors"
						inputClassName="rounded-full"
						as="span"
						maxLength={100}
					/>
				</div>
			</div>

			{/* Corner indicator showing which language is being edited */}
			<div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium pointer-events-none" style={{ zIndex: 40 }}>
				{editorLanguage.toUpperCase()}
			</div>
		</div>
	);
}
