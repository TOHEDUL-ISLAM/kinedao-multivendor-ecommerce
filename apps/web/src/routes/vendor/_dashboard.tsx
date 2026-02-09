import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { api } from "@/lib/api-client";
import { VendorDashboardLayout } from "@/components/vendor-dashboard/vendor-dashboard-layout";

export const Route = createFileRoute("/vendor/_dashboard")({
  component: VendorDashboardLayoutRoute,
  beforeLoad: async () => {
    const session = await getUser();
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: "/vendor/dashboard" },
      });
    }
    return { session };
  },
  loader: async () => {
    // Check if user has an approved vendor application
    const statusResponse = await api.vendor.application.status.$get();

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();

      // If pending, redirect to status page
      if (statusData.application?.status === "pending") {
        throw redirect({ to: "/vendor/apply/status" });
      }

      // If approved, try to get vendor name from overview
      if (statusData.application?.status === "approved") {
        const overviewResponse = await api.vendorDashboard.overview.$get();

        if (overviewResponse.ok) {
          const overviewData = await overviewResponse.json();
          return {
            vendorName: overviewData.vendor.vendorName || statusData.application.shopNameEn || "Vendor",
          };
        }

        // If overview fails but approved, use shop name from application
        return {
          vendorName: statusData.application.shopNameEn || "Vendor",
        };
      }
    }

    // No application or not approved → apply page
    throw redirect({ to: "/vendor/apply" });
  },
});

function VendorDashboardLayoutRoute() {
  const { vendorName } = Route.useLoaderData();

  return (
    <VendorDashboardLayout vendorName={vendorName}>
      <Outlet />
    </VendorDashboardLayout>
  );
}
