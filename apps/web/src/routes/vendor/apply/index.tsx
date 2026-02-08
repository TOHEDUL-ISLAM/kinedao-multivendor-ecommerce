import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { api } from "@/lib/api-client";
import { HeroSection } from "@/components/vendor/hero-section";
import { StepsAccordion } from "@/components/vendor/steps-accordion";
import { BenefitsGrid } from "@/components/vendor/benefits-grid";
import { FAQSection } from "@/components/vendor/faq-section";
import { CTASection } from "@/components/vendor/cta-section";

export const Route = createFileRoute("/vendor/apply/")({
  component: VendorApplyPage,
  beforeLoad: async () => {
    const session = await getUser();
    return { session };
  },
  loader: async ({ context }) => {
    // Only check status if user is logged in
    if (context.session) {
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
      }
    }
    return { status: null };
  },
});

function VendorApplyPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <StepsAccordion />
      <BenefitsGrid />
      <FAQSection />
      <CTASection />
    </div>
  );
}