import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { AdminInviteModal } from "@/components/admin/admin-invite-modal";
import { AdminListTable } from "@/components/admin/admin-list-table";

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

function AdminManagementPage() {
	const queryClient = useQueryClient();
	const { currentUserId } = Route.useLoaderData();
	const [inviteOpen, setInviteOpen] = useState(false);
	const [revokingUserId, setRevokingUserId] = useState<string | null>(null);

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
			toast.success("Admin access revoked");
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
			<Group justify="space-between">
				<Title order={2}>Admin Management</Title>
				<Button onClick={() => setInviteOpen(true)}>Invite Admin</Button>
			</Group>

			<Paper p="lg" radius="lg">
				{adminsQuery.isLoading ? (
					<Text c="dimmed">Loading admins...</Text>
				) : adminsQuery.data ? (
					<AdminListTable
						admins={adminsQuery.data.admins}
						currentUserId={currentUserId}
						revokingUserId={revokingUserId}
						onRevoke={(userId) => revokeMutation.mutate(userId)}
					/>
				) : (
					<Text c="dimmed">No admins found.</Text>
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
