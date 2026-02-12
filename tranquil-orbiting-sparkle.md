# Multi-Role Authentication Architecture for KineDao.com

## Context

KineDao.com currently has three user types (customer, vendor, admin) but lacks a unified system for handling users with multiple roles. Key problems:

- **No role information in user table**: Role checks require separate DB queries to `adminUsers` and `vendor_applications` tables
- **Frontend can't detect roles**: Routes can't guard themselves until API calls fail
- **No admin management**: Only one admin exists (added manually to DB), no invitation system
- **Single-role assumption**: A user cannot be both a customer and a vendor/admin simultaneously
- **No permission levels**: All admins have identical permissions

### Why This Matters

In a marketplace, users legitimately hold multiple roles:
- A vendor who also shops as a customer
- An admin who also sells products
- A customer who later becomes a vendor

Research shows modern e-commerce platforms (Shopify, Etsy) use **unified authentication with role arrays**, providing seamless UX where one login grants access to all user roles.

### Design Decision

**Recommendation**: Implement Pattern A (Unified Authentication + Role Array)

This approach leverages Better Auth's `additionalFields` feature to add a `roles` array to the user table, avoiding complex multi-tenant systems while providing:
- Single login for all roles
- Fast role checks (no DB queries after session load)
- Backward compatibility with existing middleware
- Type-safe end-to-end with Better Auth's type inference

---

## Architecture Overview

### Role System

**Roles stored in user table** as string array:
```typescript
user.roles: ["customer", "vendor", "admin", "super_admin"]
```

**Role definitions**:
- `customer` (default) - Can browse, order, review products
- `vendor` - Access vendor dashboard, manage products/orders
- `admin` - Platform moderation (approve vendors, products, manage orders)
- `super_admin` - Admin + can invite/revoke other admins

**Key principle**: One user, multiple roles, single session.

### Database Changes

**1. Add roles field to user table** (via Better Auth `additionalFields`):
```typescript
// In packages/auth/src/index.ts betterAuth() config:
user: {
  additionalFields: {
    roles: {
      type: "string[]",
      required: true,
      defaultValue: ["customer"],
      input: false, // Security: users cannot set their own roles
    }
  }
}
```

**2. New admin_invitations table** (for admin management):
```typescript
// Location: packages/db/src/schema/admin.ts
export const adminInvitations = pgTable("admin_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().$type<"admin" | "super_admin">(),
  invitedBy: text("invited_by").notNull().references(() => user.id),
  token: text("token").notNull().unique(), // 32-char secure token
  expiresAt: timestamp("expires_at").notNull(), // 7 days
  acceptedAt: timestamp("accepted_at"),
  status: varchar("status", { length: 20 }).default("pending")
    .$type<"pending" | "accepted" | "expired" | "revoked">(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**3. Keep existing tables** (backward compatibility):
- `adminUsers` - Synced with user.roles for quick admin lookup
- `vendor_applications` - Still drives vendor approval workflow
- `admin_audit_log` - Enhanced to log role grants/revokes

---

## Implementation Plan

### Phase 1: Database Schema & Role Service

**Files to create/modify**:

1. **`packages/auth/src/index.ts`** - Add roles field
   - Add `user.additionalFields.roles` config
   - Add `inferAdditionalFields()` plugin for frontend type inference
   - Run Better Auth CLI migration: `bunx @better-auth/cli migrate`

2. **`packages/db/src/schema/admin.ts`** - Add admin_invitations table
   - Create table schema as shown above
   - Export from `packages/db/src/schema/index.ts`
   - Run `bun run db:push` to apply schema

3. **`apps/server/src/lib/role-service.ts`** - NEW centralized role management
   ```typescript
   export type UserRole = "customer" | "vendor" | "admin" | "super_admin";

   // Core functions:
   export async function grantRole(userId: string, role: UserRole)
   export async function revokeRole(userId: string, role: UserRole)
   export function hasRole(userRoles: string[] | null, role: UserRole): boolean
   export function hasAnyRole(userRoles: string[] | null, roles: UserRole[]): boolean
   export async function syncVendorRole(userId: string) // Auto-grant vendor role if approved
   ```

   **Purpose**: All role mutations go through this service, which:
   - Updates `user.roles` array
   - Syncs lookup tables (`adminUsers`, etc.)
   - Maintains consistency across the system

4. **`apps/server/src/scripts/create-first-admin.ts`** - NEW bootstrap script
   ```bash
   # Usage: Set FIRST_ADMIN_EMAIL env var, then:
   bun run apps/server/src/scripts/create-first-admin.ts
   ```

   **Purpose**: Grant `super_admin` role to the first admin (bootstrap problem)

5. **`apps/server/src/scripts/migrate-existing-roles.ts`** - NEW one-time migration
   - Grant `admin` role to existing `adminUsers` records
   - Grant `vendor` role to approved `vendor_applications`
   - Run once after schema migration

**Verification**:
- Check `user.roles` column exists: `SELECT id, email, roles FROM "user" LIMIT 5;`
- Verify first admin: roles should include `"super_admin"`
- Verify existing admins/vendors migrated correctly

---

### Phase 2: Backend Middleware & APIs

**Files to modify/create**:

1. **`apps/server/src/middleware/admin-auth.ts`** - Update to use roles
   ```typescript
   // Before: queries adminUsers table
   // After: checks c.var.user.roles includes "admin" or "super_admin"

   if (!hasAnyRole(user.roles, ["admin", "super_admin"])) {
     return c.json({ error: "Not an admin user" }, 403);
   }

   c.set("adminUserId", user.id);
   c.set("isSuperAdmin", hasRole(user.roles, "super_admin"));
   ```

2. **`apps/server/src/middleware/vendor-auth.ts`** - Update to check roles + sync
   ```typescript
   // Check if user has vendor role
   if (!hasRole(user.roles, "vendor")) {
     // Try to sync from vendor_applications (approved but role not granted)
     await syncVendorRole(user.id);

     // Re-check after sync
     const [updatedUser] = await db.select({ roles: user.roles })
       .from(user).where(eq(user.id, user.id)).limit(1);

     if (!hasRole(updatedUser?.roles, "vendor")) {
       return c.json({ error: "Not an approved vendor" }, 403);
     }
   }

   // Existing logic to get/create vendor record...
   ```

3. **`apps/server/src/routes/admin-management.ts`** - NEW admin management API
   - `POST /api/admin-management/invite` - Send admin invitation (super_admin only)
   - `POST /api/admin-management/accept-invite` - Accept invitation (authenticated user)
   - `GET /api/admin-management/admins` - List all admins
   - `DELETE /api/admin-management/admins/:userId` - Revoke admin access (super_admin only)

   **Key features**:
   - Email validation (invited email must match logged-in user)
   - Token security (32-char nanoid, 7-day expiry, one-time use)
   - Audit logging (all actions logged)
   - Permission checks (only super_admins can manage admins)

4. **`apps/server/src/routes/admin.ts`** - Update vendor approval hook
   ```typescript
   // In PATCH /vendors/:vendorId/status endpoint
   if (status === "approved") {
     // Existing approval logic...

     // Auto-grant vendor role
     await grantRole(application.userId, "vendor");

     await logAdminAction(c.var.adminUserId, "approve_vendor", ...);
   }
   ```

5. **`apps/server/src/index.ts`** - Mount new router
   ```typescript
   import { adminManagementRouter } from "./routes/admin-management";

   const app = new Hono()
     // ... existing routes
     .route("/api/admin-management", adminManagementRouter);
   ```

6. **`packages/api-types/src/admin-management.ts`** - NEW type definitions
   - Zod schemas for invite/accept requests
   - Response DTOs (AdminInviteResponseDTO, AdminListResponseDTO, etc.)

**Verification**:
- Test admin middleware with user who has `["customer", "admin"]` roles
- Test vendor middleware auto-syncs role when vendor_applications.status = "approved"
- Test admin invite flow with Postman/Hoppscotch

---

### Phase 3: Frontend Route Guards & Role Detection

**Files to create/modify**:

1. **`apps/web/src/hooks/use-user-roles.ts`** - NEW role detection hook
   ```typescript
   export function useUserRoles() {
     const { data: session, isLoading } = useQuery({
       queryKey: ["session"],
       queryFn: async () => {
         const session = await authClient.session();
         return session.data;
       },
       staleTime: 5 * 60 * 1000,
     });

     const user = session?.user as UserWithRoles | null;
     const roles = user?.roles ?? ["customer"];

     return {
       user,
       roles,
       hasRole: (role: UserRole) => roles.includes(role),
       isVendor: roles.includes("vendor"),
       isAdmin: roles.includes("admin") || roles.includes("super_admin"),
       isSuperAdmin: roles.includes("super_admin"),
     };
   }
   ```

2. **`apps/web/src/components/auth/role-switcher.tsx`** - NEW role switcher UI
   - Shows buttons for each role user has (Vendor Dashboard, Admin Dashboard, Shop)
   - Only visible if user has 2+ roles
   - Located in dashboard headers

3. **`apps/web/src/routes/vendor/_dashboard.tsx`** - Update route guard
   ```typescript
   beforeLoad: async () => {
     const session = await getUser();
     if (!session) {
       throw redirect({ to: "/login", search: { redirect: "/vendor/dashboard" } });
     }

     // Fast role check (no DB query!)
     const roles = session.user.roles || [];
     if (!roles.includes("vendor")) {
       // No vendor role, check application status
       const statusResponse = await api.vendor.application.status.$get();
       // Redirect to /vendor/apply if not approved
     }

     return { session };
   }
   ```

4. **`apps/web/src/routes/admin/_layout.tsx`** - Update route guard
   ```typescript
   beforeLoad: async ({ location }) => {
     const session = await getUser();
     if (!session) {
       throw redirect({ to: "/login", search: { redirect: location.href } });
     }

     // Fast role check
     const roles = session.user.roles || [];
     if (!roles.includes("admin") && !roles.includes("super_admin")) {
       throw redirect({ to: "/", search: { error: "access_denied" } });
     }

     return { session };
   },
   loader: async ({ context }) => {
     const isSuperAdmin = context.session.user.roles?.includes("super_admin");
     return { isSuperAdmin };
   }
   ```

5. **`apps/web/src/components/vendor-dashboard/vendor-dashboard-layout.tsx`**
   - Add `<RoleSwitcher />` to header (top-right, before theme toggle)

6. **`apps/web/src/components/admin/admin-dashboard-layout.tsx`**
   - Add `<RoleSwitcher />` to header
   - Conditionally show "Admin Management" nav link only for super_admins

**Verification**:
- Login as user with `["customer", "vendor"]` roles
- Verify role switcher appears in vendor dashboard header
- Click "Shop" button, verify navigation to homepage
- Test route guards block unauthorized access (non-admin trying to access /admin)

---

### Phase 4: Admin Management UI

**Files to create**:

1. **`apps/web/src/routes/admin/_layout/admins.tsx`** - Admin management page
   - **Guard**: Only super_admins can access (check in beforeLoad)
   - **UI Components**:
     - Table of current admins (name, email, roles, created date)
     - "Invite Admin" button → opens modal
     - "Revoke Access" button per admin (with confirmation dialog)
   - **Loader**: Fetch admins via `api.adminManagement.admins.$get()`

2. **`apps/web/src/routes/admin/accept-invite.tsx`** - Invitation acceptance page
   - **Public route** (no auth required)
   - **Search param**: `?token=xxx`
   - **Logic**:
     - If user is logged in: Show "Accept Invite" button
     - If not logged in: Show "Sign in to accept" / "Create account to accept" buttons
     - After accept: Redirect to /admin/dashboard

3. **`apps/web/src/components/admin/admin-invite-modal.tsx`** - Invite modal component
   - Form fields: Email input, Role selector (admin/super_admin radio buttons)
   - Validation: Email format, role selection required
   - Submit: Call `api.adminManagement.invite.$post({ json: { email, role } })`
   - Success: Show toast, refresh admin list

4. **`apps/web/src/components/admin/admin-list-table.tsx`** - Admin table component
   - Mantine Table with columns: Name, Email, Roles, Created Date, Actions
   - Actions column: "Revoke Access" button (disabled for current user)
   - Confirmation dialog before revoke

**Verification**:
- Login as super_admin, navigate to /admin/admins
- Click "Invite Admin", enter email and role, send invite
- Check email for invitation link
- Open invite link in incognito window (not logged in)
- Sign up with invited email
- Click "Accept Invitation"
- Verify redirected to /admin/dashboard
- Verify new admin appears in admin list

---

## Key Features & Workflows

### 1. Same Email, Multiple Roles

**Scenario**: User creates account as customer, later becomes vendor

**Flow**:
1. User signs up → `user.roles = ["customer"]`
2. User applies to become vendor → vendor application created
3. Admin approves application → `grantRole(userId, "vendor")` → `user.roles = ["customer", "vendor"]`
4. User logs in → session includes both roles
5. User sees role switcher in header → can toggle between shopping and vendor dashboard

**Implementation**: Automatic via vendor approval hook in admin routes

---

### 2. Admin Invitation & Management

**Scenario**: First super_admin wants to add a new moderator admin

**Flow**:
1. Super_admin navigates to /admin/admins
2. Clicks "Invite Admin", enters email and selects "admin" role
3. Backend creates invitation record, generates secure token, sends email
4. Invitee clicks email link → /admin/accept-invite?token=xxx
5. If not logged in → redirected to /login with redirect param
6. After login, clicks "Accept Invite"
7. Backend validates token, grants role via `grantRole(userId, "admin")`
8. Invitee redirected to /admin/dashboard

**Security**:
- Only super_admins can invite
- Tokens expire after 7 days
- One-time use (status updated after acceptance)
- Email must match logged-in user
- All actions logged in admin_audit_log

---

### 3. Vendor Role Auto-Sync

**Scenario**: Vendor application approved but vendor hasn't logged in yet

**Flow**:
1. Admin approves vendor application → `grantRole(userId, "vendor")` called
2. Vendor logs in → session includes `vendor` role automatically
3. Vendor navigates to /vendor/dashboard → route guard checks roles array → passes
4. Middleware ensures vendor record exists (auto-create if missing)

**Fallback**: If vendor has approved application but role not synced (edge case), vendor middleware will detect and sync on first dashboard access

---

### 4. Dashboard Entry Points

**Customer Dashboard**: `/account/*` (orders, profile, addresses)
- No role required (all users are customers)

**Vendor Dashboard**: `/vendor/dashboard`
- Requires `vendor` role
- Redirects to /vendor/apply if not approved

**Admin Dashboard**: `/admin/dashboard`
- Requires `admin` or `super_admin` role
- Redirects to / with error if not authorized

**Role Switcher**: Visible in all dashboards if user has 2+ roles

---

## Security Considerations

### 1. Role Tampering Prevention

**Critical**: `input: false` in Better Auth config prevents users from setting their own roles during signup/update

```typescript
roles: {
  type: "string[]",
  input: false, // ⚠️ Users cannot modify this field!
}
```

All role grants go through backend `role-service.ts` with proper authorization checks.

### 2. Permission Escalation

- Only super_admins can invite new admins
- Users cannot revoke their own admin access (prevents lock-out)
- All admin actions logged in `admin_audit_log` with actor, action, entity

### 3. Token Security

- Admin invitation tokens: 32-character nanoid (cryptographically secure)
- Tokens expire after 7 days
- One-time use (status updated to "accepted" after use)
- Email validation (invited email must match logged-in user email)

### 4. Session Security

- Roles stored in Better Auth session (httpOnly cookie, CSRF protection)
- CORS restricted to frontend origin
- Session refresh re-queries database for current roles (catches revocations)

---

## Migration & Backward Compatibility

### Existing Data Migration

**Script**: `apps/server/src/scripts/migrate-existing-roles.ts`

**Actions**:
1. Query all `adminUsers` records
2. For each: `UPDATE "user" SET roles = array_append(roles, 'admin') WHERE id = ?`
3. Query all approved `vendor_applications`
4. For each: `UPDATE "user" SET roles = array_append(roles, 'vendor') WHERE id = ?`

**Run once**: After Phase 1 database migration

### Backward Compatibility

- Keep `adminUsers` table (synced with roles, used for quick lookups)
- Keep `vendor_applications` table (drives approval workflow)
- Middleware checks roles array first, falls back to table queries if needed
- No breaking changes to existing API routes

---

## Testing Strategy

### Unit Tests

- `role-service.ts`: grantRole, revokeRole, hasRole, syncVendorRole
- Middleware: admin-auth, vendor-auth with various role combinations

### Integration Tests

- Admin invite flow: send invite → accept → verify role granted
- Vendor approval flow: approve application → verify vendor role granted
- Multi-role session: login as customer+vendor, verify both dashboards accessible

### Manual Testing Checklist

- [ ] Create first super_admin via script
- [ ] Login as super_admin, access /admin/dashboard
- [ ] Invite new admin, verify email sent
- [ ] Accept invite, verify admin dashboard accessible
- [ ] Approve vendor application, verify vendor role granted
- [ ] Login as vendor, verify vendor dashboard accessible
- [ ] Login as customer+vendor, verify role switcher appears
- [ ] Switch between roles, verify navigation works
- [ ] Revoke admin access, verify user can no longer access /admin

---

## Critical Files Summary

| File Path | Purpose |
|-----------|---------|
| `packages/auth/src/index.ts` | Add roles field via additionalFields (enables entire system) |
| `packages/db/src/schema/admin.ts` | Add admin_invitations table |
| `apps/server/src/lib/role-service.ts` | Centralized role management (grant/revoke/check) |
| `apps/server/src/routes/admin-management.ts` | Admin invite/revoke API endpoints |
| `apps/server/src/middleware/admin-auth.ts` | Updated to check roles array |
| `apps/server/src/middleware/vendor-auth.ts` | Updated to check roles + auto-sync |
| `apps/web/src/hooks/use-user-roles.ts` | Frontend role detection hook |
| `apps/web/src/components/auth/role-switcher.tsx` | Role switching UI component |
| `apps/web/src/routes/admin/_layout/admins.tsx` | Admin management page |
| `apps/web/src/routes/admin/accept-invite.tsx` | Invitation acceptance page |

---

## Answers to User's Questions

### Q1: How should vendors access the vendor dashboard?

**A**: After their application is approved by an admin, vendors automatically receive the `vendor` role. They can then directly access `/vendor/dashboard`. The route guard checks their roles array (fast, no DB query needed). If they also have other roles (e.g., customer), they see a role switcher to navigate between dashboards.

### Q2: How should admins access the admin dashboard?

**A**: Admins are invited by super admins via email. After accepting the invitation (which grants them the `admin` or `super_admin` role), they can access `/admin/dashboard`. Same role switcher applies if they have multiple roles.

### Q3: What happens if the same email is both a vendor and a customer?

**A**: The user will have `["customer", "vendor"]` in their roles array. They see a role switcher in the header with buttons for "Shop" (customer homepage) and "Vendor Dashboard". Single login, seamless switching, no re-authentication needed.

### Q4: How to manage multiple admins?

**A**:
- **First admin**: Created via `create-first-admin.ts` script (grants `super_admin` role to specified email)
- **Additional admins**: Invited by super admins via /admin/admins page
- **Permission levels**: Two tiers (admin vs super_admin)
- **Audit trail**: All admin actions logged in `admin_audit_log`
- **Revocation**: Super admins can revoke admin access via UI

### Q5: How do platforms like AliExpress handle this?

**A**: Research shows two approaches:
- **AliExpress/Amazon**: Separate portals (seller.aliexpress.com vs aliexpress.com) - worse UX, confusing
- **Shopify/Etsy**: Unified login with role context - better UX, what we're implementing

Modern best practice for marketplaces is unified authentication (Pattern A), which we're adopting.

---

## Implementation Timeline Estimate

- **Phase 1** (Database): 2-4 hours
- **Phase 2** (Backend): 6-8 hours
- **Phase 3** (Frontend Guards): 4-6 hours
- **Phase 4** (Admin UI): 6-8 hours
- **Testing & Polish**: 4-6 hours

**Total**: 22-32 hours (3-4 working days)

---

## Post-Implementation Enhancements (Future)

- **Granular permissions**: Replace role-level checks with permission-based (e.g., "can_approve_products", "can_process_refunds")
- **Multi-level admin hierarchy**: Add more admin roles (moderator, support, content_editor)
- **Organization support**: Use Better Auth's organization plugin for multi-vendor shop management
- **Activity dashboard**: Show recent admin actions in real-time
- **2FA enforcement**: Require 2FA for vendor and admin accounts
