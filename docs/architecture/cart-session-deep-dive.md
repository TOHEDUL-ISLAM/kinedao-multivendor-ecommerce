# KineDao Deep Dive: Rendering, Product Fetching, Cart Storage, Session Management

## Purpose

This document explains, from source code, how the codebase works in four critical areas:

1. Product page and catalog data fetching
2. SSR vs client-side rendering behavior
3. Cart storage and merge behavior
4. Authentication/session lifecycle

---

## 1) System Map (What talks to what)

### High-level flow

1. Browser renders TanStack Start routes in `apps/web`.
2. Web app calls typed Hono RPC client (`api.*`) to `apps/server`.
3. Server resolves session (Better-Auth), sets `c.var.user`, then route handlers execute.
4. Route handlers query PostgreSQL via Drizzle (`packages/db` schema).
5. Response returns DTOs defined in `packages/api-types`.

### Core integration points

- Typed RPC client with cookie credentials: `apps/web/src/lib/api-client.ts:6`
- Server route mount + auth session middleware: `apps/server/src/index.ts:65`
- Better-Auth config (cookies, providers, email verification): `packages/auth/src/index.ts:65`
- DB schemas (products/cart/auth): `packages/db/src/schema/products.ts:16`, `packages/db/src/schema/cart.ts:15`, `packages/db/src/schema/auth.ts:4`

---

## 2) Rendering Model (SSR vs Client Data Fetching)

## What is actually SSR here?

The app uses TanStack Start SSR for the route tree/document shell, and wraps body content in `ClientOnly`.

- Root route includes `ClientOnly` with a server-renderable fallback containing `<Outlet />`: `apps/web/src/routes/__root.tsx:163`
- `ClientOnly` renders fallback until mounted (`hasMounted`): `apps/web/src/components/client-only.tsx:10`

This means the app has SSR shell capability, but page data strategy varies by route.

## Route behavior categories

### A) SSR shell + client data fetching (`useQuery` in component, no route `loader`)

These routes fetch data from the browser after render/hydration:

- Home `/`: `apps/web/src/routes/index.tsx:23`, `apps/web/src/routes/index.tsx:73`
- Catalog `/catalog`: `apps/web/src/routes/catalog.tsx:37`, `apps/web/src/routes/catalog.tsx:77`
- Category `/category/$slug`: `apps/web/src/routes/category/$slug.tsx:48`, `apps/web/src/routes/category/$slug.tsx:91`
- Product `/product/$slug`: `apps/web/src/routes/product/$slug.tsx:31`, `apps/web/src/routes/product/$slug.tsx:68`
- Cart `/cart` (cart comes from store/API call in effect): `apps/web/src/routes/cart.tsx:17`, `apps/web/src/routes/cart.tsx:31`

### B) Route-guarded (server function in `beforeLoad`) + mostly client page state

Auth/role checks run before allowing page render:

- Checkout auth gate: `apps/web/src/routes/checkout.tsx:17`
- Account layout auth gate: `apps/web/src/routes/account/_layout.tsx:13`
- Admin role gate: `apps/web/src/routes/admin/_layout.tsx:12`
- Vendor access gate: `apps/web/src/routes/vendor/_dashboard.tsx:8`

### C) Loader-driven route data (SSR/hybrid-friendly)

`/order-confirmation` uses both auth gate and route loader data fetch:

- `beforeLoad`: `apps/web/src/routes/order-confirmation.tsx:32`
- `loader`: `apps/web/src/routes/order-confirmation.tsx:40`

So this route has explicit router-level data loading, unlike product/catalog/category.

---

## 3) Product Fetching: End-to-End

## A. Product detail page (`/product/$slug`)

### Web side

1. Route param `slug` comes from TanStack Router.
2. `useQuery` runs with `queryKey: ["product-detail", slug]`: `apps/web/src/routes/product/$slug.tsx:68`
3. Query function calls typed RPC endpoint:
   - `api.products[":slug"].detail.$get({ param: { slug } })`: `apps/web/src/routes/product/$slug.tsx:36`

### Server side

Endpoint:

- `GET /api/products/:slug/detail`: `apps/server/src/routes/products.ts:340`

Handler behavior:

1. Reads product + vendor + category + parent + grandparent with active/approved filter:
   - `apps/server/src/routes/products.ts:375`
2. Fetches images/options/skus in parallel:
   - `apps/server/src/routes/products.ts:398`
3. Fetches related products from same category:
   - `apps/server/src/routes/products.ts:428`
4. Builds rich `ProductDetailDTO` (main product, variants, breadcrumb category tree, related products):
   - `apps/server/src/routes/products.ts:547`

### What user interactions then do

- Add to cart calls cart store `addItem({ productId, skuId }, quantity)`: `apps/web/src/routes/product/$slug.tsx:101`
- Buy now stores one-off checkout state in buy-now store and navigates to checkout:
  - `apps/web/src/routes/product/$slug.tsx:118`
  - `apps/web/src/stores/buy-now-store.ts:28`

## B. Listing pages

### `/catalog`

Web:

- Calls `/api/catalog/products`: `apps/web/src/routes/catalog.tsx:48`
- Calls `/api/catalog/facets`: `apps/web/src/routes/catalog.tsx:42`
- Both through `useQuery`: `apps/web/src/routes/catalog.tsx:77`, `apps/web/src/routes/catalog.tsx:84`

Server:

- Products endpoint applies full filter pipeline (q/category/vendor/brand/age overlap/safety/rating/price/sort/pagination):
  - `apps/server/src/routes/catalog.ts:105`
  - `apps/server/src/routes/catalog.ts:216`
  - `apps/server/src/routes/catalog.ts:320`
- Facets endpoint returns categories/vendors/brands/age/safety/price range:
  - `apps/server/src/routes/catalog.ts:396`
  - `apps/server/src/routes/catalog.ts:575`

### `/category/$slug`

Web:

- Calls `/api/category/:slug` with pagination/filter params: `apps/web/src/routes/category/$slug.tsx:53`
- Uses `useQuery`: `apps/web/src/routes/category/$slug.tsx:91`

Server:

- Resolves category and descendants recursively:
  - `apps/server/src/routes/category.ts:194`
- Applies brand + age overlap + rating + price sorting/filtering:
  - `apps/server/src/routes/category.ts:221`
  - `apps/server/src/routes/category.ts:228`
  - `apps/server/src/routes/category.ts:291`

## C. Quick view fetch path (important in catalog cards)

- Product cards call `GET /api/products/:id/quick-view` before add/buy-now decisions:
  - `apps/web/src/components/product-card.tsx:91`
- Quick view modal fetches same endpoint when opened:
  - `apps/web/src/components/quick-view-modal.tsx:50`

---

## 4) Cart Storage and Synchronization Model

## Core idea

Cart is hybrid:

1. Client keeps a persisted snapshot for fast UX.
2. Server is source of truth for stock/pricing/validation.
3. Identity supports both guest and logged-in user.

## A. Guest identity and request headers

- Guest ID key: `kinedao-guest-id`: `apps/web/src/lib/cart-session.ts:1`
- If missing, generated and saved in localStorage: `apps/web/src/lib/cart-session.ts:30`
- Every cart request sends `x-guest-id`: `apps/web/src/lib/cart-session.ts:43`
- Server validates this header by schema for cart routes:
  - `packages/api-types/src/cart.ts:7`
  - `apps/server/src/routes/cart.ts:292`

## B. Cart persistence in browser

- Zustand persist store key: `kinedao-cart-v2`: `apps/web/src/stores/cart-store.ts:357`
- Persisted subset is only `cart` and `itemCount`: `apps/web/src/stores/cart-store.ts:368`
- Storage is `localStorage`: `apps/web/src/stores/cart-store.ts:358`

## C. Server cart data model

- `carts` table: either `userId` or `sessionId` must exist (`ownerCheck`):
  - `packages/db/src/schema/cart.ts:15`
  - `packages/db/src/schema/cart.ts:28`
- `cart_items` unique by `(cartId, productId, skuId)`:
  - `packages/db/src/schema/cart.ts:58`

## D. Runtime flow

### Initial load

- Header ensures guest ID and fetches cart on mount:
  - `apps/web/src/components/header.tsx:93`

### Add item

- Client calls `POST /api/cart/items` via store:
  - `apps/web/src/stores/cart-store.ts:96`
- Server validates product status and stock, creates/updates item:
  - `apps/server/src/routes/cart.ts:307`
  - `apps/server/src/routes/cart.ts:347`
  - `apps/server/src/routes/cart.ts:380`

### Update quantity

- Optimistic local update first, then debounced PATCH (500ms):
  - `apps/web/src/stores/cart-store.ts:124`
  - `apps/web/src/stores/cart-store.ts:150`
- Server re-validates stock and product status:
  - `apps/server/src/routes/cart.ts:408`

### Remove item

- Client does optimistic remove + undo toast:
  - `apps/web/src/stores/cart-store.ts:189`
- Actual delete deferred in `finalizeDelete`:
  - `apps/web/src/stores/cart-store.ts:291`
- Server delete endpoint:
  - `apps/server/src/routes/cart.ts:487`

### Merge guest cart after login

- Triggered in header when session user appears:
  - `apps/web/src/components/header.tsx:98`
- Store calls `POST /api/cart/merge`:
  - `apps/web/src/stores/cart-store.ts:334`
- Server merge behavior:
  - Requires authenticated user: `apps/server/src/routes/cart.ts:552`
  - Reassigns guest cart if user cart missing: `apps/server/src/routes/cart.ts:576`
  - Merges line items with stock cap: `apps/server/src/routes/cart.ts:615`
  - Deletes guest cart afterward: `apps/server/src/routes/cart.ts:637`

## E. Server-side normalization when reading cart

`buildCartResponse` does important cleanup:

- Removes invalid items if product is inactive/unapproved:
  - `apps/server/src/routes/cart.ts:135`
- Resolves image, current stock, SKU details for each line:
  - `apps/server/src/routes/cart.ts:160`
  - `apps/server/src/routes/cart.ts:181`
  - `apps/server/src/routes/cart.ts:214`

This prevents stale client cart data from becoming authoritative.

---

## 5) Session Management (Auth Lifecycle)

## A. Session creation and cookies

- Better-Auth is configured with Drizzle adapter and auth schema:
  - `packages/auth/src/index.ts:65`
- Cookie attributes are set centrally:
  - `sameSite` = `none` (HTTPS) or `lax` (HTTP): `packages/auth/src/index.ts:23`
  - `secure` and `httpOnly`: `packages/auth/src/index.ts:197`
- Underlying tables include `session`, `account`, `verification`, `user`:
  - `packages/db/src/schema/auth.ts:23`

## B. Browser -> API cookie transport

- Hono RPC client always sends `credentials: "include"`:
  - `apps/web/src/lib/api-client.ts:6`
- Server CORS allows credentials and trusted origins:
  - `apps/server/src/index.ts:136`
  - `apps/server/src/index.ts:141`

## C. Per-request user resolution on server

Global middleware on server:

1. Calls `auth.api.getSession` with request headers:
   - `apps/server/src/index.ts:80`
2. Stores current user in Hono context (`c.set("user", ...)`):
   - `apps/server/src/index.ts:127`
3. Every protected route checks `c.var.user?.id`.

Example protected endpoint:

- Orders group route rejects unauthenticated access: `apps/server/src/routes/orders.ts:614`

## D. Web route guards (`beforeLoad`) via server function

Web uses `getUser` server function:

- `getUser` uses `authMiddleware` then returns `context.session`:
  - `apps/web/src/functions/get-user.ts:5`
- `authMiddleware` fetches session using request headers:
  - `apps/web/src/middleware/auth.ts:5`

Guard examples:

- Checkout requires session: `apps/web/src/routes/checkout.tsx:17`
- Account layout requires session: `apps/web/src/routes/account/_layout.tsx:13`
- Admin layout requires admin/super_admin role: `apps/web/src/routes/admin/_layout.tsx:22`
- Vendor layout checks vendor role/application status: `apps/web/src/routes/vendor/_dashboard.tsx:17`

## E. Sign-in and sign-out

- Sign-in uses Better-Auth client:
  - `authClient.signIn.email(...)`: `apps/web/src/components/sign-in-form.tsx:103`
- Sign-out:
  - `authClient.signOut(...)`: `apps/web/src/components/user-menu.tsx:89`

## F. Account deletion/recovery implications for session

- Deletion endpoint soft-deletes account and deletes all session rows:
  - `apps/server/src/routes/account.ts:68`
  - `apps/server/src/routes/account.ts:83`
- Recovery endpoint can restore within recovery window:
  - `apps/server/src/routes/account.ts:97`
- Header effect calls account recover on logged-in session:
  - `apps/web/src/components/header.tsx:110`

---

## 6) Concrete SSR/CSR Classification for Mentor Discussion

Use this language:

1. "We SSR the app shell and route structure through TanStack Start."
2. "Most customer-facing data pages currently fetch data client-side via React Query in components."
3. "Auth and role checks run in route `beforeLoad` using a server function, so access control is enforced before page render."
4. "A few routes use router loaders for route-level data fetching, e.g. order confirmation."

Examples:

- Shell SSR + client data: `/`, `/catalog`, `/category/$slug`, `/product/$slug`, `/cart`
- Route-guard SSR/hybrid: `/checkout`, `/account/*`, `/admin/*`, `/vendor/*`
- Loader-driven data route: `/order-confirmation`

References:

- Root SSR shell composition: `apps/web/src/routes/__root.tsx:163`
- Client-only fallback behavior: `apps/web/src/components/client-only.tsx:17`
- Loader route example: `apps/web/src/routes/order-confirmation.tsx:40`

---

## 7) Mentor Q&A (Short, Precise Answers)

### Q: "Where does product page data come from?"

`/product/$slug` calls `api.products[":slug"].detail.$get` in `useQuery`, and server handles it in `GET /api/products/:slug/detail` where it joins product, vendor, category hierarchy, options, skus, related products.

Refs:

- `apps/web/src/routes/product/$slug.tsx:36`
- `apps/server/src/routes/products.ts:340`

### Q: "Which parts are SSR and which are CSR?"

Shell/layout is SSR-capable via root route + `ClientOnly` fallback; most page data is client-fetched with React Query unless a route has loader logic (`/order-confirmation`).

Refs:

- `apps/web/src/routes/__root.tsx:163`
- `apps/web/src/routes/index.tsx:73`
- `apps/web/src/routes/order-confirmation.tsx:40`

### Q: "Where is cart stored?"

Three places:

1. Browser localStorage snapshot (`kinedao-cart-v2`)
2. Browser guest identity (`kinedao-guest-id`)
3. Server DB tables (`carts`, `cart_items`) as source of truth

Refs:

- `apps/web/src/stores/cart-store.ts:357`
- `apps/web/src/lib/cart-session.ts:1`
- `packages/db/src/schema/cart.ts:15`

### Q: "How does guest cart become user cart?"

After login, header effect triggers `mergeGuestCart(userId)`; server `/api/cart/merge` moves or merges guest cart into user cart with stock-aware quantity caps, then deletes guest cart.

Refs:

- `apps/web/src/components/header.tsx:98`
- `apps/web/src/stores/cart-store.ts:334`
- `apps/server/src/routes/cart.ts:528`

### Q: "How is session verified per request?"

Server middleware calls Better-Auth `getSession` from request headers, then stores user in `c.var.user`; routes authorize using that user.

Refs:

- `apps/server/src/index.ts:80`
- `apps/server/src/index.ts:127`

---

## 8) Engineering Observations (If asked for improvements)

1. Product/catalog/category/home rely on client `useQuery` and do not use route loader prefetch/dehydration. If SEO/perceived performance needs to improve, move critical queries to route loaders or SSR-aware prefetch path.
2. `formatProductCard` in catalog/category performs per-product DB calls for image/sku/option; this can become N+1 under large page sizes.
3. Cart API requires `x-guest-id` even for authenticated requests; it works because guest ID is always initialized, but this is a coupling worth documenting clearly.

