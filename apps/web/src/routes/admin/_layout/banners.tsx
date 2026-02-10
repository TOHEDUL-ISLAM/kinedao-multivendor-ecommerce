import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { Plus, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import type { AdminBannerListItemDTO } from "@kineDao.com/api-types/admin";

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
    sortOrder: "Sort Order",
    actions: "Actions",
    noResults: "No banners found",
    edit: "Edit",
    delete: "Delete",
    // Modal labels
    addBannerTitle: "Add New Banner",
    editBannerTitle: "Edit Banner",
    uploadImage: "Upload Image",
    titleEn: "Title (English)",
    titleBn: "Title (Bangla)",
    subtitleEn: "Subtitle (English)",
    subtitleBn: "Subtitle (Bangla)",
    priceLabel: "Price Label",
    badgeText: "Badge Text",
    badgeColor: "Badge Color",
    ctaText: "CTA Button Text",
    discountPercentage: "Discount Percentage",
    linkUrl: "Link URL",
    placementLabel: "Placement",
    activeLabel: "Active",
    sortOrderLabel: "Sort Order",
    startsAt: "Start Date/Time",
    endsAt: "End Date/Time",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    // Delete modal
    deleteTitle: "Delete Banner",
    deleteMessage: "Are you sure you want to delete this banner? This action cannot be undone.",
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
  },
  bn: {
    title: "ব্যানার ব্যবস্থাপনা",
    addBanner: "ব্যানার যোগ করুন",
    image: "ছবি",
    titleLabel: "শিরোনাম",
    placement: "অবস্থান",
    active: "সক্রিয়",
    sortOrder: "ক্রম",
    actions: "কার্যক্রম",
    noResults: "কোনো ব্যানার পাওয়া যায়নি",
    edit: "সম্পাদনা",
    delete: "মুছুন",
    // Modal labels
    addBannerTitle: "নতুন ব্যানার যোগ করুন",
    editBannerTitle: "ব্যানার সম্পাদনা করুন",
    uploadImage: "ছবি আপলোড করুন",
    titleEn: "শিরোনাম (ইংরেজি)",
    titleBn: "শিরোনাম (বাংলা)",
    subtitleEn: "উপশিরোনাম (ইংরেজি)",
    subtitleBn: "উপশিরোনাম (বাংলা)",
    priceLabel: "মূল্য লেবেল",
    badgeText: "ব্যাজ টেক্সট",
    badgeColor: "ব্যাজ রঙ",
    ctaText: "CTA বাটন টেক্সট",
    discountPercentage: "ছাড় শতাংশ",
    linkUrl: "লিংক URL",
    placementLabel: "অবস্থান",
    activeLabel: "সক্রিয়",
    sortOrderLabel: "ক্রম",
    startsAt: "শুরুর তারিখ/সময়",
    endsAt: "শেষ তারিখ/সময়",
    cancel: "বাতিল",
    save: "সংরক্ষণ",
    saving: "সংরক্ষণ হচ্ছে...",
    // Delete modal
    deleteTitle: "ব্যানার মুছুন",
    deleteMessage: "আপনি কি নিশ্চিত যে আপনি এই ব্যানারটি মুছতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
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

function AdminBannersPage() {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const t = labels[language];
  const isDark = resolvedTheme === "dark";
  const queryClient = useQueryClient();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<AdminBannerListItemDTO | null>(null);

  // Fetch banners
  const { data: banners, isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => {
      const response = await api.admin.banners.$get();
      if (!response.ok) throw new Error("Failed to fetch banners");
      return response.json();
    },
  });

  // Add banner form
  const addForm = useForm<BannerFormValues>({
    initialValues: {
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
    },
    validate: {
      titleEn: (value: string) => (!value ? "Title (English) is required" : null),
      imageFile: (value: File | null) => (!value ? "Image is required" : null),
      placement: (value: string) => (!value ? "Placement is required" : null),
    },
  });

  // Edit banner form
  const editForm = useForm<BannerFormValues>({
    initialValues: {
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
    },
    validate: {
      titleEn: (value: string) => (!value ? "Title (English) is required" : null),
      placement: (value: string) => (!value ? "Placement is required" : null),
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/upload?category=banners`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to upload image");
      return response.json();
    },
  });

  // Create banner mutation
  const createBannerMutation = useMutation({
    mutationFn: async (values: BannerFormValues) => {
      // Upload image first
      if (!values.imageFile) throw new Error("No image file");
      const uploadResult = await uploadImageMutation.mutateAsync(values.imageFile);

      // Create banner
      const response = await api.admin.banners.$post({
        json: {
          titleEn: values.titleEn,
          titleBn: values.titleBn || undefined,
          subtitleEn: values.subtitleEn || undefined,
          subtitleBn: values.subtitleBn || undefined,
          priceLabel: values.priceLabel || undefined,
          badgeText: values.badgeText || undefined,
          badgeColor: values.badgeColor || undefined,
          ctaText: values.ctaText || undefined,
          discountPercentage: values.discountPercentage || undefined,
          imageUrl: uploadResult.url,
          s3Key: uploadResult.key,
          linkUrl: values.linkUrl || undefined,
          placement: values.placement as "hero_carousel" | "promotional_card" | "homepage_middle" | "sidebar",
          isActive: values.isActive,
          sortOrder: values.sortOrder,
          startsAt: values.startsAt?.toISOString() || undefined,
          endsAt: values.endsAt?.toISOString() || undefined,
        },
      });

      if (!response.ok) throw new Error("Failed to create banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
      toast.success(t.bannerCreated);
      setAddModalOpen(false);
      addForm.reset();
    },
    onError: () => {
      toast.error(t.error);
    },
  });

  // Update banner mutation
  const updateBannerMutation = useMutation({
    mutationFn: async ({ bannerId, values }: { bannerId: string; values: BannerFormValues }) => {
      let imageUrl = selectedBanner?.imageUrl;
      let s3Key = selectedBanner?.s3Key;

      // Upload new image if provided
      if (values.imageFile) {
        const uploadResult = await uploadImageMutation.mutateAsync(values.imageFile);
        imageUrl = uploadResult.url;
        s3Key = uploadResult.key;
      }

      // Update banner
      const response = await api.admin.banners[":bannerId"].$put({
        param: { bannerId },
        json: {
          titleEn: values.titleEn,
          titleBn: values.titleBn || undefined,
          subtitleEn: values.subtitleEn || undefined,
          subtitleBn: values.subtitleBn || undefined,
          priceLabel: values.priceLabel || undefined,
          badgeText: values.badgeText || undefined,
          badgeColor: values.badgeColor || undefined,
          ctaText: values.ctaText || undefined,
          discountPercentage: values.discountPercentage || undefined,
          imageUrl: imageUrl!,
          s3Key: s3Key!,
          linkUrl: values.linkUrl || undefined,
          placement: values.placement as "hero_carousel" | "promotional_card" | "homepage_middle" | "sidebar",
          isActive: values.isActive,
          sortOrder: values.sortOrder,
          startsAt: values.startsAt?.toISOString() || undefined,
          endsAt: values.endsAt?.toISOString() || undefined,
        },
      });

      if (!response.ok) throw new Error("Failed to update banner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
      toast.success(t.bannerUpdated);
      setEditModalOpen(false);
      setSelectedBanner(null);
      editForm.reset();
    },
    onError: () => {
      toast.error(t.error);
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
    onError: () => {
      toast.error(t.error);
    },
  });

  const handleEdit = (banner: AdminBannerListItemDTO) => {
    setSelectedBanner(banner);
    editForm.setValues({
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
    setEditModalOpen(true);
  };

  const handleDelete = (banner: AdminBannerListItemDTO) => {
    setSelectedBanner(banner);
    setDeleteModalOpen(true);
  };

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

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={2} style={{ color: isDark ? "oklch(0.95 0.02 260)" : "oklch(0.25 0.02 260)" }}>
          {t.title}
        </Title>
        <Button
          leftSection={<Plus size={18} />}
          onClick={() => setAddModalOpen(true)}
          style={{
            background: "oklch(0.65 0.15 175)",
            color: "white",
          }}
        >
          {t.addBanner}
        </Button>
      </Group>

      <Paper
        p="lg"
        radius="lg"
        style={{
          background: isDark
            ? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
            : "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 150) 100%)",
          border: isDark ? "1px solid oklch(0.3 0.02 260 / 0.3)" : "1px solid oklch(0.92 0.01 260 / 0.2)",
        }}
      >
        {isLoading ? (
          <Stack gap="xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={80} radius="md" />
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
                <Table.Tr key={banner.id}>
                  <Table.Td>
                    <Image
                      src={banner.imageUrl}
                      alt={banner.titleEn}
                      width={100}
                      height={50}
                      fit="cover"
                      radius="sm"
                    />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {language === "en" ? banner.titleEn : banner.titleBn || banner.titleEn}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{t[banner.placement as keyof typeof t] as string}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" color={banner.isActive ? "green" : "gray"} radius="md">
                      {banner.isActive ? t.active : "Inactive"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{banner.sortOrder}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleEdit(banner)}
                      >
                        <Pencil size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(banner)}
                      >
                        <Trash2 size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            {t.noResults}
          </Text>
        )}
      </Paper>

      {/* Add Banner Modal */}
      <Modal
        opened={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          addForm.reset();
        }}
        title={t.addBannerTitle}
        size="lg"
      >
        <form onSubmit={addForm.onSubmit((values: BannerFormValues) => createBannerMutation.mutate(values))}>
          <Stack gap="md">
            <FileInput
              label={t.uploadImage}
              placeholder={t.uploadImage}
              leftSection={<ImageIcon size={16} />}
              accept="image/*"
              required
              {...addForm.getInputProps("imageFile")}
            />
            <TextInput
              label={t.titleEn}
              placeholder={t.titleEn}
              required
              {...addForm.getInputProps("titleEn")}
            />
            <TextInput
              label={t.titleBn}
              placeholder={t.titleBn}
              {...addForm.getInputProps("titleBn")}
            />
            <TextInput
              label={t.subtitleEn}
              placeholder="Everything your little one needs"
              {...addForm.getInputProps("subtitleEn")}
            />
            <TextInput
              label={t.subtitleBn}
              placeholder="আপনার ছোট্টটির জন্য সবকিছু"
              {...addForm.getInputProps("subtitleBn")}
            />
            <TextInput
              label={t.priceLabel}
              placeholder="From $19.99"
              {...addForm.getInputProps("priceLabel")}
            />
            <TextInput
              label={t.badgeText}
              placeholder="NEW COLLECTION"
              {...addForm.getInputProps("badgeText")}
            />
            <Select
              label={t.badgeColor}
              placeholder="Select color"
              data={badgeColorOptions}
              {...addForm.getInputProps("badgeColor")}
            />
            <TextInput
              label={t.ctaText}
              placeholder="Shop Now →"
              {...addForm.getInputProps("ctaText")}
            />
            <NumberInput
              label={t.discountPercentage}
              placeholder="50"
              min={1}
              max={100}
              {...addForm.getInputProps("discountPercentage")}
            />
            <TextInput
              label={t.linkUrl}
              placeholder="https://example.com"
              {...addForm.getInputProps("linkUrl")}
            />
            <Select
              label={t.placementLabel}
              placeholder={t.placementLabel}
              data={placementOptions}
              required
              {...addForm.getInputProps("placement")}
            />
            <Switch
              label={t.activeLabel}
              {...addForm.getInputProps("isActive", { type: "checkbox" })}
            />
            <NumberInput
              label={t.sortOrderLabel}
              placeholder="0"
              min={0}
              {...addForm.getInputProps("sortOrder")}
            />
            <DateTimePicker
              label={t.startsAt}
              placeholder={t.startsAt}
              {...addForm.getInputProps("startsAt")}
            />
            <DateTimePicker
              label={t.endsAt}
              placeholder={t.endsAt}
              {...addForm.getInputProps("endsAt")}
            />
            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                onClick={() => {
                  setAddModalOpen(false);
                  addForm.reset();
                }}
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                loading={createBannerMutation.isPending}
                style={{
                  background: "oklch(0.65 0.15 175)",
                  color: "white",
                }}
              >
                {createBannerMutation.isPending ? t.saving : t.save}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Banner Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedBanner(null);
          editForm.reset();
        }}
        title={t.editBannerTitle}
        size="lg"
      >
        <form
          onSubmit={editForm.onSubmit((values: BannerFormValues) =>
            updateBannerMutation.mutate({ bannerId: selectedBanner!.id, values })
          )}
        >
          <Stack gap="md">
            {selectedBanner && (
              <Image
                src={selectedBanner.imageUrl}
                alt={selectedBanner.titleEn}
                height={100}
                fit="contain"
                radius="sm"
              />
            )}
            <FileInput
              label={t.uploadImage}
              placeholder={t.uploadImage}
              leftSection={<ImageIcon size={16} />}
              accept="image/*"
              description="Leave empty to keep current image"
              {...editForm.getInputProps("imageFile")}
            />
            <TextInput
              label={t.titleEn}
              placeholder={t.titleEn}
              required
              {...editForm.getInputProps("titleEn")}
            />
            <TextInput
              label={t.titleBn}
              placeholder={t.titleBn}
              {...editForm.getInputProps("titleBn")}
            />
            <TextInput
              label={t.subtitleEn}
              placeholder="Everything your little one needs"
              {...editForm.getInputProps("subtitleEn")}
            />
            <TextInput
              label={t.subtitleBn}
              placeholder="আপনার ছোট্টটির জন্য সবকিছু"
              {...editForm.getInputProps("subtitleBn")}
            />
            <TextInput
              label={t.priceLabel}
              placeholder="From $19.99"
              {...editForm.getInputProps("priceLabel")}
            />
            <TextInput
              label={t.badgeText}
              placeholder="NEW COLLECTION"
              {...editForm.getInputProps("badgeText")}
            />
            <Select
              label={t.badgeColor}
              placeholder="Select color"
              data={badgeColorOptions}
              {...editForm.getInputProps("badgeColor")}
            />
            <TextInput
              label={t.ctaText}
              placeholder="Shop Now →"
              {...editForm.getInputProps("ctaText")}
            />
            <NumberInput
              label={t.discountPercentage}
              placeholder="50"
              min={1}
              max={100}
              {...editForm.getInputProps("discountPercentage")}
            />
            <TextInput
              label={t.linkUrl}
              placeholder="https://example.com"
              {...editForm.getInputProps("linkUrl")}
            />
            <Select
              label={t.placementLabel}
              placeholder={t.placementLabel}
              data={placementOptions}
              required
              {...editForm.getInputProps("placement")}
            />
            <Switch
              label={t.activeLabel}
              {...editForm.getInputProps("isActive", { type: "checkbox" })}
            />
            <NumberInput
              label={t.sortOrderLabel}
              placeholder="0"
              min={0}
              {...editForm.getInputProps("sortOrder")}
            />
            <DateTimePicker
              label={t.startsAt}
              placeholder={t.startsAt}
              {...editForm.getInputProps("startsAt")}
            />
            <DateTimePicker
              label={t.endsAt}
              placeholder={t.endsAt}
              {...editForm.getInputProps("endsAt")}
            />
            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedBanner(null);
                  editForm.reset();
                }}
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                loading={updateBannerMutation.isPending}
                style={{
                  background: "oklch(0.65 0.15 175)",
                  color: "white",
                }}
              >
                {updateBannerMutation.isPending ? t.saving : t.save}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

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
              onClick={() => deleteBannerMutation.mutate(selectedBanner!.id)}
            >
              {deleteBannerMutation.isPending ? t.deleting : t.deleteConfirm}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
