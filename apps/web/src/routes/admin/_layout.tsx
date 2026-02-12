import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { getUser } from "@/functions/get-user";
import { AdminDashboardLayout } from "@/components/admin/admin-dashboard-layout";
import { redirectToAdminPortalIfNeeded } from "@/lib/admin-portal";

const hasAdminRole = (roles: string[] | null | undefined) =>
  (roles ?? []).includes("admin") || (roles ?? []).includes("super_admin");

export const Route = createFileRoute("/admin/_layout")({
  component: AdminDashboardLayoutRoute,
  beforeLoad: async ({ location }) => {
    const session = await getUser();

    if (!session) {
      throw redirect({
        to: "/admin/login",
        search: { redirect: location.href },
      });
    }

    const roles = ((session.user as { roles?: string[] | null }).roles ?? []);
    if (!hasAdminRole(roles)) {
      throw redirect({
        to: "/admin/login",
        search: { redirect: location.href, reason: "access_denied" },
      });
    }
    const isSuperAdmin = roles.includes("super_admin");

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

  useEffect(() => {
    void redirectToAdminPortalIfNeeded(
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    );
  }, []);

  return (
    <AdminDashboardLayout adminName={adminName} isSuperAdmin={isSuperAdmin}>
      <Outlet />
    </AdminDashboardLayout>
  );
}
