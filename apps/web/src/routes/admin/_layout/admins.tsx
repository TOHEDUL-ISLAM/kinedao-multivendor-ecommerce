import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Paper,
  Skeleton,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { toast } from "sonner";
import { UserPlus, Mail, Calendar, Shield } from "lucide-react";
import { api } from "@/lib/api-client";
import { AdminInviteModal } from "@/components/admin/admin-invite-modal";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";

export const Route = createFileRoute("/admin/_layout/admins")({
  beforeLoad: async ({ context }) => {
    if (!context.isSuperAdmin) {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
  loader: async ({ context }) => {
    return { currentUserId: context.session.user.id };
  },
  component: AdminManagementPage,
});

const labels = {
  en: {
    title: "Admin Management",
    inviteAdmin: "Invite Admin",
    name: "Name",
    email: "Email",
    roles: "Roles",
    created: "Created",
    actions: "Actions",
    revoke: "Revoke",
    loading: "Loading admins...",
    noAdmins: "No admins found.",
    revokeSuccess: "Admin access revoked",
    you: "(You)",
  },
  bn: {
    title: "অ্যাডমিন ব্যবস্থাপনা",
    inviteAdmin: "অ্যাডমিন আমন্ত্রণ",
    name: "নাম",
    email: "ইমেইল",
    roles: "ভূমিকা",
    created: "তৈরি",
    actions: "কর্ম",
    revoke: "বাতিল",
    loading: "অ্যাডমিন লোড হচ্ছে...",
    noAdmins: "কোনো অ্যাডমিন পাওয়া যায়নি।",
    revokeSuccess: "অ্যাডমিন অ্যাক্সেস বাতিল করা হয়েছে",
    you: "(আপনি)",
  },
};

function AdminManagementPage() {
  const queryClient = useQueryClient();
  const { currentUserId } = Route.useLoaderData();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [revokingUserId, setRevokingUserId] = useState<string | null>(null);
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const t = labels[language];
  const isDark = resolvedTheme === "dark";

  const adminsQuery = useQuery({
    queryKey: ["admin-management-admins"],
    queryFn: async () => {
      const response = await api.adminManagement.admins.$get();
      if (!response.ok) {
        throw new Error("Failed to load admins");
      }
      return response.json();
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      setRevokingUserId(userId);
      const response = await api.adminManagement.admins[":userId"].$delete({
        param: { userId },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error((data as { error?: string } | null)?.error || "Failed to revoke admin");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success(t.revokeSuccess);
      void queryClient.invalidateQueries({ queryKey: ["admin-management-admins"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSettled: () => {
      setRevokingUserId(null);
    },
  });

  return (
    <Stack gap="xl">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Title
          order={2}
          className="text-xl sm:text-2xl"
          style={{ color: isDark ? "oklch(0.95 0.02 260)" : "oklch(0.25 0.02 260)" }}
        >
          {t.title}
        </Title>
        <Button
          leftSection={<UserPlus size={18} />}
          onClick={() => setInviteOpen(true)}
          size="sm"
          style={{
            background: "oklch(0.65 0.15 175)",
            color: "white",
          }}
        >
          {t.inviteAdmin}
        </Button>
      </Group>

      <Paper
        p={{ base: "sm", sm: "lg" }}
        radius="lg"
        style={{
          background: isDark
            ? "linear-gradient(135deg, oklch(0.22 0.02 260) 0%, oklch(0.2 0.02 250) 100%)"
            : "linear-gradient(135deg, oklch(0.99 0.005 90) 0%, oklch(0.97 0.01 150) 100%)",
          border: isDark ? "1px solid oklch(0.3 0.02 260 / 0.3)" : "1px solid oklch(0.92 0.01 260 / 0.2)",
        }}
      >
        {adminsQuery.isLoading ? (
          <Stack gap="xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={60} radius="md" />
            ))}
          </Stack>
        ) : adminsQuery.data ? (
          <>
            {/* Desktop table view */}
            <Box visibleFrom="md">
              <Table.ScrollContainer minWidth={600}>
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t.name}</Table.Th>
                      <Table.Th>{t.email}</Table.Th>
                      <Table.Th>{t.roles}</Table.Th>
                      <Table.Th>{t.created}</Table.Th>
                      <Table.Th>{t.actions}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {adminsQuery.data.admins.map((admin) => {
                      const isSelf = admin.userId === currentUserId;
                      const isRevoking = revokingUserId === admin.userId;

                      return (
                        <Table.Tr key={admin.userId}>
                          <Table.Td>
                            <Group gap="xs">
                              <Text size="sm" fw={600}>
                                {admin.name}
                              </Text>
                              {isSelf && (
                                <Text size="xs" c="dimmed">{t.you}</Text>
                              )}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{admin.email}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              {admin.roles.map((role) => (
                                <Badge
                                  key={`${admin.userId}-${role}`}
                                  color={role === "super_admin" ? "red" : "blue"}
                                  variant="light"
                                  size="sm"
                                >
                                  {role}
                                </Badge>
                              ))}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              {new Date(admin.createdAt).toLocaleDateString()}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Button
                              size="xs"
                              color="red"
                              variant="light"
                              disabled={isSelf}
                              loading={isRevoking}
                              onClick={() => revokeMutation.mutate(admin.userId)}
                            >
                              {t.revoke}
                            </Button>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Box>

            {/* Mobile card view */}
            <Stack gap="sm" hiddenFrom="md">
              {adminsQuery.data.admins.map((admin) => {
                const isSelf = admin.userId === currentUserId;
                const isRevoking = revokingUserId === admin.userId;

                return (
                  <Card
                    key={admin.userId}
                    padding="sm"
                    radius="md"
                    style={{
                      background: isDark ? "oklch(0.2 0.02 260)" : "oklch(0.99 0.005 260)",
                      border: isDark
                        ? "1px solid oklch(0.3 0.02 260 / 0.3)"
                        : "1px solid oklch(0.92 0.01 260 / 0.2)",
                    }}
                  >
                    <Group justify="space-between" mb="xs">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Group gap="xs">
                          <Shield size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                          <Text size="sm" fw={600} truncate>
                            {admin.name}
                          </Text>
                          {isSelf && (
                            <Text size="xs" c="dimmed">{t.you}</Text>
                          )}
                        </Group>
                        <Group gap={4} mt={2}>
                          <Mail size={12} style={{ opacity: 0.5 }} />
                          <Text size="xs" c="dimmed" truncate>
                            {admin.email}
                          </Text>
                        </Group>
                      </div>
                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        disabled={isSelf}
                        loading={isRevoking}
                        onClick={() => revokeMutation.mutate(admin.userId)}
                      >
                        {t.revoke}
                      </Button>
                    </Group>

                    <Group gap="sm" wrap="wrap">
                      {admin.roles.map((role) => (
                        <Badge
                          key={`${admin.userId}-${role}`}
                          color={role === "super_admin" ? "red" : "blue"}
                          variant="light"
                          size="xs"
                        >
                          {role}
                        </Badge>
                      ))}
                      <Group gap={4}>
                        <Calendar size={12} style={{ opacity: 0.5 }} />
                        <Text size="xs" c="dimmed">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </Text>
                      </Group>
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          </>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            {t.noAdmins}
          </Text>
        )}
      </Paper>

      <AdminInviteModal
        opened={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ["admin-management-admins"] });
        }}
      />
    </Stack>
  );
}
