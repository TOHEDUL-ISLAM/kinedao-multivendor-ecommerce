# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**কিনেদাও (KineDao.com)** is a multivendor baby products marketplace with bilingual support (Bangla/English). The project is a 2-week MVP focused on core e-commerce functionality with Cash on Delivery (COD) payments only.

For detailed product requirements and user stories, see [initial-prd.md](initial-prd.md).

## Tech Stack

- **Runtime**: Bun (package manager and runtime environment)
- **Frontend**: React 19 + TanStack Start (SSR) + TanStack Router
- **Backend**: Hono (lightweight server framework) with Hono RPC for type-safe APIs
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better-Auth (email + Google/Facebook OAuth)
- **UI**: TailwindCSS 4 + shadcn/ui components
- **Database Setup**: Supabase (local development)
- **Type Safety**: End-to-end type safety via Hono RPC + Zod validation

## Monorepo Structure

This is a Bun workspaces monorepo with the following structure:

```
kineDao.com/
├── apps/
│   ├── web/          # Frontend (TanStack Start)
│   └── server/       # Backend API (Hono)
├── packages/
│   ├── api/          # API layer / business logic
│   ├── api-types/    # Shared API types & Zod schemas (for Hono RPC)
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
- `@kineDao.com/api-types` - Shared API DTOs and Zod validation schemas for type-safe RPC

The web app and server both depend on `@kineDao.com/auth` for authentication. The auth package depends on `@kineDao.com/db` for database access. Both web and server depend on `@kineDao.com/api-types` for end-to-end type safety.

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

# API Documentation (when server is running)
# Interactive docs: http://localhost:3000/docs
# OpenAPI spec:     http://localhost:3000/openapi
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

- **Framework**: Hono (minimal, performant) with **Hono RPC** for end-to-end type safety
- Entry point: [apps/server/src/index.ts](apps/server/src/index.ts)
- CORS configured for frontend origin
- Auth routes delegated to Better-Auth handler
- All API routes use **method chaining pattern** for RPC type inference

#### Hono RPC Architecture

This project uses **Hono RPC** to achieve full end-to-end type safety between the frontend and backend. Key components:

1. **Shared Types Package** (`@kineDao.com/api-types`):
   - Contains all API DTOs (Data Transfer Objects)
   - Contains Zod validation schemas for requests/responses
   - Single source of truth for API contracts
   - Location: [packages/api-types/src/](packages/api-types/src/)

2. **Server Route Pattern**:
   - All routes use **method chaining** (`.get()`, `.post()`, etc.)
   - All routes use `zValidator` for request validation
   - All routes return responses with **explicit status codes**
   - All routes export their type for RPC client

3. **AppType Export**:
   - Main server file exports `AppType` for RPC client type inference
   - Location: [apps/server/src/index.ts](apps/server/src/index.ts)

4. **RPC Client**:
   - Type-safe client created using `hc<AppType>()` from `hono/client`
   - Provides full autocomplete and type checking for all API calls
   - Location: [apps/web/src/lib/api-client.ts](apps/web/src/lib/api-client.ts)

#### Creating New API Endpoints

When adding new API endpoints, follow this pattern:

**1. Define types in `@kineDao.com/api-types`:**

```typescript
// packages/api-types/src/your-feature.ts
import { z } from "zod";

// Zod schema for request validation
export const yourRequestSchema = z.object({
  field: z.string(),
  count: z.coerce.number().min(1).max(100),
});

// TypeScript types
export interface YourResponseDTO {
  id: string;
  data: string[];
}
```

**2. Create route using method chaining with OpenAPI documentation:**

```typescript
// apps/server/src/routes/your-feature.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { describeRoute, resolver } from "hono-openapi";
import { yourRequestSchema, type YourResponseDTO } from "@kineDao.com/api-types/your-feature";
import { z } from "zod";

const yourRouter = new Hono()
  .get(
    "/endpoint",
    describeRoute({
      tags: ["Your Feature"],
      summary: "Get your data",
      description: "Detailed description of what this endpoint does",
      responses: {
        200: {
          description: "Successful response",
          content: {
            "application/json": {
              schema: resolver(z.object({ id: z.string(), data: z.array(z.string()) }))
            }
          }
        }
      }
    }),
    zValidator("query", yourRequestSchema),
    async (c) => {
      const validated = c.req.valid("query"); // Fully typed!
      // ... your logic here
      const response: YourResponseDTO = { id: "123", data: [] };
      return c.json(response, 200); // Always explicit status codes
    }
  )
  .post(
    "/endpoint",
    describeRoute({
      tags: ["Your Feature"],
      summary: "Create your data",
      description: "Detailed description of what this endpoint does",
      responses: {
        201: {
          description: "Created successfully",
          content: {
            "application/json": {
              schema: resolver(z.object({ id: z.string(), data: z.array(z.string()) }))
            }
          }
        }
      }
    }),
    zValidator("json", yourRequestSchema),
    async (c) => {
      const validated = c.req.valid("json");
      // ... your logic here
      return c.json(response, 201);
    }
  );

export { yourRouter };
export type YourRouterType = typeof yourRouter;
```

**3. Mount route in main app:**

```typescript
// apps/server/src/index.ts
import { yourRouter } from "./routes/your-feature";

const app = new Hono()
  // ... existing routes
  .route("/api/your-feature", yourRouter);

export type AppType = typeof app;
```

**4. Use in frontend with RPC client:**

```typescript
// apps/web/src/your-component.tsx
import { api } from "@/lib/api-client";
import type { YourResponseDTO } from "@kineDao.com/api-types/your-feature";

const response = await api["your-feature"].endpoint.$get({
  query: { field: "value", count: "10" }, // Type-safe!
});

if (response.ok) {
  const data: YourResponseDTO = await response.json(); // Fully typed!
}
```

**Important RPC Guidelines:**
- ✅ Always use method chaining (`.get()`, `.post()`) on routes
- ✅ Always use `zValidator` for request validation
- ✅ Always return explicit status codes: `c.json(data, 200)`
- ✅ Always export router type: `export type XxxRouterType = typeof xxxRouter`
- ✅ Share types via `@kineDao.com/api-types` package
- ✅ Document routes with `describeRoute()` from `hono-openapi` for API documentation
- ❌ Never use `c.notFound()` - use `c.json({ error: "Not found" }, 404)` instead
- ❌ Never use native `fetch()` on frontend - always use RPC client (`api.*`)

#### API Documentation with Scalar

The API is fully documented using **Scalar** (interactive API documentation UI) powered by **hono-openapi**:

- **Documentation UI**: http://localhost:3000/docs (when server is running)
- **OpenAPI Spec**: http://localhost:3000/openapi (raw JSON)
- **Features**: Interactive API explorer, test requests, code examples, response schemas

**To document a new route**, wrap it with `describeRoute()`:

```typescript
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";

const router = new Hono()
  .get(
    "/your-path",
    describeRoute({
      tags: ["Tag Name"],           // Groups routes in sidebar
      summary: "Short title",        // Endpoint title
      description: "Full details",   // Detailed explanation
      responses: {
        200: {
          description: "Success message",
          content: {
            "application/json": {
              schema: resolver(yourZodSchema)  // Response schema
            }
          }
        },
        404: {
          description: "Not found",
          content: {
            "application/json": {
              schema: resolver(z.object({ error: z.string() }))
            }
          }
        }
      }
    }),
    zValidator("query", yourSchema),  // Existing validator
    async (c) => { ... }               // Existing handler
  );
```

**Scalar Configuration** is in [apps/server/src/index.ts](apps/server/src/index.ts):
- Theme: Purple (customizable)
- All routes are automatically documented when wrapped with `describeRoute()`
- Supports testing endpoints directly from the browser

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

6. **API Integration**: The web app uses the **Hono RPC client** for all API calls. Never use native `fetch()` - always use the typed `api` client from [apps/web/src/lib/api-client.ts](apps/web/src/lib/api-client.ts). Use TanStack Query for data fetching with the RPC client.

   ```typescript
   // ❌ DON'T: Use native fetch
   const response = await fetch(`${env.VITE_SERVER_URL}/api/products`);

   // ✅ DO: Use RPC client
   import { api } from "@/lib/api-client";
   const response = await api.products.$get(); // Fully typed!
   ```

7. **Hono RPC Benefits**: The RPC setup provides end-to-end type safety, IDE autocomplete for all API routes, compile-time errors when endpoints change, and runtime validation with Zod schemas. This ensures the frontend and backend always stay in sync.

## Project Context

This project was generated using [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) v3.18.0. The configuration is stored in [bts.jsonc](bts.jsonc).

The MVP roadmap is defined in [initial-prd.md](initial-prd.md) with detailed user stories, acceptance criteria, and Fibonacci story points across 2 sprints (55 points total).
