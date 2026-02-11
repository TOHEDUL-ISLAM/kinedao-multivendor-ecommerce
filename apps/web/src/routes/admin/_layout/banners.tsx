import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
	Stack,
	Title,
	Button,
	Table,
	Group,
	Text,
	Paper,
	Skeleton,
	Image,
	Badge,
	Modal,
	TextInput,
	Select,
	Switch,
	NumberInput,
	ActionIcon,
	FileInput,
	SimpleGrid,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { Plus, Pencil, Trash2, Image as ImageIcon, X, Eye } from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import type { AdminBannerListItemDTO } from "@kineDao.com/api-types/admin";
import type { BannerDTO } from "@kineDao.com/api-types/catalog";
import { HeroBanners } from "@/components/homepage/hero-banners";
import { PromotionalBanners } from "@/components/homepage/promotional-banners";
import "@mantine/dates/styles.css";
import "@mantine/carousel/styles.css";

export const Route = createFileRoute("/admin/_layout/banners")({
	component: AdminBannersPage,
});

const labels = {
	en: {
		title: "Banner Management",
		addBanner: "Add Banner",
		image: "Image",
		titleLabel: "Title",
		placement: "Placement",
		active: "Active",
		inactive: "Inactive",
		sortOrder: "Sort Order",
		actions: "Actions",
		noResults: "No banners found. Click 'Add Banner' to create your first banner.",
		edit: "Edit",
		delete: "Delete",
		// Form labels
		addBannerTitle: "Add New Banner",
		editBannerTitle: "Edit Banner",
		uploadImage: "Banner Image",
		titleEn: "Title (English)",
		titleBn: "Title (Bangla)",
		subtitleEn: "Subtitle (English)",
		subtitleBn: "Subtitle (Bangla)",
		priceLabel: "Price Label",
		badgeText: "Badge Text",
		badgeColor: "Badge Color",
		ctaText: "CTA Button Text",
		discountPercentage: "Discount %",
		linkUrl: "Link URL",
		placementLabel: "Placement",
		activeLabel: "Active",
		sortOrderLabel: "Sort Order",
		startsAt: "Start Date/Time",
		endsAt: "End Date/Time",
		cancel: "Cancel",
		save: "Save Changes",
		create: "Create Banner",
		saving: "Saving...",
		// Delete modal
		deleteTitle: "Delete Banner",
		deleteMessage:
			"Are you sure you want to delete this banner? This action cannot be undone.",
		deleteConfirm: "Delete",
		deleting: "Deleting...",
		// Placements
		hero_carousel: "Hero Carousel",
		promotional_card: "Promotional Card",
		homepage_middle: "Homepage Middle",
		sidebar: "Sidebar",
		// Toast messages
		bannerCreated: "Banner created successfully",
		bannerUpdated: "Banner updated successfully",
		bannerDeleted: "Banner deleted successfully",
		error: "An error occurred",
		// Preview
		livePreview: "Live Preview",
		previewDescription: "This is how the homepage hero section will look",
		topTrends: "Top Trends",
	},
	bn: {
		title: "ব্যানার ব্যবস্থাপনা",
		addBanner: "ব্যানার যোগ করুন",
		image: "ছবি",
		titleLabel: "শিরোনাম",
		placement: "অবস্থান",
		active: "সক্রিয়",
		inactive: "নিষ্ক্রিয়",
		sortOrder: "ক্রম",
		actions: "কার্যক্রম",
		noResults:
			"কোনো ব্যানার পাওয়া যায়নি। প্রথম ব্যানার তৈরি করতে 'ব্যানার যোগ করুন' ক্লিক করুন।",
		edit: "সম্পাদনা",
		delete: "মুছুন",
		// Form labels
		addBannerTitle: "নতুন ব্যানার যোগ করুন",
		editBannerTitle: "ব্যানার সম্পাদনা করুন",
		uploadImage: "ব্যানার ছবি",
		titleEn: "শিরোনাম (ইংরেজি)",
		titleBn: "শিরোনাম (বাংলা)",
		subtitleEn: "উপশিরোনাম (ইংরেজি)",
		subtitleBn: "উপশিরোনাম (বাংলা)",
		priceLabel: "মূল্য লেবেল",
		badgeText: "ব্যাজ টেক্সট",
		badgeColor: "ব্যাজ রঙ",
		ctaText: "CTA বাটন টেক্সট",
		discountPercentage: "ছাড় %",
		linkUrl: "লিংক URL",
		placementLabel: "অবস্থান",
		activeLabel: "সক্রিয়",
		sortOrderLabel: "ক্রম",
		startsAt: "শুরুর তারিখ/সময়",
		endsAt: "শেষ তারিখ/সময়",
		cancel: "বাতিল",
		save: "সংরক্ষণ",
		create: "ব্যানার তৈরি করুন",
		saving: "সংরক্ষণ হচ্ছে...",
		// Delete modal
		deleteTitle: "ব্যানার মুছুন",
		deleteMessage:
			"আপনি কি নিশ্চিত যে আপনি এই ব্যানারটি মুছতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
		deleteConfirm: "মুছুন",
		deleting: "মুছছে...",
		// Placements
		hero_carousel: "হিরো ক্যারোসেল",
		promotional_card: "প্রচারমূলক কার্ড",
		homepage_middle: "হোমপেজ মধ্য",
		sidebar: "সাইডবার",
		// Toast messages
		bannerCreated: "ব্যানার সফলভাবে তৈরি হয়েছে",
		bannerUpdated: "ব্যানার সফলভাবে আপডেট হয়েছে",
		bannerDeleted: "ব্যানার সফলভাবে মুছে ফেলা হয়েছে",
		error: "একটি ত্রুটি ঘটেছে",
		// Preview
		livePreview: "লাইভ প্রিভিউ",
		previewDescription: "হোমপেজ হিরো সেকশন এভাবে দেখাবে",
		topTrends: "টপ ট্রেন্ডস",
	},
};

interface BannerFormValues {
	titleEn: string;
	titleBn: string;
	subtitleEn: string;
	subtitleBn: string;
	priceLabel: string;
	badgeText: string;
	badgeColor: string;
	ctaText: string;
	discountPercentage: number | null;
	imageFile: File | null;
	linkUrl: string;
	placement: string;
	isActive: boolean;
	sortOrder: number;
	startsAt: Date | null;
	endsAt: Date | null;
}

const DEFAULT_FORM_VALUES: BannerFormValues = {
	titleEn: "",
	titleBn: "",
	subtitleEn: "",
	subtitleBn: "",
	priceLabel: "",
	badgeText: "",
	badgeColor: "",
	ctaText: "",
	discountPercentage: null,
	imageFile: null,
	linkUrl: "",
	placement: "hero_carousel",
	isActive: true,
	sortOrder: 0,
	startsAt: null,
	endsAt: null,
};

const formValidation = {
	titleEn: (value: string) => {
		if (!value) return "English title is required";
		if (value.length > 200) return "Title must be 200 characters or less";
		return null;
	},
	titleBn: (value: string) => {
		if (value && value.length > 200)
			return "Title must be 200 characters or less";
		return null;
	},
	subtitleEn: (value: string) => {
		if (value && value.length > 300)
			return "Subtitle must be 300 characters or less";
		return null;
	},
	subtitleBn: (value: string) => {
		if (value && value.length > 300)
			return "Subtitle must be 300 characters or less";
		return null;
	},
	priceLabel: (value: string) => {
		if (value && value.length > 100)
			return "Price label must be 100 characters or less";
		return null;
	},
	badgeText: (value: string) => {
		if (value && value.length > 50)
			return "Badge text must be 50 characters or less";
		return null;
	},
	ctaText: (value: string) => {
		if (value && value.length > 100)
			return "CTA text must be 100 characters or less";
		return null;
	},
	discountPercentage: (value: number | null) => {
		if (value !== null && (value < 1 || value > 100))
			return "Discount must be between 1 and 100";
		return null;
	},
	linkUrl: (value: string) => {
		if (value && !value.startsWith("/") && !value.startsWith("http"))
			return "URL must start with / or http";
		return null;
	},
	placement: (value: string) => (!value ? "Placement is required" : null),
	endsAt: (value: Date | null, values: BannerFormValues) => {
		if (value && values.startsAt && value <= values.startsAt)
			return "End date must be after start date";
		return null;
	},
};

/** Convert admin banner DTO to the public BannerDTO shape for preview components */
function toBannerDTO(banner: AdminBannerListItemDTO): BannerDTO {
	return {
		id: banner.id,
		titleEn: banner.titleEn,
		titleBn: banner.titleBn,
		subtitleEn: banner.subtitleEn,
		subtitleBn: banner.subtitleBn,
		imageUrl: banner.imageUrl,
		linkUrl: banner.linkUrl,
		priceLabel: banner.priceLabel,
		badgeText: banner.badgeText,
		badgeColor: banner.badgeColor,
		ctaText: banner.ctaText,
		discountPercentage: banner.discountPercentage,
		placement: banner.placement,
		sortOrder: banner.sortOrder,
	};
}

function AdminBannersPage() {
	const { language } = useLanguage();
	const { resolvedTheme } = useTheme();
	const t = labels[language];
	const isDark = resolvedTheme === "dark";
	const queryClient = useQueryClient();

	// UI state
	const [showForm, setShowForm] = useState(false);
	const [selectedBanner, setSelectedBanner] =
		useState<AdminBannerListItemDTO | null>(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

	const isEditing = selectedBanner !== null && showForm;

	// Fetch banners
	const { data: banners, isLoading } = useQuery({
		queryKey: ["admin", "banners"],
		queryFn: async () => {
			const response = await api.admin.banners.$get();
			if (!response.ok) throw new Error("Failed to fetch banners");
			return response.json();
		},
	});

	// Single form for both add and edit
	const form = useForm<BannerFormValues>({
		initialValues: DEFAULT_FORM_VALUES,
		validate: {
			...formValidation,
			imageFile: (value: File | null) => {
				// Required only when adding (not editing)
				if (!isEditing && !value) return "Image is required";
				if (value && value.size > 5 * 1024 * 1024)
					return "Image must be less than 5MB";
				return null;
			},
		},
		validateInputOnChange: true,
		validateInputOnBlur: true,
	});

	// Upload image mutation
	const uploadImageMutation = useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			const response = await fetch(
				`${import.meta.env.VITE_SERVER_URL}/api/upload?category=banners`,
				{ method: "POST", body: formData, credentials: "include" },
			);
			if (!response.ok) throw new Error("Failed to upload image");
			return response.json();
		},
	});

	// Create banner mutation
	const createBannerMutation = useMutation({
		mutationFn: async (values: BannerFormValues) => {
			if (!values.imageFile) throw new Error("No image file");
			const uploadResult = await uploadImageMutation.mutateAsync(
				values.imageFile,
			);

			const response = await api.admin.banners.$post({
				json: {
					titleEn: values.titleEn,
					titleBn: values.titleBn || undefined,
					subtitleEn: values.subtitleEn || undefined,
					subtitleBn: values.subtitleBn || undefined,
					priceLabel: values.priceLabel || undefined,
					badgeText: values.badgeText || undefined,
					badgeColor:
						(values.badgeColor as
							| "red"
							| "teal"
							| "purple"
							| "orange"
							| "green"
							| undefined) || undefined,
					ctaText: values.ctaText || undefined,
					discountPercentage: values.discountPercentage || undefined,
					imageUrl: uploadResult.url,
					s3Key: uploadResult.s3Key,
					linkUrl: values.linkUrl || undefined,
					placement: values.placement as
						| "hero_carousel"
						| "promotional_card"
						| "homepage_middle"
						| "sidebar",
					isActive: values.isActive,
					sortOrder: values.sortOrder,
					startsAt: values.startsAt
						? values.startsAt instanceof Date
							? values.startsAt.toISOString()
							: new Date(values.startsAt).toISOString()
						: undefined,
					endsAt: values.endsAt
						? values.endsAt instanceof Date
							? values.endsAt.toISOString()
							: new Date(values.endsAt).toISOString()
						: undefined,
				},
			});

			if (!response.ok) {
				const errorData: any = await response.json();
				let errorMessage = "Failed to create banner";
				if (typeof errorData === "string") errorMessage = errorData;
				else if (errorData.error)
					errorMessage =
						typeof errorData.error === "string"
							? errorData.error
							: JSON.stringify(errorData.error);
				else if (errorData.message) errorMessage = errorData.message;
				else if (errorData.issues)
					errorMessage = errorData.issues
						.map(
							(issue: any) =>
								`${issue.path.join(".")}: ${issue.message}`,
						)
						.join(", ");
				throw new Error(errorMessage);
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
			toast.success(t.bannerCreated);
			closeForm();
		},
		onError: (error: any) => {
			const msg = error?.message || "Failed to create banner";
			if (msg.includes("upload"))
				toast.error(`Image upload failed: ${msg}`);
			else toast.error(`Error: ${msg}`);
		},
	});

	// Update banner mutation
	const updateBannerMutation = useMutation({
		mutationFn: async ({
			bannerId,
			values,
		}: { bannerId: string; values: BannerFormValues }) => {
			let imageUrl = selectedBanner?.imageUrl;
			let s3Key = selectedBanner?.s3Key;

			if (values.imageFile) {
				const uploadResult = await uploadImageMutation.mutateAsync(
					values.imageFile,
				);
				imageUrl = uploadResult.url;
				s3Key = uploadResult.s3Key;
			}

			const response = await api.admin.banners[":bannerId"].$put({
				param: { bannerId },
				json: {
					titleEn: values.titleEn,
					titleBn: values.titleBn || undefined,
					subtitleEn: values.subtitleEn || undefined,
					subtitleBn: values.subtitleBn || undefined,
					priceLabel: values.priceLabel || undefined,
					badgeText: values.badgeText || undefined,
					badgeColor:
						(values.badgeColor as
							| "red"
							| "teal"
							| "purple"
							| "orange"
							| "green"
							| undefined) || undefined,
					ctaText: values.ctaText || undefined,
					discountPercentage: values.discountPercentage || undefined,
					imageUrl: imageUrl!,
					s3Key: s3Key!,
					linkUrl: values.linkUrl || undefined,
					placement: values.placement as
						| "hero_carousel"
						| "promotional_card"
						| "homepage_middle"
						| "sidebar",
					isActive: values.isActive,
					sortOrder: values.sortOrder,
					startsAt: values.startsAt
						? values.startsAt instanceof Date
							? values.startsAt.toISOString()
							: new Date(values.startsAt).toISOString()
						: undefined,
					endsAt: values.endsAt
						? values.endsAt instanceof Date
							? values.endsAt.toISOString()
							: new Date(values.endsAt).toISOString()
						: undefined,
				},
			});

			if (!response.ok) {
				const errorData: any = await response.json();
				let errorMessage = "Failed to update banner";
				if (typeof errorData === "string") errorMessage = errorData;
				else if (errorData.error)
					errorMessage =
						typeof errorData.error === "string"
							? errorData.error
							: JSON.stringify(errorData.error);
				else if (errorData.message) errorMessage = errorData.message;
				else if (errorData.issues)
					errorMessage = errorData.issues
						.map(
							(issue: any) =>
								`${issue.path.join(".")}: ${issue.message}`,
						)
						.join(", ");
				throw new Error(errorMessage);
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
			toast.success(t.bannerUpdated);
			closeForm();
		},
		onError: (error: any) => {
			const msg = error?.message || "Failed to update banner";
			if (msg.includes("upload"))
				toast.error(`Image upload failed: ${msg}`);
			else toast.error(`Error: ${msg}`);
		},
	});

	// Delete banner mutation
	const deleteBannerMutation = useMutation({
		mutationFn: async (bannerId: string) => {
			const response = await api.admin.banners[":bannerId"].$delete({
				param: { bannerId },
			});
			if (!response.ok) throw new Error("Failed to delete banner");
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
			toast.success(t.bannerDeleted);
			setDeleteModalOpen(false);
			setSelectedBanner(null);
		},
		onError: () => toast.error(t.error),
	});

	// Form actions
	function openAddForm() {
		form.reset();
		setSelectedBanner(null);
		setImagePreviewUrl(null);
		setShowForm(true);
	}

	function openEditForm(banner: AdminBannerListItemDTO) {
		setSelectedBanner(banner);
		setImagePreviewUrl(banner.imageUrl);
		form.setValues({
			titleEn: banner.titleEn,
			titleBn: banner.titleBn || "",
			subtitleEn: banner.subtitleEn || "",
			subtitleBn: banner.subtitleBn || "",
			priceLabel: banner.priceLabel || "",
			badgeText: banner.badgeText || "",
			badgeColor: banner.badgeColor || "",
			ctaText: banner.ctaText || "",
			discountPercentage: banner.discountPercentage,
			imageFile: null,
			linkUrl: banner.linkUrl || "",
			placement: banner.placement,
			isActive: banner.isActive,
			sortOrder: banner.sortOrder,
			startsAt: banner.startsAt ? new Date(banner.startsAt) : null,
			endsAt: banner.endsAt ? new Date(banner.endsAt) : null,
		});
		setShowForm(true);
	}

	function closeForm() {
		setShowForm(false);
		setSelectedBanner(null);
		setImagePreviewUrl(null);
		form.reset();
	}

	function handleSubmit(values: BannerFormValues) {
		if (isEditing) {
			updateBannerMutation.mutate({
				bannerId: selectedBanner.id,
				values,
			});
		} else {
			createBannerMutation.mutate(values);
		}
	}

	// Handle image file change for local preview
	function handleImageFileChange(file: File | null) {
		form.setFieldValue("imageFile", file);
		if (file) {
			const url = URL.createObjectURL(file);
			setImagePreviewUrl(url);
		} else if (isEditing && selectedBanner) {
			setImagePreviewUrl(selectedBanner.imageUrl);
		} else {
			setImagePreviewUrl(null);
		}
	}

	// Compute preview banners from existing data
	const activeBanners = useMemo(() => {
		if (!banners) return { hero: [] as BannerDTO[], promo: [] as BannerDTO[] };
		const active = banners.filter((b) => b.isActive);
		return {
			hero: active
				.filter((b) => b.placement === "hero_carousel")
				.map(toBannerDTO),
			promo: active
				.filter((b) => b.placement === "promotional_card")
				.map(toBannerDTO),
		};
	}, [banners]);

	const placementOptions = [
		{ value: "hero_carousel", label: t.hero_carousel },
		{ value: "promotional_card", label: t.promotional_card },
		{ value: "homepage_middle", label: t.homepage_middle },
		{ value: "sidebar", label: t.sidebar },
	];

	const badgeColorOptions = [
		{ value: "red", label: "Red" },
		{ value: "teal", label: "Teal" },
		{ value: "purple", label: "Purple" },
		{ value: "orange", label: "Orange" },
		{ value: "green", label: "Green" },
	];

	const isSubmitting =
		createBannerMutation.isPending || updateBannerMutation.isPending;

	return (
		<Stack gap="lg">
			{/* Header */}
			<Group justify="space-between">
				<Title
					order={2}
					style={{
						color: isDark
							? "oklch(0.95 0.02 260)"
							: "oklch(0.25 0.02 260)",
					}}
				>
					{t.title}
				</Title>
				<Button
					leftSection={<Plus size={18} />}
					onClick={openAddForm}
					style={{ background: "oklch(0.65 0.15 175)", color: "white" }}
				>
					{t.addBanner}
				</Button>
			</Group>

			{/* Main content: split layout */}
			<div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
				{/* Left: Table + Form */}
				<div className="xl:col-span-7 space-y-4">
					{/* Banner Table */}
					<Paper
						p="md"
						radius="lg"
						style={{
							background: isDark
								? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
								: "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 150) 100%)",
							border: isDark
								? "1px solid oklch(0.3 0.02 260 / 0.3)"
								: "1px solid oklch(0.92 0.01 260 / 0.2)",
						}}
					>
						{isLoading ? (
							<Stack gap="xs">
								{Array.from({ length: 3 }).map((_, i) => (
									<Skeleton key={i} height={60} radius="md" />
								))}
							</Stack>
						) : banners && banners.length > 0 ? (
							<Table highlightOnHover>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>{t.image}</Table.Th>
										<Table.Th>{t.titleLabel}</Table.Th>
										<Table.Th>{t.placement}</Table.Th>
										<Table.Th>{t.active}</Table.Th>
										<Table.Th>{t.sortOrder}</Table.Th>
										<Table.Th>{t.actions}</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{banners.map((banner) => (
										<Table.Tr
											key={banner.id}
											style={{
												background:
													selectedBanner?.id === banner.id
														? isDark
															? "oklch(0.25 0.04 175 / 0.2)"
															: "oklch(0.95 0.03 175 / 0.3)"
														: undefined,
											}}
										>
											<Table.Td>
												<Image
													src={banner.imageUrl}
													alt={banner.titleEn}
													w={80}
													h={45}
													fit="cover"
													radius="sm"
													fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNDUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjQ1IiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtc2l6ZT0iMTAiPk5vIEltZzwvdGV4dD48L3N2Zz4="
												/>
											</Table.Td>
											<Table.Td>
												<Text size="sm" fw={500} lineClamp={1}>
													{language === "en"
														? banner.titleEn
														: banner.titleBn || banner.titleEn}
												</Text>
											</Table.Td>
											<Table.Td>
												<Badge
													size="xs"
													variant="light"
													color={
														banner.placement === "hero_carousel"
															? "blue"
															: banner.placement === "promotional_card"
																? "orange"
																: "gray"
													}
												>
													{t[banner.placement as keyof typeof t] as string}
												</Badge>
											</Table.Td>
											<Table.Td>
												<Badge
													size="xs"
													color={banner.isActive ? "green" : "gray"}
													radius="md"
												>
													{banner.isActive ? t.active : t.inactive}
												</Badge>
											</Table.Td>
											<Table.Td>
												<Text size="sm">{banner.sortOrder}</Text>
											</Table.Td>
											<Table.Td>
												<Group gap={4}>
													<ActionIcon
														variant="subtle"
														color="blue"
														size="sm"
														onClick={() => openEditForm(banner)}
													>
														<Pencil size={14} />
													</ActionIcon>
													<ActionIcon
														variant="subtle"
														color="red"
														size="sm"
														onClick={() => {
															setSelectedBanner(banner);
															setDeleteModalOpen(true);
														}}
													>
														<Trash2 size={14} />
													</ActionIcon>
												</Group>
											</Table.Td>
										</Table.Tr>
									))}
								</Table.Tbody>
							</Table>
						) : (
							<Stack align="center" py="xl" gap="xs">
								<ImageIcon
									size={40}
									className="text-zinc-400 opacity-50"
								/>
								<Text c="dimmed" ta="center" size="sm">
									{t.noResults}
								</Text>
							</Stack>
						)}
					</Paper>

					{/* Inline Add/Edit Form */}
					{showForm && (
						<Paper
							p="lg"
							radius="lg"
							withBorder
							style={{
								borderColor: isDark
									? "oklch(0.4 0.1 175 / 0.4)"
									: "oklch(0.7 0.1 175 / 0.3)",
								background: isDark
									? "oklch(0.2 0.015 260)"
									: "oklch(0.99 0.005 90)",
							}}
						>
							<Group justify="space-between" mb="md">
								<Title
									order={4}
									style={{
										color: isDark
											? "oklch(0.9 0.05 175)"
											: "oklch(0.4 0.1 175)",
									}}
								>
									{isEditing ? t.editBannerTitle : t.addBannerTitle}
								</Title>
								<ActionIcon
									variant="subtle"
									onClick={closeForm}
									color="gray"
								>
									<X size={16} />
								</ActionIcon>
							</Group>

							<form onSubmit={form.onSubmit(handleSubmit)}>
								<Stack gap="sm">
									{/* Image Upload + Preview */}
									<div>
										<FileInput
											label={t.uploadImage}
											placeholder={
												isEditing
													? "Choose new image (optional)"
													: "Choose image..."
											}
											description={
												isEditing
													? "Leave empty to keep current image. Max 5MB."
													: "Recommended: 1200x500px for hero, 600x400px for promo. Max 5MB."
											}
											leftSection={<ImageIcon size={16} />}
											accept="image/*"
											required={!isEditing}
											value={form.values.imageFile}
											onChange={handleImageFileChange}
											error={form.errors.imageFile}
										/>
										{imagePreviewUrl && (
											<Image
												src={imagePreviewUrl}
												alt="Preview"
												h={120}
												fit="contain"
												radius="sm"
												mt="xs"
												style={{
													background: isDark
														? "oklch(0.15 0.01 260)"
														: "oklch(0.96 0.005 260)",
													borderRadius: 8,
												}}
											/>
										)}
									</div>

									{/* Title fields - 2 columns */}
									<SimpleGrid cols={{ base: 1, sm: 2 }}>
										<TextInput
											label={t.titleEn}
											placeholder="Premium Baby Essentials"
											required
											{...form.getInputProps("titleEn")}
										/>
										<TextInput
											label={t.titleBn}
											placeholder="প্রিমিয়াম বেবি এসেনশিয়াল"
											{...form.getInputProps("titleBn")}
										/>
									</SimpleGrid>

									{/* Subtitle fields */}
									<SimpleGrid cols={{ base: 1, sm: 2 }}>
										<TextInput
											label={t.subtitleEn}
											placeholder="Everything your little one needs"
											{...form.getInputProps("subtitleEn")}
										/>
										<TextInput
											label={t.subtitleBn}
											placeholder="আপনার ছোট্টটির জন্য সবকিছু"
											{...form.getInputProps("subtitleBn")}
										/>
									</SimpleGrid>

									{/* Placement + Badge + Sort Order */}
									<SimpleGrid cols={{ base: 1, sm: 3 }}>
										<Select
											label={t.placementLabel}
											data={placementOptions}
											required
											{...form.getInputProps("placement")}
										/>
										<Select
											label={t.badgeColor}
											data={badgeColorOptions}
											clearable
											{...form.getInputProps("badgeColor")}
										/>
										<NumberInput
											label={t.sortOrderLabel}
											min={0}
											{...form.getInputProps("sortOrder")}
										/>
									</SimpleGrid>

									{/* Link + CTA + Badge + Price + Discount */}
									<SimpleGrid cols={{ base: 1, sm: 2 }}>
										<TextInput
											label={t.linkUrl}
											placeholder="/catalog or https://..."
											{...form.getInputProps("linkUrl")}
										/>
										<TextInput
											label={t.ctaText}
											placeholder="Shop Now →"
											{...form.getInputProps("ctaText")}
										/>
										<TextInput
											label={t.badgeText}
											placeholder="NEW COLLECTION"
											{...form.getInputProps("badgeText")}
										/>
										<TextInput
											label={t.priceLabel}
											placeholder="From ৳999"
											{...form.getInputProps("priceLabel")}
										/>
									</SimpleGrid>

									<SimpleGrid cols={{ base: 1, sm: 2 }}>
										<NumberInput
											label={t.discountPercentage}
											placeholder="50"
											min={1}
											max={100}
											{...form.getInputProps("discountPercentage")}
										/>
										<div className="flex items-end pb-1">
											<Switch
												label={t.activeLabel}
												description="Only active banners display on the website"
												{...form.getInputProps("isActive", {
													type: "checkbox",
												})}
											/>
										</div>
									</SimpleGrid>

									{/* Schedule */}
									<SimpleGrid cols={{ base: 1, sm: 2 }}>
										<DateTimePicker
											label={t.startsAt}
											placeholder="Optional start"
											clearable
											{...form.getInputProps("startsAt")}
										/>
										<DateTimePicker
											label={t.endsAt}
											placeholder="Optional end"
											clearable
											{...form.getInputProps("endsAt")}
										/>
									</SimpleGrid>

									{/* Actions */}
									<Group justify="flex-end" mt="xs">
										<Button variant="default" onClick={closeForm}>
											{t.cancel}
										</Button>
										<Button
											type="submit"
											loading={isSubmitting}
											style={{
												background: "oklch(0.65 0.15 175)",
												color: "white",
											}}
										>
											{isSubmitting
												? t.saving
												: isEditing
													? t.save
													: t.create}
										</Button>
									</Group>
								</Stack>
							</form>
						</Paper>
					)}
				</div>

				{/* Right: Live Preview */}
				<div className="xl:col-span-5 sticky top-4">
					<Paper
						p="md"
						radius="lg"
						style={{
							background: isDark
								? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
								: "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 150) 100%)",
							border: isDark
								? "1px solid oklch(0.3 0.02 260 / 0.3)"
								: "1px solid oklch(0.92 0.01 260 / 0.2)",
						}}
					>
						<Group gap="xs" mb="sm">
							<Eye size={16} className="text-teal-500" />
							<Text fw={600} size="sm">
								{t.livePreview}
							</Text>
						</Group>

						{/* Scaled-down hero layout */}
						<div
							className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700"
							style={{ background: isDark ? "#18181b" : "#fff" }}
						>
							<div className="grid grid-cols-12 gap-1 p-1.5">
								{/* Left: Promo cards */}
								<div className="col-span-3" style={{ minHeight: 180 }}>
									<PromotionalBanners
										banners={activeBanners.promo}
										layout="vertical"
									/>
								</div>

								{/* Center: Hero carousel */}
								<div className="col-span-6" style={{ minHeight: 180 }}>
									<HeroBanners banners={activeBanners.hero} />
								</div>

								{/* Right: Placeholder for top trends */}
								<div className="col-span-3 flex flex-col p-1.5">
									<Text
										size="xs"
										fw={700}
										mb={4}
										className="text-zinc-900 dark:text-white"
									>
										{t.topTrends}
									</Text>
									<div className="grid grid-cols-3 gap-1 flex-1">
										{[1, 2, 3, 4, 5, 6].map((i) => (
											<div
												key={i}
												className="aspect-[4/5] rounded bg-zinc-200 dark:bg-zinc-700"
											/>
										))}
									</div>
								</div>
							</div>
						</div>

						<Text size="xs" c="dimmed" mt="xs" ta="center">
							{t.previewDescription}
						</Text>
					</Paper>
				</div>
			</div>

			{/* Delete Confirmation Modal */}
			<Modal
				opened={deleteModalOpen}
				onClose={() => {
					setDeleteModalOpen(false);
					setSelectedBanner(null);
				}}
				title={t.deleteTitle}
			>
				<Stack gap="md">
					<Text>{t.deleteMessage}</Text>
					<Group justify="flex-end" gap="sm">
						<Button
							variant="default"
							onClick={() => {
								setDeleteModalOpen(false);
								setSelectedBanner(null);
							}}
						>
							{t.cancel}
						</Button>
						<Button
							color="red"
							loading={deleteBannerMutation.isPending}
							onClick={() =>
								deleteBannerMutation.mutate(selectedBanner!.id)
							}
						>
							{deleteBannerMutation.isPending
								? t.deleting
								: t.deleteConfirm}
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Stack>
	);
}
