import { createFileRoute } from "@tanstack/react-router";
import { Mail, ShieldCheck, User } from "lucide-react";
import type { ComponentType } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/account/_layout/")({
  component: AccountProfilePage,
});

function getDisplayName(name: string | null | undefined, email: string): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email.split("@")[0]?.trim();
  return local || "Customer";
}

function AccountProfilePage() {
  const { session } = Route.useRouteContext();
  const displayName = getDisplayName(session.user.name, session.user.email);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card className="rounded-2xl border-primary/15 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Profile Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-primary/30">
              {session.user.image ? <AvatarImage src={session.user.image} alt={displayName} /> : null}
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
