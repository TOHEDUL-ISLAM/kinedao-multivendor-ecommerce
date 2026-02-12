import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Alert, Button, Center, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { ShieldAlert } from "lucide-react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { getUser } from "@/functions/get-user";
import { authClient } from "@/lib/auth-client";
import { getAdminPortalHref, redirectToAdminPortalIfNeeded } from "@/lib/admin-portal";

const adminLoginSearchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
  reason: z.enum(["access_denied"]).optional(),
});

const hasAdminRole = (roles: string[] | null | undefined) =>
  (roles ?? []).includes("admin") || (roles ?? []).includes("super_admin");

const sanitizeAdminRedirect = (redirectPath?: string) => {
  if (!redirectPath) return "/admin/dashboard";
  if (!redirectPath.startsWith("/")) return "/admin/dashboard";
  if (!redirectPath.startsWith("/admin/")) return "/admin/dashboard";
  return redirectPath;
};

export const Route = createFileRoute("/admin/login")({
  validateSearch: adminLoginSearchSchema,
  beforeLoad: async ({ search }) => {
    const session = await getUser();
    if (!session) {
      return { session: null as Awaited<ReturnType<typeof getUser>> | null };
    }

    const roles = ((session.user as { roles?: string[] | null }).roles ?? []);
    if (hasAdminRole(roles)) {
      throw redirect({
        to: sanitizeAdminRedirect(search.redirect),
      });
    }

    return { session };
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const search = Route.useSearch();
  const { session } = Route.useRouteContext();
  const redirectTo = sanitizeAdminRedirect(search.redirect);
  const [showSignIn, setShowSignIn] = useState(search.mode !== "signup");

  useEffect(() => {
    void redirectToAdminPortalIfNeeded(
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    );
  }, []);

  if (session) {
    return (
      <Center py="xl">
        <Paper p="xl" radius="lg" withBorder maw={560} w="100%">
          <Stack gap="md">
            <Group gap="xs" align="center">
              <ShieldAlert size={20} />
              <Title order={3}>Admin Access Required</Title>
            </Group>
            <Text>
              You are signed in, but this account does not have administrator access.
            </Text>
            <Text size="sm" c="dimmed">
              Signed in as: {session.user.email}
            </Text>
            <Group>
              <Button
                onClick={async () => {
                  await authClient.signOut();
                  window.location.href = getAdminPortalHref("/admin/login?mode=signin");
                }}
              >
                Sign Out
              </Button>
              <Button component={Link} to="/" variant="light">
                Back to Shop
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Center>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10 md:py-14">
      <Stack gap="md" mb="lg">
        <Title order={1}>Admin Login</Title>
        <Text c="dimmed">
          Sign in with an admin account to access the administration panel.
        </Text>
        {search.reason === "access_denied" ? (
          <Alert color="red" title="Access denied">
            You must sign in with an account that has admin permission.
          </Alert>
        ) : null}
      </Stack>

      {showSignIn ? (
        <SignInForm
          onSwitchToSignUp={() => setShowSignIn(false)}
          redirectTo={redirectTo}
          hideTitle
          className="mt-0 max-w-none p-0"
        />
      ) : (
        <SignUpForm
          onSwitchToSignIn={() => setShowSignIn(true)}
          redirectTo={redirectTo}
          hideTitle
          className="mt-0 max-w-none p-0"
        />
      )}
    </div>
  );
}
