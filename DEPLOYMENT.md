# Showcase deployment

This project can run as a full personal showcase without removing customer,
vendor, admin, upload, notification, or Cash on Delivery features.

## Target services

| Role                     | Service               | Public address            |
| ------------------------ | --------------------- | ------------------------- |
| React and TanStack Start | Vercel Hobby          | `<project>.vercel.app`    |
| Bun and Hono API         | Render Free           | `<service>.onrender.com`  |
| PostgreSQL               | Neon Free             | private connection string |
| Object storage           | Supabase Storage Free | Supabase project URL      |
| Transactional email      | Brevo Free            | no public endpoint        |

The Vercel deployment is suitable only for a personal, non-commercial
showcase. A public marketplace that sells or advertises real products requires
a Vercel paid plan or a different frontend host.

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
`DATABASE_URL` on Render. A full restore retains the current 41-table schema,
accounts, roles, catalog, orders, sequences, and the existing Drizzle migration
ledger. Do not run the incomplete historical migrations against this restored
database.

After restoring, compare table counts and test the first admin account. The
existing `FIRST_ADMIN_EMAIL` script can grant admin roles to an imported user
when needed.

## 2. Copy object storage

Create a Supabase Storage project and enable S3 protocol access. Create a public
`kinedao-assets` bucket for storefront media and a private `kinedao-private`
bucket for vendor NID and trade-license files. Generate server-only S3 access
keys. Supabase S3 is compatible with the Bun S3 client already used by the API.

Copy public objects from local Supabase storage to `kinedao-assets` while
preserving their exact keys. Product and banner records store those keys, so
their paths must not change. Copy `vendor-documents/` to `kinedao-private`
instead. Never make identity documents public.

The three existing local vendor applications store local Supabase URLs, which
will not work after the move. After restoring the database and copying those
objects, convert their document values to private object references in Neon:

```sql
UPDATE vendor_applications
SET
  nid_front_url = regexp_replace(nid_front_url, '^.*/kinedao-assets/(vendor-documents/.*)$', 'private://\\1'),
  nid_back_url = regexp_replace(nid_back_url, '^.*/kinedao-assets/(vendor-documents/.*)$', 'private://\\1'),
  trade_license_url = CASE
    WHEN trade_license_url IS NULL THEN NULL
    ELSE regexp_replace(trade_license_url, '^.*/kinedao-assets/(vendor-documents/.*)$', 'private://\\1')
  END;
```

New vendor-document uploads are stored in the private bucket. The API gives
only the vendor or an admin a one-hour signed URL when they need to view one.

Set these Render variables from the Supabase project’s S3 settings:

```text
S3_ENDPOINT=https://<project-ref>.supabase.co/storage/v1/s3
S3_REGION=<region supplied by Supabase>
S3_BUCKET=kinedao-assets
S3_PRIVATE_BUCKET=kinedao-private
S3_ACCESS_KEY_ID=<server-only access key>
S3_SECRET_ACCESS_KEY=<server-only secret>
S3_PUBLIC_BASE_URL=https://<project-ref>.supabase.co/storage/v1/object/public/kinedao-assets
```

Set `VITE_S3_PUBLIC_BASE_URL` to the same public base URL in Vercel.

## 3. Create the backend service

Create a Render Docker web service from this repository after the deployment
changes are available to Render. It exposes `/healthz` without requiring a
database connection. Set:

```text
NODE_ENV=production
PORT=3000
DATABASE_URL=<Neon pooled SSL URL>
BETTER_AUTH_SECRET=<new 32+ character secret>
BETTER_AUTH_URL=https://<vercel-project>.vercel.app
WEB_ORIGIN=https://<vercel-project>.vercel.app
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=2525
SMTP_USER=<Brevo SMTP login>
SMTP_PASS=<Brevo SMTP key>
EMAIL_FROM=<verified Brevo sender>
VAPID_PUBLIC_KEY=<generated VAPID public key>
VAPID_PRIVATE_KEY=<generated VAPID private key>
VAPID_SUBJECT=mailto:<contact email>
```

Add the Supabase storage variables from the previous section and optional Google
and Facebook OAuth credentials. Render Free blocks SMTP ports 25, 465, and 587;
Brevo accepts port 2525. Generate VAPID keys with:

```bash
bun --cwd apps/server -e "import webPush from 'web-push'; console.log(webPush.generateVAPIDKeys())"
```

Verify `https://<render-service>.onrender.com/healthz` before connecting the
frontend. The free service can take about a minute to wake after inactivity.

## 4. Create the frontend deployment

The Vercel build uses Nitro, which packages TanStack Start SSR and server
functions for Vercel. Replace the placeholder host in
`apps/web/vercel.json` with the actual Render service hostname before deployment.

Configure the Vercel project with repository root as the project root and:

```text
Install command: bun install --frozen-lockfile
Build command: bun run --filter web build
VITE_SERVER_URL=https://<render-service>.onrender.com
VITE_S3_PUBLIC_BASE_URL=https://<project-ref>.supabase.co/storage/v1/object/public/kinedao-assets
```

Browsers use Vercel’s `/api/*` rewrite for API calls, login, uploads, and live
notifications. `VITE_SERVER_URL` is used by server-side rendering, so it must
remain the Render URL rather than an empty string.

Use the final Vercel URL in Render’s `BETTER_AUTH_URL` and `WEB_ORIGIN`. Add
these OAuth redirect URLs to the Google and Facebook provider consoles:

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
- Open the site after the Render service has slept and confirm the UI recovers
  without repeating a write operation.

## Publishing without Git pushes

Vercel can deploy from the local CLI, but that publishes the frontend. Render
requires either a connected Git repository or a container image in a registry.
Building the image locally is safe; uploading it to a registry or connecting a
repository is the publishing step. Keep the deployment environment variables in
provider dashboards and never commit them.
