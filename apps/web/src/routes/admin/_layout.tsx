import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { api } from "@/lib/api-client";
import { AdminDashboardLayout } from "@/components/admin/admin-dashboard-layout";

export const Route = createFileRoute("/admin/_layout")({
  component: AdminDashboardLayoutRoute,
  beforeLoad: async ({ location }) => {
    console.log("[Admin beforeLoad] Starting...");
    const session = await getUser();

    console.log("[Admin beforeLoad] Session:", session ? "EXISTS" : "NULL");

    if (!session) {
      console.log("[Admin beforeLoad] No session, redirecting to login");
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    console.log("[Admin beforeLoad] Session OK, user ID:", session.user.id, "email:", session.user.email);
    
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      console.log("[Admin beforeLoad] At root /admin, redirecting to dashboard");
      throw redirect({ to: "/admin/dashboard" });
    }

    console.log("[Admin beforeLoad] Session OK, user:", session.user.email);
    return { session };
  },
  loader: async ({ context }) => {
    // Admin check happens on the backend when API calls are made
    // We just need to pass through the session user info here
    console.log("[Admin Layout] Loader running for user:", context.session.user.email);

    return {
      adminName: context.session.user.name || "Admin",
    };
  },
});

function AdminDashboardLayoutRoute() {
  const { adminName } = Route.useLoaderData();

  return (
    <AdminDashboardLayout adminName={adminName}>
      <Outlet />
    </AdminDashboardLayout>
  );
}
