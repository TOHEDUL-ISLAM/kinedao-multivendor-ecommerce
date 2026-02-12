import { useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Loader } from "@mantine/core";
import { useLanguage } from "@/lib/i18n/use-language";
import { editorLabels } from "./banner-editor-labels";

interface ImageUploadOverlayProps {
	onFileSelect: (file: File) => void;
	isUploading: boolean;
	hasImage: boolean;
	compactOnHasImage?: boolean;
	forceCompact?: boolean;
}

export function ImageUploadOverlay({
	onFileSelect,
	isUploading,
	hasImage,
	compactOnHasImage = true,
	forceCompact = false,
}: ImageUploadOverlayProps) {
	const { language } = useLanguage();
	const t = editorLabels[language];
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const useCompactOverlay = forceCompact || (compactOnHasImage && hasImage);

	const handleClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && file.type.startsWith("image/")) {
			onFileSelect(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		const file = e.dataTransfer.files?.[0];
		if (file && file.type.startsWith("image/")) {
			onFileSelect(file);
		}
	};

	return (
		<>
			{/* Hidden file input */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileChange}
				className="hidden"
			/>

			{useCompactOverlay ? (
				<div className="absolute inset-0 z-30 pointer-events-none">
					<button
						type="button"
						onClick={handleClick}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						aria-label={t.changeImage}
						className="absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center pointer-events-auto transition-transform hover:scale-105"
						style={{
							background:
								"linear-gradient(135deg, oklch(0.65 0.15 175), oklch(0.55 0.15 200))",
							boxShadow: "0 4px 16px oklch(0.65 0.15 175 / 0.35)",
						}}
					>
						{isUploading ? (
							<Loader size="sm" color="white" />
						) : isDragging ? (
							<Upload className="w-4 h-4 text-white" />
						) : (
							<Camera className="w-4 h-4 text-white" />
						)}
					</button>
				</div>
			) : (
				<div
					onClick={handleClick}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					className="absolute inset-0 z-30 flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
					style={{
						background: isDragging
							? "linear-gradient(135deg, oklch(0.65 0.15 175 / 0.9), oklch(0.55 0.15 200 / 0.9))"
							: "linear-gradient(135deg, oklch(0.3 0.05 260 / 0.95), oklch(0.25 0.05 250 / 0.95))",
						backdropFilter: "blur(8px)",
					}}
				>
					{isUploading ? (
						<>
							<Loader size="xl" color="teal" />
							<p className="text-white font-semibold mt-4 text-lg">
								{t.uploading}
							</p>
						</>
					) : (
						<>
							<div
								className="rounded-full p-6 mb-4 transition-transform hover:scale-110"
								style={{
									background:
										"linear-gradient(135deg, oklch(0.65 0.15 175), oklch(0.55 0.15 200))",
									boxShadow: "0 8px 32px oklch(0.65 0.15 175 / 0.4)",
								}}
							>
								{isDragging ? (
									<Upload className="w-12 h-12 text-white" strokeWidth={2.5} />
								) : (
									<Camera className="w-12 h-12 text-white" strokeWidth={2.5} />
								)}
							</div>

							<p className="text-white font-bold text-xl mb-2">
								{t.selectImage}
							</p>
							<p className="text-white/80 text-sm max-w-xs text-center px-4">
								{isDragging ? t.dropImage : t.clickOrDrop}
							</p>
							<p className="text-white/60 text-xs mt-3 max-w-md text-center px-4">
								{t.imageTooltip}
							</p>
						</>
					)}
				</div>
			)}
		</>
	);
}
