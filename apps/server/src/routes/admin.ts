import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { db, getS3Url } from "@kineDao.com/db";
import {
  user,
  adminAuditLog,
  vendorApplications,
  vendors,
  products,
  productImages,
  productOptions,
  productSkus,
  categories,
  orders,
  orderItems,
  vendorPayouts,
  transactions,
  banners,
  siteSettings,
  type ShippingAddressSnapshot,
  type OrderItemProductSnapshot,
} from "@kineDao.com/db/schema";
import { and, asc, desc, eq, sql, ilike, gte, lte, inArray, isNull } from "drizzle-orm";
import {
  adminVendorListQuerySchema,
  adminVendorStatusUpdateSchema,
  adminProductListQuerySchema,
  adminProductStatusUpdateSchema,
  adminProductActiveUpdateSchema,
  adminOrderListQuerySchema,
  adminUserListQuerySchema,
  adminPayoutProcessSchema,
  adminPayoutHistoryQuerySchema,
  adminOrderReconcileSchema,
  adminSettlementClearSchema,
  adminBannerFormSchema,
  adminHeroBannerFormSchema,
  adminSideCardFormSchema,
  adminBannerReorderSchema,
  adminCategoryFormSchema,
  type AdminOverviewDTO,
  type AdminVendorListResponseDTO,
  type AdminVendorCountsDTO,
  type AdminVendorDetailDTO,
  type AdminProductListResponseDTO,
  type AdminProductCountsDTO,
  type AdminProductDetailDTO,
  type AdminOrderListResponseDTO,
  type AdminOrderDetailDTO,
  type AdminUserListResponseDTO,
  type AdminPendingPayoutDTO,
  type AdminPayoutHistoryResponseDTO,
  type AdminWalletSummaryDTO,
  type AdminBannerListItemDTO,
  type AdminHeroBannerListItemDTO,
  type AdminSideCardListItemDTO,
  type AdminCategoryListItemDTO,
} from "@kineDao.com/api-types/admin";
import { adminAuthMiddleware, type AdminEnv } from "../middleware/admin-auth";
import { notify } from "../lib/notification-service";
import { deleteFile } from "../lib/file-upload";
import { resolvePrivateFileUrl } from "../lib/private-file-url";
import { grantRole, revokeRole } from "../lib/role-service";
import {
  adminTopBarAnnouncementUpdateSchema,
  topBarAnnouncementSchema,
  type TopBarAnnouncementDTO,
} from "@kineDao.com/api-types/site-settings";
import {
  DEFAULT_TOP_BAR_ANNOUNCEMENT,
  TOP_BAR_ANNOUNCEMENT_SETTING_KEY,
  parseTopBarAnnouncement,
} from "../lib/top-bar-announcement";

// Helper: generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

// Helper: log admin action
async function logAdminAction(
  adminUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, any>,
) {
  await db.insert(adminAuditLog).values({
    adminUserId,
    action,
    entityType,
    entityId,
    details: details || null,
  });
}

function defaultPayoutFeePaisa(paymentMethod: "bank" | "bkash" | "nagad") {
  if (paymentMethod === "bank") {
    return 0;
  }
  // Flat 10 BDT operational fee for MFS payout rail.
  return 1000;
}

function getHeroBannerStatus(params: {
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}): "active" | "scheduled" | "inactive" {
  const { isActive, startsAt, endsAt } = params;

  if (!isActive) return "inactive";

  const now = new Date();
  if (startsAt && startsAt > now) return "scheduled";
  if (endsAt && endsAt < now) return "inactive";

  return "active";
}

export const adminRouter = new Hono<AdminEnv>()
  // Apply admin auth to all routes
  .use("*", adminAuthMiddleware)

  // =====================
  // Debug Endpoint
  // =====================
  .get(
    "/me",
    describeRoute({
      tags: ["Admin Dashboard"],
      summary: "Get current admin session info",
      description: "Returns info about the currently authenticated admin",
      responses: {
        200: {
          description: "Admin session info",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    async (c) => {
      return c.json(
        {
          user: c.var.user,
          adminUserId: c.var.adminUserId,
          isSuperAdmin: c.var.isSuperAdmin,
        },
        200,
      );
    },
  )

  // =====================
  // GET /overview - Dashboard stats
  // =====================
  .get(
    "/overview",
    describeRoute({
      tags: ["Admin Dashboard"],
      summary: "Get admin dashboard overview",
      description: "Returns platform-wide stats, recent orders, and pending counts",
      responses: {
        200: {
          description: "Dashboard overview data",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    async (c) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Run parallel queries
      const [
        totalUsersResult,
        activeVendorsResult,
        totalOrdersResult,
        totalRevenueResult,
        pendingVendorsResult,
        pendingProductsResult,
        pendingPayoutVendorsResult,
        recentOrderRows,
        thisMonthUsersResult,
        lastMonthUsersResult,
        thisMonthVendorsResult,
        lastMonthVendorsResult,
        thisMonthOrdersResult,
        lastMonthOrdersResult,
        thisMonthRevenueResult,
        lastMonthRevenueResult,
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(user),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vendors)
          .where(eq(vendors.isVerified, true)),
        db.select({ count: sql<number>`count(*)::int` }).from(orders),
        db
          .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)::int` })
          .from(orders)
          .where(eq(orders.status, "delivered")),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vendorApplications)
          .where(eq(vendorApplications.status, "pending")),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(eq(products.status, "pending")),
        db
          .select({
            vendorId: transactions.vendorId,
          })
          .from(transactions)
          .where(eq(transactions.status, "cleared"))
          .groupBy(transactions.vendorId)
          .having(sql`COALESCE(SUM(${transactions.amountPaisa}), 0) > 0`),
        // Recent orders with vendor and user info
        db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            status: orders.status,
            total: orders.total,
            createdAt: orders.createdAt,
            customerName: user.name,
            vendorName: vendors.name,
          })
          .from(orders)
          .leftJoin(user, eq(orders.userId, user.id))
          .leftJoin(vendors, eq(orders.vendorId, vendors.id))
          .orderBy(desc(orders.createdAt))
          .limit(5),
        // This month users
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(user)
          .where(gte(user.createdAt, startOfMonth)),
        // Last month users
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(user)
          .where(and(gte(user.createdAt, startOfLastMonth), lte(user.createdAt, endOfLastMonth))),
        // This month vendors
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vendors)
          .where(and(eq(vendors.isVerified, true), gte(vendors.createdAt, startOfMonth))),
        // Last month vendors
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vendors)
          .where(
            and(
              eq(vendors.isVerified, true),
              gte(vendors.createdAt, startOfLastMonth),
              lte(vendors.createdAt, endOfLastMonth),
            ),
          ),
        // This month orders
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(orders)
          .where(gte(orders.createdAt, startOfMonth)),
        // Last month orders
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(orders)
          .where(
            and(gte(orders.createdAt, startOfLastMonth), lte(orders.createdAt, endOfLastMonth)),
          ),
        // This month revenue
        db
          .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)::int` })
          .from(orders)
          .where(and(eq(orders.status, "delivered"), gte(orders.createdAt, startOfMonth))),
        // Last month revenue
        db
          .select({ total: sql<number>`coalesce(sum(${orders.total}), 0)::int` })
          .from(orders)
          .where(
            and(
              eq(orders.status, "delivered"),
              gte(orders.createdAt, startOfLastMonth),
              lte(orders.createdAt, endOfLastMonth),
            ),
          ),
      ]);

      // Calculate growth percentages
      const calculateGrowth = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        const raw = ((current - previous) / previous) * 100;
        if (!Number.isFinite(raw)) return 0;
        return Math.max(-999, Math.min(999, Math.round(raw)));
      };

      const response: AdminOverviewDTO = {
        totalUsers: totalUsersResult[0]?.count ?? 0,
        activeVendors: activeVendorsResult[0]?.count ?? 0,
        totalOrders: totalOrdersResult[0]?.count ?? 0,
        totalRevenue: totalRevenueResult[0]?.total ?? 0,
        pendingVendors: pendingVendorsResult[0]?.count ?? 0,
        pendingProducts: pendingProductsResult[0]?.count ?? 0,
        pendingPayouts: pendingPayoutVendorsResult.length,
        recentOrders: recentOrderRows.map((row) => ({
          id: row.id,
          orderNumber: row.orderNumber,
          customerName: row.customerName || "Unknown",
          vendorName: row.vendorName || "Unknown",
          status: row.status,
          total: row.total,
          createdAt: row.createdAt.toISOString(),
        })),
        monthOverMonth: {
          users: calculateGrowth(
            thisMonthUsersResult[0]?.count ?? 0,
            lastMonthUsersResult[0]?.count ?? 0,
          ),
          vendors: calculateGrowth(
            thisMonthVendorsResult[0]?.count ?? 0,
            lastMonthVendorsResult[0]?.count ?? 0,
          ),
          orders: calculateGrowth(
            thisMonthOrdersResult[0]?.count ?? 0,
            lastMonthOrdersResult[0]?.count ?? 0,
          ),
          revenue: calculateGrowth(
            thisMonthRevenueResult[0]?.total ?? 0,
            lastMonthRevenueResult[0]?.total ?? 0,
          ),
        },
      };

      return c.json(response, 200);
    },
  )

  // =====================
  // Vendor Management
  // =====================

  // GET /vendors - Paginated list with filters
  .get(
    "/vendors",
    describeRoute({
      tags: ["Admin - Vendors"],
      summary: "List vendor applications",
      description: "Paginated list of vendor applications with status filters",
      responses: {
        200: {
          description: "Vendor applications list",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    zValidator("query", adminVendorListQuerySchema),
    async (c) => {
      const query = c.req.valid("query");
      const offset = (query.page - 1) * query.limit;

      // Build where conditions
      const conditions = [];
      if (query.status !== "all") {
        conditions.push(eq(vendorApplications.status, query.status));
      }
      if (query.search) {
        conditions.push(
          sql`(${vendorApplications.shopNameEn} ILIKE ${`%${query.search}%`} OR ${vendorApplications.ownerName} ILIKE ${`%${query.search}%`} OR ${vendorApplications.email} ILIKE ${`%${query.search}%`})`,
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count and paginated results
      const [totalResult, items] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vendorApplications)
          .where(whereClause),
        db
          .select({
            id: vendorApplications.id,
            shopNameEn: vendorApplications.shopNameEn,
            shopNameBn: vendorApplications.shopNameBn,
            ownerName: vendorApplications.ownerName,
            email: vendorApplications.email,
            phone: vendorApplications.phone,
            status: vendorApplications.status,
            createdAt: vendorApplications.createdAt,
            reviewedAt: vendorApplications.reviewedAt,
          })
          .from(vendorApplications)
          .where(whereClause)
          .orderBy(desc(vendorApplications.createdAt))
          .limit(query.limit)
          .offset(offset),
      ]);

      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / query.limit);

      const response: AdminVendorListResponseDTO = {
        vendors: items.map((item) => ({
          id: item.id,
          shopNameEn: item.shopNameEn,
          shopNameBn: item.shopNameBn,
          ownerName: item.ownerName,
          email: item.email,
          phone: item.phone,
          status: item.status,
          createdAt: item.createdAt.toISOString(),
          reviewedAt: item.reviewedAt?.toISOString() || null,
        })),
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
      };

      return c.json(response, 200);
    },
  )

  // GET /vendors/counts - Count by status
  .get(
    "/vendors/counts",
    describeRoute({
      tags: ["Admin - Vendors"],
      summary: "Get vendor application counts",
      description: "Returns count of applications by status",
      responses: {
        200: {
          description: "Vendor application counts",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    async (c) => {
      const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vendorApplications)
          .where(eq(vendorApplications.status, "pending")),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vendorApplications)
          .where(eq(vendorApplications.status, "approved")),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vendorApplications)
          .where(eq(vendorApplications.status, "rejected")),
      ]);

      const response: AdminVendorCountsDTO = {
        pending: pendingResult[0]?.count ?? 0,
        approved: approvedResult[0]?.count ?? 0,
        rejected: rejectedResult[0]?.count ?? 0,
      };

      return c.json(response, 200);
    },
  )

  // GET /vendors/:applicationId - Full application detail
  .get(
    "/vendors/:applicationId",
    describeRoute({
      tags: ["Admin - Vendors"],
      summary: "Get vendor application detail",
      description: "Returns full application info including documents",
      responses: {
        200: {
          description: "Vendor application detail",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
        404: {
          description: "Application not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const applicationId = c.req.param("applicationId");

      const [application] = await db
        .select()
        .from(vendorApplications)
        .where(eq(vendorApplications.id, applicationId))
        .limit(1);

      if (!application) {
        return c.json({ error: "Application not found" }, 404);
      }

      const response: AdminVendorDetailDTO = {
        id: application.id,
        userId: application.userId,
        status: application.status,
        shopNameEn: application.shopNameEn,
        shopNameBn: application.shopNameBn,
        ownerName: application.ownerName,
        phone: application.phone,
        email: application.email,
        businessType: application.businessType,
        addressLine1: application.addressLine1,
        addressLine2: application.addressLine2,
        district: application.district,
        city: application.city,
        postalCode: application.postalCode,
        nidNumber: application.nidNumber,
        nidFrontUrl: resolvePrivateFileUrl(application.nidFrontUrl),
        nidBackUrl: resolvePrivateFileUrl(application.nidBackUrl),
        tradeLicenseUrl: application.tradeLicenseUrl
          ? resolvePrivateFileUrl(application.tradeLicenseUrl)
          : null,
        shopLogoUrl: application.shopLogoUrl,
        bankName: application.bankName,
        bankAccountNumber: application.bankAccountNumber,
        bankAccountName: application.bankAccountName,
        bkashNumber: application.bkashNumber,
        nagadNumber: application.nagadNumber,
        slug: application.slug,
        reviewNotes: application.reviewNotes,
        reviewedAt: application.reviewedAt?.toISOString() || null,
        reviewedBy: application.reviewedBy,
        vendorId: application.vendorId,
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
      };

      return c.json(response, 200);
    },
  )

  // PATCH /vendors/:applicationId/status - Approve or reject
  .patch(
    "/vendors/:applicationId/status",
    describeRoute({
      tags: ["Admin - Vendors"],
      summary: "Update vendor application status",
      description: "Approve or reject a vendor application",
      responses: {
        200: {
          description: "Status updated successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
        404: {
          description: "Application not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminVendorStatusUpdateSchema),
    async (c) => {
      const applicationId = c.req.param("applicationId");
      const adminUserId = c.var.adminUserId;
      const { status, reviewNotes } = c.req.valid("json");

      const [application] = await db
        .select()
        .from(vendorApplications)
        .where(eq(vendorApplications.id, applicationId))
        .limit(1);

      if (!application) {
        return c.json({ error: "Application not found" }, 404);
      }

      if (status === "approved") {
        // Create vendor record if doesn't exist
        let vendorId = application.vendorId;

        if (!vendorId) {
          const slug = generateSlug(application.shopNameEn);
          const [newVendor] = await db
            .insert(vendors)
            .values({
              name: application.shopNameEn,
              slug,
              isVerified: true,
              logoUrl: application.shopLogoUrl,
            })
            .returning({ id: vendors.id });

          if (!newVendor) {
            return c.json({ error: "Failed to create vendor" }, 500);
          }

          vendorId = newVendor.id;
        }

        // Update application
        await db
          .update(vendorApplications)
          .set({
            status: "approved",
            reviewedAt: new Date(),
            reviewedBy: adminUserId,
            reviewNotes: reviewNotes || null,
            vendorId,
          })
          .where(eq(vendorApplications.id, applicationId));

        // Role sync: approved vendors must carry vendor role in auth session.
        await grantRole(application.userId, "vendor");

        // Log action
        await logAdminAction(adminUserId, "approve_vendor", "vendor_application", applicationId, {
          vendorId,
          reviewNotes,
        });

        // Send notification to vendor
        const [vendorUser] = await db
          .select({ email: user.email, name: user.name })
          .from(user)
          .where(eq(user.id, application.userId))
          .limit(1);

        if (vendorUser) {
          notify({
            userId: application.userId,
            type: "vendor_approved",
            title: "Vendor Application Approved",
            titleBn: "বিক্রেতার আবেদন অনুমোদিত",
            body: `Congratulations! Your vendor application for ${application.shopNameEn} has been approved`,
            bodyBn: `অভিনন্দন! ${application.shopNameEn} এর জন্য আপনার বিক্রেতার আবেদন অনুমোদিত হয়েছে`,
            data: {
              applicationId,
              vendorId,
              shopName: application.shopNameEn,
            },
            channel: "vendor",
            emailData: {
              userEmail: vendorUser.email,
              userName: application.ownerName,
              shopName: application.shopNameEn,
            },
          }).catch((error) => {
            console.error(`[ADMIN] Failed to send vendor approval notification:`, error);
          });
        }
      } else {
        // Rejected
        await db
          .update(vendorApplications)
          .set({
            status: "rejected",
            reviewedAt: new Date(),
            reviewedBy: adminUserId,
            reviewNotes: reviewNotes || null,
          })
          .where(eq(vendorApplications.id, applicationId));

        // Ensure rejected vendors lose vendor role if previously granted.
        try {
          await revokeRole(application.userId, "vendor");
        } catch (error) {
          console.error("[ADMIN] Failed to revoke vendor role:", error);
        }

        // Log action
        await logAdminAction(adminUserId, "reject_vendor", "vendor_application", applicationId, {
          reviewNotes,
        });
      }

      return c.json({ message: "Status updated successfully" }, 200);
    },
  )

  // =====================
  // Product Moderation
  // =====================

  // GET /products - Cross-vendor product list
  .get(
    "/products",
    describeRoute({
      tags: ["Admin - Products"],
      summary: "List products for moderation",
      description: "Cross-vendor paginated product list with filters",
      responses: {
        200: {
          description: "Products list",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    zValidator("query", adminProductListQuerySchema),
    async (c) => {
      const query = c.req.valid("query");
      const offset = (query.page - 1) * query.limit;

      // Build where conditions
      const conditions = [];
      if (query.status !== "all") {
        conditions.push(eq(products.status, query.status));
      }
      if (query.vendorId) {
        conditions.push(eq(products.vendorId, query.vendorId));
      }
      if (query.search) {
        conditions.push(ilike(products.title, `%${query.search}%`));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count and paginated results
      const [totalResult, items] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(whereClause),
        db
          .select({
            id: products.id,
            title: products.title,
            titleBn: products.titleBn,
            slug: products.slug,
            status: products.status,
            pendingReason: products.pendingReason,
            submittedAt: products.submittedAt,
            isActive: products.isActive,
            createdAt: products.createdAt,
            updatedAt: products.updatedAt,
            vendorId: vendors.id,
            vendorName: vendors.name,
            categoryId: categories.id,
            categoryName: categories.name,
            // Get lowest SKU price
            minPrice: sql<number>`(
							SELECT COALESCE(MIN(${productSkus.priceAmount}), 0)
							FROM ${productSkus}
							WHERE ${productSkus.productId} = ${products.id}
						)`,
            // Get primary image
            imageUrl: sql<string | null>`(
							SELECT ${productImages.s3Key}
							FROM ${productImages}
							WHERE ${productImages.productId} = ${products.id}
							AND ${productImages.isPrimary} = true
							LIMIT 1
						)`,
          })
          .from(products)
          .leftJoin(vendors, eq(products.vendorId, vendors.id))
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(whereClause)
          .orderBy(query.sort === "newest" ? desc(products.createdAt) : asc(products.createdAt))
          .limit(query.limit)
          .offset(offset),
      ]);

      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / query.limit);

      const response: AdminProductListResponseDTO = {
        products: items.map((item) => ({
          id: item.id,
          title: item.title,
          titleBn: item.titleBn,
          slug: item.slug,
          status: item.status,
          imageUrl: item.imageUrl ? getS3Url(item.imageUrl) : null,
          vendorName: item.vendorName || "Unknown",
          vendorId: item.vendorId || "",
          categoryName: item.categoryName || "Uncategorized",
          priceAmount: item.minPrice,
          isActive: item.isActive ?? true,
          createdAt: item.createdAt.toISOString(),
          updatedAt: item.updatedAt.toISOString(),
          submittedAt: item.submittedAt?.toISOString() ?? null,
          pendingReason: item.pendingReason ?? null,
          hasVendorUpdate: item.pendingReason === "vendor_update",
        })),
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
      };

      return c.json(response, 200);
    },
  )

  // GET /products/counts - Count by status
  .get(
    "/products/counts",
    describeRoute({
      tags: ["Admin - Products"],
      summary: "Get product counts",
      description: "Returns count of products by status",
      responses: {
        200: {
          description: "Product counts",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    async (c) => {
      const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(eq(products.status, "pending")),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(eq(products.status, "approved")),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(products)
          .where(eq(products.status, "rejected")),
      ]);

      const response: AdminProductCountsDTO = {
        pending: pendingResult[0]?.count ?? 0,
        approved: approvedResult[0]?.count ?? 0,
        rejected: rejectedResult[0]?.count ?? 0,
      };

      return c.json(response, 200);
    },
  )

  // GET /products/:productId - Full product detail
  .get(
    "/products/:productId",
    describeRoute({
      tags: ["Admin - Products"],
      summary: "Get product detail",
      description: "Returns full product info including vendor, images, SKUs",
      responses: {
        200: {
          description: "Product detail",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
        404: {
          description: "Product not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const productId = c.req.param("productId");

      const [productRow] = await db
        .select({
          id: products.id,
          title: products.title,
          titleBn: products.titleBn,
          slug: products.slug,
          categoryId: categories.id,
          categoryName: categories.name,
          brand: products.brand,
          shortDescription: products.shortDescription,
          shortDescriptionBn: products.shortDescriptionBn,
          description: products.description,
          descriptionBn: products.descriptionBn,
          ageRange: products.ageRange,
          ageRangeMin: products.ageRangeMin,
          ageRangeMax: products.ageRangeMax,
          isBpaFree: products.isBpaFree,
          isOrganic: products.isOrganic,
          isHypoallergenic: products.isHypoallergenic,
          hasSmallParts: products.hasSmallParts,
          safetyWarningEn: products.safetyWarningEn,
          safetyWarningBn: products.safetyWarningBn,
          safetyCertifications: products.safetyCertifications,
          weightLimitKg: products.weightLimitKg,
          expiryDate: products.expiryDate,
          status: products.status,
          pendingReason: products.pendingReason,
          submittedAt: products.submittedAt,
          reviewNotes: products.reviewNotes,
          lastReviewedAt: products.lastReviewedAt,
          lastReviewedBy: products.lastReviewedBy,
          isActive: products.isActive,
          vendorId: vendors.id,
          vendorName: vendors.name,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        })
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(vendors, eq(products.vendorId, vendors.id))
        .where(eq(products.id, productId))
        .limit(1);

      if (!productRow) {
        return c.json({ error: "Product not found" }, 404);
      }

      // Get images, options, SKUs
      const [imageRows, optionRows, skuRows] = await Promise.all([
        db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, productId))
          .orderBy(asc(productImages.sortOrder)),
        db
          .select()
          .from(productOptions)
          .where(eq(productOptions.productId, productId))
          .orderBy(asc(productOptions.sortOrder)),
        db.select().from(productSkus).where(eq(productSkus.productId, productId)),
      ]);

      const response: AdminProductDetailDTO = {
        id: productRow.id,
        title: productRow.title,
        titleBn: productRow.titleBn,
        slug: productRow.slug,
        categoryId: productRow.categoryId || "",
        categoryName: productRow.categoryName || "Uncategorized",
        brand: productRow.brand,
        shortDescription: productRow.shortDescription,
        shortDescriptionBn: productRow.shortDescriptionBn,
        description: productRow.description,
        descriptionBn: productRow.descriptionBn,
        ageRange: productRow.ageRange,
        ageRangeMin: productRow.ageRangeMin,
        ageRangeMax: productRow.ageRangeMax,
        isBpaFree: productRow.isBpaFree,
        isOrganic: productRow.isOrganic,
        isHypoallergenic: productRow.isHypoallergenic,
        hasSmallParts: productRow.hasSmallParts,
        safetyWarningEn: productRow.safetyWarningEn,
        safetyWarningBn: productRow.safetyWarningBn,
        safetyCertifications: productRow.safetyCertifications,
        weightLimitKg: productRow.weightLimitKg,
        expiryDate: productRow.expiryDate?.toISOString() || null,
        status: productRow.status,
        isActive: productRow.isActive ?? true,
        submittedAt: productRow.submittedAt?.toISOString() ?? null,
        pendingReason: productRow.pendingReason ?? null,
        hasVendorUpdate: productRow.pendingReason === "vendor_update",
        reviewNotes: productRow.reviewNotes ?? null,
        lastReviewedAt: productRow.lastReviewedAt?.toISOString() ?? null,
        lastReviewedBy: productRow.lastReviewedBy ?? null,
        vendorId: productRow.vendorId || "",
        vendorName: productRow.vendorName || "Unknown",
        images: imageRows.map((img) => ({
          id: img.id,
          s3Key: img.s3Key,
          variant: img.variant,
          isPrimary: img.isPrimary ?? false,
          sortOrder: img.sortOrder,
        })),
        options: optionRows.map((opt) => ({
          id: opt.id,
          name: opt.name,
          nameBn: opt.nameBn,
          values: opt.values,
          valuesBn: opt.valuesBn,
          sortOrder: opt.sortOrder,
        })),
        skus: skuRows.map((sku) => ({
          id: sku.id,
          sku: sku.sku,
          optionValues: sku.optionValues,
          priceAmount: sku.priceAmount,
          compareAtAmount: sku.compareAtAmount,
          stockQty: sku.stockQty,
          isAvailable: sku.isAvailable,
        })),
        createdAt: productRow.createdAt.toISOString(),
        updatedAt: productRow.updatedAt.toISOString(),
      };

      return c.json(response, 200);
    },
  )

  // PATCH /products/:productId/status - Approve or reject
  .patch(
    "/products/:productId/status",
    describeRoute({
      tags: ["Admin - Products"],
      summary: "Update product status",
      description: "Approve or reject a product",
      responses: {
        200: {
          description: "Status updated successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
        404: {
          description: "Product not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminProductStatusUpdateSchema),
    async (c) => {
      const productId = c.req.param("productId");
      const adminUserId = c.var.adminUserId;
      const { status, reviewNotes } = c.req.valid("json");

      const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);

      if (!product) {
        return c.json({ error: "Product not found" }, 404);
      }

      await db
        .update(products)
        .set({
          status,
          pendingReason: null,
          lastReviewedAt: new Date(),
          lastReviewedBy: adminUserId,
          reviewNotes: reviewNotes || null,
        })
        .where(eq(products.id, productId));

      // Log action
      await logAdminAction(
        adminUserId,
        status === "approved" ? "approve_product" : "reject_product",
        "product",
        productId,
        { reviewNotes },
      );

      // Send notification to vendor
      const [vendorApp] = await db
        .select({ userId: vendorApplications.userId })
        .from(vendorApplications)
        .where(eq(vendorApplications.vendorId, product.vendorId))
        .limit(1);

      if (vendorApp) {
        const [vendorUser] = await db
          .select({ email: user.email, name: user.name })
          .from(user)
          .where(eq(user.id, vendorApp.userId))
          .limit(1);

        if (vendorUser) {
          if (status === "approved") {
            notify({
              userId: vendorApp.userId,
              type: "product_approved",
              title: "Product Approved",
              titleBn: "পণ্য অনুমোদিত",
              body: `Your product "${product.title}" has been approved`,
              bodyBn: `আপনার পণ্য "${product.title}" অনুমোদিত হয়েছে`,
              data: {
                productId,
                productTitle: product.title,
              },
              channel: "vendor",
              emailData: {
                userEmail: vendorUser.email,
                userName: vendorUser.name,
                productTitle: product.title,
              },
            }).catch((error) => {
              console.error(`[ADMIN] Failed to send product approval notification:`, error);
            });
          } else {
            notify({
              userId: vendorApp.userId,
              type: "product_rejected",
              title: "Product Needs Changes",
              titleBn: "পণ্যে পরিবর্তন প্রয়োজন",
              body: `Your product "${product.title}" requires changes`,
              bodyBn: `আপনার পণ্য "${product.title}" পরিবর্তন প্রয়োজন`,
              data: {
                productId,
                productTitle: product.title,
                reviewNotes: reviewNotes || null,
              },
              channel: "vendor",
              emailData: {
                userEmail: vendorUser.email,
                userName: vendorUser.name,
                productTitle: product.title,
                reviewNotes: reviewNotes || "",
              },
            }).catch((error) => {
              console.error(`[ADMIN] Failed to send product rejection notification:`, error);
            });
          }
        }
      }

      return c.json({ message: "Status updated successfully" }, 200);
    },
  )

  // PATCH /products/:productId/active - Activate or deactivate product
  .patch(
    "/products/:productId/active",
    describeRoute({
      tags: ["Admin - Products"],
      summary: "Update product active state",
      description: "Force activate or deactivate a product",
      responses: {
        200: {
          description: "Active state updated successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
        404: {
          description: "Product not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminProductActiveUpdateSchema),
    async (c) => {
      const productId = c.req.param("productId");
      const adminUserId = c.var.adminUserId;
      const { isActive, reason } = c.req.valid("json");

      const [product] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product) {
        return c.json({ error: "Product not found" }, 404);
      }

      await db.update(products).set({ isActive }).where(eq(products.id, productId));

      await logAdminAction(
        adminUserId,
        isActive ? "reactivate_product" : "deactivate_product",
        "product",
        productId,
        { reason: reason || null },
      );

      return c.json(
        {
          message: isActive
            ? "Product reactivated successfully"
            : "Product deactivated successfully",
          id: productId,
          isActive,
        },
        200,
      );
    },
  )

  // =====================
  // Order Oversight
  // =====================

  // GET /orders - Cross-vendor order list
  .get(
    "/orders",
    describeRoute({
      tags: ["Admin - Orders"],
      summary: "List all orders",
      description: "Cross-vendor paginated order list with filters",
      responses: {
        200: {
          description: "Orders list",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    zValidator("query", adminOrderListQuerySchema),
    async (c) => {
      const query = c.req.valid("query");
      const offset = (query.page - 1) * query.limit;

      // Build where conditions
      const conditions = [];
      if (query.status !== "all") {
        conditions.push(eq(orders.status, query.status));
      }
      if (query.search) {
        conditions.push(
          sql`(${orders.orderNumber} ILIKE ${`%${query.search}%`} OR ${user.name} ILIKE ${`%${query.search}%`})`,
        );
      }
      if (query.dateFrom) {
        conditions.push(gte(orders.createdAt, new Date(query.dateFrom)));
      }
      if (query.dateTo) {
        conditions.push(lte(orders.createdAt, new Date(query.dateTo)));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count and paginated results
      const [totalResult, items] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(orders)
          .where(whereClause),
        db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            status: orders.status,
            total: orders.total,
            createdAt: orders.createdAt,
            customerName: user.name,
            vendorName: vendors.name,
            // Count items
            itemCount: sql<number>`(
							SELECT COUNT(*)::int
							FROM "order_items"
							WHERE "order_items"."order_id" = "orders"."id"
						)`,
          })
          .from(orders)
          .leftJoin(user, eq(orders.userId, user.id))
          .leftJoin(vendors, eq(orders.vendorId, vendors.id))
          .where(whereClause)
          .orderBy(query.sort === "newest" ? desc(orders.createdAt) : asc(orders.createdAt))
          .limit(query.limit)
          .offset(offset),
      ]);

      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / query.limit);

      const response: AdminOrderListResponseDTO = {
        orders: items.map((item) => ({
          id: item.id,
          orderNumber: item.orderNumber,
          customerName: item.customerName || "Unknown",
          vendorName: item.vendorName || "Unknown",
          status: item.status,
          total: item.total,
          itemCount: item.itemCount,
          createdAt: item.createdAt.toISOString(),
        })),
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
      };

      return c.json(response, 200);
    },
  )

  // GET /orders/:orderId - Full order detail
  .get(
    "/orders/:orderId",
    describeRoute({
      tags: ["Admin - Orders"],
      summary: "Get order detail",
      description: "Returns full order info including items and addresses",
      responses: {
        200: {
          description: "Order detail",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
        404: {
          description: "Order not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const orderId = c.req.param("orderId");

      const [orderRow] = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          paymentMethod: orders.paymentMethod,
          subtotal: orders.subtotal,
          shippingCost: orders.shippingCost,
          codFee: orders.codFee,
          total: orders.total,
          customerNotes: orders.customerNotes,
          trackingNumber: orders.trackingNumber,
          trackingCarrier: orders.trackingCarrier,
          courierName: orders.courierName,
          courierOrderRef: orders.courierOrderRef,
          actualCourierCostPaisa: orders.actualCourierCostPaisa,
          returnFeePaisa: orders.returnFeePaisa,
          commissionRateSnapshot: orders.commissionRateSnapshot,
          commissionAmountPaisa: orders.commissionAmountPaisa,
          vendorNetPaisa: orders.vendorNetPaisa,
          shippingAddress: orders.shippingAddress,
          userId: user.id,
          customerName: user.name,
          customerEmail: user.email,
          vendorId: vendors.id,
          vendorName: vendors.name,
          createdAt: orders.createdAt,
          confirmedAt: orders.confirmedAt,
          processingAt: orders.processingAt,
          shippedAt: orders.shippedAt,
          deliveredAt: orders.deliveredAt,
          paidToAdminAt: orders.paidToAdminAt,
          completedAt: orders.completedAt,
          returnedAt: orders.returnedAt,
          cancelledAt: orders.cancelledAt,
        })
        .from(orders)
        .leftJoin(user, eq(orders.userId, user.id))
        .leftJoin(vendors, eq(orders.vendorId, vendors.id))
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!orderRow) {
        return c.json({ error: "Order not found" }, 404);
      }

      // Get order items
      const items = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          lineTotal: orderItems.lineTotal,
          productSnapshot: orderItems.productSnapshot,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      const calculatedSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const effectiveSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : orderRow.subtotal;

      const shippingAddr = orderRow.shippingAddress as ShippingAddressSnapshot;

      const response: AdminOrderDetailDTO = {
        id: orderRow.id,
        orderNumber: orderRow.orderNumber,
        status: orderRow.status,
        paymentMethod: orderRow.paymentMethod,
        subtotal: effectiveSubtotal,
        shippingCost: orderRow.shippingCost,
        codFee: orderRow.codFee,
        total: orderRow.total,
        customerNotes: orderRow.customerNotes,
        trackingNumber: orderRow.trackingNumber,
        trackingCarrier: orderRow.trackingCarrier,
        courierName: orderRow.courierName,
        courierOrderRef: orderRow.courierOrderRef,
        actualCourierCostPaisa: orderRow.actualCourierCostPaisa,
        returnFeePaisa: orderRow.returnFeePaisa,
        commissionRateSnapshot: orderRow.commissionRateSnapshot,
        commissionAmountPaisa: orderRow.commissionAmountPaisa,
        vendorNetPaisa: orderRow.vendorNetPaisa,
        userId: orderRow.userId || "",
        customerName: orderRow.customerName || "Unknown",
        customerEmail: orderRow.customerEmail || "",
        vendorId: orderRow.vendorId || "",
        vendorName: orderRow.vendorName || "Unknown",
        shippingAddress: {
          fullName: shippingAddr.fullName,
          phone: shippingAddr.phone,
          alternatePhone: shippingAddr.alternatePhone,
          addressLine1: shippingAddr.addressLine1,
          addressLine2: shippingAddr.addressLine2,
          city: shippingAddr.city,
          district: shippingAddr.district,
          postalCode: shippingAddr.postalCode,
          deliveryInstructions: shippingAddr.deliveryInstructions,
        },
        items: items.map((item) => {
          const snapshot = item.productSnapshot as OrderItemProductSnapshot;
          return {
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            productSnapshot: {
              title: snapshot.title,
              titleBn: snapshot.titleBn,
              slug: snapshot.slug,
              image: snapshot.image,
              selectedOptions: snapshot.selectedOptions ?? null,
              skuCode: snapshot.skuCode ?? null,
            },
          };
        }),
        createdAt: orderRow.createdAt.toISOString(),
        confirmedAt: orderRow.confirmedAt?.toISOString() || null,
        processingAt: orderRow.processingAt?.toISOString() || null,
        shippedAt: orderRow.shippedAt?.toISOString() || null,
        deliveredAt: orderRow.deliveredAt?.toISOString() || null,
        paidToAdminAt: orderRow.paidToAdminAt?.toISOString() || null,
        completedAt: orderRow.completedAt?.toISOString() || null,
        returnedAt: orderRow.returnedAt?.toISOString() || null,
        cancelledAt: orderRow.cancelledAt?.toISOString() || null,
      };

      return c.json(response, 200);
    },
  )

  .patch(
    "/orders/:orderId/reconcile-courier-cash",
    describeRoute({
      tags: ["Admin - Orders"],
      summary: "Reconcile courier COD cash for an order",
      description: "Marks a delivered order as paid_to_admin and creates pending ledger entries.",
      responses: {
        200: {
          description: "Order reconciled successfully",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    zValidator("param", z.object({ orderId: z.string().uuid() })),
    zValidator("json", adminOrderReconcileSchema),
    async (c) => {
      const adminUserId = c.var.adminUserId;
      const { orderId } = c.req.valid("param");
      const input = c.req.valid("json");

      const [orderRow] = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          vendorId: orders.vendorId,
          total: orders.total,
          shippingCost: orders.shippingCost,
          paidToAdminAt: orders.paidToAdminAt,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!orderRow) {
        return c.json({ error: "Order not found" }, 404);
      }

      if (orderRow.status !== "delivered") {
        return c.json({ error: "Only delivered orders can be reconciled" }, 400);
      }

      if (orderRow.paidToAdminAt) {
        return c.json({ error: "Order already reconciled" }, 400);
      }

      const [vendorRow] = await db
        .select({
          commissionRate: vendors.commissionRate,
        })
        .from(vendors)
        .where(eq(vendors.id, orderRow.vendorId))
        .limit(1);

      const commissionRatePercent = vendorRow?.commissionRate ?? 12;
      const commissionRateSnapshot = Math.round(commissionRatePercent * 100); // bps
      const commissionBaseAmount = orderRow.total;
      const commissionAmount = Math.round((commissionBaseAmount * commissionRateSnapshot) / 10000);
      const effectiveCourierCost = input.actualCourierCostPaisa;
      const rawReturnFee = input.returnFeePaisa ?? 0;
      const deliveryDeduction = effectiveCourierCost;
      const returnFeeDeduction = input.deductReturnFeeFromVendor ? rawReturnFee : 0;
      const vendorNet =
        commissionBaseAmount - commissionAmount - deliveryDeduction - returnFeeDeduction;

      if (vendorNet < 0) {
        return c.json(
          {
            error:
              "Vendor net would be negative. Reduce vendor deductions or process manual adjustment.",
            vendorNetPaisa: vendorNet,
          },
          400,
        );
      }
      const now = new Date();

      await db.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({
            status: "paid_to_admin",
            paidToAdminAt: now,
            courierName: input.courierName || null,
            courierOrderRef: input.courierOrderRef || null,
            commissionRateSnapshot,
            commissionAmountPaisa: commissionAmount,
            vendorNetPaisa: vendorNet,
            actualCourierCostPaisa: input.actualCourierCostPaisa,
            returnFeePaisa: returnFeeDeduction,
            settlementNotes: input.notes || null,
          })
          .where(eq(orders.id, orderId));

        const ledgerRows: Array<typeof transactions.$inferInsert> = [
          {
            vendorId: orderRow.vendorId,
            orderId: orderRow.id,
            type: "sale",
            amountPaisa: commissionBaseAmount,
            status: "pending",
            description: `Order ${orderRow.orderNumber} gross credit`,
            referenceType: "order",
            referenceId: orderRow.orderNumber,
            meta: {
              commissionRateSnapshot,
              commissionBasePaisa: commissionBaseAmount,
            },
          },
          {
            vendorId: orderRow.vendorId,
            orderId: orderRow.id,
            type: "commission_deduction",
            amountPaisa: -commissionAmount,
            status: "pending",
            description: `Platform commission for order ${orderRow.orderNumber}`,
            referenceType: "order",
            referenceId: orderRow.orderNumber,
          },
        ];

        if (deliveryDeduction > 0) {
          ledgerRows.push({
            vendorId: orderRow.vendorId,
            orderId: orderRow.id,
            type: "delivery_charge",
            amountPaisa: -deliveryDeduction,
            status: "pending",
            description: `Courier delivery cost for order ${orderRow.orderNumber}`,
            referenceType: "order",
            referenceId: orderRow.orderNumber,
            meta: {
              estimatedShippingCostPaisa: orderRow.shippingCost,
              actualCourierCostPaisa: input.actualCourierCostPaisa,
              deductedFromVendor: true,
            },
          });
        }

        if (returnFeeDeduction > 0) {
          ledgerRows.push({
            vendorId: orderRow.vendorId,
            orderId: orderRow.id,
            type: "return_fee",
            amountPaisa: -returnFeeDeduction,
            status: "pending",
            description: `Return fee for order ${orderRow.orderNumber}`,
            referenceType: "order",
            referenceId: orderRow.orderNumber,
          });
        }

        await tx.insert(transactions).values(ledgerRows);
      });

      await logAdminAction(adminUserId, "reconcile_courier_cash", "order", orderId, {
        commissionRateSnapshot,
        commissionAmount,
        effectiveCourierCost,
        rawReturnFee,
        deliveryPassThroughApplied: true,
        deductReturnFeeFromVendor: input.deductReturnFeeFromVendor,
        deliveryDeduction,
        returnFeeDeduction,
        vendorNet,
        courierName: input.courierName || null,
        courierOrderRef: input.courierOrderRef || null,
      });

      return c.json(
        {
          message: "Order reconciled successfully",
          orderId,
          vendorNetPaisa: vendorNet,
          commissionAmountPaisa: commissionAmount,
          deliveryCostPaisa: deliveryDeduction,
          returnFeePaisa: returnFeeDeduction,
        },
        200,
      );
    },
  )

  .post(
    "/settlement/clear-matured",
    describeRoute({
      tags: ["Admin - Payouts"],
      summary: "Clear matured pending ledger entries",
      description:
        "Moves pending transactions to cleared after maturity window and marks paid_to_admin orders as completed.",
      responses: {
        200: {
          description: "Settlement clearing result",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    zValidator("json", adminSettlementClearSchema),
    async (c) => {
      const adminUserId = c.var.adminUserId;
      const { maturityDays } = c.req.valid("json");
      const now = new Date();
      const threshold = new Date(now.getTime() - maturityDays * 24 * 60 * 60 * 1000);

      const [clearedRows, completedOrders] = await db.transaction(async (tx) => {
        const cleared = await tx
          .update(transactions)
          .set({
            status: "cleared",
            updatedAt: now,
          })
          .where(
            and(
              eq(transactions.status, "pending"),
              lte(transactions.createdAt, threshold),
              inArray(transactions.type, [
                "sale",
                "commission_deduction",
                "delivery_charge",
                "return_fee",
                "adjustment",
              ]),
            ),
          )
          .returning({ id: transactions.id });

        const completed = await tx
          .update(orders)
          .set({
            status: "completed",
            completedAt: now,
          })
          .where(and(eq(orders.status, "paid_to_admin"), lte(orders.paidToAdminAt, threshold)))
          .returning({ id: orders.id });

        return [cleared, completed] as const;
      });

      await logAdminAction(adminUserId, "clear_matured_settlement", "ledger", "system", {
        maturityDays,
        threshold: threshold.toISOString(),
        clearedTransactions: clearedRows.length,
        completedOrders: completedOrders.length,
      });

      return c.json(
        {
          message: "Settlement clearing finished",
          clearedTransactions: clearedRows.length,
          completedOrders: completedOrders.length,
          threshold: threshold.toISOString(),
        },
        200,
      );
    },
  )

  // =====================
  // User Management
  // =====================

  // GET /users - User list (read-only for MVP)
  .get(
    "/users",
    describeRoute({
      tags: ["Admin - Users"],
      summary: "List users",
      description: "Paginated user list with order counts and total spent",
      responses: {
        200: {
          description: "Users list",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    zValidator("query", adminUserListQuerySchema),
    async (c) => {
      const query = c.req.valid("query");
      const offset = (query.page - 1) * query.limit;

      // Build where conditions (always exclude soft-deleted users)
      const conditions = [isNull(user.deletedAt)];
      if (query.search) {
        conditions.push(
          sql`(${user.name} ILIKE ${`%${query.search}%`} OR ${user.email} ILIKE ${`%${query.search}%`})`,
        );
      }
      const whereClause = and(...conditions);

      // Get total count and paginated results
      const [totalResult, items] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(user)
          .where(whereClause),
        db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            createdAt: user.createdAt,
            // Order count subquery
            orderCount: sql<number>`(
							SELECT COUNT(*)::int
							FROM "orders"
							WHERE "orders"."user_id" = "user"."id"
						)`,
            // Total spent subquery
            totalSpent: sql<number>`(
							SELECT COALESCE(SUM("orders"."total"), 0)::int
							FROM "orders"
							WHERE "orders"."user_id" = "user"."id"
							AND "orders"."status" = 'delivered'
						)`,
          })
          .from(user)
          .where(whereClause)
          .orderBy(desc(user.createdAt))
          .limit(query.limit)
          .offset(offset),
      ]);

      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / query.limit);

      const response: AdminUserListResponseDTO = {
        users: items.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          emailVerified: item.emailVerified,
          image: item.image,
          orderCount: item.orderCount,
          totalSpent: item.totalSpent,
          createdAt: item.createdAt.toISOString(),
        })),
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
      };

      return c.json(response, 200);
    },
  )

  // =====================
  // Payout Processing
  // =====================

  // GET /payouts/pending - Pending payouts by vendor
  .get(
    "/payouts/pending",
    describeRoute({
      tags: ["Admin - Payouts"],
      summary: "Get pending payouts",
      description: "Returns list of vendors with pending payouts",
      responses: {
        200: {
          description: "Pending payouts list",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    async (c) => {
      const [ledgerBalances, paymentMethods, orderCounts, payoutHistory, vendorRows] =
        await Promise.all([
          db
            .select({
              vendorId: transactions.vendorId,
              availableAmount: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'cleared' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
              pendingBalance: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'pending' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
            })
            .from(transactions)
            .groupBy(transactions.vendorId),
          db
            .select({
              vendorId: vendorApplications.vendorId,
              bankAccountNumber: vendorApplications.bankAccountNumber,
              bkashNumber: vendorApplications.bkashNumber,
              nagadNumber: vendorApplications.nagadNumber,
            })
            .from(vendorApplications)
            .where(eq(vendorApplications.status, "approved")),
          db
            .select({
              vendorId: orders.vendorId,
              orderCount: sql<number>`count(*)::int`,
            })
            .from(orders)
            .where(inArray(orders.status, ["paid_to_admin", "completed", "returned"]))
            .groupBy(orders.vendorId),
          db
            .select({
              vendorId: vendorPayouts.vendorId,
              amountPaisa: vendorPayouts.amountPaisa,
              processedAt: vendorPayouts.processedAt,
            })
            .from(vendorPayouts)
            .where(eq(vendorPayouts.status, "completed"))
            .orderBy(desc(vendorPayouts.processedAt)),
          db
            .select({
              vendorId: vendors.id,
              vendorName: vendors.name,
              vendorSlug: vendors.slug,
            })
            .from(vendors),
        ]);

      const lastPayoutByVendor = new Map<
        string,
        { amountPaisa: number; processedAt: Date | null }
      >();
      for (const row of payoutHistory) {
        if (!lastPayoutByVendor.has(row.vendorId)) {
          lastPayoutByVendor.set(row.vendorId, {
            amountPaisa: row.amountPaisa,
            processedAt: row.processedAt,
          });
        }
      }

      const orderCountByVendor = new Map(orderCounts.map((row) => [row.vendorId, row.orderCount]));

      const vendorInfoById = new Map(vendorRows.map((row) => [row.vendorId, row]));

      const response: AdminPendingPayoutDTO[] = ledgerBalances
        .map((vendorBalance) => {
          const vendor = vendorInfoById.get(vendorBalance.vendorId);
          if (!vendor) return null;

          const paymentMethod = paymentMethods.find((pm) => pm.vendorId === vendorBalance.vendorId);

          let primaryMethod = "bank";
          if (paymentMethod?.bkashNumber) primaryMethod = "bkash";
          else if (paymentMethod?.nagadNumber) primaryMethod = "nagad";

          const lastPayout = lastPayoutByVendor.get(vendorBalance.vendorId);

          return {
            vendorId: vendorBalance.vendorId,
            vendorName: vendor.vendorName,
            vendorSlug: vendor.vendorSlug,
            orderCount: orderCountByVendor.get(vendorBalance.vendorId) ?? 0,
            pendingAmount: vendorBalance.availableAmount + vendorBalance.pendingBalance,
            availableAmount: vendorBalance.availableAmount,
            pendingBalance: vendorBalance.pendingBalance,
            paymentMethod: primaryMethod,
            bankAccountNumber: paymentMethod?.bankAccountNumber || null,
            bkashNumber: paymentMethod?.bkashNumber || null,
            nagadNumber: paymentMethod?.nagadNumber || null,
            lastPayoutDate: lastPayout?.processedAt?.toISOString() || null,
            lastPayoutAmount: lastPayout?.amountPaisa ?? null,
          };
        })
        .filter((row): row is AdminPendingPayoutDTO => row !== null)
        .filter((row) => row.availableAmount !== 0 || row.pendingBalance !== 0);

      return c.json(response, 200);
    },
  )

  .get(
    "/vendors/:vendorId/wallet-summary",
    describeRoute({
      tags: ["Admin - Payouts"],
      summary: "Get vendor wallet summary",
      description: "Returns cached pending/available balances and commission.",
      responses: {
        200: {
          description: "Wallet summary",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    zValidator("param", z.object({ vendorId: z.string().uuid() })),
    async (c) => {
      const { vendorId } = c.req.valid("param");

      const [vendorRows, ledgerBalance] = await Promise.all([
        db
          .select({
            vendorId: vendors.id,
            commissionRatePercent: vendors.commissionRate,
          })
          .from(vendors)
          .where(eq(vendors.id, vendorId))
          .limit(1),
        db
          .select({
            availableBalancePaisa: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'cleared' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
            pendingBalancePaisa: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'pending' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
          })
          .from(transactions)
          .where(eq(transactions.vendorId, vendorId))
          .limit(1),
      ]);

      const vendorRow = vendorRows[0];
      if (!vendorRow) {
        return c.json({ error: "Vendor not found" }, 404);
      }

      const response: AdminWalletSummaryDTO = {
        vendorId: vendorRow.vendorId,
        availableBalancePaisa: ledgerBalance[0]?.availableBalancePaisa ?? 0,
        pendingBalancePaisa: ledgerBalance[0]?.pendingBalancePaisa ?? 0,
        computedPayablePaisa: ledgerBalance[0]?.availableBalancePaisa ?? 0,
        commissionRatePercent: vendorRow.commissionRatePercent ?? 12,
      };

      return c.json(response, 200);
    },
  )

  // POST /payouts - Process payout
  .post(
    "/payouts",
    describeRoute({
      tags: ["Admin - Payouts"],
      summary: "Process payout",
      description: "Create a completed payout record for a vendor",
      responses: {
        200: {
          description: "Payout processed successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminPayoutProcessSchema),
    async (c) => {
      const adminUserId = c.var.adminUserId;
      const input = c.req.valid("json");
      const [vendorRow, availableBalanceResult] = await Promise.all([
        db
          .select({
            id: vendors.id,
          })
          .from(vendors)
          .where(eq(vendors.id, input.vendorId))
          .limit(1),
        db
          .select({
            availableBalancePaisa: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.status} = 'cleared' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
          })
          .from(transactions)
          .where(eq(transactions.vendorId, input.vendorId))
          .limit(1),
      ]);

      if (!vendorRow) {
        return c.json({ error: "Vendor not found" }, 404);
      }
      const availableBalancePaisa = availableBalanceResult[0]?.availableBalancePaisa ?? 0;

      const payoutFeePaisa = input.payoutFeePaisa ?? defaultPayoutFeePaisa(input.paymentMethod);
      const computedAmountPaisa = Math.max(availableBalancePaisa - payoutFeePaisa, 0);
      const totalDebit = computedAmountPaisa + payoutFeePaisa;

      if (computedAmountPaisa <= 0) {
        return c.json({ error: "No payable balance available for payout" }, 400);
      }

      if (totalDebit > availableBalancePaisa) {
        return c.json(
          {
            error: "Insufficient available balance after including payout processing fee",
          },
          400,
        );
      }

      const periodStart = input.periodStart ? new Date(input.periodStart) : new Date();
      const periodEnd = input.periodEnd ? new Date(input.periodEnd) : new Date();
      const processedAt = new Date();

      const [payoutRecord] = await db.transaction(async (tx) => {
        const [createdPayout] = await tx
          .insert(vendorPayouts)
          .values({
            vendorId: input.vendorId,
            amountPaisa: computedAmountPaisa,
            payoutFeePaisa,
            periodStart,
            periodEnd,
            paymentMethod: input.paymentMethod,
            paymentReference: input.paymentReference,
            status: "completed",
            processedAt,
            processedBy: adminUserId,
            notes: input.notes || null,
          })
          .returning({
            id: vendorPayouts.id,
          });
        if (!createdPayout) {
          throw new Error("Failed to create payout record");
        }

        const ledgerRows: Array<typeof transactions.$inferInsert> = [
          {
            vendorId: input.vendorId,
            payoutId: createdPayout.id,
            type: "payout",
            amountPaisa: -computedAmountPaisa,
            status: "cleared",
            description: "Vendor payout",
            referenceType: "payout",
            referenceId: createdPayout.id,
          },
        ];

        if (payoutFeePaisa > 0) {
          ledgerRows.push({
            vendorId: input.vendorId,
            payoutId: createdPayout.id,
            type: "payout_fee",
            amountPaisa: -payoutFeePaisa,
            status: "cleared",
            description: "Payout processing fee",
            referenceType: "payout",
            referenceId: createdPayout.id,
          });
        }

        await tx.insert(transactions).values(ledgerRows);

        return [createdPayout] as const;
      });

      if (!payoutRecord) {
        return c.json({ error: "Failed to create payout record" }, 500);
      }

      // Log action
      await logAdminAction(adminUserId, "process_payout", "vendor_payout", payoutRecord.id, {
        vendorId: input.vendorId,
        amountPaisa: computedAmountPaisa,
        payoutFeePaisa,
        totalDebit,
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
      });

      return c.json(
        {
          message: "Payout processed successfully",
          amountPaisa: computedAmountPaisa,
          payoutFeePaisa,
          totalDebitPaisa: totalDebit,
        },
        200,
      );
    },
  )

  // GET /payouts/history - Payout history
  .get(
    "/payouts/history",
    describeRoute({
      tags: ["Admin - Payouts"],
      summary: "Get payout history",
      description: "Returns paginated list of completed payouts",
      responses: {
        200: {
          description: "Payout history",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    zValidator("query", adminPayoutHistoryQuerySchema),
    async (c) => {
      const query = c.req.valid("query");
      const offset = (query.page - 1) * query.limit;

      const whereClause = query.vendorId ? eq(vendorPayouts.vendorId, query.vendorId) : undefined;

      // Get total count and paginated results
      const [totalResult, items] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(vendorPayouts)
          .where(whereClause),
        db
          .select({
            id: vendorPayouts.id,
            vendorId: vendorPayouts.vendorId,
            vendorName: vendors.name,
            amountPaisa: vendorPayouts.amountPaisa,
            payoutFeePaisa: vendorPayouts.payoutFeePaisa,
            paymentMethod: vendorPayouts.paymentMethod,
            paymentReference: vendorPayouts.paymentReference,
            status: vendorPayouts.status,
            processedAt: vendorPayouts.processedAt,
            processedBy: vendorPayouts.processedBy,
            processedByName: user.name,
            periodStart: vendorPayouts.periodStart,
            periodEnd: vendorPayouts.periodEnd,
            notes: vendorPayouts.notes,
            createdAt: vendorPayouts.createdAt,
          })
          .from(vendorPayouts)
          .leftJoin(vendors, eq(vendorPayouts.vendorId, vendors.id))
          .leftJoin(user, eq(vendorPayouts.processedBy, user.id))
          .where(whereClause)
          .orderBy(desc(vendorPayouts.createdAt))
          .limit(query.limit)
          .offset(offset),
      ]);

      const total = totalResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / query.limit);

      const response: AdminPayoutHistoryResponseDTO = {
        payouts: items.map((item) => ({
          id: item.id,
          vendorId: item.vendorId,
          vendorName: item.vendorName || "Unknown",
          amountPaisa: item.amountPaisa,
          payoutFeePaisa: item.payoutFeePaisa,
          paymentMethod: item.paymentMethod,
          paymentReference: item.paymentReference,
          status: item.status,
          processedAt: item.processedAt?.toISOString() || null,
          processedBy: item.processedBy,
          processedByName: item.processedByName || "Unknown",
          periodStart: item.periodStart.toISOString(),
          periodEnd: item.periodEnd.toISOString(),
          notes: item.notes,
          createdAt: item.createdAt.toISOString(),
        })),
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
      };

      return c.json(response, 200);
    },
  )

  // =====================
  // Banner Management
  // =====================

  // GET /banners - All banners
  .get(
    "/banners",
    describeRoute({
      tags: ["Admin - Banners"],
      summary: "List all banners",
      description: "Returns all banners ordered by sortOrder",
      responses: {
        200: {
          description: "Banners list",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    async (c) => {
      const items = await db
        .select()
        .from(banners)
        .orderBy(asc(banners.sortOrder), desc(banners.createdAt));

      const response: AdminBannerListItemDTO[] = items.map((item) => ({
        id: item.id,
        titleEn: item.titleEn,
        titleBn: item.titleBn,
        subtitleEn: item.subtitleEn,
        subtitleBn: item.subtitleBn,
        priceLabel: item.priceLabel,
        badgeText: item.badgeText,
        badgeColor: item.badgeColor,
        ctaText: item.ctaText,
        discountPercentage: item.discountPercentage,
        imageUrl: item.s3Key ? getS3Url(item.s3Key) : item.imageUrl,
        s3Key: item.s3Key,
        linkUrl: item.linkUrl,
        placement: item.placement,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
        startsAt: item.startsAt?.toISOString() || null,
        endsAt: item.endsAt?.toISOString() || null,
        createdAt: item.createdAt.toISOString(),
      }));

      return c.json(response, 200);
    },
  )

  // GET /banners/hero - Hero carousel banners only
  .get(
    "/banners/hero",
    describeRoute({
      tags: ["Admin - Banners"],
      summary: "List hero carousel banners",
      description: "Returns hero carousel banners ordered by sortOrder",
      responses: {
        200: {
          description: "Hero banner list",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    async (c) => {
      const items = await db
        .select()
        .from(banners)
        .where(eq(banners.placement, "hero_carousel"))
        .orderBy(asc(banners.sortOrder), desc(banners.createdAt));

      const response: AdminHeroBannerListItemDTO[] = items.map((item) => ({
        id: item.id,
        imageUrl: item.s3Key ? getS3Url(item.s3Key) : item.imageUrl,
        s3Key: item.s3Key,
        linkUrl: item.linkUrl || "/",
        altText: item.titleEn || "Hero Banner",
        isActive: item.isActive,
        sortOrder: item.sortOrder,
        startsAt: item.startsAt?.toISOString() || null,
        endsAt: item.endsAt?.toISOString() || null,
        createdAt: item.createdAt.toISOString(),
        status: getHeroBannerStatus({
          isActive: item.isActive,
          startsAt: item.startsAt,
          endsAt: item.endsAt,
        }),
      }));

      return c.json(response, 200);
    },
  )

  // POST /banners/hero - Create hero carousel banner
  .post(
    "/banners/hero",
    describeRoute({
      tags: ["Admin - Banners"],
      summary: "Create hero banner",
      description: "Create a hero carousel banner",
      responses: {
        201: {
          description: "Hero banner created successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminHeroBannerFormSchema),
    async (c) => {
      const adminUserId = c.var.adminUserId;
      const input = c.req.valid("json");

      if (input.startsAt && input.endsAt) {
        const start = new Date(input.startsAt);
        const end = new Date(input.endsAt);
        if (end <= start) {
          return c.json({ error: "End date must be after start date" }, 400);
        }
      }

      const altText = input.altText?.trim() || "Hero Banner";

      const [newBanner] = await db
        .insert(banners)
        .values({
          titleEn: altText,
          titleBn: null,
          subtitleEn: null,
          subtitleBn: null,
          priceLabel: null,
          badgeText: null,
          badgeColor: null,
          ctaText: null,
          discountPercentage: null,
          imageUrl: getS3Url(input.s3Key),
          s3Key: input.s3Key,
          linkUrl: input.linkUrl,
          placement: "hero_carousel",
          isActive: input.isActive,
          sortOrder: input.sortOrder,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
        })
        .returning({ id: banners.id });

      if (!newBanner) {
        return c.json({ error: "Failed to create hero banner" }, 500);
      }

      await logAdminAction(adminUserId, "create_hero_banner", "banner", newBanner.id, { altText });

      return c.json({ message: "Hero banner created successfully" }, 201);
    },
  )

  // PUT /banners/hero/:bannerId - Update hero carousel banner
  .put(
    "/banners/hero/:bannerId",
    describeRoute({
      tags: ["Admin - Banners"],
      summary: "Update hero banner",
      description: "Update an existing hero carousel banner",
      responses: {
        200: {
          description: "Hero banner updated successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
        404: {
          description: "Hero banner not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminHeroBannerFormSchema),
    async (c) => {
      const bannerId = c.req.param("bannerId");
      const adminUserId = c.var.adminUserId;
      const input = c.req.valid("json");

      const [heroBanner] = await db
        .select()
        .from(banners)
        .where(and(eq(banners.id, bannerId), eq(banners.placement, "hero_carousel")))
        .limit(1);

      if (!heroBanner) {
        return c.json({ error: "Hero banner not found" }, 404);
      }

      if (input.startsAt && input.endsAt) {
        const start = new Date(input.startsAt);
        const end = new Date(input.endsAt);
        if (end <= start) {
          return c.json({ error: "End date must be after start date" }, 400);
        }
      }

      if (heroBanner.s3Key && input.s3Key !== heroBanner.s3Key) {
        deleteFile(heroBanner.s3Key).catch((err) =>
          console.error("Failed to delete old hero banner image:", err),
        );
      }

      const altText = input.altText?.trim() || "Hero Banner";

      await db
        .update(banners)
        .set({
          titleEn: altText,
          titleBn: null,
          subtitleEn: null,
          subtitleBn: null,
          priceLabel: null,
          badgeText: null,
          badgeColor: null,
          ctaText: null,
          discountPercentage: null,
          imageUrl: getS3Url(input.s3Key),
          s3Key: input.s3Key,
          linkUrl: input.linkUrl,
          placement: "hero_carousel",
          isActive: input.isActive,
          sortOrder: input.sortOrder,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
        })
        .where(eq(banners.id, bannerId));

      await logAdminAction(adminUserId, "update_hero_banner", "banner", bannerId, { altText });

      return c.json({ message: "Hero banner updated successfully" }, 200);
    },
  )

  // GET /banners/side-cards - Promotional side cards (max 3)
  .get(
    "/banners/side-cards",
    describeRoute({
      tags: ["Admin - Banners"],
      summary: "List side cards",
      description: "Returns up to three promotional side cards",
      responses: {
        200: {
          description: "Side cards list",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    async (c) => {
      const items = await db
        .select()
        .from(banners)
        .where(eq(banners.placement, "promotional_card"))
        .orderBy(asc(banners.sortOrder), desc(banners.createdAt))
        .limit(3);

      const response: AdminSideCardListItemDTO[] = items.map((item) => ({
        id: item.id,
        titleEn: item.titleEn,
        titleBn: item.titleBn,
        subtitleEn: item.subtitleEn,
        subtitleBn: item.subtitleBn,
        imageUrl: item.s3Key ? getS3Url(item.s3Key) : item.imageUrl,
        s3Key: item.s3Key,
        linkUrl: item.linkUrl,
        discountPercentage: item.discountPercentage,
        badgeText: item.badgeText,
        badgeColor: item.badgeColor,
        isActive: item.isActive,
        sortOrder: item.sortOrder,
        createdAt: item.createdAt.toISOString(),
      }));

      return c.json(response, 200);
    },
  )

  // POST /banners/side-cards - Create promotional side card
  .post(
    "/banners/side-cards",
    describeRoute({
      tags: ["Admin - Banners"],
      summary: "Create side card",
      description: "Create a promotional side card (maximum 3)",
      responses: {
        201: {
          description: "Side card created successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminSideCardFormSchema),
    async (c) => {
      const adminUserId = c.var.adminUserId;
      const input = c.req.valid("json");

      const managedSideCardSlots = and(
        eq(banners.placement, "promotional_card"),
        gte(banners.sortOrder, 0),
        lte(banners.sortOrder, 2),
      );

      const [countResult] = await db
        .select({ count: sql<number>`count(distinct ${banners.sortOrder})::int` })
        .from(banners)
        .where(managedSideCardSlots);

      const sideCardCount = countResult?.count ?? 0;
      if (sideCardCount >= 3) {
        return c.json({ error: "Maximum 3 side cards allowed" }, 400);
      }

      const [slotTaken] = await db
        .select({ id: banners.id })
        .from(banners)
        .where(and(managedSideCardSlots, eq(banners.sortOrder, input.sortOrder)))
        .limit(1);

      if (slotTaken) {
        return c.json({ error: "This side card slot is already configured" }, 409);
      }

      const [newBanner] = await db
        .insert(banners)
        .values({
          titleEn: input.titleEn,
          titleBn: input.titleBn || null,
          subtitleEn: input.subtitleEn || null,
          subtitleBn: input.subtitleBn || null,
          priceLabel: null,
          badgeText: input.badgeText || null,
          badgeColor: input.badgeColor || null,
          ctaText: null,
          discountPercentage: input.discountPercentage || null,
          imageUrl: getS3Url(input.s3Key),
          s3Key: input.s3Key,
          linkUrl: input.linkUrl || null,
          placement: "promotional_card",
          isActive: input.isActive,
          sortOrder: input.sortOrder,
          startsAt: null,
          endsAt: null,
        })
        .returning({ id: banners.id });

      if (!newBanner) {
        return c.json({ error: "Failed to create side card" }, 500);
      }

      await logAdminAction(adminUserId, "create_side_card", "banner", newBanner.id, {
        titleEn: input.titleEn,
        sortOrder: input.sortOrder,
      });

      return c.json({ message: "Side card created successfully" }, 201);
    },
  )

  // PUT /banners/side-cards/:bannerId - Update promotional side card
  .put(
    "/banners/side-cards/:bannerId",
    describeRoute({
      tags: ["Admin - Banners"],
      summary: "Update side card",
      description: "Update an existing promotional side card",
      responses: {
        200: {
          description: "Side card updated successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
        404: {
          description: "Side card not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminSideCardFormSchema),
    async (c) => {
      const bannerId = c.req.param("bannerId");
      const adminUserId = c.var.adminUserId;
      const input = c.req.valid("json");

      const [sideCard] = await db
        .select()
        .from(banners)
        .where(and(eq(banners.id, bannerId), eq(banners.placement, "promotional_card")))
        .limit(1);

      if (!sideCard) {
        return c.json({ error: "Side card not found" }, 404);
      }

      const slots = await db
        .select({
          id: banners.id,
          sortOrder: banners.sortOrder,
        })
        .from(banners)
        .where(eq(banners.placement, "promotional_card"));

      const isSlotTaken = slots.some(
        (item) => item.id !== bannerId && item.sortOrder === input.sortOrder,
      );
      if (isSlotTaken) {
        return c.json({ error: "This side card slot is already configured" }, 409);
      }

      if (sideCard.s3Key && input.s3Key !== sideCard.s3Key) {
        deleteFile(sideCard.s3Key).catch((err) =>
          console.error("Failed to delete old side card image:", err),
        );
      }

      await db
        .update(banners)
        .set({
          titleEn: input.titleEn,
          titleBn: input.titleBn || null,
          subtitleEn: input.subtitleEn || null,
          subtitleBn: input.subtitleBn || null,
          priceLabel: null,
          badgeText: input.badgeText || null,
          badgeColor: input.badgeColor || null,
          ctaText: null,
          discountPercentage: input.discountPercentage || null,
          imageUrl: getS3Url(input.s3Key),
          s3Key: input.s3Key,
          linkUrl: input.linkUrl || null,
          placement: "promotional_card",
          isActive: input.isActive,
          sortOrder: input.sortOrder,
          startsAt: null,
          endsAt: null,
        })
        .where(eq(banners.id, bannerId));

      await logAdminAction(adminUserId, "update_side_card", "banner", bannerId, {
        titleEn: input.titleEn,
        sortOrder: input.sortOrder,
      });

      return c.json({ message: "Side card updated successfully" }, 200);
    },
  )

  // POST /banners - Create banner
  .post(
    "/banners",
    describeRoute({
      tags: ["Admin - Banners"],
      summary: "Create banner",
      description: "Create a new banner",
      responses: {
        201: {
          description: "Banner created successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminBannerFormSchema),
    async (c) => {
      const adminUserId = c.var.adminUserId;
      const input = c.req.valid("json");

      // Validate dates
      if (input.startsAt && input.endsAt) {
        const start = new Date(input.startsAt);
        const end = new Date(input.endsAt);
        if (end <= start) {
          return c.json({ error: "End date must be after start date" }, 400);
        }
      }

      const [newBanner] = await db
        .insert(banners)
        .values({
          titleEn: input.titleEn,
          titleBn: input.titleBn || null,
          subtitleEn: input.subtitleEn || null,
          subtitleBn: input.subtitleBn || null,
          priceLabel: input.priceLabel || null,
          badgeText: input.badgeText || null,
          badgeColor: input.badgeColor || null,
          ctaText: input.ctaText || null,
          discountPercentage: input.discountPercentage || null,
          imageUrl: getS3Url(input.s3Key),
          s3Key: input.s3Key,
          linkUrl: input.linkUrl || null,
          placement: input.placement,
          isActive: input.isActive,
          sortOrder: input.sortOrder,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
        })
        .returning({ id: banners.id });

      if (!newBanner) {
        return c.json({ error: "Failed to create banner" }, 500);
      }

      // Log action
      await logAdminAction(adminUserId, "create_banner", "banner", newBanner.id, {
        titleEn: input.titleEn,
      });

      return c.json({ message: "Banner created successfully" }, 201);
    },
  )

  // PUT /banners/:bannerId - Update banner
  .put(
    "/banners/:bannerId",
    describeRoute({
      tags: ["Admin - Banners"],
      summary: "Update banner",
      description: "Update an existing banner",
      responses: {
        200: {
          description: "Banner updated successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
        404: {
          description: "Banner not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminBannerFormSchema),
    async (c) => {
      const bannerId = c.req.param("bannerId");
      const adminUserId = c.var.adminUserId;
      const input = c.req.valid("json");

      const [banner] = await db.select().from(banners).where(eq(banners.id, bannerId)).limit(1);

      if (!banner) {
        return c.json({ error: "Banner not found" }, 404);
      }

      // Validate dates
      if (input.startsAt && input.endsAt) {
        const start = new Date(input.startsAt);
        const end = new Date(input.endsAt);
        if (end <= start) {
          return c.json({ error: "End date must be after start date" }, 400);
        }
      }

      // If image changed, delete old S3 file
      if (banner.s3Key && input.s3Key !== banner.s3Key) {
        deleteFile(banner.s3Key).catch((err) =>
          console.error("Failed to delete old banner image:", err),
        );
      }

      await db
        .update(banners)
        .set({
          titleEn: input.titleEn,
          titleBn: input.titleBn || null,
          subtitleEn: input.subtitleEn || null,
          subtitleBn: input.subtitleBn || null,
          priceLabel: input.priceLabel || null,
          badgeText: input.badgeText || null,
          badgeColor: input.badgeColor || null,
          ctaText: input.ctaText || null,
          discountPercentage: input.discountPercentage || null,
          imageUrl: getS3Url(input.s3Key),
          s3Key: input.s3Key,
          linkUrl: input.linkUrl || null,
          placement: input.placement,
          isActive: input.isActive,
          sortOrder: input.sortOrder,
          startsAt: input.startsAt ? new Date(input.startsAt) : null,
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
        })
        .where(eq(banners.id, bannerId));

      // Log action
      await logAdminAction(adminUserId, "update_banner", "banner", bannerId, {
        titleEn: input.titleEn,
      });

      return c.json({ message: "Banner updated successfully" }, 200);
    },
  )

  // DELETE /banners/:bannerId - Delete banner
  .delete(
    "/banners/:bannerId",
    describeRoute({
      tags: ["Admin - Banners"],
      summary: "Delete banner",
      description: "Delete a banner",
      responses: {
        200: {
          description: "Banner deleted successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
        404: {
          description: "Banner not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const bannerId = c.req.param("bannerId");
      const adminUserId = c.var.adminUserId;

      const [banner] = await db
        .select({ id: banners.id, s3Key: banners.s3Key, titleEn: banners.titleEn })
        .from(banners)
        .where(eq(banners.id, bannerId))
        .limit(1);

      if (!banner) {
        return c.json({ error: "Banner not found" }, 404);
      }

      // Delete S3 file (fire-and-forget, don't block response)
      if (banner.s3Key) {
        deleteFile(banner.s3Key).catch((err) =>
          console.error("Failed to delete banner S3 file:", err),
        );
      }

      await db.delete(banners).where(eq(banners.id, bannerId));

      // Log action
      await logAdminAction(adminUserId, "delete_banner", "banner", bannerId, {
        titleEn: banner.titleEn,
      });

      return c.json({ message: "Banner deleted successfully" }, 200);
    },
  )

  // PATCH /banners/reorder - Batch update sort order
  .patch(
    "/banners/reorder",
    describeRoute({
      tags: ["Admin - Banners"],
      summary: "Reorder banners",
      description: "Batch update banner sort orders",
      responses: {
        200: {
          description: "Banners reordered successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminBannerReorderSchema),
    async (c) => {
      const { banners: bannerUpdates } = c.req.valid("json");

      // Update each banner's sort order
      await Promise.all(
        bannerUpdates.map((update) =>
          db.update(banners).set({ sortOrder: update.sortOrder }).where(eq(banners.id, update.id)),
        ),
      );

      return c.json({ message: "Banners reordered successfully" }, 200);
    },
  )

  // =====================
  // Site Settings
  // =====================

  // GET /top-bar-announcement - Top bar announcement setting (compat alias)
  .get(
    "/top-bar-announcement",
    describeRoute({
      tags: ["Admin - Site Settings"],
      summary: "Get top bar announcement setting",
      description: "Returns the current top bar announcement text shown on the storefront header.",
      responses: {
        200: {
          description: "Top bar announcement setting",
          content: {
            "application/json": {
              schema: resolver(topBarAnnouncementSchema),
            },
          },
        },
      },
    }),
    async (c) => {
      const [setting] = await db
        .select({ value: siteSettings.value })
        .from(siteSettings)
        .where(eq(siteSettings.key, TOP_BAR_ANNOUNCEMENT_SETTING_KEY))
        .limit(1);

      if (!setting) {
        return c.json(DEFAULT_TOP_BAR_ANNOUNCEMENT, 200);
      }

      return c.json(parseTopBarAnnouncement(setting.value), 200);
    },
  )

  // PUT /top-bar-announcement - Update top bar announcement setting (compat alias)
  .put(
    "/top-bar-announcement",
    describeRoute({
      tags: ["Admin - Site Settings"],
      summary: "Update top bar announcement setting",
      description:
        "Updates the storefront top bar announcement text. Supports plain text and emoji.",
      responses: {
        200: {
          description: "Top bar announcement updated",
          content: {
            "application/json": {
              schema: resolver(topBarAnnouncementSchema),
            },
          },
        },
      },
    }),
    zValidator("json", adminTopBarAnnouncementUpdateSchema),
    async (c) => {
      const adminUserId = c.var.adminUserId;
      const input = c.req.valid("json");

      const payload: TopBarAnnouncementDTO = {
        textEn: input.textEn.trim(),
        textBn: input.textBn?.trim() ? input.textBn.trim() : null,
        isActive: input.isActive,
      };

      await db
        .insert(siteSettings)
        .values({
          key: TOP_BAR_ANNOUNCEMENT_SETTING_KEY,
          value: payload,
          updatedBy: adminUserId,
        })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: {
            value: payload,
            updatedBy: adminUserId,
            updatedAt: new Date(),
          },
        });

      await logAdminAction(
        adminUserId,
        "update_top_bar_announcement",
        "site_setting",
        TOP_BAR_ANNOUNCEMENT_SETTING_KEY,
        payload,
      );

      return c.json(payload, 200);
    },
  )

  // GET /settings/top-bar-announcement - Top bar announcement setting
  .get(
    "/settings/top-bar-announcement",
    describeRoute({
      tags: ["Admin - Site Settings"],
      summary: "Get top bar announcement setting",
      description: "Returns the current top bar announcement text shown on the storefront header.",
      responses: {
        200: {
          description: "Top bar announcement setting",
          content: {
            "application/json": {
              schema: resolver(topBarAnnouncementSchema),
            },
          },
        },
      },
    }),
    async (c) => {
      const [setting] = await db
        .select({ value: siteSettings.value })
        .from(siteSettings)
        .where(eq(siteSettings.key, TOP_BAR_ANNOUNCEMENT_SETTING_KEY))
        .limit(1);

      if (!setting) {
        return c.json(DEFAULT_TOP_BAR_ANNOUNCEMENT, 200);
      }

      return c.json(parseTopBarAnnouncement(setting.value), 200);
    },
  )

  // PUT /settings/top-bar-announcement - Update top bar announcement setting
  .put(
    "/settings/top-bar-announcement",
    describeRoute({
      tags: ["Admin - Site Settings"],
      summary: "Update top bar announcement setting",
      description:
        "Updates the storefront top bar announcement text. Supports plain text and emoji.",
      responses: {
        200: {
          description: "Top bar announcement updated",
          content: {
            "application/json": {
              schema: resolver(topBarAnnouncementSchema),
            },
          },
        },
      },
    }),
    zValidator("json", adminTopBarAnnouncementUpdateSchema),
    async (c) => {
      const adminUserId = c.var.adminUserId;
      const input = c.req.valid("json");

      const payload: TopBarAnnouncementDTO = {
        textEn: input.textEn.trim(),
        textBn: input.textBn?.trim() ? input.textBn.trim() : null,
        isActive: input.isActive,
      };

      await db
        .insert(siteSettings)
        .values({
          key: TOP_BAR_ANNOUNCEMENT_SETTING_KEY,
          value: payload,
          updatedBy: adminUserId,
        })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: {
            value: payload,
            updatedBy: adminUserId,
            updatedAt: new Date(),
          },
        });

      await logAdminAction(
        adminUserId,
        "update_top_bar_announcement",
        "site_setting",
        TOP_BAR_ANNOUNCEMENT_SETTING_KEY,
        payload,
      );

      return c.json(payload, 200);
    },
  )

  // =====================
  // Category Management
  // =====================

  // GET /categories - All categories with product counts
  .get(
    "/categories",
    describeRoute({
      tags: ["Admin - Categories"],
      summary: "List all categories",
      description: "Returns all categories with product counts",
      responses: {
        200: {
          description: "Categories list",
          content: {
            "application/json": { schema: resolver(z.any()) },
          },
        },
      },
    }),
    async (c) => {
      const items = await db
        .select({
          id: categories.id,
          name: categories.name,
          nameBn: categories.nameBn,
          slug: categories.slug,
          parentId: categories.parentId,
          iconKey: categories.iconKey,
          sortOrder: categories.sortOrder,
          isFeatured: categories.isFeatured,
          isPopular: categories.isPopular,
          createdAt: categories.createdAt,
          // Product count
          productCount: sql<number>`(
						SELECT COUNT(*)::int
						FROM ${products}
						WHERE ${products.categoryId} = ${categories.id}
					)`,
        })
        .from(categories)
        .orderBy(asc(categories.sortOrder), asc(categories.name));

      const response: AdminCategoryListItemDTO[] = items.map((item) => ({
        id: item.id,
        name: item.name,
        nameBn: item.nameBn,
        slug: item.slug,
        parentId: item.parentId,
        iconKey: item.iconKey,
        sortOrder: item.sortOrder,
        isFeatured: item.isFeatured,
        isPopular: item.isPopular,
        productCount: item.productCount,
        createdAt: item.createdAt.toISOString(),
      }));

      return c.json(response, 200);
    },
  )

  // POST /categories - Create category
  .post(
    "/categories",
    describeRoute({
      tags: ["Admin - Categories"],
      summary: "Create category",
      description: "Create a new category",
      responses: {
        201: {
          description: "Category created successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminCategoryFormSchema),
    async (c) => {
      const adminUserId = c.var.adminUserId;
      const input = c.req.valid("json");

      const [newCategory] = await db
        .insert(categories)
        .values({
          name: input.name,
          nameBn: input.nameBn || null,
          slug: input.slug,
          parentId: input.parentId || null,
          iconKey: input.iconKey || null,
          sortOrder: input.sortOrder,
          isFeatured: input.isFeatured,
          isPopular: input.isPopular,
        })
        .returning({ id: categories.id });

      if (!newCategory) {
        return c.json({ error: "Failed to create category" }, 500);
      }

      // Log action
      await logAdminAction(adminUserId, "create_category", "category", newCategory.id, {
        name: input.name,
      });

      return c.json({ message: "Category created successfully" }, 201);
    },
  )

  // PUT /categories/:categoryId - Update category
  .put(
    "/categories/:categoryId",
    describeRoute({
      tags: ["Admin - Categories"],
      summary: "Update category",
      description: "Update an existing category",
      responses: {
        200: {
          description: "Category updated successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
        404: {
          description: "Category not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    zValidator("json", adminCategoryFormSchema),
    async (c) => {
      const categoryId = c.req.param("categoryId");
      const adminUserId = c.var.adminUserId;
      const input = c.req.valid("json");

      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1);

      if (!category) {
        return c.json({ error: "Category not found" }, 404);
      }

      await db
        .update(categories)
        .set({
          name: input.name,
          nameBn: input.nameBn || null,
          slug: input.slug,
          parentId: input.parentId || null,
          iconKey: input.iconKey || null,
          sortOrder: input.sortOrder,
          isFeatured: input.isFeatured,
          isPopular: input.isPopular,
        })
        .where(eq(categories.id, categoryId));

      // Log action
      await logAdminAction(adminUserId, "update_category", "category", categoryId, {
        name: input.name,
      });

      return c.json({ message: "Category updated successfully" }, 200);
    },
  )

  // DELETE /categories/:categoryId - Delete category
  .delete(
    "/categories/:categoryId",
    describeRoute({
      tags: ["Admin - Categories"],
      summary: "Delete category",
      description: "Delete a category (prevented if products reference it)",
      responses: {
        200: {
          description: "Category deleted successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ message: z.string() })),
            },
          },
        },
        404: {
          description: "Category not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
        400: {
          description: "Cannot delete category with products",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() })),
            },
          },
        },
      },
    }),
    async (c) => {
      const categoryId = c.req.param("categoryId");
      const adminUserId = c.var.adminUserId;

      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1);

      if (!category) {
        return c.json({ error: "Category not found" }, 404);
      }

      // Check if products reference this category
      const [productCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(products)
        .where(eq(products.categoryId, categoryId));

      const count = productCount?.count ?? 0;
      if (count > 0) {
        return c.json(
          {
            error: `Cannot delete category with ${count} product(s)`,
          },
          400,
        );
      }

      await db.delete(categories).where(eq(categories.id, categoryId));

      // Log action
      await logAdminAction(adminUserId, "delete_category", "category", categoryId, {
        name: category.name,
      });

      return c.json({ message: "Category deleted successfully" }, 200);
    },
  );

// =====================
// Brand Management (Note: brands table doesn't exist yet - for future)
// =====================
// These endpoints are placeholder and will need a brands table schema

// Export router type for RPC
export type AdminRouterType = typeof adminRouter;
