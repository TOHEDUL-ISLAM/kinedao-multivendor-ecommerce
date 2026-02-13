import { useEffect, useState } from "react";
import {
	Button,
	Group,
	Modal,
	Stack,
	Switch,
	Text,
	TextInput,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import type { AdminHeroBannerListItemDTO } from "@kineDao.com/api-types/admin";
import type { BannerLabels } from "./banner-labels";
import { BannerImageUpload } from "./banner-image-upload";

interface HeroBannerFormValues {
	linkUrl: string;
	altText: string;
	isActive: boolean;
	startsAt: Date | null;
	endsAt: Date | null;
}

export interface HeroBannerModalSubmitInput {
	linkUrl: string;
	altText: string;
	isActive: boolean;
	startsAt: Date | null;
	endsAt: Date | null;
	sortOrder: number;
	imageFile: File | null;
	currentImageUrl: string | null;
	currentS3Key: string | null;
}

interface HeroBannerModalProps {
	opened: boolean;
	onClose: () => void;
	mode: "create" | "edit";
	banner: AdminHeroBannerListItemDTO | null;
	defaultSortOrder: number;
	labels: BannerLabels;
	isSubmitting: boolean;
	onSubmit: (input: HeroBannerModalSubmitInput) => Promise<void>;
}

function isValidLinkUrl(value: string) {
	return (
		value.startsWith("/") ||
		value.startsWith("http://") ||
		value.startsWith("https://")
	);
}

export function HeroBannerModal({
	opened,
	onClose,
	mode,
	banner,
	defaultSortOrder,
	labels,
	isSubmitting,
	onSubmit,
}: HeroBannerModalProps) {
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
		banner?.imageUrl || null,
	);
	const [currentS3Key, setCurrentS3Key] = useState<string | null>(
		banner?.s3Key || null,
	);
	const [imageError, setImageError] = useState<string | null>(null);

	const form = useForm<HeroBannerFormValues>({
		initialValues: {
			linkUrl: "",
			altText: "",
			isActive: true,
			startsAt: null,
			endsAt: null,
		},
		validate: {
			linkUrl: (value) => {
				if (!value.trim()) {
					return labels.linkUrlRequired;
				}
				if (!isValidLinkUrl(value)) {
					return labels.linkUrlFormatError;
				}
				return null;
			},
			altText: (value) =>
				value.length > 200 ? labels.altTextMaxError : null,
			endsAt: (value, values) => {
				if (!value || !values.startsAt) return null;
				return value <= values.startsAt ? labels.endDateAfterStartError : null;
			},
		},
	});

	useEffect(() => {
		if (!opened) return;

		form.setValues({
			linkUrl: banner?.linkUrl || "",
			altText: banner?.altText || "",
			isActive: banner?.isActive ?? true,
			startsAt: banner?.startsAt ? new Date(banner.startsAt) : null,
			endsAt: banner?.endsAt ? new Date(banner.endsAt) : null,
		});
		form.clearErrors();

		setImageFile(null);
		setCurrentImageUrl(banner?.imageUrl || null);
		setCurrentS3Key(banner?.s3Key || null);
		setImageError(null);
	}, [opened, banner]);

	const handleSubmit = form.onSubmit(async (values) => {
		if (!imageFile && !currentImageUrl) {
			setImageError(labels.imageRequired);
			return;
		}
		setImageError(null);

		await onSubmit({
			linkUrl: values.linkUrl.trim(),
			altText: values.altText.trim(),
			isActive: values.isActive,
			startsAt: values.startsAt,
			endsAt: values.endsAt,
			sortOrder: banner?.sortOrder ?? defaultSortOrder,
			imageFile,
			currentImageUrl,
			currentS3Key,
		});
	});

	const modalTitle = mode === "create" ? labels.createHeroTitle : labels.editHeroTitle;

	return (
		<Modal opened={opened} onClose={onClose} title={modalTitle} centered size="xl">
			<form onSubmit={handleSubmit}>
				<Stack gap="md">
					<BannerImageUpload
						currentImageUrl={currentImageUrl}
						onFileSelect={(file) => {
							setImageFile(file);
							if (!file) {
								setCurrentImageUrl(null);
								setCurrentS3Key(null);
							}
							setImageError(null);
						}}
						isUploading={isSubmitting}
						aspectRatio={16 / 9}
						label={labels.imageLabel}
						hint={labels.uploadHint}
						replaceLabel={labels.replaceImage}
						removeLabel={labels.removeImage}
					/>

					{imageError ? (
						<Text size="xs" c="red">
							{imageError}
						</Text>
					) : null}

					<TextInput
						label={labels.linkUrl}
						placeholder="/catalog"
						required
						{...form.getInputProps("linkUrl")}
					/>

					<TextInput
						label={labels.altText}
						placeholder="Hero Banner"
						{...form.getInputProps("altText")}
					/>

					<Switch
						label={labels.isActiveLabel}
						checked={form.values.isActive}
						onChange={(event) =>
							form.setFieldValue("isActive", event.currentTarget.checked)
						}
					/>

						<Group grow>
							<DateTimePicker
								label={labels.startsAt}
								clearable
								value={form.values.startsAt}
								onChange={(value) =>
									form.setFieldValue("startsAt", value ? new Date(value) : null)
								}
							/>
							<DateTimePicker
								label={labels.endsAt}
								clearable
								value={form.values.endsAt}
								onChange={(value) =>
									form.setFieldValue("endsAt", value ? new Date(value) : null)
								}
								error={form.errors.endsAt}
							/>
						</Group>

					<Group justify="flex-end" mt="sm">
						<Button variant="default" onClick={onClose} disabled={isSubmitting}>
							{labels.cancel}
						</Button>
						<Button type="submit" loading={isSubmitting}>
							{isSubmitting ? labels.saving : labels.save}
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
}
