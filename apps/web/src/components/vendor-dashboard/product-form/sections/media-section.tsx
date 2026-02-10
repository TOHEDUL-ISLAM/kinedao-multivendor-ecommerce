import { Group, Text, Paper, Image, CloseButton, Badge, Stack, Box } from "@mantine/core";
import { ImageIcon, Upload } from "lucide-react";
import { FormSectionCard } from "../form-section-card";
import { vendorColors } from "@/lib/vendor-theme";
import type { FormImage } from "../form-types";

interface MediaSectionProps {
  images: FormImage[];
  handleImageUpload: (files: FileList | null) => void;
  removeImage: (index: number) => void;
  isDark: boolean;
  t: {
    images: string;
    coverPhoto: string;
    productPhotos: string;
    uploadCover: string;
    uploadProductPhoto: string;
    maxImages: string;
    primary: string;
  };
}

export function MediaSection({
  images,
  handleImageUpload,
  removeImage,
  isDark,
  t,
}: MediaSectionProps) {
  const triggerUpload = (multiple: boolean = true) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.multiple = multiple;
    input.onchange = () => handleImageUpload(input.files);
    input.click();
  };

  const coverImage = images[0];
  const additionalImages = images.slice(1);

  return (
    <FormSectionCard title={t.images} icon={<ImageIcon size={20} />}>
      <Text size="sm" c="dimmed">
        {t.maxImages}
      </Text>

      <Stack gap="md">
        {/* Cover Photo (Primary) */}
        <Box>
          <Text size="sm" fw={500} mb="xs" style={{ color: vendorColors.text.primary(isDark) }}>
            {t.coverPhoto}
          </Text>
          {coverImage ? (
            <Paper
              withBorder
              radius="md"
              p={4}
              pos="relative"
              style={{
                width: "100%",
                height: 200,
                borderColor: isDark ? "oklch(0.4 0.02 260 / 0.5)" : undefined,
              }}
            >
              <Image
                src={coverImage.url}
                alt="Cover"
                w="100%"
                h={192}
                radius="sm"
                fit="cover"
              />
              <CloseButton
                size="sm"
                pos="absolute"
                top={8}
                right={8}
                onClick={() => removeImage(0)}
                style={{
                  backgroundColor: "rgba(0,0,0,0.6)",
                  color: "white",
                }}
              />
              <Badge
                size="xs"
                pos="absolute"
                bottom={12}
                left={12}
                color="teal"
              >
                {t.primary}
              </Badge>
            </Paper>
          ) : (
            <Paper
              withBorder
              radius="md"
              p="xl"
              style={{
                width: "100%",
                height: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                borderStyle: "dashed",
                background: isDark ? "oklch(0.22 0.02 260)" : undefined,
                borderColor: isDark ? "oklch(0.4 0.02 260 / 0.5)" : undefined,
              }}
              onClick={() => triggerUpload(false)}
            >
              <Stack align="center" gap="xs">
                <Upload
                  size={32}
                  color={
                    isDark
                      ? vendorColors.text.secondary(isDark)
                      : "var(--mantine-color-dimmed)"
                  }
                />
                <Text
                  size="sm"
                  style={{ color: vendorColors.text.secondary(isDark) }}
                >
                  {t.uploadCover}
                </Text>
              </Stack>
            </Paper>
          )}
        </Box>

        {/* Additional Product Photos (up to 4 more) */}
        <Box>
          <Text size="sm" fw={500} mb="xs" style={{ color: vendorColors.text.primary(isDark) }}>
            {t.productPhotos} ({additionalImages.length}/4)
          </Text>
          <Group gap="md" wrap="nowrap" style={{ overflowX: "auto" }}>
            {additionalImages.map((img, index) => (
              <Paper
                key={index}
                withBorder
                radius="md"
                p={4}
                pos="relative"
                style={{
                  minWidth: 160,
                  width: 160,
                  height: 160,
                  flexShrink: 0,
                  borderColor: isDark ? "oklch(0.4 0.02 260 / 0.5)" : undefined,
                }}
              >
                <Image
                  src={img.url}
                  alt={`Product ${index + 2}`}
                  w={152}
                  h={152}
                  radius="sm"
                  fit="cover"
                />
                <CloseButton
                  size="xs"
                  pos="absolute"
                  top={4}
                  right={4}
                  onClick={() => removeImage(index + 1)}
                  style={{
                    backgroundColor: "rgba(0,0,0,0.6)",
                    color: "white",
                  }}
                />
              </Paper>
            ))}

            {/* Upload slots for remaining images */}
            {Array.from({ length: Math.min(4 - additionalImages.length, 4) }).map((_, i) => (
              <Paper
                key={`upload-${i}`}
                withBorder
                radius="md"
                p="md"
                style={{
                  minWidth: 160,
                  width: 160,
                  height: 160,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  borderStyle: "dashed",
                  background: isDark ? "oklch(0.22 0.02 260)" : undefined,
                  borderColor: isDark ? "oklch(0.4 0.02 260 / 0.5)" : undefined,
                }}
                onClick={() => triggerUpload(true)}
              >
                <Stack align="center" gap={4}>
                  <Upload
                    size={24}
                    color={
                      isDark
                        ? vendorColors.text.secondary(isDark)
                        : "var(--mantine-color-dimmed)"
                    }
                  />
                  <Text
                    size="xs"
                    style={{
                      color: vendorColors.text.secondary(isDark),
                      textAlign: "center",
                    }}
                  >
                    {t.uploadProductPhoto}
                  </Text>
                </Stack>
              </Paper>
            ))}
          </Group>
        </Box>
      </Stack>
    </FormSectionCard>
  );
}
