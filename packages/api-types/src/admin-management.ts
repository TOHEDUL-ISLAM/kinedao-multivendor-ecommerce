import { z } from "zod";

export const ADMIN_MANAGEMENT_ROLES = ["admin", "super_admin"] as const;
export type AdminManagementRole = (typeof ADMIN_MANAGEMENT_ROLES)[number];

export const adminInviteSchema = z.object({
	email: z.string().email(),
	role: z.enum(ADMIN_MANAGEMENT_ROLES),
});

export const adminInviteAcceptSchema = z.object({
	token: z.string().min(32).max(256),
});

export type AdminInviteInput = z.infer<typeof adminInviteSchema>;
export type AdminInviteAcceptInput = z.infer<typeof adminInviteAcceptSchema>;

export interface AdminInviteResponseDTO {
	message: string;
	email: string;
	role: AdminManagementRole;
	expiresAt: string;
}

export interface AdminInviteAcceptResponseDTO {
	message: string;
	role: AdminManagementRole;
}

export interface AdminListItemDTO {
	userId: string;
	name: string;
	email: string;
	roles: string[];
	createdAt: string;
}

export interface AdminListResponseDTO {
	admins: AdminListItemDTO[];
	total: number;
}

export interface AdminRevokeResponseDTO {
	message: string;
	userId: string;
}

