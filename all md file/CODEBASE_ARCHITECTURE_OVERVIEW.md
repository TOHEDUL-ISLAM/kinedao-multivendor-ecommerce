# KineDao.com Codebase Architecture & Tech Stack

_Last updated from current repository scan._

## 1) High-Level Architecture

KineDao is a **Bun monorepo** with:
- **Frontend**: React + TanStack Start (`apps/web`)
- **Backend API**: Hono (`apps/server`)
- **Shared packages**: auth, DB, env, API types (`packages/*`)

---

## 2) Top-Level File/Folder Structure

```text
kineDao.com/
├── apps/
│   ├── web/                     # React frontend (TanStack Start + Vite)
│   │   ├── public/              # Static assets + service worker (sw.js)
│   │   └── src/
│   │       ├── components/      # UI and feature components
│   │       ├── hooks/           # Custom hooks (auth, notifications, i18n)
│   │       ├── lib/             # API client, auth client, helpers
│   │       ├── routes/          # File-based routes (customer/admin/vendor)
│   │       └── stores/          # Zustand client state stores
│   └── server/                  # Hono backend API
│       └── src/
│           ├── routes/          # API route modules
│           ├── lib/             # Business helpers (email, notifications, upload)
│           ├── middleware/      # Role/guard middleware (admin/vendor)
│           ├── scripts/         # Admin/role migration scripts
│           └── index.ts         # Main app + route mounting + auth handler
├── packages/
│   ├── api-types/               # Shared Zod schemas and DTO types
│   ├── auth/                    # Better-Auth setup + nodemailer sender
│   ├── db/                      # Drizzle client + schema + migrations + S3 URL helpers
│   ├── env/                     # Zod-validated env (server/web)
│   └── config/                  # Shared TS config package
├── docs/                        # S3/storage documentation
├── mock/                        # Mock factories/services
├── supabase/                    # Supabase local config files
└── scripts/                     # Repo-level utility scripts
```

---

## 3) Core Tech Stack Used

### Runtime & Monorepo
- **Bun** workspaces (`packageManager: bun`)
- **TypeScript** everywhere

### Frontend (`apps/web`)
- **React 19**
- **TanStack Start + TanStack Router** (file-based routing)
- **Vite** build/dev server
- **Tailwind CSS v4**
- **TanStack Query** for server state
- **Zustand** for client/persisted state
- UI libraries: **Radix UI**, **Mantine**, **Sonner**, etc.

### Backend (`apps/server`)
- **Hono** API framework
- **hono-openapi** + **Scalar** for API docs (`/openapi`, `/docs`)
- **Zod validation** via `@hono/zod-validator`

### Database
- **PostgreSQL**
- **Drizzle ORM** + **drizzle-kit** migrations
- DB schema under `packages/db/src/schema/*`

### Authentication
- **Better-Auth** with Drizzle adapter
- Email/password + email verification + reset password
- Google/Facebook social login configured

### Storage / Uploads
- **Bun S3Client** against S3-compatible storage (configured via env)
- Structured S3 keys, UUID file naming, presigned URLs

---

## 4) Feature Stack Mapping (What is used where)

## Notification System (exact stack)

**Server-side:**
- `apps/server/src/lib/notification-service.ts`
  - Stores notifications in PostgreSQL (`notifications` table)
  - Manages real-time SSE connections (in-memory map)
  - Triggers email + web push channels
- `apps/server/src/routes/notifications.ts`
  - REST endpoints + SSE stream endpoint (`/api/notifications/stream`)
  - Preferences, unread count, mark-as-read, push subscribe/unsubscribe
- `apps/server/src/lib/web-push.ts`
  - Uses **`web-push`** npm package
  - Uses **VAPID keys** (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`)

**Database tables:**
- `notifications`
- `notification_preferences`
- `push_subscriptions`
(in `packages/db/src/schema/notifications.ts`)

**Frontend-side:**
- `apps/web/src/hooks/use-notifications.ts`
  - Uses `EventSource` for SSE + TanStack Query cache invalidation
  - Uses **Sonner** toast for in-app popup notifications
- `apps/web/src/lib/push-notifications.ts`
  - Service worker registration + push subscription flow
- `apps/web/public/sw.js`
  - Browser push event handler + notification click navigation

### Gmail SMTP / Email System (exact stack)

- `packages/auth/src/email.ts` uses **Nodemailer**
- Transport is configured as:
  - `service: "gmail"`
  - auth via `EMAIL_USER` + `EMAIL_PASS`
- This shared sender is used by:
  - Better-Auth verification/reset emails (`packages/auth/src/index.ts`)
  - Order emails (`apps/server/src/lib/order-email.ts`)
  - Notification emails (`apps/server/src/lib/notification-emails.ts`)
  - Admin invite emails (`apps/server/src/routes/admin-management.ts`)

So your SMTP implementation is: **Nodemailer + Gmail SMTP credentials from env**.

### API Typing / Contracts
- Shared typed request/response schemas in `packages/api-types` using **Zod**
- Backend and frontend both consume same DTO/schema definitions

### RBAC / Roles
- Roles: customer, vendor, admin, super_admin
- Role logic in `apps/server/src/lib/role-service.ts`
- Route guards in `apps/server/src/middleware/admin-auth.ts` and `vendor-auth.ts`

### i18n (Bilingual)
- Translation dictionary in `apps/web/src/lib/i18n/translations.ts`
- Hook: `apps/web/src/hooks/use-translation.ts`
- Language state persisted via Zustand (`apps/web/src/stores/language-store.ts`)

---

## 5) Important Entry Points

- Backend app entry: `apps/server/src/index.ts`
- Frontend router setup: `apps/web/src/router.tsx`
- Frontend typed API client: `apps/web/src/lib/api-client.ts`
- Auth config: `packages/auth/src/index.ts`
- Email transport: `packages/auth/src/email.ts`
- DB client: `packages/db/src/index.ts`
- Env schemas: `packages/env/src/server.ts`, `packages/env/src/web.ts`

---

## 6) Quick Summary

You are running a **TypeScript Bun monorepo** with **React/TanStack Start frontend**, **Hono backend**, **Drizzle + PostgreSQL**, **Better-Auth**, **Nodemailer (Gmail SMTP)**, and a **multi-channel notification system** built from **DB notifications + SSE real-time stream + Web Push (VAPID/web-push) + toast UI**.
