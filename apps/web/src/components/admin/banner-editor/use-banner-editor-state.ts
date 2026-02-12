import { useState, useRef, useEffect } from "react";
import type { AdminBannerListItemDTO } from "@kineDao.com/api-types/admin";
import type { BannerDTO } from "@kineDao.com/api-types/catalog";
import type { EditorLanguage } from "./banner-editor-labels";

export interface BannerDraft {
	// Visual fields (edited inline on the hero)
	titleEn: string;
	titleBn: string;
	subtitleEn: string;
	subtitleBn: string;
	priceLabel: string;
	badgeText: string;
	badgeColor: string;
	ctaText: string;
	discountPercentage: number | null;

	// Image state
	imageUrl: string | null; // Current display URL (could be objectURL or S3 URL)
	imageFile: File | null; // Pending file for upload
	existingS3Key: string | null; // S3 key from existing banner (for updates)

	// Non-visual fields (edited via toolbar)
	linkUrl: string;
	placement: string;
	isActive: boolean;
	sortOrder: number;
	startsAt: Date | null;
	endsAt: Date | null;
}

export interface ValidationErrors {
	[key: string]: string;
}

const DEFAULT_DRAFT: BannerDraft = {
	titleEn: "",
	titleBn: "",
	subtitleEn: "",
	subtitleBn: "",
	priceLabel: "",
	badgeText: "",
	badgeColor: "",
	ctaText: "",
	discountPercentage: null,
	imageUrl: null,
	imageFile: null,
	existingS3Key: null,
	linkUrl: "",
	placement: "hero_carousel",
	isActive: true,
	sortOrder: 0,
	startsAt: null,
	endsAt: null,
};

export function cloneBannerDraft(draft: BannerDraft): BannerDraft {
	return {
		...draft,
		startsAt: draft.startsAt ? new Date(draft.startsAt) : null,
		endsAt: draft.endsAt ? new Date(draft.endsAt) : null,
	};
}

export function validateBannerDraft(
	draft: BannerDraft,
	options?: { requireImage?: boolean },
): ValidationErrors | null {
	const errors: ValidationErrors = {};

	// Title required
	if (!draft.titleEn.trim()) {
		errors.titleEn = "English title is required";
	}

	// Title max length
	if (draft.titleEn.length > 200) {
		errors.titleEn = "Title must be 200 characters or less";
	}

	if (draft.titleBn && draft.titleBn.length > 200) {
		errors.titleBn = "Title must be 200 characters or less";
	}

	// Subtitle max length
	if (draft.subtitleEn && draft.subtitleEn.length > 300) {
		errors.subtitleEn = "Subtitle must be 300 characters or less";
	}

	if (draft.subtitleBn && draft.subtitleBn.length > 300) {
		errors.subtitleBn = "Subtitle must be 300 characters or less";
	}

	// Other field lengths
	if (draft.priceLabel && draft.priceLabel.length > 100) {
		errors.priceLabel = "Price label must be 100 characters or less";
	}

	if (draft.badgeText && draft.badgeText.length > 50) {
		errors.badgeText = "Badge text must be 50 characters or less";
	}

	if (draft.ctaText && draft.ctaText.length > 100) {
		errors.ctaText = "CTA text must be 100 characters or less";
	}

	// Discount range
	if (
		draft.discountPercentage !== null &&
		(draft.discountPercentage < 1 || draft.discountPercentage > 100)
	) {
		errors.discountPercentage = "Discount must be between 1 and 100";
	}

	// Link URL format
	if (
		draft.linkUrl &&
		!draft.linkUrl.startsWith("/") &&
		!draft.linkUrl.startsWith("http")
	) {
		errors.linkUrl = "URL must start with / or http";
	}

	// Image required for new banners
	if (options?.requireImage && !draft.imageFile && !draft.imageUrl) {
		errors.image = "Image is required";
	}

	// Schedule validation
	if (draft.startsAt && draft.endsAt && draft.endsAt <= draft.startsAt) {
		errors.endsAt = "End date must be after start date";
	}

	return Object.keys(errors).length > 0 ? errors : null;
}

export function useBannerEditorState() {
	const [draft, setDraft] = useState<BannerDraft>(DEFAULT_DRAFT);
	const [editingField, setEditingField] = useState<string | null>(null);
	const [editorLanguage, setEditorLanguage] = useState<EditorLanguage>("en");

	// Snapshot of original banner for dirty checking
	const originalRef = useRef<BannerDraft | null>(null);

	// Current blob URL for cleanup
	const blobUrlRef = useRef<string | null>(null);

	// Compute isDirty
	const isDirty = originalRef.current
		? JSON.stringify(draft) !== JSON.stringify(originalRef.current)
		: draft.titleEn !== "" ||
				draft.titleBn !== "" ||
				draft.subtitleEn !== "" ||
				draft.subtitleBn !== "" ||
				draft.priceLabel !== "" ||
				draft.badgeText !== "" ||
				draft.ctaText !== "" ||
				draft.imageFile !== null ||
				draft.linkUrl !== "" ||
				draft.discountPercentage !== null;

	// Cleanup blob URL on unmount or when replaced
	useEffect(() => {
		return () => {
			if (blobUrlRef.current) {
				URL.revokeObjectURL(blobUrlRef.current);
			}
		};
	}, []);

	const setField = <K extends keyof BannerDraft>(
		field: K,
		value: BannerDraft[K],
	) => {
		setDraft((prev) => ({ ...prev, [field]: value }));
	};

	const setImageFile = (file: File | null) => {
		// Revoke old blob URL if exists
		if (blobUrlRef.current) {
			URL.revokeObjectURL(blobUrlRef.current);
			blobUrlRef.current = null;
		}

		if (file) {
			// Create new blob URL for instant preview
			const blobUrl = URL.createObjectURL(file);
			blobUrlRef.current = blobUrl;
			setDraft((prev) => ({
				...prev,
				imageFile: file,
				imageUrl: blobUrl,
			}));
		} else {
			// Revert to existing image if available
			const existingUrl = originalRef.current?.imageUrl || null;
			setDraft((prev) => ({
				...prev,
				imageFile: null,
				imageUrl: existingUrl,
			}));
		}
	};

	const loadBanner = (banner: AdminBannerListItemDTO) => {
		const loaded: BannerDraft = {
			titleEn: banner.titleEn,
			titleBn: banner.titleBn || "",
			subtitleEn: banner.subtitleEn || "",
			subtitleBn: banner.subtitleBn || "",
			priceLabel: banner.priceLabel || "",
			badgeText: banner.badgeText || "",
			badgeColor: banner.badgeColor || "",
			ctaText: banner.ctaText || "",
			discountPercentage: banner.discountPercentage,
			imageUrl: banner.imageUrl,
			imageFile: null,
			existingS3Key: banner.s3Key,
			linkUrl: banner.linkUrl || "",
			placement: banner.placement,
			isActive: banner.isActive,
			sortOrder: banner.sortOrder,
			startsAt: banner.startsAt ? new Date(banner.startsAt) : null,
			endsAt: banner.endsAt ? new Date(banner.endsAt) : null,
		};

		setDraft(loaded);
		originalRef.current = { ...loaded };
		setEditingField(null);
		setEditorLanguage("en");
	};

	const loadDraft = (
		draftSnapshot: BannerDraft,
		options?: { markAsOriginal?: boolean },
	) => {
		const snapshot = cloneBannerDraft(draftSnapshot);
		setDraft(snapshot);
		originalRef.current = options?.markAsOriginal ? cloneBannerDraft(snapshot) : null;
		setEditingField(null);
		setEditorLanguage("en");
	};

	const resetToBlank = () => {
		setDraft(DEFAULT_DRAFT);
		originalRef.current = null;
		setEditingField(null);
		setEditorLanguage("en");

		// Revoke any blob URL
		if (blobUrlRef.current) {
			URL.revokeObjectURL(blobUrlRef.current);
			blobUrlRef.current = null;
		}
	};

	const resetToOriginal = () => {
		if (originalRef.current) {
			setDraft({ ...originalRef.current });
		}
		setEditingField(null);

		// Revoke blob URL if we created one
		if (blobUrlRef.current) {
			URL.revokeObjectURL(blobUrlRef.current);
			blobUrlRef.current = null;
		}
	};

	const getDraftAsBannerDTO = (): BannerDTO => {
		return {
			id: originalRef.current ? "editing" : "new-banner",
			titleEn: draft.titleEn,
			titleBn: draft.titleBn || null,
			subtitleEn: draft.subtitleEn || null,
			subtitleBn: draft.subtitleBn || null,
			imageUrl: draft.imageUrl || "",
			linkUrl: draft.linkUrl || null,
			priceLabel: draft.priceLabel || null,
			badgeText: draft.badgeText || null,
			badgeColor: draft.badgeColor || null,
			ctaText: draft.ctaText || null,
			discountPercentage: draft.discountPercentage,
			placement: draft.placement,
			sortOrder: draft.sortOrder,
		};
	};

	const validate = (): ValidationErrors | null =>
		validateBannerDraft(draft, {
			requireImage: !originalRef.current,
		});

	return {
		draft,
		isDirty,
		editingField,
		editorLanguage,
		setField,
		setEditingField,
		setEditorLanguage,
		setImageFile,
		loadBanner,
		loadDraft,
		resetToBlank,
		resetToOriginal,
		getDraftAsBannerDTO,
		validate,
	};
}

export type UseBannerEditorStateReturn = ReturnType<typeof useBannerEditorState>;
