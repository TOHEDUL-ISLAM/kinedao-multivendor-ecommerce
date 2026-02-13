import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Stack,
  Title,
  TextInput,
  Table,
  Group,
  Text,
  Paper,
  Skeleton,
  Badge,
  Avatar,
  Alert,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { Search, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { useTheme } from "next-themes";

export const Route = createFileRoute("/admin/_layout/users")({
  component: AdminUsersPage,
});

const labels = {
  en: {
    title: "User Management",
    search: "Search by name or email...",
    name: "Name",
    email: "Email",
    verified: "Verified",
    joined: "Joined",
    orders: "Orders",
    totalSpent: "Total Spent",
    noResults: "No users found",
    error: "Failed to load users. Please check your permissions.",
    yes: "Yes",
    no: "No",
  },
  bn: {
    title: "ব্যবহারকারী ব্যবস্থাপনা",
    search: "নাম বা ইমেইল দিয়ে খুঁজুন...",
    name: "নাম",
    email: "ইমেইল",
    verified: "যাচাইকৃত",
    joined: "যোগদান",
    orders: "অর্ডার",
    totalSpent: "মোট খরচ",
    noResults: "কোনো ব্যবহারকারী পাওয়া যায়নি",
    error: "ব্যবহারকারী লোড করতে ব্যর্থ। আপনার অনুমতি পরীক্ষা করুন।",
    yes: "হ্যাঁ",
    no: "না",
  },
};

function formatBDT(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
}

function AdminUsersPage() {
  const { language } = useLanguage();
  const { resolvedTheme } = useTheme();
  const t = labels[language];
  const isDark = resolvedTheme === "dark";

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 300);

  // Fetch user list
  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["admin-users", debouncedSearch],
    queryFn: async () => {
      const response = await api.admin.users.$get({
        query: {
          search: debouncedSearch || undefined,
          page: "1",
          limit: "50",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  return (
    <Stack gap="xl">
      <Title order={2} style={{ color: isDark ? "oklch(0.95 0.02 260)" : "oklch(0.25 0.02 260)" }}>
        {t.title}
      </Title>

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
        <Stack gap="lg">
          <TextInput
            placeholder={t.search}
            leftSection={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="md"
          />

          {isError ? (
            <Alert
              icon={<AlertTriangle size={16} />}
              color="red"
              title="Error"
              radius="md"
            >
              {t.error}
            </Alert>
          ) : isLoading ? (
            <Stack gap="xs">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} height={60} radius="md" />
              ))}
            </Stack>
          ) : users && users.users.length > 0 ? (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t.name}</Table.Th>
                  <Table.Th>{t.email}</Table.Th>
                  <Table.Th>{t.verified}</Table.Th>
                  <Table.Th>{t.orders}</Table.Th>
                  <Table.Th>{t.totalSpent}</Table.Th>
                  <Table.Th>{t.joined}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {users.users.map((user) => (
                  <Table.Tr key={user.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <Avatar
                          src={user.image}
                          alt={user.name}
                          radius="xl"
                          size="sm"
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Text size="sm" fw={500}>
                          {user.name}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{user.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="sm"
                        color={user.emailVerified ? "green" : "gray"}
                        radius="md"
                      >
                        {user.emailVerified ? t.yes : t.no}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{user.orderCount}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500}>
                        {formatBDT(user.totalSpent)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{new Date(user.createdAt).toLocaleDateString()}</Text>
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
        </Stack>
      </Paper>
    </Stack>
  );
}
