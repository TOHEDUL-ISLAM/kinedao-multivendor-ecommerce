import { db } from "@kineDao.com/db";
import {
	adminUsers,
	user,
	vendorApplications,
} from "@kineDao.com/db/schema";
import { and, eq, sql } from "drizzle-orm";

export const USER_ROLES = [
	"customer",
	"vendor",
	"admin",
	"super_admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

const ADMIN_ROLES: UserRole[] = ["admin", "super_admin"];

function isUserRole(role: string): role is UserRole {
	return (USER_ROLES as readonly string[]).includes(role);
}

function normalizeRoles(roles: string[] | null | undefined): UserRole[] {
	const deduped = new Set<UserRole>();
	for (const role of roles ?? []) {
		if (isUserRole(role)) {
			deduped.add(role);
		}
	}
	deduped.add("customer");
	return [...deduped];
}

function areEqualRoles(a: UserRole[], b: UserRole[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((role, index) => role === b[index]);
}

async function syncAdminLookup(
	tx: Pick<typeof db, "insert" | "delete">,
	userId: string,
	roles: UserRole[],
): Promise<void> {
	if (hasAnyRole(roles, ADMIN_ROLES)) {
		await tx
			.insert(adminUsers)
			.values({ userId })
			.onConflictDoNothing({ target: adminUsers.userId });
		return;
	}

	await tx.delete(adminUsers).where(eq(adminUsers.userId, userId));
}

export function hasRole(
	userRoles: string[] | null | undefined,
	role: UserRole,
): boolean {
	return normalizeRoles(userRoles).includes(role);
}

export function hasAnyRole(
	userRoles: string[] | null | undefined,
	roles: UserRole[],
): boolean {
	const normalized = normalizeRoles(userRoles);
	return roles.some((role) => normalized.includes(role));
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
	const [record] = await db
		.select({ roles: user.roles })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!record) {
		return [];
	}

	return normalizeRoles(record.roles);
}

export async function grantRole(
	userId: string,
	role: UserRole,
): Promise<UserRole[]> {
	return db.transaction(async (tx) => {
		const [record] = await tx
			.select({ roles: user.roles })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!record) {
			throw new Error(`User not found for grantRole: ${userId}`);
		}

		const currentRoles = normalizeRoles(record.roles);
		const nextRoles = currentRoles.includes(role)
			? currentRoles
			: [...currentRoles, role];

		if (!areEqualRoles(currentRoles, nextRoles)) {
			await tx
				.update(user)
				.set({
					roles: nextRoles,
					updatedAt: new Date(),
				})
				.where(eq(user.id, userId));
		}

		await syncAdminLookup(tx, userId, nextRoles);

		return nextRoles;
	});
}

export async function revokeRole(
	userId: string,
	role: UserRole,
): Promise<UserRole[]> {
	if (role === "customer") {
		throw new Error("customer role cannot be revoked");
	}

	return db.transaction(async (tx) => {
		const [record] = await tx
			.select({ roles: user.roles })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!record) {
			throw new Error(`User not found for revokeRole: ${userId}`);
		}

		const currentRoles = normalizeRoles(record.roles);
		if (!currentRoles.includes(role)) {
			await syncAdminLookup(tx, userId, currentRoles);
			return currentRoles;
		}

		if (role === "super_admin") {
			const [result] = await tx
				.select({ count: sql<number>`count(*)::int` })
				.from(user)
				.where(sql`${user.roles} @> ARRAY['super_admin']::text[]`);

			const superAdminCount = Number(result?.count ?? 0);
			if (superAdminCount <= 1) {
				throw new Error("Cannot revoke the last super_admin");
			}
		}

		const nextRoles = currentRoles.filter((currentRole) => currentRole !== role);
		if (!nextRoles.includes("customer")) {
			nextRoles.unshift("customer");
		}

		await tx
			.update(user)
			.set({
				roles: nextRoles,
				updatedAt: new Date(),
			})
			.where(eq(user.id, userId));

		await syncAdminLookup(tx, userId, nextRoles);

		return nextRoles;
	});
}

export async function syncVendorRole(userId: string): Promise<boolean> {
	const [approvedApplication] = await db
		.select({ id: vendorApplications.id })
		.from(vendorApplications)
		.where(
			and(
				eq(vendorApplications.userId, userId),
				eq(vendorApplications.status, "approved"),
			),
		)
		.limit(1);

	if (!approvedApplication) {
		return false;
	}

	await grantRole(userId, "vendor");
	return true;
}
