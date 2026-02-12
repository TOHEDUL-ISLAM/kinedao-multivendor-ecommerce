import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { api } from "@/lib/api-client";
import { ApplicationWizard } from "@/components/vendor/application-wizard";
import { useTranslation } from "@/hooks/use-translation";

export const Route = createFileRoute("/vendor/apply/form")({
  component: VendorApplyFormPage,
  beforeLoad: async () => {
    const session = await getUser();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: "/vendor/apply/form" },
      });
    }
    return { session };
  },
  loader: async ({ context }) => {
    const roles = ((context.session.user as { roles?: string[] | null }).roles ?? []);
    const hasVendorRole = roles.includes("vendor");

    if (hasVendorRole) {
      throw redirect({
        to: "/vendor/dashboard",
      });
    }

    // Check application status
    const response = await api.vendor.application.status.$get();

    if (response.ok) {
      const data = await response.json();

      // If approved, redirect to dashboard
      if (data.application?.status === "approved") {
        throw redirect({
          to: "/vendor/dashboard",
        });
      }

      // If pending, redirect to status page
      if (data.application?.status === "pending") {
        throw redirect({
          to: "/vendor/apply/status",
        });
      }

      // If rejected, allow resubmission
      return { status: data };
    }

    // If not authenticated or other error, let the page handle it
    return { status: null };
  },
});

function VendorApplyFormPage() {
  const { t } = useTranslation();

  return (
    <div className="container max-w-3xl mx-auto px-4 py-12 md:py-16">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          {t("vendor.apply.form.title")}
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
          {t("vendor.apply.form.subtitle")}
        </p>
      </div>
      <ApplicationWizard />
    </div>
  );
}
