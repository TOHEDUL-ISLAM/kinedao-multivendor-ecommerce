# kineDao.com - Development Guide

This document provides context and instructions for the **kineDao.com** project, a multivendor baby products marketplace.

## Project Overview

**kineDao.com** is a 2-week MVP aimed at creating a bilingual (Bangla/English) marketplace for baby products. It features a customer storefront, vendor dashboard, and admin panel.

**Core Features (MVP):**
*   **Storefront:** Browse, search, cart, checkout (COD only).
*   **Vendor:** Dashboard for products, orders, and earnings.
*   **Admin:** Vendor management, product moderation, order oversight.
*   **Auth:** Email, Google/Facebook Social Login (via Better-Auth).
*   **Language:** Bilingual UI (Bangla/English).

## Tech Stack

*   **Runtime/Manager:** Bun
*   **Monorepo Tooling:** Bun Workspaces
*   **Frontend:**
    *   React 19
    *   TanStack Start (SSR)
    *   TanStack Router (File-based routing)
    *   TailwindCSS 4
    *   shadcn/ui (Components)
*   **Backend:** Hono (Lightweight API server)
*   **Database:**
    *   PostgreSQL
    *   Drizzle ORM
*   **Authentication:** Better-Auth (`@kineDao.com/auth`)
*   **Validation:** Zod

## Repository Structure

The project follows a monorepo structure:

```
kineDao.com/
├── apps/
│   ├── web/          # Frontend application (React + TanStack Start)
│   └── server/       # Backend API (Hono)
├── packages/
│   ├── auth/         # Authentication logic & config (Better-Auth)
│   ├── db/           # Database schema (Drizzle) & client
│   ├── env/          # Environment variable validation schemas
│   ├── config/       # Shared configurations (TSConfig, etc.)
│   └── api/          # Shared API types/logic (if applicable)
├── initial-prd.md    # Product Requirements Document & Roadmap
└── CLAUDE.md         # Detailed developer notes & architecture
```

## Development Workflow

### Prerequisites

*   **Bun:** Ensure Bun is installed (`v1.3.6` or later recommended).
*   **PostgreSQL:** A running PostgreSQL instance is required.

### Key Commands

Run these commands from the project root:

| Command | Description |
| :--- | :--- |
| `bun install` | Install dependencies. |
| `bun run dev` | Start the entire stack (web + server). |
| `bun run dev:web` | Start only the frontend (localhost:3001). |
| `bun run dev:server` | Start only the backend (localhost:3000). |
| `bun run build` | Build all applications. |
| `bun run check-types` | Run TypeScript type checking across all packages. |
| `bun run db:push` | Push schema changes to the database (Drizzle Kit). |
| `bun run db:studio` | Open Drizzle Studio to manage database data. |

### Database & Schema

*   **Location:** Schema definitions are in `packages/db/src/schema/`.
*   **Workflow:**
    1.  Modify/Add schema files in `packages/db/src/schema/`.
    2.  Export them in `packages/db/src/schema/index.ts`.
    3.  Run `bun run db:push` to apply changes to the DB.
*   **Access:** Use the Drizzle client exported from `@kineDao.com/db`.

### Authentication

*   Authentication is handled by **Better-Auth**.
*   Configuration is in `packages/auth/src/index.ts`.
*   **Do not manually modify** the auth-related database schema files; they are managed by Better-Auth.

### Frontend Development

*   **Routing:** File-based routing in `apps/web/src/routes/`.
*   **Components:** UI components are in `apps/web/src/components/`.
*   **Styling:** TailwindCSS with shadcn/ui components.
*   **I18n:** Bilingual support is a core MVP requirement. Ensure all text is translatable.

## Reference Documentation

*   **`initial-prd.md`**: Contains detailed User Stories, Acceptance Criteria, and the MVP Roadmap. **Refer to this for feature requirements.**
*   **`CLAUDE.md`**: Technical details, architecture notes, and AI-specific instructions.
