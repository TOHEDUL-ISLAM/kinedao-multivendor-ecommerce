import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Mail,
  Shield,
  ShieldCheck,
  Upload,
  User,
} from "lucide-react";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/account/_layout/")({
  component: AccountProfilePage,
});

function getDisplayName(name: string | null | undefined, email: string): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email.split("@")[0]?.trim();
  return local || "Customer";
}

interface LinkedAccount {
  id: string;
  provider: string;
  accountId: string;
}

function normalizeProvider(provider?: string | null) {
  return (provider ?? "").trim().toLowerCase();
}

function AccountProfilePage() {
  const { session } = Route.useRouteContext();
  const [profileName, setProfileName] = useState(session.user.name ?? "");
  const [profileImage, setProfileImage] = useState(session.user.image ?? "");
  const displayName = getDisplayName(profileName, session.user.email);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="rounded-2xl border-primary/15 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Profile Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-primary/30">
                {profileImage ? <AvatarImage src={profileImage} alt={displayName} /> : null}
                <AvatarFallback className="bg-primary/15 text-primary text-lg font-semibold">
                  {initial || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">{session.user.email}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Full Name" value={displayName} icon={User} />
              <InfoRow label="Email" value={session.user.email} icon={Mail} />
              <InfoRow label="Account Type" value="Customer" icon={ShieldCheck} />
              <InfoRow label="Status" value="Active" icon={ShieldCheck} />
            </dl>
          </CardContent>
        </Card>

        <UpdateProfileCard
          initialName={profileName}
          initialEmail={session.user.email}
          initialImage={profileImage}
          onDraftChange={(next) => {
            if (typeof next.name === "string") setProfileName(next.name);
            if (typeof next.image === "string") setProfileImage(next.image);
          }}
          onPersisted={(next) => {
            setProfileName(next.name);
            setProfileImage(next.image);
          }}
        />
      </div>

      <AccountSecurity />
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-gradient-to-br from-muted/25 to-background p-3 transition-colors hover:border-primary/30">
      <dt className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}

function UpdateProfileCard({
  initialName,
  initialEmail,
  initialImage,
  onDraftChange,
  onPersisted,
}: {
  initialName: string;
  initialEmail: string;
  initialImage: string;
  onDraftChange?: (next: { name?: string; image?: string }) => void;
  onPersisted?: (next: { name: string; image: string }) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileInitial = getDisplayName(name, initialEmail).charAt(0).toUpperCase();

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const response = await api.upload.$post({
        form: { file },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        toast.error((errorBody as { error?: string }).error || "Failed to upload profile photo");
        return;
      }

      const data = (await response.json()) as { url?: string };
      if (!data.url) {
        toast.error("Upload failed: server response missing image URL");
        return;
      }

      setImageUrl(data.url);
      onDraftChange?.({ image: data.url });
      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error("Profile photo upload error:", error);
      toast.error(
        error instanceof Error && error.message
          ? `Failed to upload profile photo: ${error.message}`
          : "Failed to upload profile photo"
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    setIsSaving(true);
    try {
      await authClient.updateUser({
        name: trimmedName,
        image: imageUrl || undefined,
      });

      await authClient.getSession();
      await router.invalidate();
      toast.success("Profile updated successfully");
      onPersisted?.({ name: trimmedName, image: imageUrl });
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl border-primary/15 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Update Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                const nextName = e.target.value;
                setName(nextName);
                onDraftChange?.({ name: nextName });
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Profile Picture</label>
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16 border border-primary/30">
                {imageUrl ? <AvatarImage src={imageUrl} alt={name || "Profile"} /> : null}
                <AvatarFallback className="bg-primary/15 text-primary text-lg font-semibold">
                  {profileInitial || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>

              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isSaving}
                  className="inline-flex items-center gap-2 rounded-md border border-primary/30 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isUploading ? "Uploading..." : "Upload Photo"}
                </button>
                <p className="mt-1 text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>

          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
            {isSaving ? "Updating Profile..." : "Update Profile"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

function getProviderLabel(provider?: string | null) {
  const normalizedProvider = normalizeProvider(provider);
  switch (normalizedProvider) {
    case "google":
      return "Google";
    case "facebook":
      return "Facebook";
    case "credential":
      return "Email/Password";
    default:
      if (!normalizedProvider) return "OAuth";
      return (
        normalizedProvider.charAt(0).toUpperCase() + normalizedProvider.slice(1)
      );
  }
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function AccountSecurity() {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const hasCredential = accounts.some(
    (a) => normalizeProvider(a.provider) === "credential"
  );
  const oauthAccounts = accounts.filter(
    (a) => normalizeProvider(a.provider) !== "credential"
  );
  const isOAuthOnly = oauthAccounts.length > 0 && !hasCredential;

  useEffect(() => {
    authClient.$fetch("/list-accounts", { method: "GET" }).then(
      (res) => {
        if (Array.isArray(res.data)) {
          const normalizedAccounts: LinkedAccount[] = res.data.map((raw) => {
            const item = raw as Partial<{
              id: string;
              provider: string;
              providerId: string;
              accountId: string;
            }>;
            return {
              id: String(item.id ?? ""),
              provider: String(item.provider ?? item.providerId ?? ""),
              accountId: String(item.accountId ?? ""),
            };
          });
          setAccounts(normalizedAccounts);
        }
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    const res = await authClient.$fetch("/set-password", {
      method: "POST",
      body: { newPassword },
    });
    setSubmitting(false);
    if (res.error) {
      toast.error(res.error.message || "Failed to set password");
    } else {
      toast.success("Password set successfully!");
      resetForm();
      setAccounts((prev) => [
        ...prev,
        { id: "credential", provider: "credential", accountId: "" },
      ]);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    const res = await authClient.$fetch("/change-password", {
      method: "POST",
      body: { currentPassword, newPassword, revokeOtherSessions: false },
    });
    setSubmitting(false);
    if (res.error) {
      toast.error(res.error.message || "Failed to change password");
    } else {
      toast.success("Password changed successfully!");
      resetForm();
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border-primary/15 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-primary/15 shadow-sm overflow-hidden">
      {/* Blue left-border accent */}
      <div className="border-l-4 border-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Account Security</CardTitle>
            {isOAuthOnly && (
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                OAuth Account
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Linked OAuth providers */}
          {oauthAccounts.map((acc) => (
            <div
              key={acc.id}
              className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/15 p-3.5"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold">
                  Signed in with {getProviderLabel(acc.provider)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Your account is secured through {getProviderLabel(acc.provider)} OAuth
                </p>
              </div>
            </div>
          ))}

          {/* Password status row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">Password Status</p>
                <p className="text-xs text-muted-foreground">
                  {hasCredential
                    ? "Password is set for your account"
                    : "No password set for your account"}
                </p>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-medium ${
                hasCredential
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {hasCredential ? "Set" : "Not Set"}
            </span>
          </div>

          {/* Set password form (OAuth-only users) */}
          {!hasCredential && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3.5 dark:bg-amber-900/15 dark:border-amber-700/40">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Optional: Set a Password
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400/80">
                    You can optionally set a password to sign in with email/password in addition to{" "}
                    {oauthAccounts.length > 0
                      ? `${getProviderLabel(oauthAccounts[0].provider)} OAuth`
                      : "OAuth"}
                    .
                  </p>
                </div>
              </div>

              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password"
              />
              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm new password"
              />

              <button
                type="submit"
                disabled={submitting || !newPassword || !confirmPassword}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                Set Password
              </button>
            </form>
          )}

          {/* Change password form (users with existing password) */}
          {hasCredential && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 p-3.5 dark:bg-green-900/15 dark:border-green-700/40">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                    Password is active
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400/80">
                    You can change your password below.
                  </p>
                </div>
              </div>

              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Enter current password"
              />
              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password"
              />
              <PasswordField
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm new password"
              />

              <button
                type="submit"
                disabled={submitting || !currentPassword || !newPassword || !confirmPassword}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                Change Password
              </button>
            </form>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
