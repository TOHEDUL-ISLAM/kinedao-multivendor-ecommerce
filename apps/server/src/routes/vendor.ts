import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { db } from "@kineDao.com/db";
import { vendorApplications } from "@kineDao.com/db/schema";
import { eq } from "drizzle-orm";
import {
  vendorApplicationSchema,
  type VendorApplicationDTO,
  type VendorApplicationStatusResponse,
  type VendorApplicationSubmitResponse,
} from "@kineDao.com/api-types/vendor";
import type { AppEnv } from "../index";
import { resolvePrivateFileUrl } from "../lib/private-file-url";

// Helper to create slug from text
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

// Generate unique slug with suffix if needed
const generateUniqueSlug = async (shopName: string): Promise<string> => {
  const baseSlug = slugify(shopName);
  let slug = baseSlug;
  let counter = 0;

  while (true) {
    const [existing] = await db
      .select({ id: vendorApplications.id })
      .from(vendorApplications)
      .where(eq(vendorApplications.slug, slug))
      .limit(1);

    if (!existing) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
};

// Map database row to DTO
const mapToDTO = (row: typeof vendorApplications.$inferSelect): VendorApplicationDTO => ({
  id: row.id,
  userId: row.userId,
  status: row.status,
  shopNameEn: row.shopNameEn,
  shopNameBn: row.shopNameBn,
  ownerName: row.ownerName,
  phone: row.phone,
  email: row.email,
  businessType: row.businessType,
  addressLine1: row.addressLine1,
  addressLine2: row.addressLine2,
  district: row.district,
  city: row.city,
  postalCode: row.postalCode,
  nidNumber: row.nidNumber,
  nidFrontUrl: resolvePrivateFileUrl(row.nidFrontUrl),
  nidBackUrl: resolvePrivateFileUrl(row.nidBackUrl),
  tradeLicenseUrl: row.tradeLicenseUrl ? resolvePrivateFileUrl(row.tradeLicenseUrl) : null,
  shopLogoUrl: row.shopLogoUrl,
  bankName: row.bankName,
  bankAccountNumber: row.bankAccountNumber,
  bankAccountName: row.bankAccountName,
  bkashNumber: row.bkashNumber,
  nagadNumber: row.nagadNumber,
  slug: row.slug,
  reviewNotes: row.reviewNotes,
  reviewedAt: row.reviewedAt?.toISOString() ?? null,
  vendorId: row.vendorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const vendorRouter = new Hono<AppEnv>()
  // GET /api/vendor/application/status - Check user's application status
  .get(
    "/application/status",
    describeRoute({
      tags: ["Vendor"],
      summary: "Get vendor application status",
      description:
        "Check if the authenticated user has a vendor application and its current status.",
      responses: {
        200: {
          description: "Application status retrieved",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  exists: z.boolean(),
                  canApply: z.boolean(),
                  canResubmit: z.boolean(),
                  application: z.any().nullable(),
                }),
              ),
            },
          },
        },
        401: {
          description: "Unauthorized - user not logged in",
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

      const [application] = await db
        .select()
        .from(vendorApplications)
        .where(eq(vendorApplications.userId, userId))
        .limit(1);

      if (!application) {
        const response: VendorApplicationStatusResponse = {
          exists: false,
          canApply: true,
          canResubmit: false,
          application: null,
        };
        return c.json(response, 200);
      }

      const response: VendorApplicationStatusResponse = {
        exists: true,
        canApply: false,
        canResubmit: application.status === "rejected",
        application: mapToDTO(application),
      };
      return c.json(response, 200);
    },
  )
  // POST /api/vendor/application - Submit or resubmit vendor application
  .post(
    "/application",
    describeRoute({
      tags: ["Vendor"],
      summary: "Submit vendor application",
      description:
        "Submit a new vendor application or resubmit after rejection. State machine ensures idempotent handling.",
      responses: {
        201: {
          description: "Application submitted successfully",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  success: z.boolean(),
                  application: z.any(),
                }),
              ),
            },
          },
        },
        401: {
          description: "Unauthorized - user not logged in",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
        409: {
          description: "Application already exists and cannot be modified",
          content: {
            "application/json": {
              schema: resolver(
                z.object({
                  error: z.string(),
                  status: z.string(),
                }),
              ),
            },
          },
        },
      },
    }),
    zValidator("json", vendorApplicationSchema),
    async (c) => {
      const userId = c.var.user?.id;
      if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const input = c.req.valid("json");

      // Check existing application
      const [existing] = await db
        .select()
        .from(vendorApplications)
        .where(eq(vendorApplications.userId, userId))
        .limit(1);

      // State machine logic
      if (existing) {
        if (existing.status === "pending") {
          return c.json(
            {
              error: "Application already pending review",
              status: "pending",
            },
            409,
          );
        }

        if (existing.status === "approved") {
          return c.json(
            {
              error: "You are already a verified vendor",
              status: "approved",
            },
            409,
          );
        }

        // Status is 'rejected' - allow resubmission by updating existing row
        const [updated] = await db
          .update(vendorApplications)
          .set({
            status: "pending",
            shopNameEn: input.shopNameEn,
            shopNameBn: input.shopNameBn ?? null,
            ownerName: input.ownerName,
            phone: input.phone,
            email: input.email,
            businessType: input.businessType,
            addressLine1: input.addressLine1,
            addressLine2: input.addressLine2 ?? null,
            district: input.district,
            city: input.city,
            postalCode: input.postalCode ?? null,
            nidNumber: input.nidNumber,
            nidFrontUrl: input.nidFrontUrl,
            nidBackUrl: input.nidBackUrl,
            tradeLicenseUrl: input.tradeLicenseUrl ?? null,
            shopLogoUrl: input.shopLogoUrl ?? null,
            bankName: input.bankName ?? null,
            bankAccountNumber: input.bankAccountNumber ?? null,
            bankAccountName: input.bankAccountName ?? null,
            bkashNumber: input.bkashNumber ?? null,
            nagadNumber: input.nagadNumber ?? null,
            reviewNotes: null,
            reviewedAt: null,
            reviewedBy: null,
          })
          .where(eq(vendorApplications.id, existing.id))
          .returning();

        if (!updated) {
          return c.json({ error: "Failed to update application" }, 500);
        }

        const response: VendorApplicationSubmitResponse = {
          success: true,
          application: mapToDTO(updated),
        };
        return c.json(response, 201);
      }

      // No existing application - create new one
      const slug = await generateUniqueSlug(input.shopNameEn);

      const [created] = await db
        .insert(vendorApplications)
        .values({
          userId,
          status: "pending",
          shopNameEn: input.shopNameEn,
          shopNameBn: input.shopNameBn ?? null,
          ownerName: input.ownerName,
          phone: input.phone,
          email: input.email,
          businessType: input.businessType,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 ?? null,
          district: input.district,
          city: input.city,
          postalCode: input.postalCode ?? null,
          nidNumber: input.nidNumber,
          nidFrontUrl: input.nidFrontUrl,
          nidBackUrl: input.nidBackUrl,
          tradeLicenseUrl: input.tradeLicenseUrl ?? null,
          shopLogoUrl: input.shopLogoUrl ?? null,
          bankName: input.bankName ?? null,
          bankAccountNumber: input.bankAccountNumber ?? null,
          bankAccountName: input.bankAccountName ?? null,
          bkashNumber: input.bkashNumber ?? null,
          nagadNumber: input.nagadNumber ?? null,
          slug,
        })
        .returning();

      if (!created) {
        return c.json({ error: "Failed to create application" }, 500);
      }

      const response: VendorApplicationSubmitResponse = {
        success: true,
        application: mapToDTO(created),
      };
      return c.json(response, 201);
    },
  );

export { vendorRouter };
export type VendorRouterType = typeof vendorRouter;
