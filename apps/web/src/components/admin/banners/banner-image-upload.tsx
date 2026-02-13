import { useEffect, useRef, useState } from "react";
import { AspectRatio, Button, Group, Stack, Text } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import "@mantine/dropzone/styles.css";

const MAX_BANNER_UPLOAD_SIZE = 10 * 1024 ** 2; // 10 MiB

interface BannerImageUploadProps {
	currentImageUrl?: string | null;
	onFileSelect: (file: File | null) => void;
	isUploading?: boolean;
	aspectRatio?: number;
	label: string;
	hint: string;
	replaceLabel: string;
	removeLabel: string;
}

export function BannerImageUpload({
	currentImageUrl,
	onFileSelect,
	isUploading = false,
	aspectRatio = 16 / 9,
	label,
	hint,
	replaceLabel,
	removeLabel,
}: BannerImageUploadProps) {
	const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
	const objectUrlRef = useRef<string | null>(null);
	const openRef = useRef<(() => void) | null>(null);

	const cleanupObjectUrl = () => {
		if (objectUrlRef.current) {
			URL.revokeObjectURL(objectUrlRef.current);
			objectUrlRef.current = null;
		}
	};

	useEffect(() => {
		if (!objectUrlRef.current) {
			setPreviewUrl(currentImageUrl || null);
		}
	}, [currentImageUrl]);

	useEffect(() => {
		return () => {
			cleanupObjectUrl();
		};
		// cleanupObjectUrl intentionally omitted because it is stable for component lifetime.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleDrop = (files: File[]) => {
		const [file] = files;
		if (!file) return;

		cleanupObjectUrl();
		const blobUrl = URL.createObjectURL(file);
		objectUrlRef.current = blobUrl;
		setPreviewUrl(blobUrl);
		onFileSelect(file);
	};

	const handleRemove = () => {
		cleanupObjectUrl();
		setPreviewUrl(null);
		onFileSelect(null);
	};

	return (
		<Stack gap="sm">
			<Text size="sm" fw={600}>
				{label}
			</Text>

			{previewUrl ? (
				<AspectRatio ratio={aspectRatio}>
					<img
						src={previewUrl}
						alt="Banner preview"
						className="h-full w-full rounded-lg border border-border/70 object-cover shadow-sm"
					/>
				</AspectRatio>
			) : null}

			<Dropzone
				openRef={openRef}
				onDrop={handleDrop}
				accept={IMAGE_MIME_TYPE}
				maxSize={MAX_BANNER_UPLOAD_SIZE}
				disabled={isUploading}
				className="rounded-lg border-dashed border-border/70 bg-card/50 transition-colors hover:border-primary/50 hover:bg-primary/5"
			>
				<Group gap="sm" justify="center" py="lg">
					<Upload size={18} className="text-primary" />
					<Text size="sm">{hint}</Text>
				</Group>
			</Dropzone>

			{previewUrl ? (
				<Group gap="sm">
					<Button
						variant="light"
						leftSection={<ImageIcon size={16} />}
						radius="xl"
						className="border border-primary/20"
						onClick={() => openRef.current?.()}
					>
						{replaceLabel}
					</Button>
					<Button
						variant="subtle"
						color="red"
						leftSection={<X size={16} />}
						radius="xl"
						onClick={handleRemove}
					>
						{removeLabel}
					</Button>
				</Group>
			) : null}
		</Stack>
	);
}
