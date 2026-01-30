# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**কিনেদাও (KineDao.com)** is a multivendor baby products marketplace with bilingual support (Bangla/English). The project is a 2-week MVP focused on core e-commerce functionality with Cash on Delivery (COD) payments only.

For detailed product requirements and user stories, see [initial-prd.md](initial-prd.md).

## Tech Stack

- **Runtime**: Bun (package manager and runtime environment)
- **Frontend**: React 19 + TanStack Start (SSR) + TanStack Router
- **Backend**: Hono (lightweight server framework)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better-Auth (email + Google/Facebook OAuth)
- **UI**: TailwindCSS 4 + shadcn/ui components
- **Database Setup**: Supabase (local development)

## Monorepo Structure

This is a Bun workspaces monorepo with the following structure:

```
kineDao.com/
├── apps/
│   ├── web/          # Frontend (TanStack Start)
│   └── server/       # Backend API (Hono)
├── packages/
│   ├── api/          # API layer / business logic
│   ├── auth/         # Authentication configuration (Better-Auth)
│   ├── db/           # Database schema & Drizzle ORM
│   ├── config/       # Shared TypeScript config
│   └── env/          # Environment variable validation
```

### Package Dependencies

- `@kineDao.com/db` - Database schema, Drizzle client, and migrations
- `@kineDao.com/auth` - Better-Auth configuration shared between web and server
- `@kineDao.com/env` - Environment variable schema and validation (using Zod)
- `@kineDao.com/config` - Shared TypeScript configuration

The web app and server both depend on `@kineDao.com/auth` for authentication. The auth package depends on `@kineDao.com/db` for database access.

## Development Commands

### Running the Application

```bash
# Install dependencies (first time)
bun install

# Initialize git hooks (first time)
bun run prepare

# Run all apps concurrently
bun run dev

# Run individual apps
bun run dev:web      # Frontend only (http://localhost:3001)
bun run dev:server   # Backend only (http://localhost:3000)
```

### Database Commands

All database commands use Drizzle Kit:

```bash
# Push schema changes to database (development)
bun run db:push

# Generate migration files from schema
bun run db:generate

# Apply migrations (production)
bun run db:migrate

# Open Drizzle Studio (database GUI)
bun run db:studio
```

**Important**: Schema files are in [packages/db/src/schema/](packages/db/src/schema/). Currently only `auth.ts` schema exists (user, session, account, verification tables for Better-Auth). New schemas for products, vendors, orders, etc. need to be added here and exported from [packages/db/src/schema/index.ts](packages/db/src/schema/index.ts).

### Type Checking

```bash
# Check types across all apps
bun run check-types
```

### Building

```bash
# Build all apps
bun run build
```

## Architecture Notes

### Authentication Flow

- **Better-Auth** is configured in [packages/auth/src/index.ts](packages/auth/src/index.ts)
- Auth client for web: [apps/web/src/lib/auth-client.ts](apps/web/src/lib/auth-client.ts)
- Auth API routes are handled by server at `/api/auth/*`
- Supported providers: Email/Password, Google OAuth, Facebook OAuth
- Auth middleware for protected routes: [apps/web/src/middleware/auth.ts](apps/web/src/middleware/auth.ts)

### Database Schema

- **ORM**: Drizzle ORM with PostgreSQL
- Schema location: [packages/db/src/schema/](packages/db/src/schema/)
- Current schemas: Better-Auth tables only (user, session, account, verification)
- Connection: PostgreSQL (configured via environment variables)

**To add new tables**: Create schema file in `packages/db/src/schema/`, export from `index.ts`, then run `bun run db:push`.

### Frontend Routing

- **Router**: TanStack Router with file-based routing
- Routes defined in [apps/web/src/routes/](apps/web/src/routes/)
- Route tree auto-generated in [apps/web/src/routeTree.gen.ts](apps/web/src/routeTree.gen.ts)
- SSR-enabled via TanStack Start

### Backend API

- **Framework**: Hono (minimal, performant)
- Entry point: [apps/server/src/index.ts](apps/server/src/index.ts)
- CORS configured for frontend origin
- Auth routes delegated to Better-Auth handler
- API routes should be added to the Hono app instance

### Environment Variables

Environment variables are validated using Zod schemas in [packages/env/](packages/env/).

Required environment variables:
- Database connection string
- Better-Auth secrets
- CORS origin
- OAuth credentials (Google, Facebook)

Check `.env` files in `apps/web/` and `apps/server/` directories.

### UI Components

- Base components: [apps/web/src/components/ui/](apps/web/src/components/ui/) (shadcn/ui)
- Styling: TailwindCSS 4 with utility classes
- Theme: `next-themes` for dark mode support
- Icons: `lucide-react`
- Notifications: `sonner` toast library

### Bilingual Support

The MVP requires **Bangla/English toggle** for all user-facing text. Implement i18n using:
- Language state management (context or global state)
- Translation objects for static text
- LocalStorage persistence of language preference

## Key Implementation Notes

1. **Catalog Workspace Dependencies**: This project uses Bun workspace catalog for shared dependencies (TypeScript, Zod, dotenv, @types/bun, better-auth). These are defined in root [package.json](package.json) under `workspaces.catalog`.

2. **Better-Auth Schema**: The auth tables are managed by Better-Auth. Do not manually modify the auth schema in `packages/db/src/schema/auth.ts` - it's auto-generated from Better-Auth configuration.

3. **Hot Reload**: The server uses `bun run --hot` for hot module reloading during development.

4. **Database Client**: Access the Drizzle database client from `@kineDao.com/db` - it's a singleton exported from [packages/db/src/index.ts](packages/db/src/index.ts).

5. **Middleware**: TanStack Start middleware can be added in [apps/web/src/middleware/](apps/web/src/middleware/) for route protection, logging, etc.

6. **API Integration**: The web app should call the Hono backend API at `http://localhost:3000` during development. Use TanStack Query for data fetching.

## Project Context

This project was generated using [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) v3.18.0. The configuration is stored in [bts.jsonc](bts.jsonc).

The MVP roadmap is defined in [initial-prd.md](initial-prd.md) with detailed user stories, acceptance criteria, and Fibonacci story points across 2 sprints (55 points total).
