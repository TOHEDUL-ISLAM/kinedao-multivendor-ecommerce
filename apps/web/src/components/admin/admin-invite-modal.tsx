import { useState } from "react";
import { Button, Group, Modal, Radio, Stack, TextInput } from "@mantine/core";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface AdminInviteModalProps {
	opened: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export function AdminInviteModal({
	opened,
	onClose,
	onSuccess,
}: AdminInviteModalProps) {
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"admin" | "super_admin">("admin");

	const inviteMutation = useMutation({
		mutationFn: async () => {
			const response = await api.adminManagement.invite.$post({
				json: {
					email: email.trim(),
					role,
				},
			});
			if (!response.ok) {
				const data = await response.json().catch(() => null);
				throw new Error((data as { error?: string } | null)?.error || "Failed to send invitation");
			}
			return response.json();
		},
		onSuccess: () => {
			toast.success("Invitation sent");
			setEmail("");
			setRole("admin");
			onClose();
			onSuccess();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleClose = () => {
		if (inviteMutation.isPending) return;
		onClose();
	};

	return (
		<Modal opened={opened} onClose={handleClose} title="Invite admin" centered>
			<Stack gap="md">
				<TextInput
					label="Email"
					placeholder="admin@example.com"
					type="email"
					value={email}
					onChange={(event) => setEmail(event.currentTarget.value)}
					required
				/>
				<Radio.Group
					label="Role"
					value={role}
					onChange={(value) => setRole(value as "admin" | "super_admin")}
				>
					<Group mt="xs">
						<Radio value="admin" label="Admin" />
						<Radio value="super_admin" label="Super Admin" />
					</Group>
				</Radio.Group>

				<Group justify="flex-end" mt="sm">
					<Button variant="default" onClick={handleClose} disabled={inviteMutation.isPending}>
						Cancel
					</Button>
					<Button
						onClick={() => inviteMutation.mutate()}
						loading={inviteMutation.isPending}
						disabled={!email.trim()}
					>
						Send Invite
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}

