# 👶 কিনেদাও (KineDao.com) — Multivendor Baby Products Marketplace

[![Live Storefront](https://img.shields.io/badge/Storefront-kinedao--web.vercel.app-3b9b8f?style=for-the-badge&logo=vercel&logoColor=white)](https://kinedao-web.vercel.app)
[![Live API & Docs](https://img.shields.io/badge/API_Docs-Scalar_OpenAPI-8b5cf6?style=for-the-badge&logo=swagger&logoColor=white)](https://kinedao-server.vercel.app/docs)
[![Author](https://img.shields.io/badge/Author-TOHEDUL--ISLAM-000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/TOHEDUL-ISLAM)
[![Runtime](https://img.shields.io/badge/Runtime-Bun_v1.3+-FBF0DF?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg?style=for-the-badge)](#-license--rights)

> **কিনেদাও (KineDao.com)** is Bangladesh’s premier bilingual (Bangla / English) multivendor marketplace engineered specifically for baby, infant, and toddler products. Built as a high-performance modern monorepo with end-to-end type safety, real-time push notifications, and localized Cash on Delivery (COD) fulfillment.

Developed and maintained by **[TOHEDUL-ISLAM](https://github.com/TOHEDUL-ISLAM)**.

---

## 🌟 Live Demo & Deployments

| Component                         | Platform             | Live URL                                                                               |
| :-------------------------------- | :------------------- | :------------------------------------------------------------------------------------- |
| **Customer Storefront**           | Vercel (Edge SSR)    | [https://kinedao-web.vercel.app](https://kinedao-web.vercel.app)                       |
| **Backend API**                   | Vercel Bun Functions | [https://kinedao-server.vercel.app](https://kinedao-server.vercel.app)                 |
| **Interactive API Documentation** | Scalar / OpenAPI 3.1 | [https://kinedao-server.vercel.app/docs](https://kinedao-server.vercel.app/docs)       |
| **API Health Check**              | Vercel               | [https://kinedao-server.vercel.app/healthz](https://kinedao-server.vercel.app/healthz) |

---

## 🚀 Key Features

### 🛒 1. Customer Storefront & Catalog

- **Full Bilingual Support (বাংলা / English)**: Instant language switching across all navigation, product metadata, safety warnings, and checkout details with persistent state.
- **Baby-Specific Product Filtering**:
  - **Overlap-based Age Filter**: Filters items across numeric months (0–36m) so overlapping age ranges (e.g. "0-3m", "3-6m") accurately surface matching products.
  - **Safety Attributes**: One-click filtering for BPA-Free, Organic, Hypoallergenic, and Choke Hazard (`hasSmallParts`) attributes.
  - **Safety Certifications**: ASTM, FDA, CE, and EN-71 safety badge highlights.
- **Smart Search & Facets**: Instant category facets, price ranges, brand filters, and typeahead search.
- **Variant & SKU Selector**: Real-time stock status, pricing, and dynamic SKU resolution for sizes, colors, and pack options.
- **Cart, Wishlist & Quick View**: Persistent shopping cart with guest support, wishlist management, and fast quick-view modal.
- **Optimized Mobile UX**: Responsive touch carousel, compact above-the-fold layout, bottom navigation bar, and smooth scrolling with virtual scroll restoration.

### 🏪 2. Multivendor Portal (`/vendor`)

- **Vendor Onboarding**: Self-service registration with NID and trade license document uploads.
- **Vendor Management Dashboard**: Real-time sales metrics, revenue analytics, low-stock warnings, and order tracking.
- **Catalog Management**: Add and manage multi-variant products, upload product images to cloud storage, and configure baby safety specifications.
- **Order Fulfillment Pipeline**: Update and manage order lifecycle states (`pending` ➔ `processing` ➔ `shipped` ➔ `delivered` ➔ `cancelled`).
- **Financial Overview**: Delivered-order earnings tracking and payout history.

### 🛡️ 3. Admin Governance Panel (`/admin`)

- **Vendor Moderation**: Review and approve/reject pending vendor applications and legal documents.
- **Catalog Oversight**: Global product moderation, featured collection curation, and banner controls.
- **Order Oversight**: Cross-vendor order inspection, status audits, and customer support visibility.
- **User Management**: Role management (Customer, Vendor, Admin) with audit logs.

### 🚚 4. Localized Checkout & Cash on Delivery (COD)

- **Bangladesh Logistics**: Division, district, and upazila hierarchical shipping selector.
- **Dynamic Delivery Charges**: Automated rate calculation based on Inside Dhaka vs. Outside Dhaka delivery zones.
- **Cash on Delivery (COD)**: Frictionless checkout optimized for Bangladesh's primary e-commerce payment method.

### 🔔 5. Real-Time Notification & Messaging Engine

- **Server-Sent Events (SSE)**: Live in-app notification streaming via `/api/notifications/stream`.
- **Web Push Notifications**: Browser push notifications powered by VAPID (`web-push`).
- **Transactional Emails**: Automated order confirmation, status alerts, and password recovery via Brevo SMTP.

---

## 🛠️ Tech Stack & Architecture

```mermaid
flowchart TD
    Client["Client Browser (Web / Mobile)"]
    VercelWeb["Frontend (Vercel Edge)<br/>React 19 + TanStack Start SSR + TanStack Router"]
    VercelAPI["Backend API (Vercel Bun)<br/>Hono RPC + hono-openapi + Better-Auth"]
    DB[("Neon PostgreSQL<br/>Drizzle ORM (41+ Tables)")]
    Media["Cloudinary / S3 Storage<br/>Product & Vendor Assets"]
    Brevo["Brevo SMTP<br/>Transactional Email"]

    Client -->|"HTTPS / SSR"| VercelWeb
    Client -->|"/api/* Proxy"| VercelAPI
    VercelWeb -->|"Type-Safe Hono RPC"| VercelAPI
    VercelAPI -->|"Pooled SQL"| DB
    VercelAPI -->|"Signed Uploads"| Media
    VercelAPI -->|"SMTP Relay"| Brevo
```

| Layer                  | Technologies                                                                                                                                                                                         |
| :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime & Monorepo** | [Bun](https://bun.sh) (Workspaces, Package Manager & Native Runtime)                                                                                                                                 |
| **Frontend Framework** | [React 19](https://react.dev/), [TanStack Start](https://tanstack.com/start) (SSR), [TanStack Router](https://tanstack.com/router)                                                                   |
| **UI & Styling**       | [Tailwind CSS v4](https://tailwindcss.com/), [Mantine UI](https://mantine.dev/), [Radix UI](https://www.radix-ui.com/), [Sonner](https://sonner.emilkowal.ski/), [Lucide React](https://lucide.dev/) |
| **Client State**       | [TanStack Query](https://tanstack.com/query) (Server Cache), [Zustand](https://github.com/pmndrs/zustand) (Cart, Buy Now, Language, Wishlist)                                                        |
| **Backend Framework**  | [Hono](https://hono.dev/) with **Hono RPC** for end-to-end type safety                                                                                                                               |
| **Database & ORM**     | [Neon Serverless PostgreSQL](https://neon.tech/), [Drizzle ORM](https://orm.drizzle.team/), Drizzle Kit                                                                                              |
| **Authentication**     | [Better-Auth](https://better-auth.com/) (Email/Password, Google OAuth, Facebook OAuth, RBAC)                                                                                                         |
| **API Documentation**  | [Scalar](https://scalar.com/) + [hono-openapi](https://github.com/rhinobase/hono-openapi)                                                                                                            |
| **Push & Email**       | Web-Push (VAPID), Brevo SMTP                                                                                                                                                                         |
| **Media Storage**      | Cloudinary / S3-compatible object storage via Bun S3Client                                                                                                                                           |
| **Testing & QA**       | Playwright CLI, Vitest, TypeScript strict mode                                                                                                                                                       |

---

## 📁 Repository Structure

```text
kineDao.com/
├── apps/
│   ├── web/                    # Frontend application (React 19 + TanStack Start + SSR)
│   │   ├── src/
│   │   │   ├── components/     # UI components (catalog, vendor, admin, header, cart)
│   │   │   ├── routes/         # File-based routes (/catalog, /product, /vendor, /admin)
│   │   │   ├── stores/         # Zustand global stores (cart, language, wishlist)
│   │   │   ├── hooks/          # React hooks (translation, auth, notifications)
│   │   │   └── lib/            # Hono RPC client (`api-client.ts`), auth client
│   │   └── vercel.json         # Vercel configuration & /api/* proxying
│   │
│   └── server/                 # Backend API service (Hono)
│       └── src/
│           ├── routes/         # Modular RPC routes (catalog, products, orders, vendor, etc.)
│           ├── lib/            # Notification service, web-push, email, upload helpers
│           ├── middleware/     # Role guards (vendorAuth, adminAuth)
│           ├── scripts/        # Seeding and role assignment scripts
│           └── index.ts        # App setup, CORS, route mounting, Scalar docs
│
├── packages/
│   ├── api-types/              # Shared DTOs, Zod request/response schemas (Single source of truth)
│   ├── auth/                   # Better-Auth configuration & session management
│   ├── db/                     # Drizzle PostgreSQL schemas, migrations, relations, seed data
│   ├── env/                    # Runtime environment validation (Zod)
│   └── config/                 # Shared TypeScript configurations
│
├── docs/                       # Architecture diagrams & product documentation
└── DEPLOYMENT.md               # Production deployment guide
```

---

## ⚡ Getting Started Locally

### Prerequisites

- **[Bun](https://bun.sh)** `v1.3.0` or higher installed
- **PostgreSQL** instance running locally or a free [Neon](https://neon.tech) cloud database

### 1. Clone the Repository

```bash
git clone git@github.com:TOHEDUL-ISLAM/kinedao-multivendor-ecommerce.git
cd kinedao-multivendor-ecommerce
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment Variables

Copy `.env.example` to the root and respective apps:

```bash
cp .env.example .env
cp .env.example apps/server/.env
cp .env.example apps/web/.env
```

Key environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kinedao?sslmode=disable"

# Better-Auth
BETTER_AUTH_SECRET="your-super-secret-random-key-at-least-32-characters"
BETTER_AUTH_URL="http://localhost:3001"
WEB_ORIGIN="http://localhost:3001"

# Client SSR API
VITE_SERVER_URL="http://localhost:3000"

# Storage & Uploads (Cloudinary or S3)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Brevo SMTP (Optional for local dev)
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=2525
SMTP_USER="your-brevo-login"
SMTP_PASS="your-brevo-key"
EMAIL_FROM="KineDao <noreply@kinedao.com>"
```

### 4. Database Setup & Seeding

Push the Drizzle schema to your database and optionally run the sample dataset:

```bash
# Push schema to database
bun run db:push

# Seed sample data (10 vendors, 221 categories, 3,400+ products, campaigns)
bun run db:seed
```

### 5. Start the Development Servers

```bash
# Run both frontend and backend concurrently
bun run dev
```

- **Frontend**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: [http://localhost:3000](http://localhost:3000)
- **Scalar API Explorer**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **OpenAPI Schema**: [http://localhost:3000/openapi](http://localhost:3000/openapi)

---

## 📜 Available NPM / Bun Scripts

| Command               | Description                                                       |
| :-------------------- | :---------------------------------------------------------------- |
| `bun run dev`         | Starts all workspace applications concurrently with hot reloading |
| `bun run dev:web`     | Starts only the frontend application (`apps/web`)                 |
| `bun run dev:server`  | Starts only the backend API server (`apps/server`)                |
| `bun run build`       | Compiles and builds all workspace packages and apps               |
| `bun run check-types` | Executes TypeScript type checking across all monorepo packages    |
| `bun run db:push`     | Pushes Drizzle schema changes directly to the database            |
| `bun run db:generate` | Generates new SQL migration files from schema                     |
| `bun run db:migrate`  | Runs pending database migrations                                  |
| `bun run db:studio`   | Launches Drizzle Studio interactive database GUI                  |
| `bun run db:seed`     | Populates database with sample multivendor catalog data           |
| `bun run format`      | Runs Prettier to format codebase                                  |

---

## 🔗 End-to-End Type Safety with Hono RPC

This monorepo utilizes **Hono RPC** to ensure 100% type safety from database query to React components:

1. Request and response schemas are declared with **Zod** in `@kineDao.com/api-types`.
2. Backend routes use method chaining and `zValidator` in `apps/server`.
3. The server exports `AppType = typeof app`.
4. The web client initializes `hc<AppType>()` in `apps/web/src/lib/api-client.ts`.
5. Any API route change immediately reflects in frontend autocomplete and triggers compile-time TypeScript verification.

```typescript
// Type-safe call in React component
import { api } from "@/lib/api-client";

const response = await api.catalog.products.$get({
  query: {
    category: "feeding-nursing",
    isBpaFree: "true",
    limit: "20",
  },
});

if (response.ok) {
  const data = await response.json(); // Fully typed ProductListDTO!
}
```

---

## ☁️ Deployment Architecture

The application is deployed with production scaling and cost efficiency:

- **Frontend**: Hosted on [Vercel](https://vercel.com) Edge SSR network.
  - Rewrites `/api/*` requests directly to the API service.
  - Automatic SSL, global CDN asset caching, and instant Git branch previews.
- **Backend**: Hosted on [Vercel Bun Functions](https://vercel.com/docs/functions/runtimes/bun) running serverless Bun runtime for minimal cold starts.
- **Database**: Serverless PostgreSQL on [Neon](https://neon.tech) with automatic scaling and connection pooling.
- **Storage**: Cloudinary CDN for public image delivery and signed private uploads.
- **Email**: Brevo SMTP for transactional emails.

For comprehensive deployment steps, environment configurations, and database restore guides, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 👨‍💻 Author

**TOHEDUL ISLAM**

- **GitHub**: [@TOHEDUL-ISLAM](https://github.com/TOHEDUL-ISLAM)
- **Repository**: [TOHEDUL-ISLAM/kinedao-multivendor-ecommerce](https://github.com/TOHEDUL-ISLAM/kinedao-multivendor-ecommerce)

---

## 📄 License & Rights

Copyright © 2026 **TOHEDUL ISLAM**. All rights reserved.

This software and associated documentation files are proprietary. Unauthorized copying, distribution, modification, public display, or commercial use of this repository or any portion thereof is strictly prohibited without prior express written permission.
