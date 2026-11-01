# Showcase deployment

This project can run as a full personal showcase without removing customer,
vendor, admin, upload, notification, or Cash on Delivery features.

## Target services

| Role                     | Service         | Public address            |
| ------------------------ | --------------- | ------------------------- |
| React and TanStack Start | Vercel Hobby    | `<project>.vercel.app`    |
| Bun and Hono API         | Render Free     | `<service>.onrender.com`  |
| PostgreSQL               | Neon Free       | private connection string |
| Media storage            | Cloudinary Free | Cloudinary CDN            |
| Transactional email      | Brevo Free      | no public endpoint        |

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

## 2. Configure Cloudinary media

Create a free Cloudinary account. Product images, banners, and logos are public
CDN assets. Vendor NID and trade-license uploads are authenticated Cloudinary
assets; the API provides authorized users a signed one-hour download URL.

Set these Render variables from Cloudinary’s API Keys page:

```text
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<API key>
CLOUDINARY_API_SECRET=<API secret>
```

Existing external catalog image URLs continue to work. New uploads use
Cloudinary and do not require a client-side secret.

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
