import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { useEffect } from "react";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Loader from "@/components/loader";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/verify-email")({
  validateSearch: z.object({
    token: z.string().optional(),
    callbackURL: z.string().optional(),
  }),
  component: VerifyEmailComponent,
});

function VerifyEmailComponent() {
  const navigate = useNavigate();
  const { token, callbackURL } = Route.useSearch();

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        await authClient.verifyEmail({
          query: {
            token,
            callbackURL,
          },
        });
      } catch {
        navigate({ to: "/login" });
        return;
      }

      const fallback = `${window.location.origin}/login`;
      if (!callbackURL) {
        window.location.href = fallback;
        return;
      }

      try {
        const nextUrl = new URL(callbackURL, window.location.origin);
        window.location.href =
          nextUrl.origin === window.location.origin
            ? nextUrl.toString()
            : fallback;
      } catch {
        window.location.href = fallback;
      }
    };

    void verify();
  }, [token, callbackURL, navigate]);

  if (token) {
    return <Loader />;
  }

  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6">
      <Card className="p-6">
        <div className="text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
            <Mail className="h-8 w-8 text-indigo-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Check your inbox</h1>
            <p className="text-muted-foreground text-sm">
              We've sent you a verification link to your email address.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account. If you don't see
              the email, check your spam folder.
            </p>
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Back to Login</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
