# Showcase deployment

This project can run as a full personal showcase without removing customer,
vendor, admin, upload, notification, or Cash on Delivery features.

## Target services

| Role                     | Service              | Public address             |
| ------------------------ | -------------------- | -------------------------- |
| React and TanStack Start | Vercel Hobby         | `<web-project>.vercel.app` |
| Bun and Hono API         | Vercel Bun Functions | `<api-project>.vercel.app` |
| PostgreSQL               | Neon Free            | private connection string |
| Media storage            | Cloudinary Free      | Cloudinary CDN             |
| Transactional email      | Brevo Free           | no public endpoint         |

Vercel Hobby is for personal, non-commercial use. Use this setup for a demo
with sample products; a live store that advertises or sells real products needs
a hosting plan that permits commercial use.

## 1. Export the local database

The local database is the source of truth. Do not run `bun run db:seed` during
this process because the seed script deletes catalog and order data.

Use the local database's direct connection string to create a portable backup:

```bash
pg_dump --format=custom --no-owner --no-privileges \
  --file ./kinedao-local.dump \
  '<local direct PostgreSQL URL>'
```

Keep the dump outside Git. Restore it only into a new, empty Neon project:

```bash
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname '<Neon direct PostgreSQL URL>' \
  ./kinedao-local.dump
```

Use Neon’s direct, non-pooled URL for the restore. Use the pooled SSL URL as
`DATABASE_URL` on the Vercel API project. A full restore retains the current
41-table schema, accounts, roles, catalog, orders, sequences, and the existing
Drizzle migration ledger. Do not run the incomplete historical migrations
against this restored database.

After restoring, compare table counts and test the first admin account. The
existing `FIRST_ADMIN_EMAIL` script can grant admin roles to an imported user
when needed.

## 2. Configure Cloudinary media

Create a free Cloudinary account. Product images, banners, and logos are public
CDN assets. Vendor NID and trade-license uploads are authenticated Cloudinary
assets; the API provides authorized users a signed one-hour download URL.

Set these Vercel API project variables from Cloudinary’s API Keys page:

```text
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<API key>
CLOUDINARY_API_SECRET=<API secret>
```

Existing external catalog image URLs continue to work. New uploads use
Cloudinary and do not require a client-side secret.

## 3. Create the API project

Create a Vercel project named `kinedao-server` from this repository and select
the `bug-fix` branch. Set the project Root Directory to the repository root so
the server can import the Bun workspaces. The root `server.ts` starts the Hono
app with `Bun.serve()`, and the root `vercel.json` selects Vercel’s Bun runtime.
The API exposes `/healthz` without requiring a database connection.

Set these environment variables on the API project:

```text
NODE_ENV=production
PORT=3000
DATABASE_URL=<Neon pooled SSL URL>
BETTER_AUTH_SECRET=<new 32+ character secret>
BETTER_AUTH_URL=https://<web-project>.vercel.app
WEB_ORIGIN=https://<web-project>.vercel.app
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=2525
SMTP_USER=<Brevo SMTP login>
SMTP_PASS=<Brevo SMTP key>
EMAIL_FROM=<verified Brevo sender>
VAPID_PUBLIC_KEY=<generated VAPID public key>
VAPID_PRIVATE_KEY=<generated VAPID private key>
VAPID_SUBJECT=mailto:<contact email>
```

Set the Cloudinary credentials from section 2 and optional Google and Facebook
OAuth credentials. Vercel allows outbound SMTP except on port 25; keep Brevo on
port 2525. Generate VAPID keys with:

```bash
bun --cwd apps/server -e "import webPush from 'web-push'; console.log(webPush.generateVAPIDKeys())"
```

Once deployed, verify `https://<api-project>.vercel.app/healthz` before
connecting the frontend. Vercel runs the API as request-based functions, so
long-running notification streams can be disconnected at the function duration
limit; the browser should reconnect its EventSource stream.

## 4. Create the frontend project

Create a second Vercel project named `kinedao-web` from the same repository,
select the `bug-fix` branch, and set its Root Directory to `apps/web`. Enable
**Include source files outside of the Root Directory** so the app can use the
shared workspace packages. The rewrite in `apps/web/vercel.json` sends browser
`/api/*` requests to `https://kinedao-server.vercel.app`. If Vercel assigns the
API a different domain, update that rewrite to match.

Configure the frontend project with:

```text
Install command: use Vercel's detected Bun workspace install
Build command: bun run build
VITE_SERVER_URL=https://kinedao-server.vercel.app
```

Browsers use Vercel’s `/api/*` rewrite for API calls, login, uploads, and live
notifications. `VITE_SERVER_URL` is used by server-side rendering, so it must
remain the API URL rather than an empty string.

Use the final frontend Vercel URL in the API project’s `BETTER_AUTH_URL` and
`WEB_ORIGIN`. Add these OAuth redirect URLs to the Google and Facebook
provider consoles:

```text
https://<vercel-project>.vercel.app/api/auth/callback/google
https://<vercel-project>.vercel.app/api/auth/callback/facebook
```

## 5. Verify the full application

- Open the catalog, filters, product details, cart, and checkout.
- Sign in, refresh the browser, and confirm the session survives.
- Test email verification, password reset, and each enabled OAuth provider.
- Upload a product image, banner, and vendor document.
- Place a test COD order; review it as vendor and admin.
- Test vendor application, product editing, reviews, notifications, push
  subscription, Bangla/English switching, and dark mode.
- Open the site after the API has been idle and confirm it recovers without
  repeating a write operation.

## Publishing without Git pushes

Vercel can deploy both projects from the local CLI. Keep deployment environment
variables in the Vercel dashboard and never commit them.
