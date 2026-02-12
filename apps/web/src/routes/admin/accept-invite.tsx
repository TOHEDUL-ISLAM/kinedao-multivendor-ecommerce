import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button, Center, Paper, Stack, Text, Title } from "@mantine/core";
import { toast } from "sonner";
import { z } from "zod";
import { getUser } from "@/functions/get-user";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin/accept-invite")({
	validateSearch: z.object({
		token: z.string().optional(),
	}),
	beforeLoad: async () => {
		const session = await getUser();
		return { session };
	},
	loader: async ({ context }) => {
		return { session: context.session };
	},
	component: AcceptAdminInvitePage,
});

function AcceptAdminInvitePage() {
	const navigate = useNavigate();
	const { token } = Route.useSearch();
	const { session } = Route.useLoaderData();
	const [mismatchDetails, setMismatchDetails] = useState<{
		invitedEmail?: string;
		currentEmail?: string;
	} | null>(null);

	const redirectPath = useMemo(() => {
		if (!token) return "/admin/accept-invite";
		return `/admin/accept-invite?token=${encodeURIComponent(token)}`;
	}, [token]);

	const acceptMutation = useMutation({
		mutationFn: async () => {
			if (!token) {
				throw new Error("Missing invitation token");
			}
			setMismatchDetails(null);

			const response = await api.adminManagement["accept-invite"].$post({
				json: { token },
			});
			if (!response.ok) {
				const data = await response
					.json()
					.catch(() => null) as
					| {
							error?: string;
							code?: string;
							invitedEmail?: string;
							currentEmail?: string;
					  }
					| null;

				if (data?.code === "invite_email_mismatch") {
					setMismatchDetails({
						invitedEmail: data.invitedEmail,
						currentEmail: data.currentEmail,
					});
				}

				throw new Error(data?.error || "Failed to accept invitation");
			}
			return response.json();
		},
		onSuccess: () => {
			setMismatchDetails(null);
			toast.success("Invitation accepted");
			void navigate({ to: "/admin/dashboard" });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	return (
		<Center py="xl">
			<Paper p="xl" radius="lg" withBorder maw={520} w="100%">
				<Stack gap="lg">
					<Title order={2}>Admin Invitation</Title>
					{token ? (
						<Text c="dimmed">
							Accept this invitation to gain admin access.
						</Text>
					) : (
						<Text c="red">Missing or invalid invitation token.</Text>
					)}

					{session ? (
						<Stack gap="sm">
							<Button
								onClick={() => acceptMutation.mutate()}
								loading={acceptMutation.isPending}
								disabled={!token}
							>
								Accept Invitation
							</Button>
							{mismatchDetails ? (
								<Paper p="md" withBorder>
									<Stack gap="xs">
										<Text c="red" fw={600}>
											Account mismatch
										</Text>
										<Text size="sm">
											Invited email: {mismatchDetails.invitedEmail || "unknown"}
										</Text>
										<Text size="sm">
											Logged in as: {mismatchDetails.currentEmail || "unknown"}
										</Text>
										<Button
											variant="default"
											onClick={() => {
												authClient.signOut({
													fetchOptions: {
														onSuccess: () => {
															void navigate({
																to: "/login",
																search: {
																	redirect: redirectPath,
																	mode: "signin",
																},
															});
														},
													},
												});
											}}
										>
											Sign out and switch account
										</Button>
									</Stack>
								</Paper>
							) : null}
						</Stack>
					) : (
						<Stack gap="sm">
							<Text c="dimmed">
								You need to sign in (or create an account) with the invited email first.
							</Text>
							<Button
								component="a"
								href={`/login?redirect=${encodeURIComponent(redirectPath)}&mode=signin`}
							>
								Sign In
							</Button>
							<Button
								component="a"
								href={`/login?redirect=${encodeURIComponent(redirectPath)}&mode=signup`}
								variant="default"
							>
								Create Account
							</Button>
						</Stack>
					)}
				</Stack>
			</Paper>
		</Center>
	);
}
