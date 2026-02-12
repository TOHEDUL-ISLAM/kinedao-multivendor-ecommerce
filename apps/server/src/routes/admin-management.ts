import { createHash, randomBytes } from "node:crypto";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { sendEmail } from "@kineDao.com/auth/email";
import { db } from "@kineDao.com/db";
import {
	adminAuditLog,
	adminInvitations,
	user,
} from "@kineDao.com/db/schema";
import {
	adminInviteAcceptSchema,
	adminInviteSchema,
	type AdminInviteAcceptResponseDTO,
	type AdminInviteResponseDTO,
	type AdminListResponseDTO,
	type AdminRevokeResponseDTO,
} from "@kineDao.com/api-types/admin-management";
import { env } from "@kineDao.com/env/server";
import { and, eq, sql } from "drizzle-orm";
import {
	grantRole,
	hasAnyRole,
	hasRole,
	revokeRole,
} from "../lib/role-service";
import {
	canonicalizeEmail,
	emailsMatch,
	normalizeEmail,
} from "../lib/email-normalization";
import {
	adminAuthMiddleware,
	type AdminEnv,
} from "../middleware/admin-auth";

const inviteParamsSchema = z.object({
	userId: z.string().min(1),
});

const INVITE_WINDOW_MS = 60_000;
const INVITE_MAX_PER_WINDOW = 5;
const inviteAttempts = new Map<string, number[]>();

function buildInviteUrl(token: string): string {
	const base = env.FRONTEND_URL.replace(/\/+$/, "");
	return `${base}/admin/accept-invite?token=${encodeURIComponent(token)}`;
}

function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

function enforceInviteRateLimit(userId: string): boolean {
	const now = Date.now();
	const existing = inviteAttempts.get(userId) ?? [];
	const activeWindow = existing.filter((timestamp) => now - timestamp < INVITE_WINDOW_MS);

	if (activeWindow.length >= INVITE_MAX_PER_WINDOW) {
		inviteAttempts.set(userId, activeWindow);
		return false;
	}

	activeWindow.push(now);
	inviteAttempts.set(userId, activeWindow);
	return true;
}

async function logAdminAction(
	adminUserId: string,
	action: string,
	entityType: string,
	entityId: string,
	details?: Record<string, unknown>,
): Promise<void> {
	await db.insert(adminAuditLog).values({
		adminUserId,
		action,
		entityType,
		entityId,
		details: details ?? null,
	});
}

async function findUserByEmail(email: string): Promise<{
	id: string;
	email: string;
	roles: string[] | null;
} | null> {
	const normalizedEmail = normalizeEmail(email);
	const canonicalEmail = canonicalizeEmail(normalizedEmail);

	const [exactUser] = await db
		.select({
			id: user.id,
			email: user.email,
			roles: user.roles,
		})
		.from(user)
		.where(eq(user.email, normalizedEmail))
		.limit(1);

	if (exactUser) {
		return exactUser;
	}

	// Gmail aliases (dots/+tag/googlemail.com) can point to the same inbox.
	if (normalizedEmail.includes("@")) {
		const candidates = await db
			.select({
				id: user.id,
				email: user.email,
				roles: user.roles,
			})
			.from(user)
			.where(
				sql`lower(${user.email}) like '%@gmail.com' or lower(${user.email}) like '%@googlemail.com'`,
			);

		const matched = candidates.find(
			(candidate) => canonicalizeEmail(candidate.email) === canonicalEmail,
		);
		if (matched) {
			return matched;
		}
	}

	return null;
}

async function cleanupPendingInvitesForEmail(email: string): Promise<void> {
	const normalizedEmail = normalizeEmail(email);
	const now = new Date();

	const pendingInvites = await db
		.select({
			id: adminInvitations.id,
			email: adminInvitations.email,
			expiresAt: adminInvitations.expiresAt,
		})
		.from(adminInvitations)
		.where(eq(adminInvitations.status, "pending"));

	for (const pendingInvite of pendingInvites) {
		if (pendingInvite.expiresAt < now) {
			await db
				.update(adminInvitations)
				.set({
					status: "expired",
					updatedAt: now,
				})
				.where(eq(adminInvitations.id, pendingInvite.id));
			continue;
		}

		if (emailsMatch(pendingInvite.email, normalizedEmail)) {
			await db
				.update(adminInvitations)
				.set({
					status: "revoked",
					updatedAt: now,
				})
				.where(eq(adminInvitations.id, pendingInvite.id));
		}
	}
}

export const adminManagementRouter = new Hono<AdminEnv>()
	.post(
		"/accept-invite",
		describeRoute({
			tags: ["Admin Management"],
			summary: "Accept admin invitation",
			description: "Accept an admin invitation for the currently logged-in user.",
			responses: {
				200: {
					description: "Invitation accepted successfully",
					content: {
						"application/json": {
							schema: resolver(z.object({ message: z.string(), role: z.string() })),
						},
					},
				},
				401: {
					description: "Unauthorized",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("json", adminInviteAcceptSchema),
		async (c) => {
			const sessionUser = c.var.user as
				| { id: string; email: string }
				| null;

			if (!sessionUser?.id) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { token } = c.req.valid("json");
			const trimmedToken = token.trim();
			const tokenHash = hashToken(trimmedToken);

			const [invitation] = await db
				.select()
				.from(adminInvitations)
				.where(eq(adminInvitations.tokenHash, tokenHash))
				.limit(1);

			if (!invitation) {
				return c.json({ error: "Invitation not found" }, 404);
			}

			if (invitation.status !== "pending") {
				if (invitation.status === "accepted") {
					return c.json({ error: "Invitation already accepted" }, 409);
				}
				if (invitation.status === "revoked") {
					return c.json({ error: "Invitation has been revoked" }, 410);
				}
				if (invitation.status === "expired") {
					return c.json({ error: "Invitation has expired" }, 410);
				}
			}

			if (invitation.expiresAt < new Date()) {
				await db
					.update(adminInvitations)
					.set({ status: "expired", updatedAt: new Date() })
					.where(eq(adminInvitations.id, invitation.id));
				return c.json({ error: "Invitation has expired" }, 410);
			}

			if (!emailsMatch(invitation.email, sessionUser.email)) {
				return c.json(
					{
						error: "Invitation email does not match your account",
						code: "invite_email_mismatch",
						invitedEmail: invitation.email,
						currentEmail: sessionUser.email,
					},
					403,
				);
			}

			const [updatedInvitation] = await db
				.update(adminInvitations)
				.set({
					status: "accepted",
					acceptedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(
					and(
						eq(adminInvitations.id, invitation.id),
						eq(adminInvitations.status, "pending"),
					),
				)
				.returning({ id: adminInvitations.id });

			if (!updatedInvitation) {
				return c.json({ error: "Invitation already consumed" }, 409);
			}

			await grantRole(sessionUser.id, invitation.role);

			await logAdminAction(
				sessionUser.id,
				"accept_admin_invite",
				"admin_invitation",
				invitation.id,
				{
					email: invitation.email,
					role: invitation.role,
				},
			);

			const response: AdminInviteAcceptResponseDTO = {
				message: "Invitation accepted successfully",
				role: invitation.role,
			};
			return c.json(response, 200);
		},
	)
	.post(
		"/invite",
		adminAuthMiddleware,
		describeRoute({
			tags: ["Admin Management"],
			summary: "Invite a new admin",
			description: "Create and send an admin invitation. Super admin only.",
			responses: {
				200: {
					description: "Invitation created successfully",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									message: z.string(),
									email: z.string(),
									role: z.string(),
									expiresAt: z.string(),
								}),
							),
						},
					},
				},
				429: {
					description: "Rate limited",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("json", adminInviteSchema),
		async (c) => {
			if (!c.var.isSuperAdmin) {
				return c.json({ error: "Only super_admin can invite admins" }, 403);
			}

			if (!enforceInviteRateLimit(c.var.adminUserId)) {
				return c.json(
					{ error: "Too many invitations. Please try again in a minute." },
					429,
				);
			}

			const input = c.req.valid("json");
			const normalizedEmail = normalizeEmail(input.email);
			const existingUser = await findUserByEmail(normalizedEmail);
			if (existingUser) {
				const currentRoles = existingUser.roles ?? [];
				if (
					input.role === "admin" &&
					hasAnyRole(currentRoles, ["admin", "super_admin"])
				) {
					return c.json({ error: "User already has admin access" }, 409);
				}
				if (
					input.role === "super_admin" &&
					hasRole(currentRoles, "super_admin")
				) {
					return c.json({ error: "User is already a super_admin" }, 409);
				}
			}

			const token = randomBytes(24).toString("hex");
			const tokenHash = hashToken(token);
			const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

			await cleanupPendingInvitesForEmail(normalizedEmail);

			const [createdInvitation] = await db
				.insert(adminInvitations)
				.values({
					email: normalizedEmail,
					role: input.role,
					invitedBy: c.var.adminUserId,
					tokenHash,
					expiresAt,
					status: "pending",
				})
				.returning({ id: adminInvitations.id });

			if (!createdInvitation) {
				return c.json({ error: "Failed to create invitation" }, 500);
			}

			const inviteUrl = buildInviteUrl(token);
			try {
				await sendEmail({
					to: normalizedEmail,
					subject: "You're invited as admin on KineDao",
					html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You are invited to KineDao Admin</h2>
            <p>You were invited as <strong>${input.role}</strong>.</p>
            <p>Click the link below to accept your invitation:</p>
            <p><a href="${inviteUrl}">${inviteUrl}</a></p>
            <p>This invitation expires in 7 days.</p>
          </div>
        `,
				});
			} catch {
				await db
					.update(adminInvitations)
					.set({
						status: "revoked",
						updatedAt: new Date(),
					})
					.where(eq(adminInvitations.id, createdInvitation.id));

				return c.json(
					{
						error:
							"Failed to send invitation email. Verify SMTP/app-password settings and try again.",
					},
					502,
				);
			}

			await logAdminAction(
				c.var.adminUserId,
				"invite_admin",
				"admin_invitation",
				createdInvitation.id,
				{
					email: normalizedEmail,
					role: input.role,
				},
			);

			const response: AdminInviteResponseDTO = {
				message: "Admin invitation sent",
				email: normalizedEmail,
				role: input.role,
				expiresAt: expiresAt.toISOString(),
			};

			return c.json(response, 200);
		},
	)
	.get(
		"/admins",
		adminAuthMiddleware,
		describeRoute({
			tags: ["Admin Management"],
			summary: "List admins",
			description: "List current admins and super admins.",
			responses: {
				200: {
					description: "Admin list",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									admins: z.array(z.any()),
									total: z.number(),
								}),
							),
						},
					},
				},
			},
		}),
		async (c) => {
			const admins = await db
				.select({
					userId: user.id,
					name: user.name,
					email: user.email,
					roles: user.roles,
					createdAt: user.createdAt,
				})
				.from(user)
				.where(sql`${user.roles} && ARRAY['admin', 'super_admin']::text[]`)
				.orderBy(user.createdAt);

			const response: AdminListResponseDTO = {
				admins: admins.map((admin) => ({
					userId: admin.userId,
					name: admin.name,
					email: admin.email,
					roles: admin.roles ?? [],
					createdAt: admin.createdAt.toISOString(),
				})),
				total: admins.length,
			};

			return c.json(response, 200);
		},
	)
	.delete(
		"/admins/:userId",
		adminAuthMiddleware,
		describeRoute({
			tags: ["Admin Management"],
			summary: "Revoke admin access",
			description: "Revoke admin/super_admin roles for a user. Super admin only.",
			responses: {
				200: {
					description: "Admin access revoked",
					content: {
						"application/json": {
							schema: resolver(z.object({ message: z.string(), userId: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("param", inviteParamsSchema),
		async (c) => {
			if (!c.var.isSuperAdmin) {
				return c.json({ error: "Only super_admin can revoke admin access" }, 403);
			}

			const { userId } = c.req.valid("param");
			if (userId === c.var.adminUserId) {
				return c.json({ error: "You cannot revoke your own admin access" }, 400);
			}

			const [targetUser] = await db
				.select({
					id: user.id,
					roles: user.roles,
				})
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);

			if (!targetUser) {
				return c.json({ error: "User not found" }, 404);
			}

			const targetRoles = targetUser.roles ?? [];
			if (!hasAnyRole(targetRoles, ["admin", "super_admin"])) {
				return c.json({ error: "Target user is not an admin" }, 404);
			}

			try {
				if (hasRole(targetRoles, "super_admin")) {
					await revokeRole(userId, "super_admin");
				}
				if (hasRole(targetRoles, "admin")) {
					await revokeRole(userId, "admin");
				}
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Failed to revoke admin access";
				return c.json({ error: message }, 409);
			}

			await logAdminAction(
				c.var.adminUserId,
				"revoke_admin",
				"user",
				userId,
				{},
			);

			const response: AdminRevokeResponseDTO = {
				message: "Admin access revoked",
				userId,
			};
			return c.json(response, 200);
		},
	);

export type AdminManagementRouterType = typeof adminManagementRouter;
