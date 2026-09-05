# kineDao.com

**কিনেদাও (KineDao.com)** is a multivendor baby products marketplace with bilingual support (Bangla/English).

## Tech Stack

- **Runtime**: Bun (package manager and runtime environment)
- **Frontend**: React 19 + TanStack Start (SSR) + TanStack Router
- **Backend**: Hono (lightweight server framework) with Hono RPC for type-safe APIs
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Better-Auth (email + Google/Facebook OAuth)
- **Storage**: Cloudflare R2
- **Email**: Brevo SMTP
- **UI**: TailwindCSS 4 + Mantine UI

## Deployment Architecture

The application is deployed across multiple cloud providers for cost-effective scaling:

- **Frontend**: Vercel (Edge network proxying `/api/*` to Render)
- **Backend**: Render (Docker container running Bun)
- **Database**: Neon (Serverless PostgreSQL)
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Email**: Brevo SMTP

For full deployment instructions, see `DEPLOYMENT.md`.

## Getting Started Locally

First, install the dependencies:

```bash
bun install
```

### Environment Variables

Copy `.env.example` to `apps/server/.env`, `apps/web/.env`, and `.env` and fill in the required values.

### Database Setup

1. Start your local database (or connect to a Neon preview branch).
2. Push the schema to your database:

```bash
bun run db:push
```

3. (Optional) Seed the database:

```bash
bun run db:seed
```

### Running the App

Run the development server:

```bash
bun run dev
```

- Frontend: [http://localhost:3001](http://localhost:3001)
- Backend API: [http://localhost:3000](http://localhost:3000)
- API Docs: [http://localhost:3000/docs](http://localhost:3000/docs)

## Available Scripts

- `bun run dev`: Start all applications
- `bun run build`: Build all applications
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes (Local only)
- `bun run db:migrate`: Run production migrations
- `bun run db:studio`: Open Drizzle Studio UI

## Documentation

- Cross-agent instructions: `AGENTS.md`
- Product Requirements: `docs/product/prd.md`
- Deployment Checklist: `DEPLOYMENT.md`
