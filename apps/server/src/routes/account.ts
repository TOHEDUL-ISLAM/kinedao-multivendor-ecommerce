import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { db } from "@kineDao.com/db";
import { session, user } from "@kineDao.com/db/schema/auth";
import type { AppEnv } from "../index";

const RECOVERY_DAYS = 14;

function addRecoveryWindow(from: Date): Date {
	const next = new Date(from);
	next.setDate(next.getDate() + RECOVERY_DAYS);
	return next;
}

export const accountRouter = new Hono<AppEnv>()
	.delete(
		"/",
		describeRoute({
			tags: ["Account"],
			summary: "Schedule account deletion",
			description:
				"Soft deletes account and keeps data recoverable for 14 days if user logs in again.",
			responses: {
				200: {
					description: "Account deletion scheduled",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									success: z.boolean(),
									recoverUntil: z.string(),
									message: z.string(),
								}),
							),
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
				404: {
					description: "User not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const now = new Date();
			const recoverUntil = addRecoveryWindow(now);

			const updated = await db
				.update(user)
				.set({
					deletedAt: now,
					recoverUntil,
					updatedAt: now,
				})
				.where(eq(user.id, userId))
				.returning({ id: user.id });

			if (!updated[0]) {
				return c.json({ error: "User not found" }, 404);
			}

			// Immediately invalidate active sessions so user is signed out.
			await db.delete(session).where(eq(session.userId, userId));

			return c.json(
				{
					success: true,
					recoverUntil: recoverUntil.toISOString(),
					message:
						"Account scheduled for deletion. Log in again within 14 days to recover.",
				},
				200,
			);
		},
	)
	.post(
		"/recover",
		describeRoute({
			tags: ["Account"],
			summary: "Recover soft-deleted account",
			description:
				"Recovers account if current authenticated user is still inside recovery window.",
			responses: {
				200: {
					description: "Recovery result",
					content: {
						"application/json": {
							schema: resolver(
								z.object({
									success: z.boolean(),
									recovered: z.boolean(),
								}),
							),
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
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const now = new Date();
			const current = await db
				.select({
					id: user.id,
					deletedAt: user.deletedAt,
					recoverUntil: user.recoverUntil,
				})
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);

			const record = current[0];
			if (!record?.deletedAt || !record.recoverUntil || record.recoverUntil < now) {
				return c.json({ success: true, recovered: false }, 200);
			}

			await db
				.update(user)
				.set({
					deletedAt: null,
					recoverUntil: null,
					updatedAt: now,
				})
				.where(and(eq(user.id, userId), eq(user.deletedAt, record.deletedAt)));

			return c.json({ success: true, recovered: true }, 200);
		},
	);
