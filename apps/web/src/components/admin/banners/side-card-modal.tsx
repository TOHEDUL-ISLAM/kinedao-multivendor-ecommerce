import { useEffect, useRef, useState } from "react";
import {
	ActionIcon,
	Badge,
	Button,
	Grid,
	Group,
	Modal,
	NumberInput,
	Paper,
	Stack,
	Switch,
	Text,
	TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import type { AdminSideCardListItemDTO } from "@kineDao.com/api-types/admin";
import type { BannerLabels } from "./banner-labels";
import { BannerImageUpload } from "./banner-image-upload";

const BADGE_COLORS = ["red", "teal", "purple", "orange", "green"] as const;
type BadgeColor = (typeof BADGE_COLORS)[number];

interface SideCardFormValues {
	titleEn: string;
	titleBn: string;
	subtitleEn: string;
	subtitleBn: string;
	linkUrl: string;
	discountPercentage: number | null;
	badgeText: string;
	badgeColor: BadgeColor | null;
	isActive: boolean;
}

export interface SideCardModalSubmitInput {
	titleEn: string;
	titleBn: string;
	subtitleEn: string;
	subtitleBn: string;
	linkUrl: string;
	discountPercentage: number | null;
	badgeText: string;
	badgeColor: BadgeColor | null;
	isActive: boolean;
	sortOrder: number;
	imageFile: File | null;
	currentImageUrl: string | null;
	currentS3Key: string | null;
}

interface SideCardModalProps {
	opened: boolean;
	onClose: () => void;
	mode: "create" | "edit";
	banner: AdminSideCardListItemDTO | null;
	slotIndex: number;
	labels: BannerLabels;
	isSubmitting: boolean;
	onSubmit: (input: SideCardModalSubmitInput) => Promise<void>;
}

function isValidOptionalLinkUrl(value: string) {
	if (!value.trim()) return true;
	return (
		value.startsWith("/") ||
		value.startsWith("http://") ||
		value.startsWith("https://")
	);
}

export function SideCardModal({
	opened,
	onClose,
	mode,
	banner,
	slotIndex,
	labels,
	isSubmitting,
	onSubmit,
}: SideCardModalProps) {
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
		banner?.imageUrl || null,
	);
	const [currentS3Key, setCurrentS3Key] = useState<string | null>(
		banner?.s3Key || null,
	);
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(
		banner?.imageUrl || null,
	);
	const [imageError, setImageError] = useState<string | null>(null);
	const previewBlobRef = useRef<string | null>(null);

	const form = useForm<SideCardFormValues>({
		initialValues: {
			titleEn: "",
			titleBn: "",
			subtitleEn: "",
			subtitleBn: "",
			linkUrl: "",
			discountPercentage: null,
			badgeText: "",
			badgeColor: "teal",
			isActive: true,
		},
		validate: {
			titleEn: (value) =>
				value.trim() ? null : labels.titleRequired,
			titleBn: (value) =>
				value.length <= 200 ? null : labels.titleMaxError,
			subtitleEn: (value) =>
				value.length <= 300 ? null : labels.subtitleMaxError,
			subtitleBn: (value) =>
				value.length <= 300 ? null : labels.subtitleMaxError,
			linkUrl: (value) =>
				isValidOptionalLinkUrl(value) ? null : labels.linkUrlFormatError,
			discountPercentage: (value) => {
				if (value === null) return null;
				return value >= 1 && value <= 100 ? null : labels.discountRangeError;
			},
			badgeText: (value) =>
				value.length <= 50 ? null : labels.badgeTextMaxError,
		},
	});

	const cleanupPreviewBlob = () => {
		if (previewBlobRef.current) {
			URL.revokeObjectURL(previewBlobRef.current);
			previewBlobRef.current = null;
		}
	};

	useEffect(() => {
		if (!opened) return;

		form.setValues({
			titleEn: banner?.titleEn || "",
			titleBn: banner?.titleBn || "",
			subtitleEn: banner?.subtitleEn || "",
			subtitleBn: banner?.subtitleBn || "",
			linkUrl: banner?.linkUrl || "",
			discountPercentage: banner?.discountPercentage || null,
			badgeText: banner?.badgeText || "",
			badgeColor: (banner?.badgeColor as BadgeColor | null) || "teal",
			isActive: banner?.isActive ?? true,
		});
		form.clearErrors();

		setImageFile(null);
		setCurrentImageUrl(banner?.imageUrl || null);
		setCurrentS3Key(banner?.s3Key || null);
		setPreviewImageUrl(banner?.imageUrl || null);
		setImageError(null);
		cleanupPreviewBlob();
	}, [opened, banner]);

	useEffect(() => {
		return () => {
			cleanupPreviewBlob();
		};
		// cleanupPreviewBlob intentionally omitted because it is stable for component lifetime.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSubmit = form.onSubmit(async (values) => {
		if (!imageFile && !currentImageUrl) {
			setImageError(labels.imageRequired);
			return;
		}
		setImageError(null);

		await onSubmit({
			titleEn: values.titleEn.trim(),
			titleBn: values.titleBn.trim(),
			subtitleEn: values.subtitleEn.trim(),
			subtitleBn: values.subtitleBn.trim(),
			linkUrl: values.linkUrl.trim(),
			discountPercentage: values.discountPercentage,
			badgeText: values.badgeText.trim(),
			badgeColor: values.badgeColor,
			isActive: values.isActive,
			sortOrder: slotIndex,
			imageFile,
			currentImageUrl,
			currentS3Key,
		});
	});

	const title = mode === "create" ? labels.createSideTitle : labels.editSideTitle;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={title}
			centered
			size="xl"
			classNames={{
				content: "rounded-2xl",
				header: "border-b border-border/70",
				body: "pt-4",
				title: "font-semibold",
			}}
		>
			<form onSubmit={handleSubmit}>
				<Grid gutter="md">
					<Grid.Col span={{ base: 12, md: 7 }}>
						<Stack gap="sm">
							<BannerImageUpload
								currentImageUrl={currentImageUrl}
								onFileSelect={(file) => {
									setImageFile(file);
									setImageError(null);

									cleanupPreviewBlob();
									if (file) {
										const blobUrl = URL.createObjectURL(file);
										previewBlobRef.current = blobUrl;
										setPreviewImageUrl(blobUrl);
										return;
									}

									setCurrentImageUrl(null);
									setCurrentS3Key(null);
									setPreviewImageUrl(null);
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
								label={labels.titleEn}
								required
								{...form.getInputProps("titleEn")}
							/>
							<TextInput label={labels.titleBn} {...form.getInputProps("titleBn")} />
							<TextInput
								label={labels.subtitleEn}
								{...form.getInputProps("subtitleEn")}
							/>
							<TextInput
								label={labels.subtitleBn}
								{...form.getInputProps("subtitleBn")}
							/>
							<TextInput
								label={labels.linkUrl}
								placeholder="/catalog"
								{...form.getInputProps("linkUrl")}
							/>
							<NumberInput
								label={labels.discountPercentage}
								min={1}
								max={100}
								value={form.values.discountPercentage ?? undefined}
								onChange={(value) =>
									form.setFieldValue(
										"discountPercentage",
										typeof value === "number" ? value : null,
									)
								}
								error={form.errors.discountPercentage}
							/>
							<TextInput
								label={labels.badgeText}
								{...form.getInputProps("badgeText")}
							/>

							<Stack gap={6}>
								<Text size="sm" fw={600}>
									{labels.badgeColor}
								</Text>
								<Group gap="xs">
									{BADGE_COLORS.map((color) => (
										<ActionIcon
											key={color}
											radius="xl"
											variant={form.values.badgeColor === color ? "filled" : "light"}
											color={color}
											onClick={() => form.setFieldValue("badgeColor", color)}
										>
											{form.values.badgeColor === color ? "•" : ""}
										</ActionIcon>
									))}
								</Group>
							</Stack>

							<Switch
								label={labels.isActiveLabel}
								checked={form.values.isActive}
								onChange={(event) =>
									form.setFieldValue("isActive", event.currentTarget.checked)
								}
							/>

							<Group justify="flex-end" mt="sm">
								<Button variant="default" onClick={onClose} disabled={isSubmitting}>
									{labels.cancel}
								</Button>
								<Button type="submit" loading={isSubmitting}>
									{isSubmitting ? labels.saving : labels.save}
								</Button>
							</Group>
						</Stack>
					</Grid.Col>

					<Grid.Col span={{ base: 12, md: 5 }}>
						<Stack>
							<Text fw={600}>{labels.livePreview}</Text>
							<Paper withBorder p="sm" radius="md">
								<img
									src={previewImageUrl || "https://placehold.co/600x340?text=Banner"}
									alt={form.values.titleEn || labels.previewTitle}
									className="h-40 w-full rounded object-cover"
								/>
								<Stack gap={6} mt="sm">
									{form.values.badgeText ? (
										<Badge
											color={form.values.badgeColor || "teal"}
											variant="light"
											w="fit-content"
										>
											{form.values.badgeText}
										</Badge>
									) : null}
									<Text fw={700} size="sm" lineClamp={2}>
										{form.values.titleEn || labels.previewTitle}
									</Text>
									<Text size="sm" c="dimmed" lineClamp={2}>
										{form.values.subtitleEn || labels.previewSubtitle}
									</Text>
									{form.values.discountPercentage ? (
										<Badge color="red" variant="light" w="fit-content">
											-{form.values.discountPercentage}%
										</Badge>
									) : null}
								</Stack>
							</Paper>
						</Stack>
					</Grid.Col>
				</Grid>
			</form>
		</Modal>
	);
}
