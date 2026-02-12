import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { VendorAuthPage } from "@/components/vendor-auth/vendor-auth-page";
import { getUser } from "@/functions/get-user";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
  portal: z.enum(["vendor"]).optional(),
});

function sanitizeRedirect(redirect?: string, portal?: "vendor"): string {
  if (!redirect) return portal === "vendor" ? "/vendor/apply" : "/";

  if (!redirect.startsWith("/")) {
    return portal === "vendor" ? "/vendor/apply" : "/";
  }

  if (portal === "vendor" && !redirect.startsWith("/vendor/")) {
    return "/vendor/apply";
  }

  return redirect;
}

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ search }) => {
    if (search.portal !== "vendor") {
      return;
    }

    let session: Awaited<ReturnType<typeof getUser>> | null = null;
    try {
      session = await getUser();
    } catch (error) {
      console.error("[LoginRoute] getUser failed:", error);
      session = null;
    }

    if (!session) {
      return;
    }

    const roles = ((session.user as { roles?: string[] | null }).roles ?? []);
    if (roles.includes("vendor")) {
      throw redirect({ to: "/vendor/dashboard" });
    }

    throw redirect({ to: "/vendor/apply" });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const redirectTo = sanitizeRedirect(search.redirect, search.portal);
  const [showSignIn, setShowSignIn] = useState(search.mode !== "signup");

  if (search.portal === "vendor") {
    return (
      <VendorAuthPage
        redirectTo={redirectTo}
        initialMode={search.mode === "signup" ? "signup" : "signin"}
      />
    );
  }

  return showSignIn ? (
    <SignInForm
      onSwitchToSignUp={() => setShowSignIn(false)}
      redirectTo={redirectTo}
    />
  ) : (
    <SignUpForm
      onSwitchToSignIn={() => setShowSignIn(true)}
      redirectTo={redirectTo}
    />
  );
}
