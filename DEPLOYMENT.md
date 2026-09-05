# Deployment Guide

This guide covers the manual provisioning and deployment of KineDao.com to free-tier production infrastructure (Vercel, Render, Neon, Cloudflare R2, Brevo).

## Infrastructure Provisioning Checklist

### 1. Database (Neon)
1. Create a new project in [Neon.tech](https://neon.tech).
2. Note the database connection string.
3. In Neon, go to **Settings > Compute** and ensure **Autosuspend** is enabled to save compute hours.
4. Go to **Settings > Pooling** and get the pooled connection string (e.g. `postgresql://user:pass@ep-pooler.region.aws.neon.tech/neondb?sslmode=require`).

### 2. Storage (Cloudflare R2)
1. Create a Cloudflare account and navigate to R2.
2. Create a new bucket (e.g. `kinedao-prod`).
3. Enable **Public Access** by either:
   - Connecting a custom domain (e.g., `cdn.kinedao.com`)
   - Allowing `.r2.dev` subdomain (useful for testing).
4. Go to **R2 API Tokens** and generate an API token with "Object Read & Write" permissions for this bucket.
5. Save the Access Key ID, Secret Access Key, and the S3 endpoint URL.

### 3. Email (Brevo)
1. Create a free account at [Brevo.com](https://brevo.com).
2. Go to **Transactional > SMTP & API** and generate a new SMTP key.
3. Configure the sender domain if you have a custom domain.
4. Save the SMTP server (`smtp-relay.brevo.com`), port (`587`), user, and password.

### 4. Backend (Render)
1. Push the repository to GitHub.
2. In [Render](https://render.com), create a new **Web Service**.
3. Connect the GitHub repository.
4. Settings:
   - **Environment**: Docker
   - **Branch**: `main`
   - **Plan**: Free
5. Set the Environment Variables (`render.yaml` will automate most of this, but you need to supply the secrets in the Render dashboard):
   - `DATABASE_URL` (Neon pooled connection string)
   - `BETTER_AUTH_SECRET` (generate a secure random string)
   - `BETTER_AUTH_URL` (e.g. `https://api.kinedao.com` or the `.onrender.com` URL)
   - `WEB_ORIGIN` (e.g. `https://kinedao.com`)
   - S3 Secrets: `S3_ENDPOINT`, `S3_REGION` (`auto`), `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_BASE_URL`
   - SMTP Secrets: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
   - Web Push (VAPID): Generate VAPID keys via `npx web-push generate-vapid-keys` and set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:admin@kinedao.com`).
6. Deploy the service. Wait for the `db:migrate` script to run and the container to go green. Note the Render URL.

### 5. Frontend (Vercel)
1. In [Vercel](https://vercel.com), add a new project and import the GitHub repository.
2. Set the **Framework Preset** to `Vite`.
3. Set the **Root Directory** to `apps/web` (or leave it at the repo root depending on your Vercel preference, but standard is `apps/web` if `package.json` is selected).
   *Note: Because of the Vercel rewrite in `vercel.json`, ensure the backend Render URL matches the destination in `vercel.json`.*
4. Environment Variables:
   - `VITE_SERVER_URL` (Set to `""` for proxying or the Render URL for absolute fetching during SSR - wait, the Vercel edge rewrite proxies `https://kinedao.com/api` to Render. Just ensure `vercel.json`'s destination is set to your Render URL.)
5. Deploy.

### 6. Domain Alignment (Recommended)
For `sameSite: "lax"` cookies to function seamlessly and to avoid preflight CORS:
1. Map `kinedao.com` and `www.kinedao.com` to Vercel.
2. Map `api.kinedao.com` to Render.
3. Update `apps/web/vercel.json` to proxy `/api/(.*)` to `https://api.kinedao.com/api/$1`.
4. Update Render's `BETTER_AUTH_URL` to `https://api.kinedao.com`.

## Verification Steps
- [ ] Backend health check responds successfully (`https://<render-url>/healthz`).
- [ ] Vercel frontend loads without errors.
- [ ] Navigating to a public product page works (SSR fetches products from Render).
- [ ] Sign up/Login works (Auth cookies are set securely and persist).
- [ ] Uploading an image as a vendor succeeds (hits Cloudflare R2).
- [ ] Placing an order triggers a notification (hits Brevo).
