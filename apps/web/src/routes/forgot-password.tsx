import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { api } from "@/lib/api-client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordComponent,
});

function ForgotPasswordComponent() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        console.log("[FORGOT-PASSWORD] Attempting to send reset email to:", value.email);
        const response = await api.auth["forgot-password"].$post({
          json: {
            email: value.email,
            redirectTo: `${window.location.origin}/reset-password`,
          },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          console.error("[FORGOT-PASSWORD] Error:", data);
          setServerError("Failed to send reset email. Please try again.");
          return;
        }

        const data = await response.json().catch(() => ({}));
        console.log("[FORGOT-PASSWORD] Success!", data);
        setIsSubmitted(true);
        toast.success("Password reset email sent!");
      } catch (error) {
        console.error("[FORGOT-PASSWORD] Caught error:", error);
        setServerError("Failed to send reset email. Please try again.");
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Invalid email format"),
      }),
    },
  });

  if (isSubmitted) {
    return (
      <div className="mx-auto w-full mt-10 max-w-md p-6">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Check your inbox</h1>
            <p className="text-muted-foreground text-sm">
              We've sent a password reset link to your email address.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Back to Login</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Forgot your password?</h1>
            <p className="text-muted-foreground text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {serverError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
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
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
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

            <form.Subscribe>
              {(state) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!state.canSubmit || state.isSubmitting}
                >
                  {state.isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <div className="text-center">
            <Button asChild variant="link" className="text-indigo-600 hover:text-indigo-800">
              <Link to="/login">Back to Login</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
