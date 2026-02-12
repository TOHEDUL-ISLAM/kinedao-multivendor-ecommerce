import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { db } from "@kineDao.com/db";
import { shippingAddresses } from "@kineDao.com/db/schema";
import { and, desc, eq } from "drizzle-orm";
import {
	shippingAddressSchema,
	shippingAddressParamSchema,
	shippingCostQuerySchema,
	SHIPPING_ZONES,
	type ShippingAddressDTO,
	type ShippingCostDTO,
	type ShippingZone,
} from "@kineDao.com/api-types/checkout";
import type { AppEnv } from "../index";

// Helper function to calculate shipping cost
function calculateShippingCost(district: string): ShippingCostDTO {
	for (const [zone, config] of Object.entries(SHIPPING_ZONES) as Array<[ShippingZone, typeof SHIPPING_ZONES[keyof typeof SHIPPING_ZONES]]>) {
		if ((config.districts as readonly string[]).includes(district)) {
			return {
				zone: zone,
				costPaisa: config.costPaisa,
				estimatedDays: config.estimatedDays,
				labelEn: config.labelEn,
				labelBn: config.labelBn,
			};
		}
	}
	// Default: other districts
	return {
		zone: "other",
		costPaisa: SHIPPING_ZONES.other.costPaisa,
		estimatedDays: SHIPPING_ZONES.other.estimatedDays,
		labelEn: SHIPPING_ZONES.other.labelEn,
		labelBn: SHIPPING_ZONES.other.labelBn,
	};
}

export const shippingAddressesRouter = new Hono<AppEnv>()
	// List user's saved addresses
	.get(
		"/",
		describeRoute({
			tags: ["Shipping Addresses"],
			summary: "List user's saved addresses",
			description:
				"Get all shipping addresses for the authenticated user, ordered by default status and creation date",
			responses: {
				200: {
					description: "List of shipping addresses",
					content: {
						"application/json": {
							schema: resolver(z.array(z.any())),
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

			const addresses = await db
				.select()
				.from(shippingAddresses)
				.where(eq(shippingAddresses.userId, userId))
				.orderBy(
					desc(shippingAddresses.isDefault),
					desc(shippingAddresses.createdAt),
				);

			const addressDTOs: ShippingAddressDTO[] = addresses.map((addr) => ({
				id: addr.id,
				fullName: addr.fullName,
				phone: addr.phone,
				alternatePhone: addr.alternatePhone,
				addressLine1: addr.addressLine1,
				addressLine2: addr.addressLine2,
				city: addr.city,
				district: addr.district,
				postalCode: addr.postalCode,
				deliveryInstructions: addr.deliveryInstructions,
				isDefault: addr.isDefault,
				createdAt: addr.createdAt.toISOString(),
			}));

			return c.json({ addresses: addressDTOs }, 200);
		},
	)

	// Create new address
	.post(
		"/",
		describeRoute({
			tags: ["Shipping Addresses"],
			summary: "Create new shipping address",
			description:
				"Create a new shipping address for the authenticated user. If isDefault is true, un-defaults all other addresses first.",
			responses: {
				201: {
					description: "Address created successfully",
					content: {
						"application/json": {
							schema: resolver(z.any()),
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
		zValidator("json", shippingAddressSchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const data = c.req.valid("json");

			// If setting as default, un-default all other addresses first
			if (data.isDefault) {
				await db
					.update(shippingAddresses)
					.set({ isDefault: false })
					.where(eq(shippingAddresses.userId, userId));
			}

			const [address] = await db
				.insert(shippingAddresses)
				.values({
					userId,
					fullName: data.fullName,
					phone: data.phone,
					alternatePhone: data.alternatePhone || null,
					addressLine1: data.addressLine1,
					addressLine2: data.addressLine2 || null,
					city: data.city,
					district: data.district,
					postalCode: data.postalCode || null,
					deliveryInstructions: data.deliveryInstructions || null,
					isDefault: data.isDefault ?? false,
				})
				.returning();

			if (!address) {
				return c.json({ error: "Failed to create address" }, 500);
			}

			const addressDTO: ShippingAddressDTO = {
				id: address.id,
				fullName: address.fullName,
				phone: address.phone,
				alternatePhone: address.alternatePhone,
				addressLine1: address.addressLine1,
				addressLine2: address.addressLine2,
				city: address.city,
				district: address.district,
				postalCode: address.postalCode,
				deliveryInstructions: address.deliveryInstructions,
				isDefault: address.isDefault,
				createdAt: address.createdAt.toISOString(),
			};

			return c.json({ address: addressDTO }, 201);
		},
	)

	// Update address
	.patch(
		"/:addressId",
		describeRoute({
			tags: ["Shipping Addresses"],
			summary: "Update shipping address",
			description: "Update an existing shipping address. Verifies ownership.",
			responses: {
				200: {
					description: "Address updated successfully",
					content: {
						"application/json": {
							schema: resolver(z.any()),
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
					description: "Address not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("param", shippingAddressParamSchema),
		zValidator("json", shippingAddressSchema.partial()),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { addressId } = c.req.valid("param");
			const data = c.req.valid("json");

			// Verify ownership
			const [existing] = await db
				.select()
				.from(shippingAddresses)
				.where(
					and(
						eq(shippingAddresses.id, addressId),
						eq(shippingAddresses.userId, userId),
					),
				)
				.limit(1);

			if (!existing) {
				return c.json({ error: "Address not found" }, 404);
			}

			// If setting as default, un-default all other addresses first
			if (data.isDefault) {
				await db
					.update(shippingAddresses)
					.set({ isDefault: false })
					.where(eq(shippingAddresses.userId, userId));
			}

			const [updated] = await db
				.update(shippingAddresses)
				.set({
					fullName: data.fullName ?? existing.fullName,
					phone: data.phone ?? existing.phone,
					alternatePhone: data.alternatePhone ?? existing.alternatePhone,
					addressLine1: data.addressLine1 ?? existing.addressLine1,
					addressLine2: data.addressLine2 ?? existing.addressLine2,
					city: data.city ?? existing.city,
					district: data.district ?? existing.district,
					postalCode: data.postalCode ?? existing.postalCode,
					deliveryInstructions:
						data.deliveryInstructions ?? existing.deliveryInstructions,
					isDefault: data.isDefault ?? existing.isDefault,
				})
				.where(eq(shippingAddresses.id, addressId))
				.returning();

			if (!updated) {
				return c.json({ error: "Failed to update address" }, 500);
			}

			const addressDTO: ShippingAddressDTO = {
				id: updated.id,
				fullName: updated.fullName,
				phone: updated.phone,
				alternatePhone: updated.alternatePhone,
				addressLine1: updated.addressLine1,
				addressLine2: updated.addressLine2,
				city: updated.city,
				district: updated.district,
				postalCode: updated.postalCode,
				deliveryInstructions: updated.deliveryInstructions,
				isDefault: updated.isDefault,
				createdAt: updated.createdAt.toISOString(),
			};

			return c.json({ address: addressDTO }, 200);
		},
	)

	// Delete address
	.delete(
		"/:addressId",
		describeRoute({
			tags: ["Shipping Addresses"],
			summary: "Delete shipping address",
			description: "Delete a shipping address. Verifies ownership.",
			responses: {
				200: {
					description: "Address deleted successfully",
					content: {
						"application/json": {
							schema: resolver(z.object({ success: z.boolean() })),
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
					description: "Address not found",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("param", shippingAddressParamSchema),
		async (c) => {
			const userId = c.var.user?.id;
			if (!userId) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			const { addressId } = c.req.valid("param");

			// Verify ownership
			const [existing] = await db
				.select()
				.from(shippingAddresses)
				.where(
					and(
						eq(shippingAddresses.id, addressId),
						eq(shippingAddresses.userId, userId),
					),
				)
				.limit(1);

			if (!existing) {
				return c.json({ error: "Address not found" }, 404);
			}

			await db
				.delete(shippingAddresses)
				.where(eq(shippingAddresses.id, addressId));

			return c.json({ success: true }, 200);
		},
	)

	// Calculate shipping cost by district
	.get(
		"/shipping-cost",
		describeRoute({
			tags: ["Shipping Addresses"],
			summary: "Calculate shipping cost",
			description:
				"Calculate shipping cost and estimated delivery time based on district. Returns zone info.",
			responses: {
				200: {
					description: "Shipping cost calculated",
					content: {
						"application/json": {
							schema: resolver(z.any()),
						},
					},
				},
				400: {
					description: "Invalid district",
					content: {
						"application/json": {
							schema: resolver(z.object({ error: z.string() })),
						},
					},
				},
			},
		}),
		zValidator("query", shippingCostQuerySchema),
		async (c) => {
			const { district } = c.req.valid("query");

			const shippingInfo = calculateShippingCost(district);

			return c.json(shippingInfo, 200);
		},
	);

export type ShippingAddressesRouterType = typeof shippingAddressesRouter;
