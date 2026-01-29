# Homepage Redesign: Professional Multivendor Baby Marketplace

## TL;DR

> **Quick Summary**: Transform KineDao.com homepage from basic layout to professional multivendor marketplace with AURUM-inspired design patterns, optimized for baby products with warm, trustworthy aesthetics.
> 
> **Deliverables**:
> - Redesigned header with utility bar + main nav + category bar
> - Hero section with carousel + promotional cards
> - 6 product sections (Flash Deals, New Arrivals, Trending, Best Sellers, Recommended, Vendor Spotlight)
> - Shop by Category circular icons (baby-specific)
> - Trust badges section (baby-focused messaging)
> - Enhanced footer with newsletter + multi-column links
> - All components bilingual (EN/BN) and fully responsive
> 
> **Estimated Effort**: Large (15-20 tasks)
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Header → Hero → Product Sections → Footer

---

## Context

### Original Request
User wants homepage redesigned to match professional multivendor marketplace standards (AURUM reference), specifically for baby products. Current implementation lacks polish and doesn't follow multivendor patterns (missing vendor attribution, poor visual hierarchy, no trust signals).

### Interview Summary
**Key Discussions**:
- User provided 6 reference screenshots from AURUM marketplace (dark/light themes)
- Emphasized "stunning", "professional", "top-notch" design
- Must maintain existing bilingual (Bangla/English) functionality
- Theme toggle (dark/light) is priority feature
- All device responsiveness required

**Research Findings**:
- Existing codebase uses TanStack Start SSR with file-based routing
- Translation system via `useTranslation()` hook already in place
- Zustand stores for cart, favorites, language already implemented
- TailwindCSS with OKLCH design tokens in `index.css`
- shadcn/ui components + custom UI primitives
- Better-Auth for login/signup flows

### Metis Review
**Identified Gaps** (addressed):
- Vendor attribution pattern not documented → Will define vendor badge/name display pattern
- Mobile-first responsive breakpoints need explicit definition → Will specify Tailwind breakpoints
- Image optimization strategy undefined → Will use Next.js Image patterns with TanStack
- Performance budget not set → Will add lazy loading + virtualization guardrails

---

## Work Objectives

### Core Objective
Redesign KineDao.com homepage to professional multivendor marketplace standard with baby-appropriate aesthetics, maintaining bilingual support and responsive design across all devices.

### Concrete Deliverables
- `apps/web/src/components/header.tsx` - Enhanced 3-tier header
- `apps/web/src/components/home/hero-section.tsx` - New carousel + promo cards
- `apps/web/src/components/home/trust-badges.tsx` - Updated baby-focused badges
- `apps/web/src/components/home/product-sections.tsx` - Unified product carousel component
- `apps/web/src/components/home/category-circles.tsx` - New circular category icons
- `apps/web/src/components/footer.tsx` - Enhanced footer with newsletter
- `apps/web/src/components/product-card.tsx` - Updated with vendor attribution
- `apps/web/src/lib/i18n/translations.ts` - New translation keys
- `apps/web/src/index.css` - Updated baby-themed color tokens

### Definition of Done
- [ ] Homepage renders on mobile (375px), tablet (768px), desktop (1440px) without horizontal scroll
- [ ] All text uses `t("key")` - zero hard-coded strings
- [ ] Dark/light theme toggle works across all new sections
- [ ] Cart and favorites interactions work on all product cards
- [ ] Lighthouse score: Performance >85, Accessibility >95
- [ ] Vendor name/badge displays on every product card
- [ ] All images lazy-loaded below fold

### Must Have
- Three-tier header (utility bar, main header, category nav)
- Hero carousel with baby product imagery
- Six distinct product sections with carousels
- Circular category icons (minimum 8 baby categories)
- Vendor attribution on all product cards
- Trust badges with baby-specific messaging
- Newsletter subscription in footer
- Countdown timer for Flash Deals

### Must NOT Have (Guardrails)
- No generic e-commerce stock photos (must be baby-focused)
- No hard-coded English text (breaks bilingual requirement)
- No layout shift during image loading (use aspect ratio containers)
- No horizontal scroll on any device size
- No vendor badge if product is direct-from-platform
- No auto-play carousel without pause button (accessibility)
- No discount badges >90% (avoid looking spammy)

---

## Verification Strategy

### Manual Verification (NO automated tests exist)

Each TODO includes EXECUTABLE verification procedures:

**By Deliverable Type:**

| Type | Verification Tool | Automated Procedure |
|------|------------------|---------------------|
| **UI Components** | Playwright browser via playwright skill | Agent navigates, screenshots, validates responsive breakpoints |
| **Translation Coverage** | Bash grep | Agent searches for hard-coded strings in components |
| **Theme Toggle** | Playwright | Agent toggles dark/light, screenshots comparison |
| **API Integration** | curl via Bash | Agent validates /api/home endpoint response |

**Evidence Requirements (Agent-Executable):**
- Screenshots at 375px, 768px, 1440px widths saved to `.sisyphus/evidence/`
- Translation key coverage report (grep for untranslated strings)
- Lighthouse JSON reports for performance/accessibility
- Theme toggle screenshots (light vs dark side-by-side)

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - Start Immediately):
├── Task 1: Update design tokens in index.css (baby theme colors)
├── Task 2: Add new translation keys to translations.ts
└── Task 3: Update ProductCard component with vendor attribution

Wave 2 (Header & Hero - After Wave 1):
├── Task 4: Build 3-tier Header component
├── Task 5: Build Hero carousel with promo cards
└── Task 6: Update Trust Badges with baby messaging

Wave 3 (Content Sections - After Wave 2):
├── Task 7: Build Flash Deals section with countdown
├── Task 8: Build New Arrivals carousel
├── Task 9: Build Trending carousel
├── Task 10: Build Best Sellers carousel
├── Task 11: Build Recommended carousel
└── Task 12: Build Circular Category Icons

Wave 4 (Footer & Integration - After Wave 3):
├── Task 13: Build enhanced Footer with newsletter
├── Task 14: Update index.tsx route with all sections
├── Task 15: Add lazy loading for below-fold sections
└── Task 16: Manual QA across devices + themes

Critical Path: Task 1 → Task 4 → Task 14 → Task 16
Parallel Speedup: ~60% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4, 5, 6 | 2, 3 |
| 2 | None | All (translations needed) | 1, 3 |
| 3 | None | 7-11 | 1, 2 |
| 4 | 1, 2 | 14 | 5, 6 |
| 5 | 1, 2 | 14 | 4, 6 |
| 6 | 1, 2 | 14 | 4, 5 |
| 7-12 | 2, 3 | 14 | Each other (same wave) |
| 13 | 2 | 14 | None |
| 14 | 4-13 | 15, 16 | None |
| 15 | 14 | 16 | None |
| 16 | 15 | None | None (final QA) |

---

## TODOs

- [ ] 1. Update Design Tokens for Baby Theme

  **What to do**:
  - Modify `apps/web/src/index.css` CSS variables
  - Replace primary colors with soft teal/mint (`oklch(0.75 0.12 180)`)
  - Update accent to warm coral/peach (`oklch(0.78 0.14 35)`)
  - Add baby-specific semantic tokens: `--baby-soft`, `--trust-badge-bg`
  - Ensure dark theme variants are warm, not stark
  - Test color contrast ratios (WCAG AA minimum)

  **Must NOT do**:
  - Don't use bright, saturated colors (too aggressive for baby products)
  - Don't remove existing design token structure
  - Don't hard-code colors in components (use CSS vars)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Color system design and theming expertise needed
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Design token architecture and color psychology for baby products

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4, 5, 6 (header/hero need new colors)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `apps/web/src/index.css:1-100` - Current design token structure (OKLCH format, light/dark themes)

  **Design References**:
  - User's Screenshot #6 (baby products page) - Soft teal/mint color scheme, warm imagery
  - WCAG contrast checker: https://webaim.org/resources/contrastchecker/

  **WHY**:
  - `index.css` is the single source of truth for design tokens; all components consume these CSS variables
  - OKLCH format allows perceptual color adjustments while maintaining accessibility

  **Acceptance Criteria**:

  **Manual Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Screenshot: .sisyphus/evidence/task-1-theme-light.png
  3. Click theme toggle
  4. Wait for: 500ms (theme transition)
  5. Screenshot: .sisyphus/evidence/task-1-theme-dark.png
  6. Assert: Both screenshots show soft, baby-appropriate colors (not stark white/black)
  ```

  **Contrast Check via Bash**:
  ```bash
  # Agent validates color contrast ratios
  # Extract primary and background colors from index.css
  grep -E "primary|background" apps/web/src/index.css | head -10
  # Visual inspection: primary on background should be readable
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Light theme with new baby colors
  - [ ] Screenshot: Dark theme with warm tones
  - [ ] Terminal output: CSS variable values extracted

  **Commit**: YES
  - Message: `style(theme): update design tokens for baby products theme`
  - Files: `apps/web/src/index.css`
  - Pre-commit: `bun run check-types`

---

- [ ] 2. Add New Translation Keys

  **What to do**:
  - Edit `apps/web/src/lib/i18n/translations.ts`
  - Add keys for new sections: `header.trackOrder`, `header.helpCenter`, `header.hotline`
  - Add hero keys: `hero.newArrivals.title`, `hero.newArrivals.cta`
  - Add trust badges: `trust.fastDelivery`, `trust.safePackaging`, `trust.easyReturns`, `trust.support24`
  - Add footer: `footer.newsletter.title`, `footer.newsletter.placeholder`, `footer.aboutUs`, `footer.sellOnKineDao`
  - Add vendor: `product.vendor`, `product.verifiedVendor`
  - Add countdown: `deals.endsIn`, `deals.hours`, `deals.minutes`, `deals.seconds`
  - Add category: `category.clothing`, `category.feeding`, `category.toys`, `category.nursery`, `category.diapers`, `category.giftSets`
  - Ensure BOTH `en` and `bn` objects have all keys

  **Must NOT do**:
  - Don't leave any key only in `en` (breaks Bangla support)
  - Don't use placeholders like "TODO" or "TBD" in production
  - Don't change existing translation keys (breaks existing components)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward translation key addition, low complexity
  - **Skills**: []
    - No specialized skills needed (simple JSON-like object editing)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: ALL tasks (every component needs translations)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `apps/web/src/lib/i18n/translations.ts:1-242` - Existing translation structure (en/bn objects, nested keys)

  **Translation Reference**:
  - User's Screenshot #1-6 - Text to translate: "Track Order", "Help Center", "Free shipping", "Today's Deals", "Shop Now", "View All", etc.

  **WHY**:
  - `translations.ts` is the single source of bilingual content
  - TypeScript `TranslationKey` type auto-validates usage in components

  **Acceptance Criteria**:

  **Translation Coverage via Bash**:
  ```bash
  # Agent validates no missing keys
  # Count keys in en vs bn
  grep -o '"[^"]*":' apps/web/src/lib/i18n/translations.ts | grep -A 1000 'en:' | grep -B 1000 'bn:' | wc -l
  # (en count should equal bn count)
  
  # Verify no TODO/TBD placeholders
  grep -i 'TODO\|TBD' apps/web/src/lib/i18n/translations.ts
  # Expected: No matches
  ```

  **Evidence to Capture**:
  - [ ] Terminal output: Key count comparison (en vs bn)
  - [ ] Terminal output: No TODO/TBD found

  **Commit**: YES
  - Message: `feat(i18n): add translation keys for homepage redesign`
  - Files: `apps/web/src/lib/i18n/translations.ts`
  - Pre-commit: `bun run check-types`

---

- [ ] 3. Update ProductCard with Vendor Attribution

  **What to do**:
  - Edit `apps/web/src/components/product-card.tsx`
  - Add `vendor` prop to component interface (name, verified badge)
  - Display vendor name below product title with verified checkmark if applicable
  - Use Lucide `BadgeCheck` icon for verified vendors
  - Style vendor text: smaller font, muted color, flex row with icon
  - Ensure vendor info is bilingual (use `t("product.vendor")`)
  - Update Zustand cart store type if needed to include vendor data

  **Must NOT do**:
  - Don't show vendor for platform-direct products (add conditional)
  - Don't make vendor name clickable yet (Phase 2 feature)
  - Don't break existing product card usage (maintain backward compatibility)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component enhancement with design considerations
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Component composition and visual hierarchy

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 7-11 (product carousels use ProductCard)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `apps/web/src/components/product-card.tsx:1-end` - Current component structure
  - User's Screenshot #2 (AURUM light theme) - Vendor name shown above product title in smaller text

  **Icon Reference**:
  - `lucide-react` BadgeCheck icon for verified badge

  **Type Reference**:
  - `apps/web/src/stores/cart-store.ts` - May need to add vendor to cart item type

  **WHY**:
  - ProductCard is used across all product sections; must support vendor attribution
  - Multivendor marketplace pattern requires clear vendor identification

  **Acceptance Criteria**:

  **Visual Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Wait for: selector ".product-card" to be visible
  3. Screenshot: .sisyphus/evidence/task-3-product-card.png
  4. Assert: Vendor name visible below product title
  5. Assert: Verified badge (checkmark icon) visible for verified vendors
  ```

  **Type Check via Bash**:
  ```bash
  # Agent runs TypeScript check
  bun run check-types
  # Expected: Exit code 0 (no type errors)
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Product card showing vendor name and verified badge
  - [ ] Terminal output: TypeScript check passes

  **Commit**: YES
  - Message: `feat(product-card): add vendor attribution with verified badge`
  - Files: `apps/web/src/components/product-card.tsx`, `apps/web/src/stores/cart-store.ts` (if needed)
  - Pre-commit: `bun run check-types`

---

- [ ] 4. Build 3-Tier Header Component

  **What to do**:
  - Edit `apps/web/src/components/header.tsx`
  - **Tier 1 (Utility Bar)**: Track Order, Help Center, Free Shipping notice, Hotline (right-aligned)
  - **Tier 2 (Main Header)**: Logo (left), Search bar (center), Language toggle, Theme toggle, Wishlist, Cart with badge, User menu (right)
  - **Tier 3 (Category Nav)**: All Categories dropdown (with icon), Flash Deals (highlighted red), New Arrivals, Top Rated, Top Vendors, "KINEDAO CHOICE" badge (right)
  - Use existing `useCartStore` for cart count
  - Use existing `useLanguageStore` for language toggle
  - Implement responsive: Mobile shows hamburger menu, desktop shows full nav
  - Search bar should use existing API endpoint (if available) or placeholder
  - Sticky header on scroll (use `sticky top-0 z-50`)

  **Must NOT do**:
  - Don't implement All Categories dropdown content yet (placeholder OK)
  - Don't add new API calls without checking existing endpoints
  - Don't break existing auth flow (use existing UserMenu component)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex responsive navigation with multiple interaction patterns
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Navigation UX patterns, responsive design, accessibility

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Task 14 (homepage integration)
  - **Blocked By**: Tasks 1, 2 (need colors and translations)

  **References**:

  **Pattern References**:
  - `apps/web/src/components/header.tsx:1-end` - Current header structure
  - `apps/web/src/components/search-bar.tsx` - Existing search component
  - `apps/web/src/components/user-menu.tsx` - Existing user menu
  - `apps/web/src/components/language-toggle.tsx` - Existing language toggle
  - `apps/web/src/stores/cart-store.ts` - Cart count: `getItemCount()`

  **Design References**:
  - User's Screenshot #2 (AURUM light) - Full 3-tier header layout
  - User's Screenshot #3 (AURUM dark) - Dark theme header styling

  **Responsive Pattern**:
  - Mobile: Hamburger → slide-out drawer with category nav
  - Desktop: Full horizontal layout

  **WHY**:
  - Header sets the tone for entire site; must be professional and functional
  - Sticky header improves navigation UX

  **Acceptance Criteria**:

  **Responsive Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Resize viewport: 375x667 (mobile)
  3. Screenshot: .sisyphus/evidence/task-4-header-mobile.png
  4. Assert: Hamburger menu visible, utility bar hidden or condensed
  5. Resize viewport: 1440x900 (desktop)
  6. Screenshot: .sisyphus/evidence/task-4-header-desktop.png
  7. Assert: All three tiers visible, no hamburger menu
  8. Scroll down: 500px
  9. Assert: Header is sticky (still visible at top)
  ```

  **Cart Badge via Bash**:
  ```bash
  # Agent validates cart integration
  grep -n "useCartStore" apps/web/src/components/header.tsx
  # Expected: Found usage of getItemCount()
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Mobile header (375px width)
  - [ ] Screenshot: Desktop header (1440px width)
  - [ ] Screenshot: Sticky header after scroll
  - [ ] Terminal output: Cart store integration confirmed

  **Commit**: YES
  - Message: `feat(header): implement 3-tier header with responsive nav`
  - Files: `apps/web/src/components/header.tsx`
  - Pre-commit: `bun run check-types`

---

- [ ] 5. Build Hero Section with Carousel + Promo Cards

  **What to do**:
  - Create/update `apps/web/src/components/home/hero-section.tsx`
  - **Left side**: Carousel with 3-4 slides (baby product promotions)
  - **Right side**: Grid of 4 promo cards (2x2) with discount badges
  - Carousel: Auto-play (5s interval), manual nav arrows, pause on hover, indicator dots
  - Use `framer-motion` for transitions (existing dependency)
  - Promo cards: Image background, discount badge (top-left), category label, CTA button
  - Responsive: Stack vertically on mobile (carousel full-width, then promo cards)
  - Load images with aspect ratio containers (16:9 for carousel, 1:1 for cards)

  **Must NOT do**:
  - Don't use generic stock images (use baby-specific placeholders or Unsplash baby products)
  - Don't auto-play without pause button (accessibility violation)
  - Don't exceed 5s auto-play interval (UX guideline)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex image-heavy carousel with animations
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Carousel patterns, animation timing, image optimization

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Task 14 (homepage integration)
  - **Blocked By**: Tasks 1, 2 (need colors and translations)

  **References**:

  **Pattern References**:
  - `apps/web/src/components/home/hero-carousel.tsx` - Existing carousel (may already exist)
  - User's Screenshot #2 (AURUM) - Carousel layout with side promo cards
  - User's Screenshot #6 (baby products) - Hero with mother-baby imagery

  **Animation Reference**:
  - `framer-motion` softSpring preset (existing in codebase)

  **Image Aspect Ratios**:
  - Carousel: 16:9 (1200x675px recommended)
  - Promo cards: 1:1 (400x400px recommended)

  **WHY**:
  - Hero section is first impression; must be visually stunning
  - Carousel showcases key promotions, promo cards drive category exploration

  **Acceptance Criteria**:

  **Carousel Interaction via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Wait for: selector ".hero-carousel" to be visible
  3. Screenshot: .sisyphus/evidence/task-5-hero-slide1.png
  4. Wait: 5 seconds (auto-advance)
  5. Screenshot: .sisyphus/evidence/task-5-hero-slide2.png
  6. Assert: Slide changed (different image visible)
  7. Hover over carousel
  8. Wait: 6 seconds
  9. Assert: Slide did NOT change (pause on hover working)
  ```

  **Responsive via Playwright**:
  ```
  # Agent executes:
  1. Resize viewport: 375x667 (mobile)
  2. Screenshot: .sisyphus/evidence/task-5-hero-mobile.png
  3. Assert: Carousel full-width, promo cards stacked below
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Hero section slide 1
  - [ ] Screenshot: Hero section slide 2 (after auto-advance)
  - [ ] Screenshot: Mobile layout (stacked)
  - [ ] Video/GIF: Carousel auto-play and pause behavior

  **Commit**: YES
  - Message: `feat(hero): add carousel with promo cards section`
  - Files: `apps/web/src/components/home/hero-section.tsx`
  - Pre-commit: `bun run check-types`

---

- [ ] 6. Update Trust Badges with Baby Messaging

  **What to do**:
  - Edit `apps/web/src/components/home/trust-badges.tsx`
  - Update 4 badges: Fast Delivery, Safe & Secure Packaging, Easy Returns, 24/7 Support
  - Replace generic icons with baby-appropriate icons (Lucide: Truck, Shield, RotateCcw, Headset)
  - Update messaging for baby products context:
    - "Fast Delivery" → "2-3 days nationwide"
    - "Safe Packaging" → "Baby-safe materials"
    - "Easy Returns" → "7-day return policy"
    - "24/7 Support" → "Always here to help"
  - Use soft background colors (mint/teal tint)
  - Ensure translations: `t("trust.fastDelivery")` etc.

  **Must NOT do**:
  - Don't remove existing trust badges structure
  - Don't use aggressive colors (keep soft and trustworthy)
  - Don't add badges without icons (visual hierarchy needs icons)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple component update with icon + text changes
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Icon selection and trust signal design

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5)
  - **Blocks**: Task 14 (homepage integration)
  - **Blocked By**: Tasks 1, 2 (need colors and translations)

  **References**:

  **Pattern References**:
  - `apps/web/src/components/home/trust-badges.tsx` - Existing component
  - User's Screenshot #1 (AURUM footer) - Trust badges layout
  - User's Screenshot #6 (baby products) - Baby-specific trust messaging

  **Icon Reference**:
  - `lucide-react`: Truck, Shield, RotateCcw, Headset

  **WHY**:
  - Trust badges reduce purchase anxiety for parents buying baby products
  - Baby-specific messaging builds credibility

  **Acceptance Criteria**:

  **Visual Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Scroll to: selector ".trust-badges"
  3. Screenshot: .sisyphus/evidence/task-6-trust-badges.png
  4. Assert: 4 badges visible with icons
  5. Assert: Text shows baby-specific messaging
  ```

  **Translation Check via Bash**:
  ```bash
  # Agent validates translation usage
  grep "trust\." apps/web/src/components/home/trust-badges.tsx
  # Expected: Found t("trust.fastDelivery"), etc.
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Trust badges section
  - [ ] Terminal output: Translation keys found

  **Commit**: YES
  - Message: `feat(trust-badges): update for baby products context`
  - Files: `apps/web/src/components/home/trust-badges.tsx`
  - Pre-commit: `bun run check-types`

---

- [ ] 7. Build Flash Deals Section with Countdown

  **What to do**:
  - Create `apps/web/src/components/home/flash-deals-section.tsx`
  - Section header: "Today's Deals" + countdown timer (hours:minutes:seconds)
  - Horizontal scrollable product carousel (6-8 products visible)
  - Use updated `ProductCard` component (with vendor attribution)
  - Countdown timer: Use `useState` + `useEffect` with interval
  - "View All" link on right side of header
  - Discount badges prominent on product cards (use existing badge component)
  - Fetch data from `/api/home` endpoint (if deals data exists) or use mock data

  **Must NOT do**:
  - Don't fetch from undefined API endpoint (check existing endpoint first)
  - Don't make countdown timer server-dependent (client-side only)
  - Don't show expired deals (filter by end time)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex carousel with real-time countdown logic
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Carousel UX, urgency design patterns, data display

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9, 10, 11, 12)
  - **Blocks**: Task 14 (homepage integration)
  - **Blocked By**: Tasks 2, 3 (need translations and updated ProductCard)

  **References**:

  **Pattern References**:
  - `apps/web/src/components/product-card.tsx` - Updated with vendor
  - `apps/web/src/routes/index.tsx` - Current homepage data fetching
  - User's Screenshot #2 (AURUM) - "Today's Deals" section with countdown

  **API Reference**:
  - `apps/server/src/routes/home.ts` - Check if deals endpoint exists

  **Countdown Pattern**:
  ```typescript
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);
  ```

  **WHY**:
  - Flash deals create urgency and drive conversions
  - Countdown timer increases perceived scarcity

  **Acceptance Criteria**:

  **Carousel Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Scroll to: selector ".flash-deals"
  3. Screenshot: .sisyphus/evidence/task-7-flash-deals.png
  4. Assert: Countdown timer visible and ticking (wait 2s, check if seconds changed)
  5. Assert: Horizontal scroll enabled (carousel scrollable)
  6. Assert: "View All" link visible
  ```

  **Product Card Integration via Bash**:
  ```bash
  # Agent validates ProductCard usage
  grep "ProductCard" apps/web/src/components/home/flash-deals-section.tsx
  # Expected: Found import and usage
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Flash deals section with countdown
  - [ ] Video/GIF: Countdown timer ticking
  - [ ] Terminal output: ProductCard integration confirmed

  **Commit**: YES
  - Message: `feat(flash-deals): add deals carousel with countdown timer`
  - Files: `apps/web/src/components/home/flash-deals-section.tsx`
  - Pre-commit: `bun run check-types`

---

- [ ] 8. Build New Arrivals Carousel

  **What to do**:
  - Create `apps/web/src/components/home/new-arrivals-section.tsx`
  - Section header: "New Arrivals" + "View All" link
  - Horizontal scrollable product carousel (6-8 products visible)
  - Use updated `ProductCard` component
  - Show "NEW" badge on product cards (if product has `isNew` flag)
  - Fetch from `/api/home` or `/api/catalog?sort=newest` (check existing endpoints)
  - Responsive: 1 product on mobile, 3 on tablet, 6 on desktop

  **Must NOT do**:
  - Don't duplicate Flash Deals component (create reusable ProductCarousel component if patterns repeat)
  - Don't fetch without pagination (limit to first 12 items)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Product carousel with responsive grid
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Carousel patterns, responsive design

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 9, 10, 11, 12)
  - **Blocks**: Task 14 (homepage integration)
  - **Blocked By**: Tasks 2, 3 (need translations and updated ProductCard)

  **References**:

  **Pattern References**:
  - `apps/web/src/components/product-card.tsx` - Use this component
  - User's Screenshot #6 (baby products) - "New Arrivals" section

  **API Reference**:
  - `apps/server/src/routes/catalog.ts` - Check for sort=newest parameter

  **Reusability Note**:
  - If Tasks 7-11 have similar carousel logic, extract shared `ProductCarousel` component

  **WHY**:
  - New arrivals keep content fresh and encourage repeat visits
  - Parents want latest baby products

  **Acceptance Criteria**:

  **Carousel Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Scroll to: selector ".new-arrivals"
  3. Screenshot: .sisyphus/evidence/task-8-new-arrivals.png
  4. Assert: Section header "New Arrivals" visible
  5. Assert: Horizontal carousel with products visible
  6. Resize viewport: 375px width
  7. Screenshot: .sisyphus/evidence/task-8-new-arrivals-mobile.png
  8. Assert: 1 product visible in viewport (mobile responsive)
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: New Arrivals desktop
  - [ ] Screenshot: New Arrivals mobile (1 product visible)

  **Commit**: YES
  - Message: `feat(new-arrivals): add new arrivals product carousel`
  - Files: `apps/web/src/components/home/new-arrivals-section.tsx`
  - Pre-commit: `bun run check-types`

---

- [ ] 9. Build Trending Carousel

  **What to do**:
  - Create `apps/web/src/components/home/trending-section.tsx`
  - Section header: "Trending Products" + "View All" link
  - Horizontal scrollable product carousel (6-8 products visible)
  - Use updated `ProductCard` component
  - Show "HOT" badge on trending products (if product has `isTrending` flag)
  - Fetch from `/api/home` or `/api/catalog?sort=trending` (check existing endpoints)
  - Responsive: Same as New Arrivals (1 mobile, 3 tablet, 6 desktop)

  **Must NOT do**:
  - Don't duplicate carousel code (consider shared component)
  - Don't show trending badge on all products (only flagged ones)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Product carousel variation
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Carousel patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 10, 11, 12)
  - **Blocks**: Task 14 (homepage integration)
  - **Blocked By**: Tasks 2, 3 (need translations and updated ProductCard)

  **References**:

  **Pattern References**:
  - `apps/web/src/components/product-card.tsx` - Use this component
  - Task 8 implementation - Reuse carousel pattern

  **API Reference**:
  - `apps/server/src/routes/catalog.ts` - Check for trending sort

  **WHY**:
  - Trending products leverage social proof to drive conversions

  **Acceptance Criteria**:

  **Carousel Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Scroll to: selector ".trending"
  3. Screenshot: .sisyphus/evidence/task-9-trending.png
  4. Assert: Section header "Trending Products" visible
  5. Assert: "HOT" badge visible on some products
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Trending section

  **Commit**: YES
  - Message: `feat(trending): add trending products carousel`
  - Files: `apps/web/src/components/home/trending-section.tsx`
  - Pre-commit: `bun run check-types`

---

- [ ] 10. Build Best Sellers/Most Purchased Carousel

  **What to do**:
  - Create `apps/web/src/components/home/best-sellers-section.tsx`
  - Section header: "Best Sellers" or "Most Purchased" + "View All" link
  - Horizontal scrollable product carousel (6-8 products visible)
  - Use updated `ProductCard` component
  - Show purchase count or star rating prominently
  - Fetch from `/api/home` or `/api/catalog?sort=best-selling`
  - Responsive: Same as previous carousels

  **Must NOT do**:
  - Don't fabricate purchase numbers (use real data or hide count)
  - Don't show out-of-stock products in best sellers

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Product carousel variation
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Carousel patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 9, 11, 12)
  - **Blocks**: Task 14 (homepage integration)
  - **Blocked By**: Tasks 2, 3 (need translations and updated ProductCard)

  **References**:

  **Pattern References**:
  - `apps/web/src/components/product-card.tsx` - Use this component
  - Tasks 8, 9 - Reuse carousel pattern

  **API Reference**:
  - `apps/server/src/routes/catalog.ts` - Check for best-selling sort

  **WHY**:
  - Best sellers provide social proof and guide purchase decisions

  **Acceptance Criteria**:

  **Carousel Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Scroll to: selector ".best-sellers"
  3. Screenshot: .sisyphus/evidence/task-10-best-sellers.png
  4. Assert: Section header "Best Sellers" visible
  5. Assert: Star ratings or purchase counts visible on cards
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Best Sellers section

  **Commit**: YES
  - Message: `feat(best-sellers): add best selling products carousel`
  - Files: `apps/web/src/components/home/best-sellers-section.tsx`
  - Pre-commit: `bun run check-types`

---

- [ ] 11. Build Recommended/Personalized Carousel

  **What to do**:
  - Create `apps/web/src/components/home/recommended-section.tsx`
  - Section header: "Recommended for You" + "View All" link
  - Horizontal scrollable product carousel (6-8 products visible)
  - Use updated `ProductCard` component
  - For MVP: Show random/featured products (personalization in Phase 2)
  - Fetch from `/api/home` or use random selection from catalog
  - Responsive: Same as previous carousels

  **Must NOT do**:
  - Don't claim personalization without actual user data (header text should be generic if not personalized)
  - Don't duplicate products from other sections (filter overlap)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Product carousel variation
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Carousel patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 9, 10, 12)
  - **Blocks**: Task 14 (homepage integration)
  - **Blocked By**: Tasks 2, 3 (need translations and updated ProductCard)

  **References**:

  **Pattern References**:
  - `apps/web/src/components/product-card.tsx` - Use this component
  - Tasks 8, 9, 10 - Reuse carousel pattern

  **API Reference**:
  - `apps/server/src/routes/home.ts` - Check for featured/random products

  **WHY**:
  - Recommended section drives exploration and discovery

  **Acceptance Criteria**:

  **Carousel Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Scroll to: selector ".recommended"
  3. Screenshot: .sisyphus/evidence/task-11-recommended.png
  4. Assert: Section header "Recommended for You" visible
  5. Assert: Products shown are different from Flash Deals/New Arrivals
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Recommended section

  **Commit**: YES
  - Message: `feat(recommended): add recommended products carousel`
  - Files: `apps/web/src/components/home/recommended-section.tsx`
  - Pre-commit: `bun run check-types`

---

- [ ] 12. Build Circular Category Icons

  **What to do**:
  - Create `apps/web/src/components/home/category-circles.tsx`
  - Display 8-10 circular category icons in a horizontal scrollable row
  - Categories (baby-specific): Clothing, Feeding, Toys, Nursery, Diapers & Care, Gift Sets, Bath & Skincare, Safety & Health
  - Each circle: Category icon (Lucide or custom), category name below
  - Circles should be clickable → navigate to `/catalog?category={slug}`
  - Use soft background colors (different tint per category)
  - Responsive: 3 circles mobile, 5 tablet, 8-10 desktop (horizontal scroll on mobile)

  **Must NOT do**:
  - Don't use generic e-commerce categories (must be baby-specific)
  - Don't make circles too small on mobile (min 80px diameter)
  - Don't navigate without category filter (links must apply filter)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Icon selection and circular layout design
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Icon-based navigation, circular layout patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8, 9, 10, 11)
  - **Blocks**: Task 14 (homepage integration)
  - **Blocked By**: Task 2 (need category translations)

  **References**:

  **Pattern References**:
  - User's Screenshot #2 (AURUM) - "Shop by Category" circular icons
  - User's Screenshot #5 (dark theme) - Category circles layout

  **Icon Reference**:
  - `lucide-react`: Shirt (Clothing), Baby (Feeding), Toy, Bed (Nursery), Sparkles (Care), Gift, Droplet (Bath), Shield (Safety)

  **Navigation**:
  - Use TanStack Router `Link` component to `/catalog?category={slug}`

  **WHY**:
  - Category circles enable quick navigation and discovery
  - Visual icons improve scannability for busy parents

  **Acceptance Criteria**:

  **Visual Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Scroll to: selector ".category-circles"
  3. Screenshot: .sisyphus/evidence/task-12-categories-desktop.png
  4. Assert: 8-10 circular icons visible
  5. Resize viewport: 375px width
  6. Screenshot: .sisyphus/evidence/task-12-categories-mobile.png
  7. Assert: 3 circles visible, horizontal scroll enabled
  8. Click first category circle
  9. Assert: URL changed to /catalog?category=...
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Category circles desktop
  - [ ] Screenshot: Category circles mobile (scrollable)
  - [ ] Screenshot: Catalog page after category click (URL with filter)

  **Commit**: YES
  - Message: `feat(categories): add circular category navigation`
  - Files: `apps/web/src/components/home/category-circles.tsx`
  - Pre-commit: `bun run check-types`

---

- [ ] 13. Build Enhanced Footer with Newsletter

  **What to do**:
  - Edit `apps/web/src/components/footer.tsx`
  - **Top section**: Newsletter subscription (email input + Subscribe button)
  - **Trust badges row**: Same as Task 6 badges (condensed icons + text)
  - **Multi-column links**:
    - About Us: About KineDao, Careers, Press, Blog
    - Shop By: All Categories, New Arrivals, Best Sellers, Deals
    - Customer Service: Contact Us, FAQ, Track Order, Return Policy, Shipping Info
    - Sell on KineDao: Become a Seller, Seller Login, Seller Guidelines, Seller Support
    - Contact: Phone (৮৮০০X), Email, Address (Dhaka, Bangladesh)
  - **Social icons row**: Facebook, Instagram, Twitter/X, LinkedIn, YouTube (Lucide icons)
  - **Payment methods**: Show logos (bKash, Nagad, Rocket, COD) or text
  - **Copyright + Legal**: "© 2026 KineDao. All rights reserved." + Terms & Conditions, Privacy Policy
  - Use bilingual translations for all text
  - Responsive: Stack columns on mobile (1 column), 2 columns on tablet, 5 columns on desktop

  **Must NOT do**:
  - Don't make newsletter subscription functional yet (placeholder form OK, Phase 2 for API)
  - Don't link to non-existent pages (use `#` or `/coming-soon` placeholder)
  - Don't forget COD payment method (critical for Bangladesh market)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex multi-column layout with responsive design
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Footer patterns, link organization, newsletter forms

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 6 trust badges)
  - **Parallel Group**: None (runs alone after Wave 3)
  - **Blocks**: Task 14 (homepage integration)
  - **Blocked By**: Task 2 (need footer translations)

  **References**:

  **Pattern References**:
  - User's Screenshot #1 (AURUM footer light) - Multi-column layout, newsletter
  - User's Screenshot #4 (AURUM footer dark) - Dark theme footer

  **Social Icons**:
  - `lucide-react`: Facebook, Instagram, Twitter, Linkedin, Youtube

  **Payment Methods**:
  - bKash, Nagad, Rocket (Bangladesh mobile payments), COD (Cash on Delivery)

  **WHY**:
  - Footer provides navigation, builds trust, collects leads (newsletter)
  - Multi-column structure improves information architecture

  **Acceptance Criteria**:

  **Visual Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Scroll to: selector "footer"
  3. Screenshot: .sisyphus/evidence/task-13-footer-desktop.png
  4. Assert: Newsletter input visible
  5. Assert: 5 link columns visible
  6. Assert: Social icons visible
  7. Assert: Payment method logos/text visible
  8. Resize viewport: 375px width
  9. Screenshot: .sisyphus/evidence/task-13-footer-mobile.png
  10. Assert: Columns stacked vertically
  ```

  **Translation Check via Bash**:
  ```bash
  # Agent validates translation usage
  grep "footer\." apps/web/src/components/footer.tsx
  # Expected: Found t("footer.newsletter"), t("footer.aboutUs"), etc.
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Footer desktop (5 columns)
  - [ ] Screenshot: Footer mobile (stacked)
  - [ ] Terminal output: Translation keys found

  **Commit**: YES
  - Message: `feat(footer): add enhanced footer with newsletter and multi-column links`
  - Files: `apps/web/src/components/footer.tsx`
  - Pre-commit: `bun run check-types`

---

- [ ] 14. Update Homepage Route with All Sections

  **What to do**:
  - Edit `apps/web/src/routes/index.tsx`
  - Import all new components: HeroSection, FlashDealsSection, NewArrivalsSection, TrendingSection, BestSellersSection, RecommendedSection, CategoryCircles, TrustBadges
  - Arrange sections in order:
    1. HeroSection
    2. TrustBadges
    3. CategoryCircles
    4. FlashDealsSection
    5. NewArrivalsSection
    6. TrendingSection
    7. BestSellersSection
    8. RecommendedSection
  - Add section spacing (margin/padding between sections)
  - Ensure Header and Footer (from __root.tsx) wrap the page
  - Fetch data from `/api/home` endpoint if available, or use component-level fetching
  - Add loading states for sections (skeleton loaders or spinners)

  **Must NOT do**:
  - Don't remove existing homepage logic without testing
  - Don't hardcode section order (consider making it configurable in future)
  - Don't block entire page render if one section fails (graceful degradation)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Page composition and layout orchestration
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Page layout, section composition, loading states

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on all previous tasks)
  - **Parallel Group**: None (critical path, runs after Wave 3)
  - **Blocks**: Tasks 15, 16 (final optimization and QA)
  - **Blocked By**: Tasks 4-13 (all sections must be complete)

  **References**:

  **Pattern References**:
  - `apps/web/src/routes/index.tsx` - Current homepage structure
  - `apps/web/src/routes/__root.tsx` - Header/Footer mounting

  **API Reference**:
  - `apps/server/src/routes/home.ts` - Homepage data endpoint

  **Loading Pattern**:
  - Use TanStack Query `isLoading` state + Skeleton component (shadcn/ui)

  **WHY**:
  - Homepage is the central integration point for all components
  - Section order impacts user flow and conversion

  **Acceptance Criteria**:

  **Full Page Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Wait for: selector ".hero-section" to be visible
  3. Screenshot: .sisyphus/evidence/task-14-homepage-top.png
  4. Scroll: 1000px down
  5. Screenshot: .sisyphus/evidence/task-14-homepage-mid.png
  6. Scroll: to bottom
  7. Screenshot: .sisyphus/evidence/task-14-homepage-bottom.png
  8. Assert: All 8 sections visible in correct order
  9. Assert: No layout shift during scroll
  ```

  **Section Order via Bash**:
  ```bash
  # Agent validates section order in code
  grep -n "Section" apps/web/src/routes/index.tsx | head -20
  # Expected: HeroSection → TrustBadges → CategoryCircles → FlashDeals → ... (in order)
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Homepage top (hero + trust badges)
  - [ ] Screenshot: Homepage middle (product sections)
  - [ ] Screenshot: Homepage bottom (footer visible)
  - [ ] Terminal output: Section order confirmed

  **Commit**: YES
  - Message: `feat(homepage): integrate all redesigned sections`
  - Files: `apps/web/src/routes/index.tsx`
  - Pre-commit: `bun run check-types`

---

- [ ] 15. Add Lazy Loading for Below-Fold Sections

  **What to do**:
  - Update `apps/web/src/routes/index.tsx` and section components
  - Implement lazy loading for sections below the fold:
    - Hero, Trust Badges, Categories → Load immediately (above fold)
    - Flash Deals, New Arrivals → Lazy load with `IntersectionObserver`
    - Trending, Best Sellers, Recommended → Lazy load
  - Use React `lazy()` + `Suspense` or custom `IntersectionObserver` hook
  - Add Skeleton loaders for lazy-loaded sections (shadcn/ui Skeleton component)
  - Prefetch data on hover for "View All" links (TanStack Query `prefetchQuery`)

  **Must NOT do**:
  - Don't lazy load above-fold content (hurts LCP)
  - Don't lazy load without fallback (use Skeleton, not blank space)
  - Don't block interactivity during lazy load (progressive enhancement)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Performance optimization with technical complexity
  - **Skills**: []
    - No specialized skill needed (React patterns)

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 14)
  - **Parallel Group**: None
  - **Blocks**: Task 16 (final QA)
  - **Blocked By**: Task 14 (all sections must be integrated)

  **References**:

  **Pattern References**:
  - React `lazy()`: https://react.dev/reference/react/lazy
  - `IntersectionObserver` hook pattern

  **Performance Target**:
  - LCP (Largest Contentful Paint) < 2.5s
  - Reduce initial bundle size by ~30% (lazy load reduces initial load)

  **WHY**:
  - Lazy loading improves initial page load performance
  - Critical for mobile users on slow networks

  **Acceptance Criteria**:

  **Performance Verification via Playwright**:
  ```
  # Agent executes:
  1. Navigate to: http://localhost:3001
  2. Wait for: selector ".hero-section" to be visible
  3. Assert: Flash Deals section NOT in DOM yet (lazy)
  4. Scroll to: 500px (bring Flash Deals into viewport)
  5. Wait for: selector ".flash-deals" to be visible
  6. Assert: Flash Deals section now loaded
  7. Screenshot: .sisyphus/evidence/task-15-lazy-load.png
  ```

  **Bundle Size via Bash**:
  ```bash
  # Agent checks build output
  bun run build
  # Look for reduced initial bundle size in build output
  ```

  **Evidence to Capture**:
  - [ ] Screenshot: Page load with lazy sections not yet rendered
  - [ ] Screenshot: Lazy sections loaded after scroll
  - [ ] Terminal output: Build bundle sizes

  **Commit**: YES
  - Message: `perf(homepage): add lazy loading for below-fold sections`
  - Files: `apps/web/src/routes/index.tsx`, section components
  - Pre-commit: `bun run check-types && bun run build`

---

- [ ] 16. Manual QA Across Devices + Themes

  **What to do**:
  - Test homepage on 3 viewport sizes: Mobile (375px), Tablet (768px), Desktop (1440px)
  - Test both Light and Dark themes on all viewport sizes
  - Test Bangla and English languages on all combinations
  - Verify all interactive elements work: Cart add, Wishlist, Category clicks, Carousel nav, Theme toggle, Language toggle
  - Check for accessibility: Keyboard navigation, focus states, ARIA labels
  - Run Lighthouse audit: Performance >85, Accessibility >95, Best Practices >90, SEO >90
  - Document any bugs found in `.sisyphus/evidence/qa-report.md`
  - Take screenshots of all viewport + theme + language combinations (12 screenshots total)

  **Must NOT do**:
  - Don't skip any combination (all 12 must be tested)
  - Don't ignore accessibility warnings (must fix critical issues)
  - Don't deploy without passing Lighthouse thresholds

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Comprehensive manual testing requiring attention to detail
  - **Skills**: [`playwright`]
    - `playwright`: Browser automation for systematic QA testing

  **Parallelization**:
  - **Can Run In Parallel**: NO (final verification step)
  - **Parallel Group**: None
  - **Blocks**: None (final task)
  - **Blocked By**: Task 15 (all optimizations must be complete)

  **References**:

  **Testing Matrix**:
  - 3 viewports × 2 themes × 2 languages = 12 combinations
  - Mobile (375px): Light EN, Light BN, Dark EN, Dark BN
  - Tablet (768px): Light EN, Light BN, Dark EN, Dark BN
  - Desktop (1440px): Light EN, Light BN, Dark EN, Dark BN

  **Lighthouse**:
  - Run via Chrome DevTools or `lighthouse-ci`

  **WHY**:
  - Final QA catches integration issues and ensures production readiness
  - Lighthouse scores validate performance and accessibility

  **Acceptance Criteria**:

  **Full Matrix Testing via Playwright**:
  ```
  # Agent executes all 12 combinations:
  # Example for Mobile Light EN:
  1. Navigate to: http://localhost:3001
  2. Set theme: light (via localStorage or toggle)
  3. Set language: en (via localStorage or toggle)
  4. Resize viewport: 375x667
  5. Screenshot: .sisyphus/evidence/qa-mobile-light-en.png
  6. Test interactions: Add to cart, toggle wishlist, click category, scroll carousel
  7. Assert: All interactions work without errors
  
  # Repeat for all 12 combinations
  ```

  **Lighthouse via Bash**:
  ```bash
  # Agent runs Lighthouse audit
  # (Requires Lighthouse CLI or manual Chrome DevTools run)
  # Expected: Performance >85, Accessibility >95
  ```

  **QA Report**:
  ```markdown
  # QA Report - Homepage Redesign

  ## Test Date: [Date]

  ## Viewports Tested
  - [x] Mobile (375px)
  - [x] Tablet (768px)
  - [x] Desktop (1440px)

  ## Themes Tested
  - [x] Light
  - [x] Dark

  ## Languages Tested
  - [x] English
  - [x] Bangla

  ## Bugs Found
  - [List any issues]

  ## Lighthouse Scores
  - Performance: [score]
  - Accessibility: [score]
  - Best Practices: [score]
  - SEO: [score]

  ## Screenshots
  [Links to all 12 screenshots]
  ```

  **Evidence to Capture**:
  - [ ] 12 screenshots (all viewport × theme × language combinations)
  - [ ] Lighthouse JSON report
  - [ ] QA report markdown file

  **Commit**: NO (QA task, no code changes)
  - If bugs found → Fix → New commit → Re-run QA

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `style(theme): update design tokens for baby products theme` | apps/web/src/index.css | bun run check-types |
| 2 | `feat(i18n): add translation keys for homepage redesign` | apps/web/src/lib/i18n/translations.ts | bun run check-types |
| 3 | `feat(product-card): add vendor attribution with verified badge` | apps/web/src/components/product-card.tsx | bun run check-types |
| 4 | `feat(header): implement 3-tier header with responsive nav` | apps/web/src/components/header.tsx | bun run check-types |
| 5 | `feat(hero): add carousel with promo cards section` | apps/web/src/components/home/hero-section.tsx | bun run check-types |
| 6 | `feat(trust-badges): update for baby products context` | apps/web/src/components/home/trust-badges.tsx | bun run check-types |
| 7 | `feat(flash-deals): add deals carousel with countdown timer` | apps/web/src/components/home/flash-deals-section.tsx | bun run check-types |
| 8 | `feat(new-arrivals): add new arrivals product carousel` | apps/web/src/components/home/new-arrivals-section.tsx | bun run check-types |
| 9 | `feat(trending): add trending products carousel` | apps/web/src/components/home/trending-section.tsx | bun run check-types |
| 10 | `feat(best-sellers): add best selling products carousel` | apps/web/src/components/home/best-sellers-section.tsx | bun run check-types |
| 11 | `feat(recommended): add recommended products carousel` | apps/web/src/components/home/recommended-section.tsx | bun run check-types |
| 12 | `feat(categories): add circular category navigation` | apps/web/src/components/home/category-circles.tsx | bun run check-types |
| 13 | `feat(footer): add enhanced footer with newsletter and multi-column links` | apps/web/src/components/footer.tsx | bun run check-types |
| 14 | `feat(homepage): integrate all redesigned sections` | apps/web/src/routes/index.tsx | bun run check-types |
| 15 | `perf(homepage): add lazy loading for below-fold sections` | apps/web/src/routes/index.tsx, section components | bun run check-types && bun run build |
| 16 | N/A (QA task) | N/A | Manual QA + Lighthouse |

---

## Success Criteria

### Verification Commands
```bash
# Type check
bun run check-types

# Build (verify no errors)
bun run build

# Dev server (manual testing)
bun run dev:web

# Check for hard-coded strings (should return empty)
grep -r "Add to cart\|New Arrivals\|Flash Deals" apps/web/src/components apps/web/src/routes --include="*.tsx" --include="*.ts" | grep -v "translation"
```

### Final Checklist
- [ ] All "Must Have" sections present
- [ ] All "Must NOT Have" guardrails respected
- [ ] All text uses translation keys (zero hard-coded)
- [ ] Vendor attribution on every product card
- [ ] Responsive: No horizontal scroll on mobile/tablet/desktop
- [ ] Themes: Dark/Light both work across all sections
- [ ] Languages: EN/BN both complete and functional
- [ ] Performance: Lighthouse >85 Performance, >95 Accessibility
- [ ] Images: All lazy-loaded below fold
- [ ] Countdown: Flash Deals timer works and updates
- [ ] Carousels: Auto-play + manual nav + pause on hover
- [ ] Category circles: Clickable and navigate with filter
- [ ] Newsletter: Form present (functional in Phase 2)
- [ ] Payment methods: COD + mobile payments shown in footer
