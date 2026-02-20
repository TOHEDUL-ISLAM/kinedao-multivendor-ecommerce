# PRD — KineDao.com Storefront MVP (Sprint 1)

**Project:** KineDao.com (Baby Products Marketplace)  
**Region:** Bangladesh (Currency: ৳ BDT)  
**Scope:** Frontend only — Home Page + Product Catalog + Quick View  
**Timeline:** 2-week MVP (Sprint 1)

---

## 1) Objective
Build a high-fidelity, interactive, UI-first prototype for a multi-vendor baby products marketplace. The experience should feel **trusted, playful, and vibrant**, with **high-density** commerce layouts (Daraz/Flipkart-style). Data is mocked now but **frontend schema must match a normalized relational database** for seamless backend integration later.

---

## 2) Goals & Success Criteria
**Goals**
- Fast product discovery (search + filters + deals).
- Persistent cart badge across pages and modal interactions.
- Catalog filters that feel production-ready (category/vendor/price/rating).
- High perceived performance (skeletons, lazy images, minimal layout shift).

**Success Criteria**
- Search suggestions appear ≤ 200ms after debounce.
- Cart count updates instantly from any “Add to Cart”.
- Filters/sort persist via URL query params.
- Theme toggle updates all UI surfaces consistently.

---

## 3) Scope
**In scope**
- Global Header
- Hero section (carousel + daily deal card)
- Product catalog (filters, sorting, pagination)
- Product cards + Quick View modal
- Light/Dark theme via Tailwind CSS variables
- BN/EN language toggle (UI text only)

**Out of scope**
- Checkout, payments, order fulfillment
- Real API + database integration
- Vendor/admin dashboards

---

## 4) Tech Stack (Strict)
- **Framework:** TanStack Start (client-side focus) + React 19
- **Routing:** TanStack Router (file-based)
- **Styling:** Tailwind CSS 4
  - CSS Variables in base layer (Light/Dark system)
- **State:** React Context or global store (Cart + Session)
- **Mock Data:** Faker.js
- **Future Backend:** Hono + Drizzle ORM + PostgreSQL

---

## 5) Design System (Light/Dark via CSS Variables)
**Rules**
- No hard-coded hex in components.
- Use semantic tokens mapped to Tailwind utilities.
- Theme switch toggles `.dark` on `<html>`.

**Token groups**
- Foundation: `--background`, `--foreground`, `--surface`, `--surface-2`, `--border`, `--muted`, `--muted-foreground`
- Brand: `--primary`, `--primary-foreground`, `--accent`, `--accent-foreground`
- Commerce: `--success`, `--warning`, `--danger`, `--ring`
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`

**Typography (dense UI)**
- H1: 28–40px, semi-bold, tight leading
- Section title: 18–22px, semi-bold
- Product title: 14–16px, 2-line clamp
- Price: 16–18px, bold
- Meta (vendor/rating): 12–13px, muted

---

## 6) Data Strategy (Normalized Types)
Mock data must reflect relational DB structure.  
**No nested entities** (e.g., `Review` is separate and linked by `productId`).

**Core entities**
- `Vendor` → `Product` (1-many)
- `Category` → `Product` (1-many)
- `Product` → `ProductImage`, `ProductSKU`, `Review` (1-many)
- `Campaign` ↔ `Product` (many-many via join table)

---

## 7) Feature Requirements

### A) Global Header
**Components**
- Logo ("KineDao")
- Search bar (typeahead)
- Language toggle (BN/EN)
- Theme toggle
- Cart icon + badge
- User menu (mock state)

**Behavior**
- Debounced suggestions
- Cart badge updates globally

---

### B) Hero Section (Split Layout)
**Zone 1: Carousel**
- Campaign slider (image, title, CTA)
- Dots + arrows; swipe optional on mobile

**Zone 2: Daily Deal**
- Static promo card
- CTA routes to filtered catalog

---

### C) Product Catalog
**Filters**
- Price range
- Category
- Rating
- Vendor

**Sorting**
- Newest
- Price low/high
- Best selling
- Discount

**Product Card**
- Image, title, vendor name
- Price in ৳ + compare-at + discount badge

**Quick View Modal**
- Gallery thumbnails
- Size/color/variant selector
- Add to cart (SKU-based)

---

## 8) Component Architecture (Key)
- `Header`, `SearchBar`, `LangToggle`, `ThemeToggle`, `CartBadge`
- `HeroCarousel`, `DailyDealCard`
- `CatalogPage`, `FilterPanel`, `SortBar`, `ProductGrid`, `ProductCard`
- `QuickViewModal`, `ImageGallery`, `VariantSelector`
- `CartProvider`, `SessionProvider`, `LanguageProvider`

---

## 9) State Management
- **Cart state:** global (Context/store), persists in localStorage.
- **Session state:** mocked user session for UI.
- **Language state:** BN/EN toggle, persisted.

---

## 10) Acceptance Criteria
- Filters update results and URL params.
- Cart badge updates instantly from any section.
- Quick View modal supports ESC + focus trap.
- Theme toggle updates all surfaces and borders.
- Product prices always display as `৳`.

---

## 11) Timeline (Sprint 1)
**Week 1**
- Tokens + layout + header
- Hero + carousel
- Catalog grid + filters + mock data

**Week 2**
- Quick view modal + variant logic
- Polishing, accessibility, performance

---

## 12) Risks & Mitigation
- **Data mismatch later** → enforce normalized interfaces now.
- **Theme inconsistencies** → tokens only, no hardcoded color.
- **Performance** → lazy images, skeleton loaders, memoization.
