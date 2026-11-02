# KineDao QA and fix handoff — 2026-11-02

This is the current continuation checklist. Read together with [live QA report](live-order-flow-report.md), [older gap analysis](product/gap-analysis.md), and [deployment checklist Section 5](../DEPLOYMENT.md#5-verify-the-full-application).

## Current state

This handoff accompanies the application fix commit. The latest type checks and production build passed before pushing. Deployment status and live verification after the push remain unconfirmed. Testing used Playwright CLI; `playwright-interactive` could not run because this session has no `js_repl` tool.

No live COD orders were placed. No customer account was created. Authenticated live checkout is blocked by the lack of a verified test login; signup requires email verification. Temporary local fixtures bypassed auth only inside the isolated harness and mocked API responses. They are not evidence that live authentication or backend order creation works.

## Implemented fixes and verification

| Issue | Local change | Verification / remaining limit |
| --- | --- | --- |
| Invalid phone crashes checkout | Render validation messages instead of Zod objects for all six validated fields; add invalid-state/alert semantics | Actual shipping component passed browser empty-field, invalid primary/alternate phone and correction tests; valid address submitted once to mocked API |
| My Orders unreadable in dark mode | Replace fixed white/gray surfaces with semantic theme tokens | Light/dark order-card and empty-state screenshots reviewed; desktop and mobile; live signed-in verification pending |
| Mobile filter Apply button covered by bottom nav | Mantine portal Drawer at z-index 400, scrollable content, separate footer, safe-area spacing, accessible close, translated Apply label | Basic local click/apply/selection and Escape tests passed; finish final dark/Bangla, small-screen and focus checks |
| Nested buttons in filters | Use noninteractive Mantine checkbox indicators inside filter buttons; expose selection using aria-pressed | Local category toggle retained selection; zero nested buttons in tested fixture; check all other filter groups |
| Notification modal overlaps COD confirmation | COD initially open; mount notification prompt after COD exit transition completes | Original overlap reproduced and captured; **latest sequencing fix needs final browser retest** |
| Category facet counts inflated | Preserve immutable direct product counts during descendant aggregation | Parent-first, child-first and mixed-order regression checks pass; **API integration retest pending** |

Latest `bun run check-types` passed for server and web. `git diff --check` passed. The final production build also passed for the later drawer, modal and category-count fixes. The rebuilt tracked server bundle is included because the root deployment entry imports it.

## Source files changed

- `apps/web/src/components/checkout/steps/shipping-step.tsx`
- `apps/web/src/routes/account/_layout/orders/index.tsx`
- `apps/web/src/components/catalog/filter-sidebar.tsx`
- `apps/web/src/lib/i18n/translations.ts`
- `apps/web/src/components/checkout/cod-verification-modal.tsx`
- `apps/web/src/routes/order-confirmation.tsx`
- `apps/server/src/routes/catalog.ts`

## Next steps, in order

1. **Finish local verification before deployment.** Review the seven source diffs; type checks and the production build have passed for this commit. Check final drawer and modal changes below. Do not claim all Section 5 checks passed.
2. **Filter drawer:** at 360×800 and 390×844, light/dark and EN/BN, open → select → Apply → reopen → clear. Confirm footer fully visible/clickable above bottom navigation; Escape/close/backdrop work; focus returns to trigger; background cannot scroll; category/brand/vendor/rating selections each toggle once. Check category groups for nested interactive elements.
3. **Confirmation dialogs:** use a fresh local browser with notification dismissal unset. Initially show only COD. On “I'll Do Later”, close button, and successful COD verification, wait for the exit animation and then allow the notification prompt. Sample during transition as well as after it; never show two dialogs. A failed COD request must retain COD and not open notifications. Check mobile and dark mode.
4. **Category counts:** compare `/api/catalog/facets` counts with `/api/catalog/products?category=baby-clothing` totals on the updated API. Also test another parent, a child, a leaf, zero products and direct products on a parent. Live before fix: Baby Clothing facet 580 versus listing 480. Keep aggregate counts independent of category ordering.
5. **Get a verified customer test login**, plus vendor/admin test logins for their parts. Test a real flow through the UI: product variant/quantity → cart or Buy Now → invalid phone inline error → corrected address → correct shipping → COD → terms → one order → confirmation → My Orders/details. Match product/SKU, quantity, address, subtotal, per-vendor shipping and total. Verify session and order survive refresh. Review that test order as its vendor and as admin.
6. **Investigate hydration error #418.** Reproduced on live reload in dark mode and with persisted language/cart state. Nested filter buttons are now corrected locally, but the root cause of the wider reload error is not proven. Reproduce against updated local production build with console diagnostics; check persisted language/theme/cart and responsive SSR rendering before changing SSR strategy.
7. **Revisit product scroll report only with a specific failing reproduction.** Settled desktop/mobile navigation passed. A 90-frame follow-up showed all mounted-product frames at scrollY=0; scrolled frames were the outgoing catalog. Do not claim this is fixed or confirmed. On mobile the product title naturally starts below the image gallery (~764px); discuss layout expectations if this is the complaint.
8. **Complete remaining deployment Section 5 checks:** verified login refresh, email verification/reset and enabled OAuth; product image/banner/vendor document uploads; vendor application/editing; reviews; notifications and push subscription; controlled API-idle recovery without duplicate writes. Use dedicated test data and record results separately from fixtures.
9. **Deploy after review/authorization**, then repeat the critical customer order flow against the actual updated web and API deployments. Do not deploy automatically based on the previous testing request. Never rerun seed scripts against the live database.

## Earlier reports: what is stale

- The initial live QA report's guest-cart failure was premature. Retest passed adding a selected variant, quantity changes 2→3→2, correct totals and refresh persistence. Empty-cart GET 404 messages alone do not prove add-to-cart failure. QA item was removed afterward.
- `docs/product/gap-analysis.md` says homepage categories are static and not linked. Current source already passes `data?.topCategories` into `CategoriesSection`, accepts category props, and links category items to `/catalog`. Verify the current live behavior; do not redo this blindly.
- That older report requests `/product/$productId`. Current route is `/product/$slug`, and product cards already link to it. Product navigation worked live. Check image/title and Quick View independently rather than introducing a duplicate route.
- Keep the unified `/catalog` query/filter strategy. No route rewrite is needed merely to match older wording.
- “Infinite scroll” and “fully integrated dark mode” in the older report are not current signoff claims: live catalog showed pagination, and dark-mode defects were found. Empty-state Reset All remains an enhancement to verify, not a completed fix in this session.

## Evidence and resuming locally

Artifacts: `output/playwright/` (local workspace only; screenshots and temporary harness files are intentionally not part of the fix commit). Useful reviewed screenshots:

- [Shipping errors, light](../output/playwright/local-validation-final-light.png)
- [Shipping errors, dark mobile](../output/playwright/local-validation-final-dark-mobile.png)
- [My Orders, light](../output/playwright/local-orders-light.png)
- [My Orders, dark](../output/playwright/local-orders-dark.png)
- [My Orders, dark mobile](../output/playwright/local-orders-dark-mobile.png)
- [My Orders empty state, dark](../output/playwright/local-orders-empty-dark.png)
- [Live broken filter drawer](../output/playwright/live-mobile-filters.png)
- [Local drawer after initial fix](../output/playwright/fixed-filter-mobile-light.png)
- [Original overlapping dialogs](../output/playwright/local-cod-dialog-mobile.png)
- [Live cart, dark desktop](../output/playwright/live-cart-dark-desktop.png)
- [Live cart, Bangla/light](../output/playwright/live-cart-light-bangla.png)
- [Product navigation frame data](../output/playwright/live-navigation-frame-samples.json)

Temporary harness files are in `apps/web/output/playwright/`. They import actual source components and mock user/order data. Restart from `apps/web` with `bunx vite --config output/playwright/qa-vite.config.ts`; open `http://127.0.0.1:3011/output/playwright/qa.html`. Fixture request mock code is in `output/playwright/install-checkout-mocks.js` and was installed through CLI `run-code`; it needs a fixture shipping address set before confirmation preview. Test normal controls for signoff. Keep fixtures/artifacts out of production routes and commits; remove or archive temporary harness files once retesting finishes. Browser and QA server are stopped.

Do not use `fixed-filter-final-dark-mobile.png` as proof of the drawer fix: that capture followed a harness navigation timeout and shows the wrong view. No final dark-mode drawer signoff was completed.
