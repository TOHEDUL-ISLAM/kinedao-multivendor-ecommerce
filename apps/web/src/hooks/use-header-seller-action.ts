import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { VendorApplicationStatusResponse } from "@kineDao.com/api-types/vendor";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api-client";

type SellerActionLabelKey =
	| "header.becomeSeller"
	| "header.vendorDashboard"
	| "header.applicationStatus"
	| "header.updateApplication";

type SellerActionTo =
	| "/login"
	| "/vendor/apply"
	| "/vendor/dashboard"
	| "/vendor/apply/status"
	| "/vendor/apply/form";

export type HeaderSellerActionKind =
	| "guest_apply"
	| "customer_apply"
	| "vendor_dashboard"
	| "pending_status"
	| "rejected_resubmit";

interface HeaderSellerAction {
	kind: HeaderSellerActionKind;
	labelKey: SellerActionLabelKey;
	to: SellerActionTo;
	href: string;
}

const SELLER_ACTIONS: Record<HeaderSellerActionKind, HeaderSellerAction> = {
	guest_apply: {
		kind: "guest_apply",
		labelKey: "header.becomeSeller",
		to: "/login",
		href: "/login?portal=vendor&mode=signin&redirect=%2Fvendor%2Fapply",
	},
	customer_apply: {
		kind: "customer_apply",
		labelKey: "header.becomeSeller",
		to: "/vendor/apply",
		href: "/vendor/apply",
	},
	vendor_dashboard: {
		kind: "vendor_dashboard",
		labelKey: "header.vendorDashboard",
		to: "/vendor/dashboard",
		href: "/vendor/dashboard",
	},
	pending_status: {
		kind: "pending_status",
		labelKey: "header.applicationStatus",
		to: "/vendor/apply/status",
		href: "/vendor/apply/status",
	},
	rejected_resubmit: {
		kind: "rejected_resubmit",
		labelKey: "header.updateApplication",
		to: "/vendor/apply/form",
		href: "/vendor/apply/form",
	},
};

function hasVendorRole(roles: string[] | null | undefined): boolean {
	return (roles ?? []).includes("vendor");
}

export function useHeaderSellerAction() {
	const { data: session, isPending: isSessionPending } = authClient.useSession();
	const roles = (session?.user as { roles?: string[] | null } | undefined)?.roles;
	const vendorFromRole = hasVendorRole(roles);

	const vendorStatusQuery = useQuery({
		queryKey: ["header-seller-action", "vendor-status", session?.user?.id ?? "anonymous"],
		enabled: Boolean(session?.user?.id && !vendorFromRole),
		staleTime: 5 * 60 * 1000,
		queryFn: async (): Promise<VendorApplicationStatusResponse | null> => {
			const response = await api.vendor.application.status.$get();
			if (!response.ok) {
				return null;
			}
			return response.json();
		},
	});

	const vendorStatus = vendorStatusQuery.data?.application?.status;
	const isVendorApproved = vendorFromRole || vendorStatus === "approved";

	const action = useMemo<HeaderSellerAction>(() => {
		if (!session) {
			return SELLER_ACTIONS.guest_apply;
		}
		if (isVendorApproved) {
			return SELLER_ACTIONS.vendor_dashboard;
		}
		if (vendorStatus === "pending") {
			return SELLER_ACTIONS.pending_status;
		}
		if (vendorStatus === "rejected") {
			return SELLER_ACTIONS.rejected_resubmit;
		}
		return SELLER_ACTIONS.customer_apply;
	}, [isVendorApproved, session, vendorStatus]);

	const isLoading =
		isSessionPending ||
		(Boolean(session?.user?.id && !vendorFromRole) &&
			vendorStatusQuery.isLoading &&
			!vendorStatusQuery.data);

	return {
		session,
		isSessionPending,
		action,
		isVendorApproved,
		isLoading,
	};
}
