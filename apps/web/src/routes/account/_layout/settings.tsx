import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Globe, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ComponentType } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/account/_layout/settings")({
  component: AccountSettingsPage,
});

function AccountSettingsPage() {
  const navigate = useNavigate();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete account? You can recover it by logging in again within 14 days.",
    );
    if (!confirmed) return;

    setIsDeletingAccount(true);
    try {
      const response = await api.account.$delete();
      if (!response.ok) {
        toast.error("Could not delete account. Please try again.");
        return;
      }

      toast.success("Account scheduled for deletion. Recoverable for 14 days.");
      authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            navigate({ to: "/" });
          },
        },
      });
    } catch {
      toast.error("Could not delete account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="rounded-2xl border-primary/15 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SettingCard
            icon={Bell}
            title="Notifications"
            description="Manage push and email notification preferences."
            to="/account/notification-settings"
          />
          <SettingCard
            icon={Globe}
            title="Language"
            description="Manage your website language preference."
            to="/account/language"
          />
          <SettingCard
            icon={Shield}
            title="Privacy"
            description="Review account and privacy information."
            to="/privacy"
          />
          <SettingActionCard
            icon={Trash2}
            title="Delete Account"
            description="Your account will be recoverable for 14 days if you log in again."
            buttonText={isDeletingAccount ? "Deleting..." : "Delete Account"}
            onAction={handleDeleteAccount}
            danger
            disabled={isDeletingAccount}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SettingCard({
  icon: Icon,
  title,
  description,
  to,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  to: "/account/notification-settings" | "/account/language" | "/privacy";
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/80 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button asChild variant="outline" className="mt-4 w-full rounded-full border-primary/25 hover:bg-primary/5">
        <Link to={to}>Open</Link>
      </Button>
    </div>
  );
}

function SettingActionCard({
  icon: Icon,
  title,
  description,
  buttonText,
  onAction,
  danger = false,
  disabled = false,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  buttonText: string;
  onAction: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
        danger
          ? "border-red-200/80 bg-red-50/20"
          : "border-border/70 bg-card/80"
      }`}
    >
      <div
        className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${
          danger ? "bg-red-100/80 text-red-600" : "bg-primary/10 text-primary"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className={`font-semibold ${danger ? "text-red-700" : ""}`}>{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button
        type="button"
        variant={danger ? "outline" : "outline"}
        className={`mt-4 w-full rounded-full ${
          danger ? "border-red-300 text-red-700 hover:bg-red-50" : ""
        }`}
        disabled={disabled}
        onClick={onAction}
      >
        {buttonText}
      </Button>
    </div>
  );
}
