import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export const USER_ROLES = [
	"customer",
	"vendor",
	"admin",
	"super_admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

function normalizeRoles(roles: string[] | null | undefined): UserRole[] {
	const valid = new Set<UserRole>();
	for (const role of roles ?? []) {
		if ((USER_ROLES as readonly string[]).includes(role)) {
			valid.add(role as UserRole);
		}
	}
	valid.add("customer");
	return [...valid];
}

export function useUserRoles() {
	const { data, isLoading, isFetching, refetch } = useQuery({
		queryKey: ["auth-session"],
		queryFn: async () => {
			const session = await authClient.getSession();
			return session.data ?? null;
		},
		staleTime: 5 * 60 * 1000,
	});

	const user = (data?.user ?? null) as
		| ({ roles?: string[] | null } & Record<string, unknown>)
		| null;
	const roles = normalizeRoles(user?.roles);

	return {
		user,
		roles,
		isLoading: isLoading || isFetching,
		refetch,
		hasRole: (role: UserRole) => roles.includes(role),
		isVendor: roles.includes("vendor"),
		isAdmin: roles.includes("admin") || roles.includes("super_admin"),
		isSuperAdmin: roles.includes("super_admin"),
	};
}

