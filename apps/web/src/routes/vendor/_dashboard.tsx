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

    const roles = ((session.user as { roles?: string[] | null }).roles ?? []);
    const hasVendorRole = roles.includes("vendor");

    if (!hasVendorRole) {
      const statusResponse = await api.vendor.application.status.$get();
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.application?.status === "pending") {
          throw redirect({ to: "/vendor/apply/status" });
        }
        if (statusData.application?.status !== "approved") {
          throw redirect({ to: "/vendor/apply" });
        }
      } else {
        throw redirect({ to: "/vendor/apply" });
      }
    }

    return { session };
  },
  loader: async ({ context }) => {
    const roles = ((context.session.user as { roles?: string[] | null }).roles ?? []);

    // Fast path for role-based access.
    if (roles.includes("vendor")) {
      const overviewResponse = await api.vendorDashboard.overview.$get();
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        return {
          vendorName: overviewData.vendor.vendorName || "Vendor",
        };
      }
      return { vendorName: "Vendor" };
    }

    // Fallback path for approved vendors missing role sync.
    const statusResponse = await api.vendor.application.status.$get();
    if (!statusResponse.ok) {
      throw redirect({ to: "/vendor/apply" });
    }

    const statusData = await statusResponse.json();
    if (statusData.application?.status !== "approved") {
      throw redirect({ to: "/vendor/apply" });
    }

    const overviewResponse = await api.vendorDashboard.overview.$get();
    if (overviewResponse.ok) {
      const overviewData = await overviewResponse.json();
      return {
        vendorName: overviewData.vendor.vendorName || statusData.application.shopNameEn || "Vendor",
      };
    }

    return {
      vendorName: statusData.application.shopNameEn || "Vendor",
    };
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
