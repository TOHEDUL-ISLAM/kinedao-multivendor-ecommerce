import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import GoogleSignInButton from "./google-sign-in-button";
import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm({
  onSwitchToSignUp,
  redirectTo = "/",
  className,
  hideTitle = false,
}: {
  onSwitchToSignUp: () => void;
  redirectTo?: string;
  className?: string;
  hideTitle?: boolean;
}) {
  const { isPending } = authClient.useSession();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [lastEmail, setLastEmail] = useState("");
  const [canUseForgotPassword, setCanUseForgotPassword] = useState<boolean | null>(null);
  const [forgotPasswordHint, setForgotPasswordHint] = useState<string | null>(null);
  const [checkingForgotPassword, setCheckingForgotPassword] = useState(false);
  const isEmailVerificationError = (error: { message?: string; code?: string; status?: number }) => {
    const message = (error.message ?? "").toLowerCase();
    const code = (error.code ?? "").toLowerCase();
    const statusSuggestsVerification = error.status === 403 && message.includes("verif");
    return (
      statusSuggestsVerification ||
      code.includes("email_not_verified") ||
      code.includes("email-not-verified") ||
      (message.includes("email") && message.includes("verif"))
    );
  };

  const checkForgotPasswordEligibility = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const parsed = z.string().email().safeParse(normalizedEmail);
    if (!parsed.success) {
      setCanUseForgotPassword(null);
      setForgotPasswordHint(null);
      return;
    }

    setCheckingForgotPassword(true);
    try {
      const response = await api.auth["password-reset-eligibility"].$post({
        json: { email: normalizedEmail },
      });
      const data = (await response.json().catch(() => ({}))) as {
        eligible?: boolean;
        message?: string;
      };

      setCanUseForgotPassword(data.eligible === true);
      setForgotPasswordHint(data.eligible === false ? data.message ?? null : null);
    } catch {
      setCanUseForgotPassword(null);
      setForgotPasswordHint(null);
    } finally {
      setCheckingForgotPassword(false);
    }
  };

  const handleResendVerification = async () => {
    const normalizedEmail = lastEmail.trim().toLowerCase();
    if (!normalizedEmail) return;
    setResending(true);
    try {
      await authClient.sendVerificationEmail({
        email: normalizedEmail,
        callbackURL: `${window.location.origin}/login`,
      });
      toast.success("Verification email sent! Please check your inbox.");
    } catch {
      toast.error("Failed to send verification email. Please try again.");
    }
    setResending(false);
  };

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      setEmailNotVerified(false);
      const normalizedEmail = value.email.trim().toLowerCase();
      setLastEmail(normalizedEmail);
      await authClient.signIn.email(
        {
          email: normalizedEmail,
          password: value.password,
          callbackURL: `${window.location.origin}${redirectTo}`,
        },
        {
          onSuccess: () => {
            toast.success("Welcome back!");
            // Use window.location for reliable redirect after auth.
            window.location.href = redirectTo;
          },
          onError: (ctx) => {
            if (isEmailVerificationError(ctx.error)) {
              setEmailNotVerified(true);
            } else {
              setServerError(ctx.error.message || "Invalid email or password");
            }
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Invalid email format"),
        password: z.string().min(1, "Password is required"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className={cn("mx-auto w-full mt-10 max-w-md p-6", className)}>
      {!hideTitle ? (
        <h1 className="mb-6 text-center text-3xl font-bold">Welcome Back</h1>
      ) : null}

      {emailNotVerified && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-800">Email not verified</p>
          <p className="mt-1 text-amber-700">
            Please check your inbox and click the verification link before signing in.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            disabled={resending}
            onClick={handleResendVerification}
          >
            {resending ? "Sending..." : "Resend verification email"}
          </Button>
        </div>
      )}

      {serverError && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {serverError}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={() => {
                    field.handleBlur();
                    void checkForgotPasswordEligibility(field.state.value);
                  }}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    field.handleChange(nextValue);
                    setCanUseForgotPassword(null);
                    setForgotPasswordHint(null);
                  }}
                  placeholder="you@example.com"
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Password</Label>
                  {checkingForgotPassword ? (
                    <span className="text-xs text-muted-foreground">Checking...</span>
                  ) : canUseForgotPassword !== false ? (
                    <Button
                      asChild
                      variant="link"
                      className="h-auto p-0 text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      <Link to="/forgot-password">Forgot Password?</Link>
                    </Button>
                  ) : null}
                </div>
                {forgotPasswordHint ? (
                  <p className="text-xs text-amber-700">{forgotPasswordHint}</p>
                ) : null}
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Signing in..." : "Login"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <GoogleSignInButton redirectTo={redirectTo} />
      {/* <FacebookSignInButton /> */}

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignUp}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Don't have an account? Register
        </Button>
      </div>
    </div>
  );
}
