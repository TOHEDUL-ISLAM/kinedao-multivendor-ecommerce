import { Link } from "@tanstack/react-router";
import { Button, Group } from "@mantine/core";
import { useLanguage } from "@/lib/i18n/use-language";
import { useUserRoles } from "@/hooks/use-user-roles";
import { getAdminPortalHref } from "@/lib/admin-portal";

const labels = {
	en: {
		shop: "Shop",
		vendor: "Vendor Dashboard",
		admin: "Admin Dashboard",
	},
	bn: {
		shop: "শপ",
		vendor: "বিক্রেতা ড্যাশবোর্ড",
		admin: "অ্যাডমিন ড্যাশবোর্ড",
	},
};

export function RoleSwitcher() {
	const { language } = useLanguage();
	const t = labels[language];
	const { isVendor, isAdmin } = useUserRoles();
	const adminDashboardHref = getAdminPortalHref("/admin/dashboard");

	const hasMultipleRoles = (isVendor ? 1 : 0) + (isAdmin ? 1 : 0) >= 1;
	if (!hasMultipleRoles) {
		return null;
	}

	return (
		<Group gap="xs" wrap="nowrap">
			<Button
				component={Link}
				to="/"
				variant="default"
				size="xs"
				radius="md"
			>
				{t.shop}
			</Button>
			{isVendor ? (
				<Button
					component={Link}
					to="/vendor/dashboard"
					variant="light"
					size="xs"
					radius="md"
				>
					{t.vendor}
				</Button>
			) : null}
			{isAdmin ? (
				<Button
					component="a"
					href={adminDashboardHref}
					variant="light"
					size="xs"
					radius="md"
				>
					{t.admin}
				</Button>
			) : null}
		</Group>
	);
}
