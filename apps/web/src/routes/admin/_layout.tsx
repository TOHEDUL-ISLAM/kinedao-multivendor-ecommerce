import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { api } from "@/lib/api-client";
import { AdminDashboardLayout } from "@/components/admin/admin-dashboard-layout";

export const Route = createFileRoute("/admin/_layout")({
  component: AdminDashboardLayoutRoute,
  beforeLoad: async ({ location }) => {
    const session = await getUser();

    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    const response = await api.admin.me.$get();
    if (!response.ok) {
      throw redirect({ to: "/", search: { error: "access_denied" } });
    }
    const adminMe = await response.json() as { isSuperAdmin?: boolean };
    const isSuperAdmin = Boolean(adminMe.isSuperAdmin);

    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      throw redirect({ to: "/admin/dashboard" });
    }

    return { session, isSuperAdmin };
  },
  loader: async ({ context }) => {
    return {
      adminName: context.session.user.name || "Admin",
      isSuperAdmin: context.isSuperAdmin,
    };
  },
});

function AdminDashboardLayoutRoute() {
  const { adminName, isSuperAdmin } = Route.useLoaderData();

  return (
    <AdminDashboardLayout adminName={adminName} isSuperAdmin={isSuperAdmin}>
      <Outlet />
    </AdminDashboardLayout>
  );
}
