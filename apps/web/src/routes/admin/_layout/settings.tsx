import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Button,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Switch,
	Text,
	Textarea,
	Title,
} from "@mantine/core";
import { Save, Settings, Megaphone, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import type {
	AdminTopBarAnnouncementUpdateInput,
	TopBarAnnouncementDTO,
} from "@kineDao.com/api-types/site-settings";

const ADMIN_TOP_BAR_ANNOUNCEMENT_QUERY_KEY = [
	"admin",
	"settings",
	"top-bar-announcement",
] as const;

type AnnouncementFormState = {
	textEn: string;
	textBn: string;
	isActive: boolean;
};

const labels = {
	en: {
		pageTitle: "Announcement Bar",
		subtitle: "Control the announcement text shown in the storefront top bar.",
		englishLabel: "Announcement (English)",
		banglaLabel: "Announcement (Bangla)",
		englishPlaceholder: "Example: 🎉 Free shipping on orders over ৳1,000",
		banglaPlaceholder: "উদাহরণ: 🎉 ৳১,০০০+ অর্ডারে ফ্রি শিপিং",
		activeLabel: "Show announcement in storefront top bar",
		save: "Save Changes",
		saving: "Saving...",
		previewTitle: "Live Preview",
		previewDescription: "This is how the announcement appears in the header.",
		updatedAtLabel: "Current saved message",
		emptyPreview: "Add announcement text to preview it.",
		saveSuccess: "Top bar announcement updated",
		loadError: "Failed to load settings",
		saveError: "Failed to update settings",
		retry: "Retry",
		disabledHint: "Announcement is currently hidden from customers.",
		enabledHint: "Announcement is visible to customers.",
	},
	bn: {
		pageTitle: "ঘোষণা বার",
		subtitle: "স্টোরফ্রন্ট টপ বারে দেখানো ঘোষণা টেক্সট নিয়ন্ত্রণ করুন।",
		englishLabel: "ঘোষণা (ইংরেজি)",
		banglaLabel: "ঘোষণা (বাংলা)",
		englishPlaceholder: "উদাহরণ: 🎉 Free shipping on orders over ৳1,000",
		banglaPlaceholder: "উদাহরণ: 🎉 ৳১,০০০+ অর্ডারে ফ্রি শিপিং",
		activeLabel: "স্টোরফ্রন্ট টপ বারে ঘোষণা দেখান",
		save: "পরিবর্তন সংরক্ষণ করুন",
		saving: "সংরক্ষণ হচ্ছে...",
		previewTitle: "লাইভ প্রিভিউ",
		previewDescription: "হেডারে ঘোষণাটি এমন দেখাবে।",
		updatedAtLabel: "বর্তমান সংরক্ষিত মেসেজ",
		emptyPreview: "প্রিভিউ দেখতে ঘোষণা লিখুন।",
		saveSuccess: "টপ বার ঘোষণা আপডেট হয়েছে",
		loadError: "সেটিংস লোড করা যায়নি",
		saveError: "সেটিংস আপডেট করা যায়নি",
		retry: "আবার চেষ্টা করুন",
		disabledHint: "এই ঘোষণা এখন গ্রাহকদের কাছে লুকানো আছে।",
		enabledHint: "এই ঘোষণা গ্রাহকদের কাছে দৃশ্যমান।",
	},
} as const;

async function fetchTopBarAnnouncement(): Promise<TopBarAnnouncementDTO> {
	const response = await api.admin["top-bar-announcement"].$get();
	if (!response.ok) {
		const errorBody = (await response.json().catch(() => null)) as
			| { error?: string }
			| null;
		throw new Error(errorBody?.error || "Failed to fetch top bar announcement");
	}
	return response.json();
}

async function updateTopBarAnnouncement(
	input: AdminTopBarAnnouncementUpdateInput,
): Promise<TopBarAnnouncementDTO> {
	const response = await api.admin["top-bar-announcement"].$put({
		json: input,
	});
	if (!response.ok) {
		const errorBody = (await response.json().catch(() => null)) as
			| { error?: string }
			| null;
		throw new Error(errorBody?.error || "Failed to update top bar announcement");
	}
	return response.json();
}

export const Route = createFileRoute("/admin/_layout/settings")({
	component: AdminSettingsPage,
});

function AdminSettingsPage() {
	const { language } = useLanguage();
	const t = labels[language];
	const queryClient = useQueryClient();
	const [form, setForm] = useState<AnnouncementFormState>({
		textEn: "",
		textBn: "",
		isActive: true,
	});

	const announcementQuery = useQuery({
		queryKey: ADMIN_TOP_BAR_ANNOUNCEMENT_QUERY_KEY,
		queryFn: fetchTopBarAnnouncement,
		staleTime: 1000 * 60,
	});

	useEffect(() => {
		if (!announcementQuery.data) return;
		setForm({
			textEn: announcementQuery.data.textEn,
			textBn: announcementQuery.data.textBn || "",
			isActive: announcementQuery.data.isActive,
		});
	}, [announcementQuery.data]);

	const updateMutation = useMutation({
		mutationFn: updateTopBarAnnouncement,
		onSuccess: (updated) => {
			setForm({
				textEn: updated.textEn,
				textBn: updated.textBn || "",
				isActive: updated.isActive,
			});
			void queryClient.invalidateQueries({
				queryKey: ADMIN_TOP_BAR_ANNOUNCEMENT_QUERY_KEY,
			});
			void queryClient.invalidateQueries({
				queryKey: ["site-settings", "top-bar-announcement"],
			});
			toast.success(t.saveSuccess);
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : t.saveError);
		},
	});

	const isDirty = useMemo(() => {
		if (!announcementQuery.data) return false;
		return (
			form.textEn !== announcementQuery.data.textEn ||
			form.textBn !== (announcementQuery.data.textBn || "") ||
			form.isActive !== announcementQuery.data.isActive
		);
	}, [form, announcementQuery.data]);

	const previewText =
		language === "bn"
			? form.textBn.trim() || form.textEn.trim()
			: form.textEn.trim() || form.textBn.trim();

	if (announcementQuery.isLoading) {
		return (
			<Stack gap="md">
				<Skeleton h={36} w={220} radius="md" />
				<Skeleton h={220} radius="lg" />
			</Stack>
		);
	}

	if (announcementQuery.isError) {
		return (
			<Alert
				variant="light"
				color="red"
				title={t.loadError}
				icon={<AlertCircle size={16} />}
			>
				<Group justify="space-between">
					<Text size="sm">
						{announcementQuery.error instanceof Error
							? announcementQuery.error.message
							: t.loadError}
					</Text>
					<Button variant="light" size="xs" onClick={() => announcementQuery.refetch()}>
						{t.retry}
					</Button>
				</Group>
			</Alert>
		);
	}

	return (
		<Stack gap="lg">
			<Paper
				withBorder
				radius="lg"
				p="lg"
				className="border-primary/20 bg-gradient-to-br from-primary/10 via-baby-yellow/20 to-baby-mint/20"
			>
				<Group justify="space-between" align="center">
					<Stack gap={2}>
						<Text size="xs" fw={700} c="dimmed" tt="uppercase">
							Admin CMS
						</Text>
						<Title order={2}>{t.pageTitle}</Title>
						<Text size="sm" c="dimmed">
							{t.subtitle}
						</Text>
					</Stack>
					<Settings size={28} className="text-primary" />
				</Group>
			</Paper>

			<SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
				<Paper withBorder radius="lg" p="lg">
					<Stack gap="md">
							<Textarea
								label={t.englishLabel}
								placeholder={t.englishPlaceholder}
								value={form.textEn}
								onChange={(event) => {
									const value = event.currentTarget.value;
									setForm((current) => ({
										...current,
										textEn: value,
									}));
								}}
								maxLength={180}
								autosize
								minRows={2}
							/>

							<Textarea
								label={t.banglaLabel}
								placeholder={t.banglaPlaceholder}
								value={form.textBn}
								onChange={(event) => {
									const value = event.currentTarget.value;
									setForm((current) => ({
										...current,
										textBn: value,
									}));
								}}
								maxLength={180}
								autosize
								minRows={2}
							/>

							<Switch
								label={t.activeLabel}
								checked={form.isActive}
								onChange={(event) => {
									const checked = event.currentTarget.checked;
									setForm((current) => ({
										...current,
										isActive: checked,
									}));
								}}
							/>

						<Alert
							icon={<AlertCircle size={16} />}
							color={form.isActive ? "teal" : "yellow"}
							variant="light"
						>
							{form.isActive ? t.enabledHint : t.disabledHint}
						</Alert>

						<Group justify="flex-end">
							<Button
								leftSection={<Save size={16} />}
								onClick={() =>
									updateMutation.mutate({
										textEn: form.textEn,
										textBn: form.textBn,
										isActive: form.isActive,
									})
								}
								disabled={!isDirty || form.textEn.trim().length === 0}
								loading={updateMutation.isPending}
							>
								{updateMutation.isPending ? t.saving : t.save}
							</Button>
						</Group>
					</Stack>
				</Paper>

				<Paper withBorder radius="lg" p="lg">
					<Stack gap="md">
						<Group gap="xs">
							<Megaphone size={18} className="text-primary" />
							<Text fw={700}>{t.previewTitle}</Text>
						</Group>
						<Text size="sm" c="dimmed">
							{t.previewDescription}
						</Text>
						<div className="rounded-md border border-primary/20 bg-primary px-3 py-2 text-center text-[11px] font-medium text-primary-foreground sm:text-sm">
							{previewText || t.emptyPreview}
						</div>
						<Text size="xs" c="dimmed">
							{t.updatedAtLabel}
						</Text>
						<div className="rounded-md border border-dashed border-border px-3 py-2 text-sm">
							{language === "bn"
								? announcementQuery.data?.textBn || announcementQuery.data?.textEn
								: announcementQuery.data?.textEn || announcementQuery.data?.textBn}
						</div>
					</Stack>
				</Paper>
			</SimpleGrid>
		</Stack>
	);
}
