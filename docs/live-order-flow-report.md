# Live deployment QA — 2026-11-02

Target: https://kinedao-web.vercel.app/
Scope: DEPLOYMENT.md Section 5, prioritizing customer checkout and reported issues.

**Latest status and next steps: [QA fix handoff](qa-fix-handoff.md).** The updates below supersede the initial observations where noted.

## Findings

1. **High: invalid shipping fields can crash checkout (local code reproduction).** `apps/web/src/components/checkout/steps/shipping-step.tsx` renders `field.state.meta.errors` directly as `{error}` at lines 309, 332, 354, 376, 414, and 433. Using the actual shipping schema with phone `123` produces a Zod issue object. Passing it to React rendering throws `Objects are not valid as a React child`. This matches the reported error boundary screenshot, but authenticated live reproduction remains pending. Render error messages as strings and verify all required fields, not just phone.

2. **Dark-mode My Orders issue supported by source inspection; live check pending login.** `apps/web/src/routes/account/_layout/orders/index.tsx` uses `bg-gray-50` and `bg-white` throughout without dark variants, while text inherits theme colors. Inspect heading, tabs, order cards, totals and empty state after login.

3. **Live: React hydration error after dark-mode reload.** Toggle dark mode, then navigate directly to catalog. Console reports minified React error #418. Captured in `.playwright-cli/console-2026-11-02T12-38-25-364Z.log`. Root cause was not isolated.

4. **Live: category count mismatch.** Baby Clothing facet displays 580; selecting it yields 480 products at `/catalog?page=1&category=baby-clothing`. Filtering changes URL and results, but the displayed count disagrees.

5. **Corrected after retesting: guest cart works.** Initial empty-cart `/api/cart` requests returned 404. Waiting for Add to Cart to finish confirmed the selected variant and quantity appear, totals recalculate, and the cart survives refresh. The earlier empty-cart observation was premature and is not a confirmed add-to-cart bug.

## Checks completed

- Catalog loads 3,401 products after client data loads.
- Product details open and show variants, stock, price, quantity, Add to Cart and Buy Now.
- Signed-out Buy Now redirects to `/login?redirect=%2Fcheckout%3Fmode%3Dbuy_now`.
- Bangla toggle updates product title and purchase controls; review Sort remains English.
- Dark product-page screenshot captured: `product-dark.png`.
- Product scroll issue not reproduced: after scrolling catalog and clicking a product, `window.scrollY` was 0 on desktop and mobile. Desktop heading top was 285px; mobile heading top was 766px because images precede product information.

## Remaining Section 5 checks

Customer login, invalid-field live reproduction, successful COD order, session refresh, My Orders dark-mode inspection, vendor/admin order review, verification/reset/OAuth, uploads, vendor workflows, notifications/push and controlled API-idle recovery remain untested. Test credentials or permission to create a temporary test account were requested. No orders were placed during live testing.

## Local fixes — 2026-11-02

- Shipping validation now renders each error message instead of passing its object to React. Applied to name, primary/alternate phone, address, city and district. Text inputs expose invalid state and error messages use alert semantics.
- My Orders uses theme-aware background, card, border, muted and foreground tokens for both light and dark modes.
- Verification: workspace type checks and production build passed. A TanStack Form / React rendering regression check using the actual shipping schema confirmed invalid phone and empty required fields block submission and render readable errors; valid values reach the submit handler.
- Changes are local and have not been deployed. Live authenticated checkout, COD order and visual dark-mode verification remain pending. Hydration, category-count and scroll investigations remain separate outstanding items.

## Subsequent browser testing and fixes

- Actual updated shipping component tested in a local browser harness: empty required fields and invalid primary/alternate phone produce inline messages without crashing; corrected address submits once to a mocked API.
- Updated My Orders cards and empty state inspected in light/dark screenshots, including mobile.
- Fixture checkout exercised shipping → COD payment → review → terms → simulated stock conflict → manual retry → confirmation → COD verification. Submission disables while pending, and the simulated conflict does not automatically retry. These checks use mocked responses and do **not** establish live backend order correctness.
- Live guest cart verified with quantity 2 → 3 → 2, corresponding totals ৳27,502 → ৳41,253 → ৳27,502, persistence after refresh, and checkout redirect to login. QA cart item removed afterward.
- Live registration/login empty inputs, password mismatch, and invalid credentials show errors without crashing. Theme/language choices persisted after reload.
- Live mobile filter drawer had its Apply Filters button covered by bottom navigation. Replaced with a Mantine portal drawer; basic local mobile click/apply/selection and Escape checks passed. Final dark/Bangla and focus/scroll regression checks remain.
- Filter options contained nested buttons. Replaced nested checkbox controls with noninteractive Mantine indicators and exposed selection with aria-pressed. Local check found zero nested buttons and retained category selection.
- Confirmation opened notification and COD dialogs together. Local source now waits for the COD modal exit transition before mounting the notification prompt. Final browser retest of this latest sequencing change remains pending.
- Category aggregation now reads immutable direct counts. Regression checks with parent-first, child-first, and mixed category ordering return identical correct totals. API integration retest remains pending.
- Scroll follow-up: 90 frame samples distinguish the outgoing catalog from the mounted product. All 69 sampled product frames had scrollY=0. Product-scroll defect remains unconfirmed; do not treat outgoing catalog frames as a product bug. See `output/playwright/live-navigation-frame-samples.json`.
- Final workspace type checks and production build passed, including the newer drawer, modal and category-count changes.
- Fixes and reports are included in the accompanying commit, along with the rebuilt deployment server bundle. Deployment and live post-push verification are not confirmed. No real COD orders placed or test accounts created. Browser and temporary QA server stopped.
