import {
	Group,
	SegmentedControl,
	TextInput,
	NumberInput,
	Switch,
	Button,
	Divider,
	Text,
	Stack,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import {
	Save,
	X,
	Link as LinkIcon,
	Calendar,
	Hash,
	Power,
	Percent,
	UploadCloud,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/use-language";
import { editorLabels, type EditorLanguage } from "./banner-editor-labels";
import type { UseBannerEditorStateReturn } from "./use-banner-editor-state";
import { useTheme } from "next-themes";

interface BannerEditorToolbarProps {
	editorState: UseBannerEditorStateReturn;
	isEditing: boolean;
	isSubmitting: boolean;
	onSave: () => void;
	onPublishAll: () => void;
	isPublishingAll: boolean;
	stagedCount: number;
	activeTargetLabel: string;
	onCancel: () => void;
	validationErrors: Record<string, string> | null;
	bannerTitle?: string;
}

export function BannerEditorToolbar({
	editorState,
	isEditing,
	isSubmitting,
	onSave,
	onPublishAll,
	isPublishingAll,
	stagedCount,
	activeTargetLabel,
	onCancel,
	validationErrors,
	bannerTitle,
}: BannerEditorToolbarProps) {
	const { language } = useLanguage();
	const { resolvedTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const t = editorLabels[language];

	const { draft, editorLanguage, setField, setEditorLanguage, isDirty } =
		editorState;

	const modeTitle = isEditing
		? `${t.editingBanner}${bannerTitle ? `: ${bannerTitle}` : ""}`
		: t.creatingBanner;

	return (
		<div
			className="rounded-lg p-4 mb-4 border"
			style={{
				background: isDark
					? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
					: "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 150) 100%)",
				borderColor: isDark
					? "oklch(0.3 0.02 260 / 0.3)"
					: "oklch(0.92 0.01 260 / 0.2)",
			}}
		>
			<Stack gap="md">
				{/* Header: Mode + Language Toggle */}
				<Group justify="space-between" wrap="wrap">
					<div>
						<Text
							size="lg"
							fw={700}
							style={{
								color: isDark
									? "oklch(0.9 0.05 175)"
									: "oklch(0.4 0.1 175)",
							}}
						>
							{modeTitle}
						</Text>
						{isDirty && (
							<Text size="xs" c="dimmed" mt={2}>
								{t.unsavedChanges}
							</Text>
						)}
						<Text size="xs" c="dimmed" mt={2}>
							Active Element: {activeTargetLabel}
						</Text>
					</div>

					{/* Language Toggle */}
					<SegmentedControl
						value={editorLanguage}
						onChange={(value) =>
							setEditorLanguage(value as EditorLanguage)
						}
						data={[
							{ label: "EN", value: "en" },
							{ label: "BN", value: "bn" },
						]}
						color="teal"
						size="sm"
						styles={{
							root: {
								background: isDark
									? "oklch(0.18 0.02 260)"
									: "oklch(0.96 0.005 260)",
							},
						}}
					/>
				</Group>

				{/* Main Fields - Row 1: Link + Discount */}
				<Group grow wrap="wrap" gap="md">
					<TextInput
						label={t.linkUrl}
						placeholder={t.linkUrlPlaceholder}
						value={draft.linkUrl}
						onChange={(e) => setField("linkUrl", e.target.value)}
						error={validationErrors?.linkUrl}
						leftSection={<LinkIcon size={16} />}
						size="sm"
					/>

					<NumberInput
						label={t.discountPercentage}
						placeholder={t.discountPlaceholder}
						value={draft.discountPercentage || undefined}
						onChange={(value) =>
							setField(
								"discountPercentage",
								typeof value === "number" ? value : null,
							)
						}
						error={validationErrors?.discountPercentage}
						min={1}
						max={100}
						leftSection={<Percent size={16} />}
						size="sm"
						clampBehavior="strict"
					/>
				</Group>

				{/* Main Fields - Row 2: Schedule + Settings */}
				<Group grow wrap="wrap" gap="md">
					<DateTimePicker
						label={t.startsAt}
						placeholder="Optional start"
						value={draft.startsAt}
						onChange={(value) => setField("startsAt", value as Date | null)}
						error={validationErrors?.startsAt}
						leftSection={<Calendar size={16} />}
						size="sm"
						clearable
						valueFormat="DD MMM YYYY, hh:mm A"
					/>

					<DateTimePicker
						label={t.endsAt}
						placeholder="Optional end"
						value={draft.endsAt}
						onChange={(value) => setField("endsAt", value as Date | null)}
						error={validationErrors?.endsAt}
						leftSection={<Calendar size={16} />}
						size="sm"
						clearable
						valueFormat="DD MMM YYYY, hh:mm A"
					/>

					<NumberInput
						label={t.sortOrder}
						value={draft.sortOrder}
						onChange={(value) =>
							setField("sortOrder", typeof value === "number" ? value : 0)
						}
						error={validationErrors?.sortOrder}
						min={0}
						leftSection={<Hash size={16} />}
						size="sm"
					/>
				</Group>

				<Divider
					style={{
						borderColor: isDark
							? "oklch(0.3 0.02 260 / 0.2)"
							: "oklch(0.9 0.01 260 / 0.3)",
					}}
				/>

				{/* Bottom Row: Active Toggle + Actions */}
				<Group justify="space-between" wrap="wrap">
					<Switch
						label={t.active}
						description={t.activeDescription}
						checked={draft.isActive}
						onChange={(e) => setField("isActive", e.currentTarget.checked)}
						color="teal"
						size="md"
						thumbIcon={
							draft.isActive ? (
								<Power size={12} style={{ color: "white" }} />
							) : undefined
						}
					/>

					<Group gap="sm">
						<Button
							variant="default"
							onClick={onCancel}
							leftSection={<X size={16} />}
							size="md"
							disabled={isSubmitting}
						>
							{t.discard}
						</Button>

						<Button
							onClick={onSave}
							loading={isSubmitting}
							leftSection={!isSubmitting ? <Save size={16} /> : undefined}
							size="md"
							style={{
								background: "linear-gradient(135deg, oklch(0.65 0.15 175), oklch(0.55 0.15 200))",
								color: "white",
							}}
						>
							{isSubmitting
								? t.saving
								: t.stage}
						</Button>

						<Button
							onClick={onPublishAll}
							loading={isPublishingAll}
							leftSection={!isPublishingAll ? <UploadCloud size={16} /> : undefined}
							size="md"
							disabled={stagedCount === 0}
							style={{
								background: "linear-gradient(135deg, oklch(0.45 0.08 250), oklch(0.55 0.09 235))",
								color: "white",
							}}
						>
							{isPublishingAll
								? t.saving
								: `${t.publishAll} (${stagedCount})`}
						</Button>
					</Group>
				</Group>
			</Stack>
		</div>
	);
}
