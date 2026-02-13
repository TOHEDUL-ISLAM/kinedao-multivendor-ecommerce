import { useEffect, useRef, useState } from "react";
import { AspectRatio, Button, Group, Stack, Text } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import "@mantine/dropzone/styles.css";

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
						className="h-full w-full rounded-md border object-cover"
					/>
				</AspectRatio>
			) : null}

			<Dropzone
				openRef={openRef}
				onDrop={handleDrop}
				accept={IMAGE_MIME_TYPE}
				maxSize={5 * 1024 ** 2}
				disabled={isUploading}
			>
				<Group gap="sm" justify="center" py="lg">
					<Upload size={20} />
					<Text size="sm">{hint}</Text>
				</Group>
			</Dropzone>

			{previewUrl ? (
				<Group gap="sm">
					<Button
						variant="light"
						leftSection={<ImageIcon size={16} />}
						onClick={() => openRef.current?.()}
					>
						{replaceLabel}
					</Button>
					<Button
						variant="subtle"
						color="red"
						leftSection={<X size={16} />}
						onClick={handleRemove}
					>
						{removeLabel}
					</Button>
				</Group>
			) : null}
		</Stack>
	);
}
