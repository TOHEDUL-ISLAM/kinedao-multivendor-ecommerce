import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { api } from "@/lib/api-client";
import { ApplicationWizard } from "@/components/vendor/application-wizard";
import { useLanguage } from "@/lib/i18n/use-language";
import type { Language } from "@/lib/i18n/translations";

export const Route = createFileRoute("/vendor/apply/")({
  component: VendorApplyPage,
  beforeLoad: async () => {
    const session = await getUser();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: "/vendor/apply" },
      });
    }
    return { session };
  },
  loader: async () => {
    // Check application status
    const response = await api.vendor.application.status.$get();

    if (response.ok) {
      const data = await response.json();

      // If already approved, redirect to vendor dashboard
      if (data.application?.status === "approved") {
        throw redirect({
          to: "/dashboard", // TODO: Change to /vendor/dashboard when implemented
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

function VendorApplyPage() {
  const { language } = useLanguage();

  const t: Record<Language, { title: string; subtitle: string }> = {
    en: {
      title: "Become a Vendor",
      subtitle: "Join KineDao marketplace and start selling baby products to thousands of parents",
    },
    bn: {
      title: "বিক্রেতা হন",
      subtitle: "কিনেদাও মার্কেটপ্লেসে যোগ দিন এবং হাজার হাজার অভিভাবকদের কাছে শিশু পণ্য বিক্রি শুরু করুন",
    },
  };

  const labels = t[language];

  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{labels.title}</h1>
        <p className="text-muted-foreground">{labels.subtitle}</p>
      </div>

      <ApplicationWizard />
    </div>
  );
}
