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
  Badge,
  Modal,
  TextInput,
  Select,
  Switch,
  NumberInput,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import type { AdminCategoryListItemDTO } from "@kineDao.com/api-types/admin";

export const Route = createFileRoute("/admin/_layout/categories")({
  component: AdminCategoriesPage,
});

const labels = {
  en: {
    title: "Category Management",
    addCategory: "Add Category",
    icon: "Icon",
    name: "Name",
    slug: "Slug",
    productCount: "Products",
    status: "Status",
    actions: "Actions",
    noResults: "No categories found",
    edit: "Edit",
    delete: "Delete",
    featured: "Featured",
    popular: "Popular",
    // Modal labels
    addCategoryTitle: "Add New Category",
    editCategoryTitle: "Edit Category",
    nameEn: "Name (English)",
    nameBn: "Name (Bangla)",
    slugLabel: "Slug",
    parentCategory: "Parent Category",
    iconKey: "Icon Key",
    sortOrderLabel: "Sort Order",
    isFeaturedLabel: "Featured",
    isPopularLabel: "Popular",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    // Delete modal
    deleteTitle: "Delete Category",
    deleteMessage: "Are you sure you want to delete this category?",
    deleteError: "Cannot delete category with products",
    deleteConfirm: "Delete",
    deleting: "Deleting...",
    // Toast messages
    categoryCreated: "Category created successfully",
    categoryUpdated: "Category updated successfully",
    categoryDeleted: "Category deleted successfully",
    error: "An error occurred",
    noneSelected: "None (Top Level)",
  },
  bn: {
    title: "ক্যাটাগরি ব্যবস্থাপনা",
    addCategory: "ক্যাটাগরি যোগ করুন",
    icon: "আইকন",
    name: "নাম",
    slug: "স্লাগ",
    productCount: "পণ্য",
    status: "অবস্থা",
    actions: "কার্যক্রম",
    noResults: "কোনো ক্যাটাগরি পাওয়া যায়নি",
    edit: "সম্পাদনা",
    delete: "মুছুন",
    featured: "বৈশিষ্ট্যযুক্ত",
    popular: "জনপ্রিয়",
    // Modal labels
    addCategoryTitle: "নতুন ক্যাটাগরি যোগ করুন",
    editCategoryTitle: "ক্যাটাগরি সম্পাদনা করুন",
    nameEn: "নাম (ইংরেজি)",
    nameBn: "নাম (বাংলা)",
    slugLabel: "স্লাগ",
    parentCategory: "প্যারেন্ট ক্যাটাগরি",
    iconKey: "আইকন কী",
    sortOrderLabel: "ক্রম",
    isFeaturedLabel: "বৈশিষ্ট্যযুক্ত",
    isPopularLabel: "জনপ্রিয়",
    cancel: "বাতিল",
    save: "সংরক্ষণ",
    saving: "সংরক্ষণ হচ্ছে...",
    // Delete modal
    deleteTitle: "ক্যাটাগরি মুছুন",
    deleteMessage: "আপনি কি নিশ্চিত যে আপনি এই ক্যাটাগরিটি মুছতে চান?",
    deleteError: "পণ্য সহ ক্যাটাগরি মুছা যাবে না",
    deleteConfirm: "মুছুন",
    deleting: "মুছছে...",
    // Toast messages
    categoryCreated: "ক্যাটাগরি সফলভাবে তৈরি হয়েছে",
    categoryUpdated: "ক্যাটাগরি সফলভাবে আপডেট হয়েছে",
    categoryDeleted: "ক্যাটাগরি সফলভাবে মুছে ফেলা হয়েছে",
    error: "একটি ত্রুটি ঘটেছে",
    noneSelected: "কোনোটি নয় (শীর্ষ স্তর)",
  },
};

interface CategoryFormValues {
  nameEn: string;
  nameBn: string;
  slug: string;
  parentId: string | null;
  iconKey: string;
  sortOrder: number;
  isFeatured: boolean;
  isPopular: boolean;
}

function AdminCategoriesPage() {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const t = labels[language];
  const isDark = resolvedTheme === "dark";
  const queryClient = useQueryClient();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategoryListItemDTO | null>(null);

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const response = await api.admin.categories.$get();
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Add category form
  const addForm = useForm<CategoryFormValues>({
    initialValues: {
      nameEn: "",
      nameBn: "",
      slug: "",
      parentId: null,
      iconKey: "",
      sortOrder: 0,
      isFeatured: false,
      isPopular: false,
    },
    validate: {
      nameEn: (value: string) => (!value ? "Name (English) is required" : null),
      slug: (value: string) => (!value ? "Slug is required" : null),
    },
  });

  // Edit category form
  const editForm = useForm<CategoryFormValues>({
    initialValues: {
      nameEn: "",
      nameBn: "",
      slug: "",
      parentId: null,
      iconKey: "",
      sortOrder: 0,
      isFeatured: false,
      isPopular: false,
    },
    validate: {
      nameEn: (value: string) => (!value ? "Name (English) is required" : null),
      slug: (value: string) => (!value ? "Slug is required" : null),
    },
  });

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (values: CategoryFormValues) => {
      const response = await api.admin.categories.$post({
        json: {
          name: values.nameEn,
          nameBn: values.nameBn || undefined,
          slug: values.slug,
          parentId: values.parentId || undefined,
          iconKey: values.iconKey || undefined,
          sortOrder: values.sortOrder,
          isFeatured: values.isFeatured,
          isPopular: values.isPopular,
        },
      });

      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success(t.categoryCreated);
      setAddModalOpen(false);
      addForm.reset();
    },
    onError: () => {
      toast.error(t.error);
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ categoryId, values }: { categoryId: string; values: CategoryFormValues }) => {
      const response = await api.admin.categories[":categoryId"].$put({
        param: { categoryId },
        json: {
          name: values.nameEn,
          nameBn: values.nameBn || undefined,
          slug: values.slug,
          parentId: values.parentId || undefined,
          iconKey: values.iconKey || undefined,
          sortOrder: values.sortOrder,
          isFeatured: values.isFeatured,
          isPopular: values.isPopular,
        },
      });

      if (!response.ok) throw new Error("Failed to update category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success(t.categoryUpdated);
      setEditModalOpen(false);
      setSelectedCategory(null);
      editForm.reset();
    },
    onError: () => {
      toast.error(t.error);
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await api.admin.categories[":categoryId"].$delete({
        param: { categoryId },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success(t.categoryDeleted);
      setDeleteModalOpen(false);
      setSelectedCategory(null);
    },
    onError: (error: Error) => {
      if (error.message.includes("products")) {
        toast.error(t.deleteError);
      } else {
        toast.error(t.error);
      }
    },
  });

  const handleEdit = (category: AdminCategoryListItemDTO) => {
    setSelectedCategory(category);
    editForm.setValues({
      nameEn: category.name,
      nameBn: category.nameBn || "",
      slug: category.slug,
      parentId: category.parentId || null,
      iconKey: category.iconKey || "",
      sortOrder: category.sortOrder ?? 0,
      isFeatured: category.isFeatured ?? false,
      isPopular: category.isPopular ?? false,
    });
    setEditModalOpen(true);
  };

  const handleDelete = (category: AdminCategoryListItemDTO) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  // Create parent category options
  const parentCategoryOptions = categories
    ? [
        { value: "", label: t.noneSelected },
        ...categories.map((cat) => ({
          value: cat.id,
          label: language === "en" ? cat.name : cat.nameBn || cat.name,
        })),
      ]
    : [];

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
          {t.addCategory}
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
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} height={60} radius="md" />
            ))}
          </Stack>
        ) : categories && categories.length > 0 ? (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t.icon}</Table.Th>
                <Table.Th>{t.name}</Table.Th>
                <Table.Th>{t.slug}</Table.Th>
                <Table.Th>{t.productCount}</Table.Th>
                <Table.Th>{t.status}</Table.Th>
                <Table.Th>{t.actions}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {categories.map((category) => (
                <Table.Tr key={category.id}>
                  <Table.Td>
                    {category.iconKey && (
                      <Group gap="xs">
                        <Tag size={20} color="oklch(0.65 0.15 175)" />
                      </Group>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {language === "en" ? category.name : category.nameBn || category.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {category.slug}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{category.productCount}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {category.isFeatured && (
                        <Badge size="sm" color="blue" radius="md">
                          {t.featured}
                        </Badge>
                      )}
                      {category.isPopular && (
                        <Badge size="sm" color="grape" radius="md">
                          {t.popular}
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(category)}
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

      {/* Add Category Modal */}
      <Modal
        opened={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          addForm.reset();
        }}
        title={t.addCategoryTitle}
        size="lg"
      >
        <form onSubmit={addForm.onSubmit((values) => createCategoryMutation.mutate(values))}>
          <Stack gap="md">
            <TextInput
              label={t.nameEn}
              placeholder={t.nameEn}
              required
              {...addForm.getInputProps("nameEn")}
              onChange={(e) => {
                addForm.setFieldValue("nameEn", e.target.value);
                if (!addForm.values.slug) {
                  addForm.setFieldValue("slug", generateSlug(e.target.value));
                }
              }}
            />
            <TextInput
              label={t.nameBn}
              placeholder={t.nameBn}
              {...addForm.getInputProps("nameBn")}
            />
            <TextInput
              label={t.slugLabel}
              placeholder={t.slugLabel}
              required
              {...addForm.getInputProps("slug")}
            />
            <Select
              label={t.parentCategory}
              placeholder={t.parentCategory}
              data={parentCategoryOptions}
              {...addForm.getInputProps("parentId")}
              clearable
            />
            <TextInput
              label={t.iconKey}
              placeholder="e.g., baby-bottle"
              {...addForm.getInputProps("iconKey")}
            />
            <NumberInput
              label={t.sortOrderLabel}
              placeholder="0"
              min={0}
              {...addForm.getInputProps("sortOrder")}
            />
            <Switch
              label={t.isFeaturedLabel}
              {...addForm.getInputProps("isFeatured", { type: "checkbox" })}
            />
            <Switch
              label={t.isPopularLabel}
              {...addForm.getInputProps("isPopular", { type: "checkbox" })}
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
                loading={createCategoryMutation.isPending}
                style={{
                  background: "oklch(0.65 0.15 175)",
                  color: "white",
                }}
              >
                {createCategoryMutation.isPending ? t.saving : t.save}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCategory(null);
          editForm.reset();
        }}
        title={t.editCategoryTitle}
        size="lg"
      >
        <form
          onSubmit={editForm.onSubmit((values) =>
            updateCategoryMutation.mutate({ categoryId: selectedCategory!.id, values })
          )}
        >
          <Stack gap="md">
            <TextInput
              label={t.nameEn}
              placeholder={t.nameEn}
              required
              {...editForm.getInputProps("nameEn")}
            />
            <TextInput
              label={t.nameBn}
              placeholder={t.nameBn}
              {...editForm.getInputProps("nameBn")}
            />
            <TextInput
              label={t.slugLabel}
              placeholder={t.slugLabel}
              required
              {...editForm.getInputProps("slug")}
            />
            <Select
              label={t.parentCategory}
              placeholder={t.parentCategory}
              data={parentCategoryOptions.filter((opt) => opt.value !== selectedCategory?.id)}
              {...editForm.getInputProps("parentId")}
              clearable
            />
            <TextInput
              label={t.iconKey}
              placeholder="e.g., baby-bottle"
              {...editForm.getInputProps("iconKey")}
            />
            <NumberInput
              label={t.sortOrderLabel}
              placeholder="0"
              min={0}
              {...editForm.getInputProps("sortOrder")}
            />
            <Switch
              label={t.isFeaturedLabel}
              {...editForm.getInputProps("isFeatured", { type: "checkbox" })}
            />
            <Switch
              label={t.isPopularLabel}
              {...editForm.getInputProps("isPopular", { type: "checkbox" })}
            />
            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedCategory(null);
                  editForm.reset();
                }}
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                loading={updateCategoryMutation.isPending}
                style={{
                  background: "oklch(0.65 0.15 175)",
                  color: "white",
                }}
              >
                {updateCategoryMutation.isPending ? t.saving : t.save}
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
          setSelectedCategory(null);
        }}
        title={t.deleteTitle}
      >
        <Stack gap="md">
          <Text>{t.deleteMessage}</Text>
          {selectedCategory && selectedCategory.productCount > 0 && (
            <Text c="red" size="sm">
              {t.deleteError} ({selectedCategory.productCount} {t.productCount.toLowerCase()})
            </Text>
          )}
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedCategory(null);
              }}
            >
              {t.cancel}
            </Button>
            <Button
              color="red"
              loading={deleteCategoryMutation.isPending}
              onClick={() => deleteCategoryMutation.mutate(selectedCategory!.id)}
            >
              {deleteCategoryMutation.isPending ? t.deleting : t.deleteConfirm}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
