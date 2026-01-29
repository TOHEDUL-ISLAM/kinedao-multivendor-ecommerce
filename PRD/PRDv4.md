# কিনেদাও (KineDao.com)
## Spec-Driven Technical PRD - Full Implementation Guide
### *Baby Products Marketplace - Epics 2-10*

---

| Field | Value |
|-------|-------|
| **Document Version** | 4.0 (Spec-Driven Technical Edition) |
| **Last Updated** | January 2026 |
| **Status** | Ready for ClickUp Implementation |
| **Team** | Team Hadi |
| **Completed** | Epic 1 (Authentication) ✅ |
| **Remaining Epics** | 2-10 (9 Epics) |

---

## Document Purpose

This spec-driven PRD provides **implementation-ready specifications** for each user story including:

1. **Domain-Specific Requirements** - Baby product nuances (safety, age ranges, certifications)
2. **ClickUp-Ready Checklists** - Copy-paste acceptance criteria with `[ ]` checkboxes
3. **Sad Path Scenarios** - Negative testing cases for each story
4. **Schema Validation** - Critical database fields and constraints
5. **API Contracts** - Expected request/response structures

---

## Responsive Design Requirements

### Breakpoint Definitions

| Breakpoint | Width | Target Devices | Tailwind Class |
|------------|-------|----------------|----------------|
| **Mobile S** | 320px | iPhone SE, Galaxy S8 | `xs:` (custom) |
| **Mobile M** | 375px | iPhone 12/13/14, Pixel 5 | `sm:` default |
| **Mobile L** | 425px | iPhone 14 Pro Max, large Android | `sm:` |
| **Tablet** | 768px | iPad Mini, iPad Air | `md:` |
| **Laptop** | 1024px | iPad Pro, small laptops | `lg:` |
| **Desktop** | 1280px | Standard monitors | `xl:` |
| **Large Desktop** | 1536px | Large monitors, 4K | `2xl:` |

### Device Testing Matrix

All features MUST be tested on these device configurations:

| Device | Screen Size | OS | Browser | Priority |
|--------|-------------|-----|---------|----------|
| iPhone SE | 375×667 | iOS 16+ | Safari | P0 |
| iPhone 14 | 390×844 | iOS 16+ | Safari | P0 |
| iPhone 14 Pro Max | 430×932 | iOS 16+ | Safari | P1 |
| Samsung Galaxy S21 | 360×800 | Android 12+ | Chrome | P0 |
| Samsung Galaxy A52 | 412×915 | Android 11+ | Chrome | P0 |
| Xiaomi Redmi Note | 393×873 | Android 11+ | Chrome | P1 |
| iPad Mini | 768×1024 | iPadOS | Safari | P1 |
| iPad Air | 820×1180 | iPadOS | Safari | P1 |
| Desktop | 1920×1080 | Windows/Mac | Chrome/Firefox | P0 |
| Laptop | 1366×768 | Windows | Chrome | P0 |

### Touch Target Requirements

| Element Type | Minimum Size | Recommended Size | Spacing |
|--------------|--------------|------------------|---------|
| Buttons | 44×44px | 48×48px | 8px gap |
| Links (inline) | 44px height | 48px height | - |
| Form inputs | 44px height | 48px height | 16px gap |
| Icon buttons | 44×44px | 48×48px | 8px gap |
| Checkboxes/Radio | 24×24px (visible) + 44×44px (tap area) | - | 12px gap |
| List items (tappable) | 48px height | 56px height | 1px border |

### Typography Scale (Responsive)

```css
/* Mobile First Typography */
:root {
  /* Headings */
  --h1-size: clamp(1.75rem, 5vw, 2.5rem);    /* 28px → 40px */
  --h2-size: clamp(1.5rem, 4vw, 2rem);        /* 24px → 32px */
  --h3-size: clamp(1.25rem, 3vw, 1.5rem);     /* 20px → 24px */
  --h4-size: clamp(1.125rem, 2.5vw, 1.25rem); /* 18px → 20px */
  
  /* Body */
  --body-size: 1rem;           /* 16px - never smaller */
  --small-size: 0.875rem;      /* 14px - minimum for readability */
  --caption-size: 0.75rem;     /* 12px - only for non-essential text */
  
  /* Line heights */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

### Responsive Layout Patterns

```
┌─────────────────────────────────────────────────────────────┐
│ MOBILE (< 768px)                                            │
├─────────────────────────────────────────────────────────────┤
│ • Single column layout                                      │
│ • Bottom navigation bar (fixed)                             │
│ • Hamburger menu for navigation                             │
│ • Full-width cards                                          │
│ • Stacked form fields                                       │
│ • Collapsible filters (bottom sheet)                        │
│ • Horizontal scroll for product carousels                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ TABLET (768px - 1023px)                                     │
├─────────────────────────────────────────────────────────────┤
│ • Two column layouts where appropriate                      │
│ • Sidebar navigation (collapsible)                          │
│ • 2-3 product cards per row                                 │
│ • Side-by-side form fields (short fields)                   │
│ • Slide-out filter panel                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DESKTOP (≥ 1024px)                                          │
├─────────────────────────────────────────────────────────────┤
│ • Multi-column layouts                                      │
│ • Persistent sidebar navigation                             │
│ • 3-4 product cards per row                                 │
│ • Inline form fields                                        │
│ • Always-visible filter sidebar                             │
│ • Hover states enabled                                      │
└─────────────────────────────────────────────────────────────┘
```

### Global Responsive Checklist (Apply to ALL Stories)

**Layout & Structure:**
- [ ] Content readable without horizontal scrolling at 320px width
- [ ] No content cutoff at any breakpoint
- [ ] Proper spacing maintained (not too cramped on mobile)
- [ ] Max content width capped at 1440px on large screens
- [ ] Content centered with appropriate margins on large screens

**Navigation:**
- [ ] Mobile: Hamburger menu or bottom navigation
- [ ] Tablet: Collapsible sidebar or top navigation
- [ ] Desktop: Full navigation visible
- [ ] Active state clearly visible on all devices
- [ ] Back button accessible on mobile

**Images:**
- [ ] Images scale proportionally
- [ ] Art direction changes for key images (different crops per device)
- [ ] Lazy loading implemented
- [ ] Placeholder shown during load
- [ ] srcset/sizes attributes for responsive images

**Forms:**
- [ ] Input fields full-width on mobile
- [ ] Appropriate keyboard type (tel, email, number)
- [ ] Labels above fields on mobile, inline on desktop (where appropriate)
- [ ] Error messages visible without scrolling
- [ ] Submit button full-width on mobile

**Touch & Interaction:**
- [ ] All interactive elements meet 44×44px minimum
- [ ] Adequate spacing between tap targets
- [ ] No hover-only interactions (provide tap alternatives)
- [ ] Swipe gestures have button alternatives
- [ ] Pull-to-refresh where appropriate (optional)

**Performance:**
- [ ] Critical CSS inlined for above-fold content
- [ ] Images optimized for each breakpoint
- [ ] Font subsetting for Bangla characters
- [ ] First Contentful Paint < 1.8s on 4G
- [ ] Largest Contentful Paint < 2.5s on 4G

---

## Baby Product Domain Glossary

| Term | Description | Database Field |
|------|-------------|----------------|
| **Age Range** | Target age for product (0-3m, 3-6m, 6-12m, 1-2y, 2-3y) | `age_range_min`, `age_range_max` |
| **Safety Certification** | BSTI, CE, ASTM F963 compliance | `safety_certifications[]` |
| **BPA-Free** | Bisphenol-A free (critical for feeding items) | `is_bpa_free` |
| **Organic** | GOTS certified organic materials | `is_organic` |
| **Formula Regulation** | Bangladesh BSTI infant formula rules | `requires_prescription` |
| **Choking Hazard** | Small parts warning for <3 years | `has_small_parts` |
| **Weight Limit** | Max child weight for carriers/seats | `weight_limit_kg` |
| **Expiry Date** | For consumables (diapers, formula, wipes) | `expiry_date` |

---

## Database Schema Overview

### Core Tables Required (in addition to auth tables)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    vendors      │────▶│    products     │────▶│  product_images │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │ product_variants│
        │               └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ vendor_payouts  │     │   cart_items    │────▶│     carts       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │     orders      │────▶│   order_items   │
                        └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │ shipping_address│
                        └─────────────────┘
```

---

# EPIC 2: Homepage & Navigation

**Priority:** P0 - Must Have | **Total Points:** 3  
**Status:** 🟡 In Progress (Basic layout done, needs acceptance criteria verification)

---

## US-2.1: Homepage Layout

**Points:** 2 | **Priority:** P0  
**Dependencies:** None  
**Route:** `/`

### Schema: Categories Table

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_bn VARCHAR(100) NOT NULL,
  description_en TEXT,
  description_bn TEXT,
  image_url VARCHAR(500),
  icon_name VARCHAR(50),           -- lucide icon name
  parent_id UUID REFERENCES categories(id),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Baby-specific category metadata
  min_age_months INT DEFAULT 0,    -- Category age range start
  max_age_months INT DEFAULT 36,   -- Category age range end
  safety_notice_en TEXT,           -- Category-level safety info
  safety_notice_bn TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Required Baby Product Categories

| Slug | Name (EN) | Name (BN) | Age Range | Safety Notice |
|------|-----------|-----------|-----------|---------------|
| `feeding` | Feeding & Nursing | খাওয়ানো ও স্তন্যপান | 0-24m | Check BPA-free certification |
| `diapers` | Diapers & Wipes | ডায়াপার ও ওয়াইপস | 0-36m | Check expiry date before use |
| `clothing` | Baby Clothing | শিশুর পোশাক | 0-36m | Avoid loose buttons/ties |
| `toys` | Toys & Games | খেলনা | 0-36m | Check age recommendation |
| `nursery` | Nursery & Furniture | নার্সারি | 0-36m | Follow assembly instructions |
| `bath` | Bath & Skincare | গোসল ও স্কিনকেয়ার | 0-36m | Patch test before first use |
| `health` | Health & Safety | স্বাস্থ্য ও নিরাপত্তা | 0-36m | Consult doctor if needed |
| `travel` | Travel & Gear | ভ্রমণ | 0-36m | Check weight limits |

### UI Components

```
HomePage
├── Header
│   ├── Logo (links to /)
│   ├── SearchBar (placeholder: "Search baby products...")
│   ├── LanguageToggle (EN/বাং)
│   ├── ThemeToggle (light/dark)
│   ├── CartIcon (with badge count)
│   └── UserMenu (Login/Register or Profile dropdown)
├── HeroSection
│   ├── PromotionalBanner (image + CTA)
│   └── TrustBadges ("Verified Sellers", "Safe Products", "COD Available")
├── CategoryGrid
│   └── CategoryCard[] (8 cards, 4x2 grid on desktop)
├── FeaturedProducts
│   ├── SectionTitle ("Featured Products" / "বৈশিষ্ট্যযুক্ত পণ্য")
│   └── ProductCard[] (8 cards, horizontal scroll on mobile)
├── AgeGroupSection (NEW - Baby Domain Specific)
│   ├── SectionTitle ("Shop by Age" / "বয়স অনুযায়ী কিনুন")
│   └── AgeCard[] ("0-3 months", "3-6 months", "6-12 months", "1-2 years", "2-3 years")
└── Footer
    ├── QuickLinks (About, Contact, Terms, Privacy)
    ├── ContactInfo
    └── Copyright
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path:**
- [ ] `Header` component renders with logo linking to `/`
- [ ] Logo displays "কিনেদাও" text or brand image
- [ ] `SearchBar` accepts text input and shows placeholder text
- [ ] `SearchBar` placeholder shows in selected language (EN: "Search baby products..." / BN: "শিশু পণ্য খুঁজুন...")
- [ ] `LanguageToggle` displays current language indicator (EN/বাং)
- [ ] `ThemeToggle` switches between light and dark mode
- [ ] `CartIcon` displays item count badge from cart state (default: 0)
- [ ] `CartIcon` badge hidden when count is 0
- [ ] `UserMenu` shows "Login" and "Register" buttons when logged out
- [ ] `UserMenu` shows profile dropdown with "My Orders", "Logout" when logged in
- [ ] `HeroSection` displays promotional banner image
- [ ] `TrustBadges` display 3 trust indicators with icons
- [ ] `CategoryGrid` renders exactly 8 category cards
- [ ] Each `CategoryCard` shows: icon, name (in selected language), product count
- [ ] Clicking `CategoryCard` navigates to `/category/[slug]`
- [ ] `FeaturedProducts` section displays 8 `ProductCard` components
- [ ] `ProductCard` shows: image, title, price (৳ symbol), vendor name
- [ ] `ProductCard` shows age range badge (e.g., "0-6 months")
- [ ] `AgeGroupSection` displays 5 age range cards
- [ ] Clicking age card navigates to `/products?age=[range]`
- [ ] `Footer` renders with all required links
- [ ] All text content switches language when toggle is used

**Sad Path / Negative Testing:**
- [ ] Verify homepage loads without products (shows "Coming soon" in FeaturedProducts)
- [ ] Verify homepage loads without categories (shows "Categories loading..." skeleton)
- [ ] Verify broken category image shows fallback placeholder
- [ ] Verify broken product image shows fallback placeholder
- [ ] Verify extremely long category name truncates with ellipsis
- [ ] Verify homepage is accessible when API is slow (shows loading skeletons)
- [ ] Verify cart icon updates when item added from another tab (if using real-time)

**Performance:**
- [ ] Homepage loads within 2 seconds on 3G connection
- [ ] Images lazy load below the fold
- [ ] Category and product data cached appropriately

**Responsive Design (Mobile - 320px to 767px):**
- [ ] Header collapses to: Logo, Search icon, Cart icon, Hamburger menu
- [ ] Search bar expands to full-width overlay when search icon tapped
- [ ] Language toggle accessible in hamburger menu
- [ ] HeroSection banner scales proportionally, text remains readable
- [ ] CategoryGrid displays as 2×4 grid (2 columns, 4 rows)
- [ ] Category cards minimum 44×44px tap target
- [ ] FeaturedProducts horizontal scroll with snap points
- [ ] Product cards minimum width 160px in carousel
- [ ] AgeGroupSection horizontal scroll
- [ ] Footer stacks vertically, full-width sections
- [ ] All text minimum 16px (1rem)
- [ ] Bottom padding accounts for mobile browser chrome (env(safe-area-inset-bottom))

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] Header shows: Logo, Search bar (compact), Language toggle, Cart, User menu
- [ ] CategoryGrid displays as 4×2 grid (4 columns, 2 rows)
- [ ] FeaturedProducts displays 3-4 cards visible
- [ ] Product cards in grid layout (3 per row)
- [ ] Footer displays in 2-3 column layout

**Responsive Design (Desktop - 1024px+):**
- [ ] Header fully expanded with all elements visible
- [ ] Search bar full-width in header center
- [ ] CategoryGrid displays as 4×2 grid with larger cards
- [ ] FeaturedProducts displays 4 cards per row
- [ ] Product cards show hover states
- [ ] Footer displays in 4 column layout
- [ ] Max content width 1440px, centered

**Device-Specific Testing:**
- [ ] iPhone SE (375px): All content accessible, no horizontal scroll
- [ ] iPhone 14 (390px): Layout balanced, touch targets adequate
- [ ] Samsung Galaxy (360px): Smallest common Android, layout intact
- [ ] iPad (768px): Tablet layout activates correctly
- [ ] Desktop (1920px): No excessive whitespace, content centered

---

## US-2.2: Language Toggle (Bangla/English)

**Points:** 1 | **Priority:** P0  
**Dependencies:** US-2.1  
**State Management:** Global context or Zustand store

### Schema: User Preferences (Optional - can use localStorage)

```sql
-- If storing server-side:
ALTER TABLE users ADD COLUMN preferred_language VARCHAR(2) DEFAULT 'en';
```

### Translation Structure

```typescript
// packages/i18n/translations.ts
export const translations = {
  en: {
    common: {
      search_placeholder: "Search baby products...",
      cart: "Cart",
      login: "Login",
      register: "Register",
      logout: "Logout",
    },
    home: {
      featured_products: "Featured Products",
      shop_by_age: "Shop by Age",
      categories: "Categories",
      trust_verified: "Verified Sellers",
      trust_safe: "Safe Products", 
      trust_cod: "Cash on Delivery",
    },
    product: {
      add_to_cart: "Add to Cart",
      out_of_stock: "Out of Stock",
      age_range: "Age Range",
      safety_warning: "Safety Warning",
      bpa_free: "BPA Free",
      organic: "Organic",
    },
    // ... more sections
  },
  bn: {
    common: {
      search_placeholder: "শিশু পণ্য খুঁজুন...",
      cart: "কার্ট",
      login: "লগইন",
      register: "নিবন্ধন",
      logout: "লগআউট",
    },
    home: {
      featured_products: "বৈশিষ্ট্যযুক্ত পণ্য",
      shop_by_age: "বয়স অনুযায়ী কিনুন",
      categories: "বিভাগসমূহ",
      trust_verified: "যাচাইকৃত বিক্রেতা",
      trust_safe: "নিরাপদ পণ্য",
      trust_cod: "ক্যাশ অন ডেলিভারি",
    },
    product: {
      add_to_cart: "কার্টে যোগ করুন",
      out_of_stock: "স্টক নেই",
      age_range: "বয়সসীমা",
      safety_warning: "নিরাপত্তা সতর্কতা",
      bpa_free: "বিপিএ মুক্ত",
      organic: "জৈব",
    },
    // ... more sections
  }
};
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path:**
- [ ] `LanguageToggle` component renders in Header
- [ ] Toggle displays "EN" when English is selected
- [ ] Toggle displays "বাং" when Bangla is selected
- [ ] Clicking toggle opens dropdown with both options
- [ ] Selecting "English" sets language to English
- [ ] Selecting "বাংলা" sets language to Bangla
- [ ] Language selection updates all static UI text immediately
- [ ] Language preference saved to `localStorage` with key `kineDao_language`
- [ ] Page refresh maintains selected language
- [ ] New browser tab reads language from localStorage
- [ ] Header text changes: "Login" ↔ "লগইন"
- [ ] Header text changes: "Register" ↔ "নিবন্ধন"
- [ ] Category names display in selected language
- [ ] Product titles display in selected language (if bilingual data exists)
- [ ] Footer links display in selected language
- [ ] Button labels change language
- [ ] Form labels change language
- [ ] Error messages display in selected language
- [ ] Date formats adapt to locale (optional)
- [ ] Number formats adapt to locale (৳ symbol consistent)

**Sad Path / Negative Testing:**
- [ ] Verify fallback to English if localStorage is corrupted
- [ ] Verify fallback to English if translation key is missing
- [ ] Verify toggle works when JavaScript is slow to load
- [ ] Verify long Bangla text doesn't break layout
- [ ] Verify mixed content (user-generated in one language) displays correctly

**Accessibility:**
- [ ] Toggle is keyboard accessible (Tab + Enter)
- [ ] Toggle has appropriate ARIA labels
- [ ] Screen reader announces language change

**Responsive Design:**
- [ ] Mobile: Language toggle in hamburger menu or settings
- [ ] Mobile: Toggle uses full-width list items (not dropdown)
- [ ] Mobile: Each language option minimum 48px height
- [ ] Tablet: Toggle in header, compact dropdown
- [ ] Desktop: Toggle in header with flag icons + text
- [ ] Touch target minimum 44×44px on all devices
- [ ] Dropdown doesn't overflow viewport on mobile
- [ ] Selected language clearly indicated (checkmark or highlight)

---

# EPIC 3: Product Catalog

**Priority:** P0 - Must Have | **Total Points:** 7  
**Status:** 🔴 Not Started

---

## Schema: Products Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  
  -- Basic Info (Bilingual)
  title_en VARCHAR(200) NOT NULL,
  title_bn VARCHAR(200),
  slug VARCHAR(250) UNIQUE NOT NULL,
  description_en TEXT,
  description_bn TEXT,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),        -- Original price for showing discount
  cost_price DECIMAL(10,2),              -- Vendor's cost (for profit calculation)
  
  -- Inventory
  stock_quantity INT NOT NULL DEFAULT 0,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  track_inventory BOOLEAN DEFAULT true,
  
  -- Baby Product Specific Fields ⭐
  age_range_min INT DEFAULT 0,           -- Minimum age in months
  age_range_max INT DEFAULT 36,          -- Maximum age in months
  is_bpa_free BOOLEAN DEFAULT false,     -- Critical for feeding products
  is_organic BOOLEAN DEFAULT false,      -- GOTS certified
  is_hypoallergenic BOOLEAN DEFAULT false,
  has_small_parts BOOLEAN DEFAULT false, -- Choking hazard warning
  weight_limit_kg DECIMAL(5,2),          -- For carriers, seats, etc.
  expiry_date DATE,                      -- For consumables
  batch_number VARCHAR(50),              -- For traceability
  
  -- Safety & Compliance
  safety_certifications TEXT[],          -- Array: ['BSTI', 'CE', 'ASTM F963']
  safety_warning_en TEXT,
  safety_warning_bn TEXT,
  country_of_origin VARCHAR(100),
  manufacturer VARCHAR(200),
  
  -- Product Attributes
  brand VARCHAR(100),
  material VARCHAR(200),
  color VARCHAR(100),
  size VARCHAR(100),
  weight_grams INT,
  dimensions_cm VARCHAR(50),             -- "L x W x H"
  
  -- Status & Moderation
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected, archived
  rejection_reason TEXT,
  is_featured BOOLEAN DEFAULT false,
  
  -- SEO
  meta_title VARCHAR(200),
  meta_description VARCHAR(500),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_price CHECK (price > 0),
  CONSTRAINT valid_stock CHECK (stock_quantity >= 0),
  CONSTRAINT valid_age_range CHECK (age_range_min <= age_range_max),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'archived'))
);

-- Indexes
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_age_range ON products(age_range_min, age_range_max);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
```

### Schema: Product Images Table

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  alt_text_en VARCHAR(200),
  alt_text_bn VARCHAR(200),
  display_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);
```

---

## US-3.1: Category Page with Product Grid

**Points:** 2 | **Priority:** P0  
**Dependencies:** Categories seeded, Products table created  
**Route:** `/category/[slug]`

### API Endpoints

```typescript
// GET /api/categories/:slug/products
// Query params: page, limit, sort, minPrice, maxPrice, brands[], ageRange

interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    availableBrands: string[];
    priceRange: { min: number; max: number };
    ageRanges: string[];
  };
}
```

### UI Components

```
CategoryPage (/category/[slug])
├── Breadcrumb ("Home > Feeding & Nursing")
├── CategoryHeader
│   ├── CategoryTitle (in selected language)
│   ├── ProductCount ("24 products" / "২৪টি পণ্য")
│   └── CategoryDescription (optional)
├── FilterSortBar (mobile: collapsible)
│   ├── FilterButton (opens FilterDrawer on mobile)
│   └── SortDropdown
├── MainContent (flex layout)
│   ├── FilterSidebar (desktop only)
│   │   ├── PriceRangeFilter (min-max slider)
│   │   ├── BrandFilter (checkbox list)
│   │   ├── AgeRangeFilter (checkbox: 0-3m, 3-6m, etc.) ⭐ Baby-specific
│   │   ├── SafetyFilter (BPA-Free, Organic checkboxes) ⭐ Baby-specific
│   │   └── ClearFiltersButton
│   └── ProductGrid
│       └── ProductCard[] (12 per page)
├── Pagination
│   ├── PageNumbers
│   └── ItemsPerPage selector
└── EmptyState (when no products match filters)
```

### ProductCard Component Structure

```
ProductCard
├── ProductImage (with lazy loading)
│   ├── DiscountBadge (if compare_at_price exists)
│   └── AgeRangeBadge ("0-6m") ⭐ Baby-specific
├── ProductInfo
│   ├── VendorName (small, muted)
│   ├── ProductTitle (truncate 2 lines)
│   ├── SafetyBadges (icons: BPA-free, Organic) ⭐ Baby-specific
│   ├── PriceSection
│   │   ├── CurrentPrice ("৳1,200")
│   │   └── ComparePrice (strikethrough, if discounted)
│   └── StockStatus ("In Stock" / "Out of Stock")
└── QuickActions
    └── AddToCartButton (or "View Details" if has variants)
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Page Structure:**
- [ ] `/category/[slug]` route renders CategoryPage component
- [ ] Invalid category slug shows 404 page
- [ ] Breadcrumb shows "Home > [Category Name]"
- [ ] Breadcrumb links are clickable
- [ ] CategoryHeader displays category name in selected language
- [ ] CategoryHeader displays product count (e.g., "24 products")
- [ ] Product count updates when filters applied

**Happy Path - Product Grid:**
- [ ] ProductGrid displays up to 12 ProductCards per page
- [ ] ProductCard shows product image (primary image)
- [ ] ProductCard shows product title (truncated to 2 lines)
- [ ] ProductCard shows price with ৳ symbol
- [ ] ProductCard shows vendor/shop name
- [ ] ProductCard shows age range badge (e.g., "0-6m", "1-2y")
- [ ] ProductCard shows discount percentage if compare_at_price exists
- [ ] ProductCard shows "BPA Free" badge if `is_bpa_free = true`
- [ ] ProductCard shows "Organic" badge if `is_organic = true`
- [ ] ProductCard shows "Out of Stock" overlay if `stock_quantity = 0`
- [ ] Clicking ProductCard navigates to `/product/[slug]`
- [ ] Products sorted by newest (created_at DESC) by default
- [ ] Only products with `status = 'approved'` are displayed

**Happy Path - Filters:**
- [ ] FilterSidebar visible on desktop (>768px)
- [ ] FilterButton visible on mobile, opens drawer
- [ ] PriceRangeFilter shows min/max inputs
- [ ] PriceRangeFilter updates URL params on change
- [ ] BrandFilter shows checkbox list of available brands
- [ ] BrandFilter shows product count per brand
- [ ] AgeRangeFilter shows checkboxes: "0-3 months", "3-6 months", "6-12 months", "1-2 years", "2-3 years"
- [ ] SafetyFilter shows "BPA Free" and "Organic" checkboxes
- [ ] Selecting filter updates product grid without page reload
- [ ] Multiple filters can be combined (AND logic)
- [ ] Active filters shown as removable chips/tags
- [ ] "Clear All Filters" button resets all filters
- [ ] Filter state persisted in URL query params

**Happy Path - Sorting:**
- [ ] SortDropdown shows options: "Newest", "Price: Low to High", "Price: High to Low", "Name A-Z"
- [ ] Selecting sort option updates product order
- [ ] Sort selection persisted in URL param `?sort=price_asc`

**Happy Path - Pagination:**
- [ ] Pagination shows page numbers when > 12 products
- [ ] Clicking page number loads that page
- [ ] Current page highlighted
- [ ] "Previous" and "Next" buttons work correctly
- [ ] Page number in URL param `?page=2`
- [ ] Scrolls to top when page changes

**Sad Path / Negative Testing:**
- [ ] Category with 0 products shows EmptyState: "No products in this category yet"
- [ ] Filters resulting in 0 products shows: "No products match your filters"
- [ ] Invalid page number (e.g., page=999) redirects to page 1
- [ ] Invalid sort param ignored, uses default
- [ ] Price filter with min > max shows validation error
- [ ] API error shows error message with retry button
- [ ] Slow API shows loading skeleton grid
- [ ] Network timeout shows offline message

**Schema Validation:**
- [ ] Query only returns products where `status = 'approved'`
- [ ] Query only returns products where `stock_quantity >= 0`
- [ ] Age range filter queries `age_range_min` and `age_range_max` columns
- [ ] BPA-free filter queries `is_bpa_free = true`
- [ ] Organic filter queries `is_organic = true`

**Responsive Design (Mobile - 320px to 767px):**
- [ ] Breadcrumb truncates with ellipsis if too long
- [ ] CategoryHeader stacks: title, then count below
- [ ] FilterSidebar hidden, replaced with "Filter" button
- [ ] "Filter" button opens full-screen bottom sheet or drawer
- [ ] Filter bottom sheet has "Apply" and "Clear" buttons fixed at bottom
- [ ] SortDropdown compact, shows current selection
- [ ] ProductGrid displays 2 columns
- [ ] Product cards minimum width 150px
- [ ] Product card image aspect ratio 1:1
- [ ] Product title max 2 lines with ellipsis
- [ ] Price and badges fit on one line
- [ ] Pagination uses compact style (< 1 2 3 ... 10 >)
- [ ] Sticky "Filter" and "Sort" bar at top when scrolling
- [ ] Pull-to-refresh to reload products (optional)

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] FilterSidebar as slide-out panel from left
- [ ] ProductGrid displays 3 columns
- [ ] Filter panel width max 320px
- [ ] Sort and filter controls in single row

**Responsive Design (Desktop - 1024px+):**
- [ ] FilterSidebar always visible on left (240-280px width)
- [ ] ProductGrid displays 3-4 columns depending on screen
- [ ] Product cards show hover effect (shadow, slight zoom)
- [ ] Quick "Add to Cart" button appears on hover
- [ ] Pagination shows more page numbers

**Touch Interactions:**
- [ ] Filter checkboxes have 44×44px tap area
- [ ] Price range uses touch-friendly slider OR input fields
- [ ] "Clear filters" easily tappable
- [ ] Product cards entire area is tappable (not just image)
- [ ] Pagination buttons minimum 44×44px

**Device-Specific Testing:**
- [ ] iPhone SE (375px): 2-column grid, filter drawer works
- [ ] iPhone 14 Pro Max (430px): Still 2 columns, larger cards
- [ ] Samsung Galaxy A52 (412px): Test filter bottom sheet
- [ ] iPad Mini (768px): 3 columns, slide-out filter
- [ ] Desktop (1920px): 4 columns with sidebar

---

## US-3.2: Product Search

**Points:** 3 | **Priority:** P0  
**Dependencies:** Products table with data  
**Route:** `/search?q=[query]`

### API Endpoint

```typescript
// GET /api/products/search
// Query params: q, page, limit, category, sort

interface SearchResponse {
  products: Product[];
  pagination: { page: number; limit: number; total: number };
  query: string;
  suggestions: string[]; // For "Did you mean?"
}
```

### Search Implementation Notes

```sql
-- Add full-text search columns
ALTER TABLE products ADD COLUMN search_vector tsvector;

-- Create search index
CREATE INDEX idx_products_search ON products USING GIN(search_vector);

-- Trigger to update search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title_en, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.title_bn, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description_en, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_search_update
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();
```

### UI Components

```
SearchPage (/search)
├── SearchHeader
│   ├── SearchInput (auto-focused, pre-filled with query)
│   ├── SearchButton
│   └── VoiceSearchButton (future)
├── SearchResultsHeader
│   ├── ResultCount ("Found 15 results for 'diaper'" / "'ডায়াপার' এর জন্য ১৫টি ফলাফল")
│   └── SortDropdown
├── SearchFilters (same as CategoryPage)
├── ProductGrid
│   └── ProductCard[] (12 per page)
├── Pagination
└── EmptyState / NoResults
    ├── NoResultsMessage
    ├── Suggestions ("Try: diapers, wipes, bottles")
    └── PopularCategories
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Search Input:**
- [ ] SearchBar in Header is always visible
- [ ] Typing in SearchBar and pressing Enter navigates to `/search?q=[query]`
- [ ] Clicking search icon navigates to `/search?q=[query]`
- [ ] Search query URL-encoded properly (handles Bangla characters)
- [ ] SearchPage shows search input pre-filled with query
- [ ] Search input auto-focused on SearchPage

**Happy Path - Search Results:**
- [ ] Results header shows query and count: "Found 15 results for 'diaper'"
- [ ] Bangla search query works: "ডায়াপার" finds relevant products
- [ ] Search matches product title (English and Bangla)
- [ ] Search matches product brand
- [ ] Search matches product description
- [ ] Search is case-insensitive
- [ ] Partial word search works: "diap" finds "diaper"
- [ ] ProductGrid displays matching products
- [ ] Products ordered by relevance by default
- [ ] Filters work same as category page
- [ ] Pagination works same as category page

**Happy Path - Baby-Specific Search:**
- [ ] Search "BPA free bottles" returns products with `is_bpa_free = true` in feeding category
- [ ] Search "organic" returns products with `is_organic = true`
- [ ] Search "newborn" returns products with `age_range_min = 0`
- [ ] Search "toddler" returns products with `age_range_min >= 12`
- [ ] Search "0-3 months" returns products in that age range

**Sad Path / Negative Testing:**
- [ ] Empty search query redirects to homepage
- [ ] Search with only spaces redirects to homepage
- [ ] No results shows: "No products found for '[query]'"
- [ ] No results shows suggestions: "Try searching for: diapers, bottles, toys"
- [ ] No results shows popular categories to browse
- [ ] XSS attempt in search query is sanitized
- [ ] SQL injection attempt is prevented
- [ ] Very long search query (>200 chars) is truncated
- [ ] Special characters handled: "baby's bottle" works

**Performance:**
- [ ] Search results return within 500ms
- [ ] Search debounced (300ms) to avoid excessive API calls
- [ ] Recent searches cached locally

**Responsive Design (Mobile - 320px to 767px):**
- [ ] Search input full-width on search page
- [ ] Search icon in header opens full-screen search overlay
- [ ] Search overlay has: input, recent searches, cancel button
- [ ] Virtual keyboard doesn't obscure input (scroll into view)
- [ ] Search suggestions appear below input (not covering it)
- [ ] Results use same 2-column ProductGrid as category page
- [ ] "No results" message centered with illustration
- [ ] Suggestion chips horizontally scrollable

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] Search bar visible in header (compact width)
- [ ] Search results 3 columns
- [ ] Suggestions dropdown below input

**Responsive Design (Desktop - 1024px+):**
- [ ] Search bar prominently in header center
- [ ] Auto-complete dropdown with product thumbnails
- [ ] Results 3-4 columns
- [ ] Keyboard navigation for suggestions (arrow keys)

**Touch & Input:**
- [ ] Search input minimum 48px height
- [ ] Clear button (X) in input field, 44×44px tap area
- [ ] Search button 44×44px
- [ ] Recent search items 48px height, full-width tappable
- [ ] Suggestion chips minimum 32px height with 8px gap

---

## US-3.3: Product Sorting and Filtering

**Points:** 2 | **Priority:** P0  
**Dependencies:** US-3.1, US-3.2  

### Filter State Management

```typescript
interface FilterState {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  brands: string[];
  ageRanges: string[];    // ['0-3', '3-6', '6-12', '12-24', '24-36']
  isBpaFree?: boolean;
  isOrganic?: boolean;
  inStock?: boolean;
  sort: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'relevance';
  page: number;
}
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Price Filter:**
- [ ] Price filter shows two inputs: Min and Max
- [ ] Price filter shows range slider (optional)
- [ ] Default min is 0, default max is highest product price
- [ ] Entering min price filters products >= min
- [ ] Entering max price filters products <= max
- [ ] Price filter shows count of matching products
- [ ] Price accepts only numbers

**Happy Path - Brand Filter:**
- [ ] Brand filter shows list of all brands in current view
- [ ] Each brand shows checkbox and product count
- [ ] Brands sorted alphabetically
- [ ] Selecting brand(s) filters products
- [ ] Multiple brands use OR logic (Brand A OR Brand B)

**Happy Path - Age Range Filter (Baby-Specific):**
- [ ] Age filter shows 5 options: "0-3 months", "3-6 months", "6-12 months", "1-2 years", "2-3 years"
- [ ] Each option shows product count
- [ ] Selecting "0-3 months" returns products where `age_range_min <= 3 AND age_range_max >= 0`
- [ ] Multiple age ranges use OR logic
- [ ] Age filter labels display in selected language

**Happy Path - Safety Filters (Baby-Specific):**
- [ ] "BPA Free" checkbox filters `is_bpa_free = true`
- [ ] "Organic" checkbox filters `is_organic = true`
- [ ] Both can be selected together (AND logic)
- [ ] Filter shows count of matching products

**Happy Path - Stock Filter:**
- [ ] "In Stock Only" checkbox filters `stock_quantity > 0`
- [ ] Default is to show all products (including out of stock)

**Happy Path - Sort Options:**
- [ ] "Newest" sorts by `created_at DESC`
- [ ] "Price: Low to High" sorts by `price ASC`
- [ ] "Price: High to Low" sorts by `price DESC`
- [ ] "Name A-Z" sorts by `title_en ASC` or `title_bn ASC` based on language

**Happy Path - URL State:**
- [ ] All filter selections reflected in URL query params
- [ ] Sharing URL preserves filter state
- [ ] Browser back button restores previous filter state
- [ ] Refreshing page maintains filters

**Sad Path / Negative Testing:**
- [ ] Price min > max shows validation error "Min price must be less than max"
- [ ] Negative price shows error "Price must be positive"
- [ ] Non-numeric price input prevented
- [ ] Clearing all filters resets to default view
- [ ] Invalid URL params ignored gracefully

---

# EPIC 4: Product Details

**Priority:** P0 - Must Have | **Total Points:** 4  
**Status:** 🔴 Not Started

---

## US-4.1: Product Detail Page

**Points:** 3 | **Priority:** P0  
**Dependencies:** Products table, Product images table  
**Route:** `/product/[slug]`

### API Endpoint

```typescript
// GET /api/products/:slug
interface ProductDetailResponse {
  product: Product & {
    images: ProductImage[];
    vendor: {
      id: string;
      shopName: string;
      rating: number;
      totalSales: number;
    };
    relatedProducts: Product[]; // Same category, limited 4
  };
}
```

### UI Components

```
ProductDetailPage (/product/[slug])
├── Breadcrumb ("Home > Feeding > Baby Bottles")
├── ProductSection (flex: image left, info right)
│   ├── ImageGallery
│   │   ├── MainImage (large, zoomable)
│   │   ├── ThumbnailStrip (scrollable)
│   │   └── ImageModal (fullscreen on click)
│   └── ProductInfo
│       ├── VendorBadge (shop name, link to vendor page)
│       ├── ProductTitle
│       ├── RatingDisplay (stars + count) - future
│       ├── PriceSection
│       │   ├── CurrentPrice ("৳1,200")
│       │   ├── ComparePrice (strikethrough)
│       │   └── DiscountBadge ("-20%")
│       ├── StockStatus
│       │   ├── InStock ("In Stock - 15 available")
│       │   └── OutOfStock ("Out of Stock")
│       ├── BabyInfoSection ⭐
│       │   ├── AgeRange ("Suitable for: 0-6 months")
│       │   ├── SafetyBadges (BPA-Free, Organic icons)
│       │   └── WeightLimit (if applicable)
│       ├── QuantitySelector
│       │   ├── MinusButton
│       │   ├── QuantityInput
│       │   └── PlusButton
│       ├── AddToCartButton
│       └── DeliveryInfo ("Cash on Delivery available")
├── ProductTabs
│   ├── DescriptionTab
│   │   ├── Description (HTML content)
│   │   └── Specifications table
│   ├── SafetyTab ⭐ (Baby-specific)
│   │   ├── SafetyWarnings
│   │   ├── Certifications
│   │   └── MaterialInfo
│   └── ShippingTab
│       ├── DeliveryInfo
│       └── ReturnPolicy
├── RelatedProducts
│   ├── SectionTitle
│   └── ProductCard[] (4 cards)
└── RecentlyViewed (localStorage based)
```

### Baby Product Safety Information Component

```
SafetyInfoSection ⭐
├── AgeRecommendation
│   ├── Icon (baby icon)
│   ├── Label ("Recommended Age")
│   └── Value ("0-6 months" / "০-৬ মাস")
├── SafetyCertifications
│   ├── CertBadge ("BSTI Certified")
│   ├── CertBadge ("CE Marked")
│   └── CertBadge ("ASTM F963")
├── MaterialSafety
│   ├── BPAFreeIndicator (if is_bpa_free)
│   ├── OrganicIndicator (if is_organic)
│   └── HypoallergenicIndicator (if is_hypoallergenic)
├── WarningSection (if has_small_parts or safety_warning exists)
│   ├── WarningIcon (⚠️)
│   ├── ChokingHazardWarning ("Contains small parts. Not for children under 3.")
│   └── CustomWarning (safety_warning_en/bn)
└── WeightLimit (if weight_limit_kg exists)
    ├── Label ("Maximum child weight")
    └── Value ("15 kg")
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Page Load:**
- [ ] `/product/[slug]` renders ProductDetailPage
- [ ] Invalid slug shows 404 page with "Product not found"
- [ ] Product with `status != 'approved'` shows 404 (unless admin/vendor owner)
- [ ] Breadcrumb shows correct category hierarchy
- [ ] Page title updates to product name (SEO)
- [ ] Meta description updates (SEO)

**Happy Path - Image Gallery:**
- [ ] MainImage displays primary product image
- [ ] ThumbnailStrip shows all product images (max 5)
- [ ] Clicking thumbnail updates MainImage
- [ ] First thumbnail selected by default
- [ ] Clicking MainImage opens fullscreen modal
- [ ] Modal allows arrow key navigation
- [ ] Modal closes on Escape key or X button
- [ ] Missing image shows placeholder

**Happy Path - Product Info:**
- [ ] VendorBadge shows shop name
- [ ] Clicking vendor name navigates to `/vendor/[id]` (future)
- [ ] ProductTitle displays in selected language
- [ ] Price shows with ৳ symbol
- [ ] ComparePrice shows with strikethrough if higher than current price
- [ ] Discount percentage calculated and displayed

**Happy Path - Stock & Quantity:**
- [ ] Stock status shows "In Stock" with quantity if `stock_quantity > 0`
- [ ] Stock status shows "Out of Stock" if `stock_quantity = 0`
- [ ] Low stock warning shows if `stock_quantity <= 5`
- [ ] QuantitySelector default value is 1
- [ ] Plus button increases quantity
- [ ] Minus button decreases quantity (min 1)
- [ ] Quantity cannot exceed available stock
- [ ] Quantity input accepts manual entry

**Happy Path - Baby-Specific Info ⭐:**
- [ ] AgeRange displays: "Suitable for: [age_range_min]-[age_range_max] months"
- [ ] Age range converts to years if >= 12 months ("1-2 years")
- [ ] BPA-Free badge displays if `is_bpa_free = true`
- [ ] Organic badge displays if `is_organic = true`
- [ ] Hypoallergenic badge displays if `is_hypoallergenic = true`
- [ ] Choking hazard warning displays if `has_small_parts = true`
- [ ] Custom safety warning displays if `safety_warning_en/bn` exists
- [ ] Weight limit displays if `weight_limit_kg` exists (for carriers, etc.)
- [ ] Safety certifications display as badges
- [ ] Expiry date warning shows if product expires within 3 months

**Happy Path - Add to Cart:**
- [ ] "Add to Cart" button is prominent and visible
- [ ] Clicking "Add to Cart" adds product with selected quantity to cart
- [ ] Cart icon count updates immediately
- [ ] Success toast shows "Added to cart"
- [ ] Button disabled if out of stock
- [ ] Button shows loading state while processing

**Happy Path - Tabs:**
- [ ] Description tab shows product description (HTML rendered)
- [ ] Description in selected language
- [ ] Specifications table shows: Brand, Material, Weight, Dimensions, Country of Origin
- [ ] Safety tab shows certifications and warnings
- [ ] Shipping tab shows delivery info and return policy

**Happy Path - Related Products:**
- [ ] Related products section shows 4 products from same category
- [ ] Related products exclude current product
- [ ] Clicking related product navigates to that product page

**Sad Path / Negative Testing:**
- [ ] Adding quantity > stock shows error "Only [X] items available"
- [ ] Adding to cart while logged out redirects to login (or continues as guest)
- [ ] Product with no images shows placeholder
- [ ] Product with missing translation shows English fallback
- [ ] API error shows error message with retry option
- [ ] Expired product (consumable) shows expiry warning prominently
- [ ] Network error during add to cart shows retry option

**Schema Validation:**
- [ ] Page queries `is_bpa_free`, `is_organic`, `has_small_parts` fields
- [ ] Page queries `age_range_min`, `age_range_max` fields
- [ ] Page queries `safety_certifications[]` array field
- [ ] Page queries `safety_warning_en/bn` fields
- [ ] Page queries `weight_limit_kg` field
- [ ] Page queries `expiry_date` field

**Responsive Design (Mobile - 320px to 767px):**
- [ ] Layout stacks vertically: Images → Info → Tabs → Related
- [ ] Image gallery full-width, swipeable
- [ ] Thumbnail strip horizontal scroll below main image
- [ ] Image dots indicator for swipe position
- [ ] Product title max 3 lines, then ellipsis
- [ ] Price section prominent, large font (24px+)
- [ ] Safety badges wrap to multiple lines if needed
- [ ] Age range badge full-width or prominent position
- [ ] Quantity selector inline with Add to Cart
- [ ] "Add to Cart" button fixed at bottom (sticky)
- [ ] Sticky Add to Cart bar: quantity + button + price
- [ ] Tabs switch to accordion on mobile
- [ ] Related products horizontal scroll
- [ ] Breadcrumb shows only: "< Back to [Category]"

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] Two-column layout: Images (50%) | Info (50%)
- [ ] Image gallery with thumbnail strip below
- [ ] Add to Cart button not sticky (in-content)
- [ ] Tabs remain as tabs
- [ ] Related products 3 per row

**Responsive Design (Desktop - 1024px+):**
- [ ] Two-column layout: Images (45%) | Info (55%)
- [ ] Thumbnail strip vertical on left of main image
- [ ] Hover zoom on main image
- [ ] Tabs with underline indicator
- [ ] Related products 4 per row
- [ ] Sticky Add to Cart section in sidebar (optional)

**Image Gallery Responsive:**
- [ ] Mobile: Swipe gestures for image navigation
- [ ] Mobile: Pinch-to-zoom on images
- [ ] Mobile: Full-screen modal for image viewing
- [ ] Tablet: Click to zoom, arrow navigation
- [ ] Desktop: Hover zoom lens effect
- [ ] All: Lazy load non-visible images

**Touch Interactions:**
- [ ] Quantity +/- buttons minimum 44×44px
- [ ] "Add to Cart" button minimum 48px height, full-width on mobile
- [ ] Image tap opens fullscreen on mobile
- [ ] Tab headers minimum 44px height
- [ ] Safety badges tappable for more info (tooltip/modal)

**Device-Specific Testing:**
- [ ] iPhone SE (375px): Sticky cart bar fits, images swipeable
- [ ] iPhone 14 (390px): All safety info visible without scroll
- [ ] Samsung Galaxy (360px): Price and button don't overlap
- [ ] iPad Mini (768px): Two-column layout renders correctly
- [ ] Desktop (1920px): Image zoom works, no layout issues

---

## US-4.2: Quick Add to Cart

**Points:** 1 | **Priority:** P0  
**Dependencies:** US-4.1, Cart functionality  

### Acceptance Criteria (ClickUp Checklist)

**Happy Path:**
- [ ] ProductCard on category/search pages has "Add to Cart" button
- [ ] Products with variants show "View Options" instead
- [ ] Clicking "Add to Cart" adds 1 quantity to cart
- [ ] Button shows brief loading spinner
- [ ] Success toast appears
- [ ] Cart count updates
- [ ] Out of stock products show disabled button with "Out of Stock" text

**Sad Path / Negative Testing:**
- [ ] Rapid clicking doesn't add duplicate items (debounced)
- [ ] Adding last item in stock succeeds
- [ ] Adding when stock just depleted shows "Sorry, item just sold out"

---

# EPIC 5: Shopping Cart

**Priority:** P0 - Must Have | **Total Points:** 4  
**Status:** 🔴 Not Started

---

## Schema: Cart Tables

```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(100),           -- For guest carts
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One of user_id or session_id must be set
  CONSTRAINT cart_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  
  -- Snapshot of price at time of adding (for price change tracking)
  unit_price DECIMAL(10,2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicate product entries
  UNIQUE(cart_id, product_id),
  CONSTRAINT valid_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_carts_session ON carts(session_id);
```

---

## US-5.1: Cart Page

**Points:** 3 | **Priority:** P0  
**Dependencies:** Cart tables, Product data  
**Route:** `/cart`

### API Endpoints

```typescript
// GET /api/cart
interface CartResponse {
  cart: {
    id: string;
    items: CartItem[];
    subtotal: number;
    itemCount: number;
  };
}

interface CartItem {
  id: string;
  product: {
    id: string;
    title: string;
    image: string;
    price: number;
    stock: number;
    vendor: { id: string; shopName: string };
    ageRange: string;
    isBpaFree: boolean;
  };
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// PATCH /api/cart/items/:itemId
interface UpdateCartItemRequest {
  quantity: number;
}

// DELETE /api/cart/items/:itemId
```

### UI Components

```
CartPage (/cart)
├── PageHeader ("Shopping Cart" / "শপিং কার্ট")
├── CartContent (if items exist)
│   ├── CartItemsSection
│   │   └── CartItemCard[] (grouped by vendor)
│   │       ├── VendorHeader ("Items from [Shop Name]")
│   │       └── CartItemRow
│   │           ├── ProductImage (thumbnail, clickable)
│   │           ├── ProductInfo
│   │           │   ├── Title (link to product)
│   │           │   ├── AgeRange badge ⭐
│   │           │   ├── SafetyBadges (BPA-free) ⭐
│   │           │   └── UnitPrice
│   │           ├── QuantityControl
│   │           │   ├── MinusButton
│   │           │   ├── QuantityDisplay
│   │           │   └── PlusButton
│   │           ├── LineTotal
│   │           └── RemoveButton (X icon)
│   └── CartSummary (sticky on desktop)
│       ├── SummaryTitle ("Order Summary")
│       ├── Subtotal
│       ├── ShippingEstimate ("Calculated at checkout")
│       ├── CODNotice ("Cash on Delivery available") ⭐
│       ├── Total
│       └── CheckoutButton
├── EmptyCartState (if no items)
│   ├── EmptyCartIcon
│   ├── Message ("Your cart is empty")
│   └── ContinueShoppingButton
└── SafetyReminder ⭐ (if cart has baby items)
    └── Message ("Please verify age recommendations before purchase")
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Cart Display:**
- [ ] `/cart` route renders CartPage
- [ ] CartPage title in selected language
- [ ] Cart items grouped by vendor
- [ ] Each vendor group shows shop name header
- [ ] CartItemRow shows product thumbnail
- [ ] Clicking thumbnail opens product page
- [ ] CartItemRow shows product title (links to product)
- [ ] CartItemRow shows unit price
- [ ] CartItemRow shows age range badge for baby products
- [ ] CartItemRow shows BPA-free badge if applicable
- [ ] CartItemRow shows line total (unit price × quantity)
- [ ] QuantityControl shows current quantity
- [ ] RemoveButton (X) visible on each item

**Happy Path - Quantity Updates:**
- [ ] Plus button increases quantity by 1
- [ ] Minus button decreases quantity by 1
- [ ] Quantity cannot go below 1 (use remove instead)
- [ ] Quantity cannot exceed product stock
- [ ] Quantity change updates line total immediately
- [ ] Quantity change updates cart subtotal
- [ ] Quantity change triggers API update (debounced 500ms)

**Happy Path - Remove Item:**
- [ ] Clicking remove button shows confirmation (optional)
- [ ] Removing item updates cart immediately
- [ ] Removing last item shows EmptyCartState
- [ ] Cart count in header updates

**Happy Path - Cart Summary:**
- [ ] Subtotal shows sum of all line totals
- [ ] Shipping shows "Calculated at checkout"
- [ ] COD notice displayed
- [ ] Total shows subtotal (shipping not included yet)
- [ ] CheckoutButton navigates to `/checkout`
- [ ] CheckoutButton disabled if cart empty

**Happy Path - Empty Cart:**
- [ ] Empty cart shows EmptyCartIcon
- [ ] Empty cart shows message in selected language
- [ ] "Continue Shopping" button navigates to homepage

**Happy Path - Baby Safety Notice ⭐:**
- [ ] If cart contains baby products, show safety reminder
- [ ] Reminder text: "Please verify age recommendations match your child before purchase"

**Sad Path / Negative Testing:**
- [ ] Product price changed since adding shows notice: "Price updated from ৳X to ৳Y"
- [ ] Product went out of stock shows warning: "This item is no longer available"
- [ ] Out of stock items highlighted with warning style
- [ ] Cannot proceed to checkout with out of stock items (must remove)
- [ ] Quantity > stock shows error: "Only [X] available"
- [ ] Network error shows retry option
- [ ] Concurrent update (another tab) syncs correctly
- [ ] Expired product (consumable) shows expiry warning

**Schema Validation:**
- [ ] Cart retrieval joins `products` table for current price/stock
- [ ] `unit_price` in cart_items used to detect price changes
- [ ] `stock_quantity` checked before allowing quantity increase
- [ ] Products with `status != 'approved'` removed from cart automatically

**Responsive Design (Mobile - 320px to 767px):**
- [ ] Single column layout
- [ ] Cart items stack vertically (image left, info right within each item)
- [ ] Item row: Image (80px) | Title + Price + Qty in stacked layout
- [ ] Quantity controls inline below price
- [ ] Remove button (X) top-right corner of each item
- [ ] Vendor group headers full-width with background
- [ ] Cart summary fixed at bottom as sticky bar
- [ ] Sticky bar shows: Total + "Checkout" button
- [ ] Tapping sticky bar expands full summary
- [ ] Empty cart centered with full-width button
- [ ] Product thumbnails 80×80px minimum

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] Two-column layout: Cart items (65%) | Summary (35%)
- [ ] Summary as sticky sidebar
- [ ] Cart item rows more horizontal
- [ ] Image, title, quantity, price, remove in single row

**Responsive Design (Desktop - 1024px+):**
- [ ] Two-column layout: Cart items (70%) | Summary (30%)
- [ ] Full table-like layout for cart items
- [ ] Summary card sticky on scroll
- [ ] Hover states on remove button

**Touch Interactions:**
- [ ] Quantity +/- buttons 44×44px minimum
- [ ] Remove button 44×44px tap area (even if icon is smaller)
- [ ] Product image/title tappable (links to product)
- [ ] Checkout button minimum 48px height
- [ ] Swipe-to-delete on cart items (optional enhancement)

**Device-Specific Testing:**
- [ ] iPhone SE (375px): Items don't overflow, sticky bar usable
- [ ] iPhone 14 (390px): Quantity controls accessible
- [ ] Samsung Galaxy (360px): Long product names truncate properly
- [ ] iPad (768px): Two-column layout works
- [ ] Desktop (1920px): Summary doesn't stick too high

---

## US-5.2: Cart Icon with Count

**Points:** 1 | **Priority:** P0  
**Dependencies:** Cart state management  

### State Management

```typescript
// Global cart state (Zustand or Context)
interface CartState {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path:**
- [ ] CartIcon visible in Header on all pages
- [ ] CartIcon shows badge with item count
- [ ] Badge hidden when count is 0
- [ ] Badge shows "9+" if count > 9
- [ ] Clicking icon navigates to `/cart`
- [ ] Count updates when item added from any page
- [ ] Count updates when item removed
- [ ] Count persists across page navigation
- [ ] Cart synced when user logs in (merge guest cart)

**Sad Path / Negative Testing:**
- [ ] Cart API error doesn't break header rendering
- [ ] Shows stale count while refreshing

---

# EPIC 6: Vendor Registration

**Priority:** P0 - Must Have | **Total Points:** 3  
**Status:** 🔴 Not Started

---

## Schema: Vendors Table

```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Business Info
  shop_name_en VARCHAR(100) NOT NULL,
  shop_name_bn VARCHAR(100),
  slug VARCHAR(100) UNIQUE NOT NULL,
  description_en TEXT,
  description_bn TEXT,
  
  -- Contact
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  business_email VARCHAR(255),
  
  -- Address
  address_line1 VARCHAR(200) NOT NULL,
  address_line2 VARCHAR(200),
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  
  -- Documents
  nid_number VARCHAR(20) NOT NULL,
  nid_front_image VARCHAR(500),
  nid_back_image VARCHAR(500),
  trade_license_number VARCHAR(50),
  trade_license_image VARCHAR(500),
  
  -- Bank/Payment Info
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50),
  bank_account_name VARCHAR(100),
  bkash_number VARCHAR(20),
  nagad_number VARCHAR(20),
  
  -- Settings
  commission_rate DECIMAL(5,2) DEFAULT 10.00,  -- Platform commission %
  logo_url VARCHAR(500),
  banner_url VARCHAR(500),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected, suspended
  rejection_reason TEXT,
  approved_at TIMESTAMP,
  approved_by UUID REFERENCES users(id),
  
  -- Stats (denormalized for performance)
  total_products INT DEFAULT 0,
  total_orders INT DEFAULT 0,
  total_sales DECIMAL(12,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  CONSTRAINT valid_commission CHECK (commission_rate >= 0 AND commission_rate <= 100)
);

CREATE INDEX idx_vendors_user ON vendors(user_id);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_slug ON vendors(slug);
```

---

## US-6.1: Vendor Application Form

**Points:** 2 | **Priority:** P0  
**Dependencies:** User authentication  
**Route:** `/vendor/apply`

### UI Components

```
VendorApplicationPage (/vendor/apply)
├── PageHeader
│   ├── Title ("Become a Seller" / "বিক্রেতা হন")
│   └── Subtitle ("Start selling baby products on KineDao")
├── BenefitsSection
│   ├── BenefitCard ("Reach thousands of parents")
│   ├── BenefitCard ("Easy product management")
│   ├── BenefitCard ("Secure payments")
│   └── BenefitCard ("Dedicated support")
├── CommissionInfo
│   └── Text ("Platform commission: 10% per sale")
├── ApplicationForm
│   ├── Step1: BusinessInfo
│   │   ├── ShopNameEN (required)
│   │   ├── ShopNameBN (optional)
│   │   ├── Phone (required, BD format)
│   │   ├── WhatsApp (optional)
│   │   └── BusinessDescription
│   ├── Step2: Address
│   │   ├── AddressLine1 (required)
│   │   ├── AddressLine2
│   │   ├── City (required)
│   │   ├── District (dropdown, required)
│   │   └── PostalCode
│   ├── Step3: Documents
│   │   ├── NIDNumber (required)
│   │   ├── NIDFrontUpload (required, image)
│   │   ├── NIDBackUpload (required, image)
│   │   ├── TradeLicenseNumber (optional)
│   │   └── TradeLicenseUpload (optional)
│   ├── Step4: PaymentInfo
│   │   ├── BankName
│   │   ├── BankAccountNumber
│   │   ├── BankAccountName
│   │   ├── bKashNumber
│   │   └── NagadNumber
│   └── Step5: Review
│       ├── SummaryDisplay
│       ├── TermsCheckbox ("I agree to seller terms")
│       └── SubmitButton
└── AlreadyApplied (if vendor record exists)
    ├── StatusDisplay
    └── ApplicationDetails
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Access:**
- [ ] `/vendor/apply` accessible only to logged-in users
- [ ] Non-logged-in users redirected to `/login?redirect=/vendor/apply`
- [ ] Users who are already approved vendors redirected to `/vendor/dashboard`
- [ ] Users with pending application see ApplicationStatus instead of form

**Happy Path - Step 1 (Business Info):**
- [ ] ShopNameEN required, 3-100 characters
- [ ] ShopNameEN validates no special characters except space, hyphen
- [ ] ShopNameBN optional, supports Bangla unicode
- [ ] Phone required, validates BD format (01XXXXXXXXX)
- [ ] Phone shows error for invalid format
- [ ] WhatsApp optional, same format as phone
- [ ] Description optional, max 1000 characters
- [ ] "Next" button disabled until required fields valid

**Happy Path - Step 2 (Address):**
- [ ] AddressLine1 required, 10-200 characters
- [ ] City required
- [ ] District dropdown shows all 64 BD districts
- [ ] PostalCode optional

**Happy Path - Step 3 (Documents):**
- [ ] NIDNumber required, 10 or 17 digits (old/new NID format)
- [ ] NIDFrontUpload required, accepts JPG/PNG, max 5MB
- [ ] NIDBackUpload required, accepts JPG/PNG, max 5MB
- [ ] Image preview shown after upload
- [ ] Can remove and re-upload images
- [ ] TradeLicenseNumber optional
- [ ] TradeLicenseUpload optional

**Happy Path - Step 4 (Payment):**
- [ ] At least one payment method required (bank OR bKash OR Nagad)
- [ ] Bank fields: all three required if any filled
- [ ] bKash number validates BD format
- [ ] Nagad number validates BD format

**Happy Path - Step 5 (Review & Submit):**
- [ ] Summary shows all entered information
- [ ] Can navigate back to edit any step
- [ ] Terms checkbox required
- [ ] Submit button disabled until terms checked
- [ ] Submitting shows loading state
- [ ] Successful submit shows confirmation message
- [ ] Email notification sent to admin (if configured)

**Sad Path / Negative Testing:**
- [ ] Duplicate shop name shows error "Shop name already taken"
- [ ] Duplicate NID number shows error "NID already registered"
- [ ] File too large shows error "File must be under 5MB"
- [ ] Invalid file type shows error "Only JPG and PNG allowed"
- [ ] Network error during upload shows retry option
- [ ] Form data persisted in localStorage (resume later)
- [ ] Submitting fails gracefully if API error
- [ ] Cannot submit same application twice

**Schema Validation:**
- [ ] `shop_name_en` stored in database
- [ ] `slug` auto-generated from shop_name_en
- [ ] `nid_number` unique constraint
- [ ] `status` defaults to 'pending'
- [ ] `user_id` links to authenticated user

**Responsive Design (Mobile - 320px to 767px):**
- [ ] Single column form layout
- [ ] All input fields full-width
- [ ] Step indicator horizontal with numbers only (no text)
- [ ] Current step highlighted, completed steps show checkmark
- [ ] "Next" and "Back" buttons full-width, stacked
- [ ] Benefits section cards stack vertically
- [ ] Image upload area full-width with tap-to-upload
- [ ] Camera option for NID capture on mobile
- [ ] Form sections collapsible accordion style
- [ ] Keyboard-aware scrolling (inputs not hidden by keyboard)
- [ ] District dropdown as full-screen bottom sheet
- [ ] File preview thumbnails 100px wide

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] Two-column layout for short fields (City + District)
- [ ] Step indicator shows text labels
- [ ] Benefits section 2×2 grid
- [ ] Image uploads side-by-side (NID front + back)
- [ ] Navigation buttons side-by-side

**Responsive Design (Desktop - 1024px+):**
- [ ] Form centered with max-width 720px
- [ ] Step indicator full with descriptions
- [ ] Benefits in single row
- [ ] Side-by-side fields where logical
- [ ] Drag-and-drop file upload
- [ ] Image preview larger (200px)

**Form Input Responsiveness:**
- [ ] All inputs minimum 48px height
- [ ] Labels above inputs on mobile
- [ ] Placeholder text visible (not too light)
- [ ] Error messages below inputs, visible without scroll
- [ ] Phone input with country code prefix (+880)
- [ ] NID input with format hint (10 or 17 digits)

**Touch & Upload:**
- [ ] File upload tap area minimum 100px height
- [ ] "Choose File" button 44×44px minimum
- [ ] Image preview shows delete button (X) with 44×44px tap area
- [ ] Camera capture option on mobile devices
- [ ] Progress indicator for uploads

**Device-Specific Testing:**
- [ ] iPhone SE (375px): Form fits, keyboard doesn't hide inputs
- [ ] iPhone 14 (390px): Camera capture works for NID
- [ ] Samsung Galaxy (360px): Long text inputs don't overflow
- [ ] iPad (768px): Two-column layout for address fields
- [ ] Desktop (1920px): Form centered, not too wide

---

## US-6.2: Vendor Application Status

**Points:** 1 | **Priority:** P0  
**Dependencies:** US-6.1  
**Route:** `/vendor/apply` (when application exists)

### Acceptance Criteria (ClickUp Checklist)

**Happy Path:**
- [ ] User with pending application sees status: "Under Review"
- [ ] Shows application submission date
- [ ] Shows estimated review time: "Usually within 24-48 hours"
- [ ] User with approved application redirected to dashboard
- [ ] User with rejected application sees rejection reason
- [ ] Rejected user can edit and resubmit application

**Sad Path:**
- [ ] Status refreshes on page load (not stale)

---

# EPIC 7: Checkout Process (COD Only)

**Priority:** P0 - Must Have | **Total Points:** 7  
**Status:** 🔴 Not Started

---

## Schema: Orders Tables

```sql
CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Recipient Info
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20),
  
  -- Address
  address_line1 VARCHAR(200) NOT NULL,
  address_line2 VARCHAR(200),
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  
  -- Delivery Instructions
  delivery_instructions TEXT,
  
  -- Flags
  is_default BOOLEAN DEFAULT false,
  label VARCHAR(50),  -- "Home", "Office", etc.
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,  -- KD-2026-XXXXX
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Shipping
  shipping_address_id UUID REFERENCES shipping_addresses(id),
  shipping_address_snapshot JSONB NOT NULL,  -- Frozen copy at order time
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Payment (COD only for MVP)
  payment_method VARCHAR(20) DEFAULT 'cod',
  payment_status VARCHAR(20) DEFAULT 'pending',  -- pending, collected, failed
  
  -- Order Status
  status VARCHAR(20) DEFAULT 'pending',
  -- pending -> confirmed -> processing -> shipped -> delivered
  -- pending -> cancelled
  
  -- Tracking (Manual for MVP)
  courier_name VARCHAR(100),
  tracking_number VARCHAR(100),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP,
  
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'collected', 'failed'))
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  
  -- Product Snapshot (frozen at order time)
  product_snapshot JSONB NOT NULL,  -- title, image, etc.
  
  -- Pricing
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  
  -- Vendor Payout Calculation
  commission_rate DECIMAL(5,2) NOT NULL,      -- Snapshot of vendor's commission rate
  commission_amount DECIMAL(10,2) NOT NULL,   -- line_total * commission_rate / 100
  vendor_earning DECIMAL(10,2) NOT NULL,      -- line_total - commission_amount
  
  -- Item Status (for multi-vendor orders)
  status VARCHAR(20) DEFAULT 'pending',
  vendor_tracking_number VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_quantity CHECK (quantity > 0)
);

-- Indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_vendor ON order_items(vendor_id);
```

---

## US-7.1: Checkout - Shipping Address

**Points:** 2 | **Priority:** P0  
**Dependencies:** Cart with items  
**Route:** `/checkout`

### UI Components

```
CheckoutPage (/checkout)
├── CheckoutStepper
│   ├── Step1: "Shipping" (active)
│   ├── Step2: "Payment"
│   └── Step3: "Review"
├── ShippingStep
│   ├── SavedAddresses (if user has addresses)
│   │   ├── AddressCard[] (selectable)
│   │   └── AddNewAddressButton
│   └── AddressForm (if adding new or guest)
│       ├── FullName (required)
│       ├── Phone (required, BD format)
│       ├── AlternatePhone (optional)
│       ├── AddressLine1 (required)
│       ├── AddressLine2 (optional)
│       ├── City (required)
│       ├── District (dropdown, required)
│       ├── PostalCode (optional)
│       ├── DeliveryInstructions (optional)
│       ├── SaveAddressCheckbox (logged-in only)
│       └── SetAsDefaultCheckbox (logged-in only)
├── OrderSummary (sidebar)
│   ├── CartItems summary (collapsed)
│   ├── Subtotal
│   ├── Shipping ("Free" or amount)
│   └── Total
└── NavigationButtons
    ├── BackToCartButton
    └── ContinueToPaymentButton
```

### Shipping Cost Rules (Bangladesh)

```typescript
const SHIPPING_RATES = {
  DHAKA_METRO: { cost: 60, days: '1-2' },
  DHAKA_SUBURBS: { cost: 80, days: '2-3' },
  MAJOR_CITIES: { cost: 100, days: '3-5' },  // Chittagong, Sylhet, etc.
  OTHER_DISTRICTS: { cost: 130, days: '5-7' },
};

// Districts mapping
const DHAKA_METRO_DISTRICTS = ['Dhaka'];
const DHAKA_SUBURBS = ['Gazipur', 'Narayanganj', 'Manikganj'];
const MAJOR_CITIES = ['Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Rangpur', 'Barisal'];
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Access:**
- [ ] `/checkout` accessible with items in cart
- [ ] Empty cart redirects to `/cart` with message
- [ ] Cart summary shows in sidebar

**Happy Path - Saved Addresses (Logged-in):**
- [ ] User's saved addresses displayed as selectable cards
- [ ] Default address pre-selected
- [ ] Can select different saved address
- [ ] "Add New Address" button opens form
- [ ] Can edit existing address

**Happy Path - Address Form:**
- [ ] FullName required, 3-100 characters
- [ ] Phone required, validates BD format
- [ ] AlternatePhone optional, validates BD format
- [ ] AddressLine1 required, 10-200 characters
- [ ] City required
- [ ] District dropdown with 64 districts
- [ ] PostalCode optional
- [ ] DeliveryInstructions optional, max 500 characters

**Happy Path - Guest Checkout:**
- [ ] Guest users can checkout without account
- [ ] Address form always shown for guests
- [ ] Email field added for guest (for order confirmation)

**Happy Path - Shipping Calculation:**
- [ ] Shipping cost updates when district selected
- [ ] Dhaka Metro districts: ৳60
- [ ] Dhaka suburbs: ৳80
- [ ] Major cities: ৳100
- [ ] Other districts: ৳130
- [ ] Estimated delivery days shown

**Happy Path - Navigation:**
- [ ] "Continue" validates address form
- [ ] Valid address proceeds to payment step
- [ ] "Back" returns to cart

**Sad Path / Negative Testing:**
- [ ] Invalid phone shows error
- [ ] Missing required fields prevents continue
- [ ] API error saving address shows retry
- [ ] District not serviceable shows warning (future)

**Responsive Design (Mobile - 320px to 767px):**
- [ ] Single column layout
- [ ] Checkout stepper horizontal, compact (icons + current step text)
- [ ] Saved addresses as stacked cards (radio selectable)
- [ ] Address card shows: Name, truncated address, phone
- [ ] Selected address has visible border/highlight
- [ ] "Add New Address" as full-width button
- [ ] Address form full-width inputs
- [ ] Order summary collapsed by default, expandable
- [ ] Summary shows item count + total only when collapsed
- [ ] "Continue" button full-width, fixed at bottom
- [ ] District dropdown as bottom sheet with search
- [ ] Shipping cost updates visible immediately

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] Two-column: Form (60%) | Summary (40%)
- [ ] Saved addresses in 2-column grid
- [ ] Address form with some side-by-side fields
- [ ] Summary sidebar sticky

**Responsive Design (Desktop - 1024px+):**
- [ ] Two-column: Form (60%) | Summary (40%)
- [ ] Saved addresses as horizontal list
- [ ] Form fields inline where logical
- [ ] Summary always visible, sticky
- [ ] Stepper shows all step labels

**Form Input Responsiveness:**
- [ ] All inputs minimum 48px height
- [ ] Phone input with +880 prefix
- [ ] District dropdown searchable
- [ ] Delivery instructions textarea expands
- [ ] Checkbox labels wrap on mobile

**Touch Interactions:**
- [ ] Address cards fully tappable to select
- [ ] Radio buttons have 44×44px tap area
- [ ] "Continue" button minimum 48px height
- [ ] Form navigation (Next/Back) easy to reach

**Device-Specific Testing:**
- [ ] iPhone SE (375px): Form scrollable, no overlap
- [ ] iPhone 14 (390px): Keyboard doesn't hide submit
- [ ] Samsung Galaxy (360px): District picker works
- [ ] iPad (768px): Two-column layout
- [ ] Desktop (1920px): Centered with max-width

---

## US-7.2: Checkout - Payment Selection (COD)

**Points:** 2 | **Priority:** P0  
**Dependencies:** US-7.1  
**Route:** `/checkout` (Step 2)

### UI Components

```
PaymentStep
├── PaymentMethodSelection
│   └── CODOption (only option for MVP)
│       ├── RadioButton (pre-selected)
│       ├── CODIcon
│       ├── Title ("Cash on Delivery")
│       ├── Description ("Pay when you receive your order")
│       └── CODFee (if applicable): "Additional ৳20 COD fee"
├── CODInstructions
│   ├── Text ("Please keep exact amount ready")
│   └── Text ("Our delivery partner will collect payment")
├── OrderNotes
│   └── CustomerNotesTextarea (optional)
└── NavigationButtons
    ├── BackToShippingButton
    └── ContinueToReviewButton
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path:**
- [ ] Payment step shows after valid shipping
- [ ] COD option pre-selected (only option)
- [ ] COD description explains payment process
- [ ] COD fee (if any) clearly displayed
- [ ] OrderNotes textarea available (optional)
- [ ] "Continue" proceeds to review step
- [ ] "Back" returns to shipping step

**Sad Path:**
- [ ] Cannot proceed without payment method selected (always COD)

---

## US-7.3: Checkout - Order Review & Placement

**Points:** 3 | **Priority:** P0  
**Dependencies:** US-7.1, US-7.2  
**Route:** `/checkout` (Step 3)

### UI Components

```
ReviewStep
├── ShippingAddressSummary
│   ├── RecipientName
│   ├── Phone
│   ├── FullAddress
│   └── EditButton (returns to step 1)
├── PaymentMethodSummary
│   ├── MethodName ("Cash on Delivery")
│   └── EditButton (returns to step 2)
├── OrderItemsReview
│   └── VendorGroup[]
│       ├── VendorName
│       └── OrderItemRow[]
│           ├── ProductImage
│           ├── ProductTitle
│           ├── AgeRange badge ⭐
│           ├── Quantity
│           └── LineTotal
├── BabySafetyReminder ⭐
│   └── Message ("Please verify all products match your child's age before accepting delivery")
├── PricingSummary
│   ├── Subtotal
│   ├── Shipping
│   ├── CODFee (if applicable)
│   ├── Discount (if applicable)
│   └── GrandTotal (highlighted)
├── TermsCheckbox
│   └── "I agree to the Terms & Conditions"
└── PlaceOrderButton
```

### Order Number Generation

```typescript
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `KD-${year}-${random}`;
  // Example: KD-2026-A7B3X
}
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Review Display:**
- [ ] Shipping address summary shows complete address
- [ ] Edit button for address returns to step 1
- [ ] Payment method shows "Cash on Delivery"
- [ ] Edit button for payment returns to step 2
- [ ] Order items grouped by vendor
- [ ] Each item shows image, title, quantity, price
- [ ] Each baby product shows age range badge
- [ ] Baby safety reminder displayed prominently

**Happy Path - Pricing:**
- [ ] Subtotal calculated correctly
- [ ] Shipping cost shown
- [ ] COD fee shown (if applicable)
- [ ] Grand total = subtotal + shipping + COD fee - discount
- [ ] All prices in ৳ format

**Happy Path - Place Order:**
- [ ] Terms checkbox required
- [ ] PlaceOrderButton disabled until terms checked
- [ ] Clicking PlaceOrderButton shows loading state
- [ ] Order created in database with status 'pending'
- [ ] Order number generated (KD-2026-XXXXX)
- [ ] Order items created with product snapshots
- [ ] Vendor earnings calculated (line_total - commission)
- [ ] Cart cleared after successful order
- [ ] Redirect to order confirmation page

**Happy Path - Inventory:**
- [ ] Stock quantity decremented for each item
- [ ] Concurrent order handles stock correctly (race condition prevention)

**Happy Path - Notifications:**
- [ ] Order confirmation email sent to customer
- [ ] New order notification to vendor(s) (if configured)

**Sad Path / Negative Testing:**
- [ ] Product went out of stock during checkout shows error
- [ ] Price changed during checkout shows warning with new price
- [ ] Network error shows retry option
- [ ] Duplicate submission prevented (idempotency)
- [ ] Order placement timeout shows error with support contact

**Schema Validation:**
- [ ] `order_number` unique and auto-generated
- [ ] `shipping_address_snapshot` contains frozen address JSONB
- [ ] `product_snapshot` in order_items contains frozen product data
- [ ] `commission_rate` snapshot from vendor at order time
- [ ] `vendor_earning` calculated as `line_total - commission_amount`

**Responsive Design (Mobile - 320px to 767px):**
- [ ] Single column layout, all sections stacked
- [ ] Shipping summary card with "Edit" button
- [ ] Payment summary card with "Edit" button
- [ ] Order items grouped by vendor, collapsible
- [ ] Each item shows: thumbnail (60px), title (2 lines max), qty, price
- [ ] Baby safety reminder prominent with yellow/orange background
- [ ] Pricing summary as clean list
- [ ] Grand total large font (24px), bold
- [ ] Terms checkbox with full-width tap area
- [ ] "Place Order" button full-width, fixed at bottom
- [ ] Sticky bottom bar: Total + Place Order button
- [ ] Loading overlay covers entire screen during submission

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] Two-column: Review content (60%) | Summary (40%)
- [ ] Order items not collapsed
- [ ] Summary sticky sidebar
- [ ] Place Order in sidebar

**Responsive Design (Desktop - 1024px+):**
- [ ] Two-column: Review content (65%) | Summary (35%)
- [ ] Full item details visible
- [ ] Hover states on edit buttons
- [ ] Summary card with shadow

**Touch Interactions:**
- [ ] Edit buttons minimum 44×44px
- [ ] Vendor group headers tappable to expand/collapse
- [ ] Terms checkbox 44×44px tap area (including label)
- [ ] Place Order button minimum 48px height
- [ ] Back navigation via swipe or button

**Device-Specific Testing:**
- [ ] iPhone SE (375px): All info visible, can place order
- [ ] iPhone 14 (390px): Safety reminder fully visible
- [ ] Samsung Galaxy (360px): Long addresses truncate well
- [ ] iPad (768px): Two-column layout
- [ ] Desktop (1920px): Comfortable reading

---

# EPIC 8: Order Confirmation & History

**Priority:** P0 - Must Have | **Total Points:** 4  
**Status:** 🔴 Not Started

---

## US-8.1: Order Confirmation Page

**Points:** 2 | **Priority:** P0  
**Dependencies:** US-7.3  
**Route:** `/order/confirmation/[orderNumber]`

### UI Components

```
OrderConfirmationPage
├── SuccessHeader
│   ├── SuccessIcon (checkmark)
│   ├── Title ("Order Placed Successfully!" / "অর্ডার সফল হয়েছে!")
│   └── OrderNumber ("Order #KD-2026-A7B3X")
├── NextStepsCard
│   ├── Step1 ("Order confirmed - we'll notify the sellers")
│   ├── Step2 ("Sellers will prepare your items")
│   ├── Step3 ("Items will be shipped to your address")
│   └── Step4 ("Pay cash when you receive delivery")
├── OrderSummaryCard
│   ├── Items ordered (count)
│   ├── Delivery address (summary)
│   ├── Estimated delivery
│   └── Total amount (to pay on delivery)
├── BabyProductReminder ⭐
│   └── Message ("Remember to check product age recommendations when items arrive")
├── ActionButtons
│   ├── ViewOrderButton (→ /account/orders/[id])
│   ├── ContinueShoppingButton (→ /)
│   └── PrintReceiptButton
└── SupportInfo
    └── ContactDetails
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path:**
- [ ] Page accessible only for valid order numbers
- [ ] Invalid order number shows 404
- [ ] Order belongs to current user (or guest session)
- [ ] Success message displayed prominently
- [ ] Order number clearly visible
- [ ] Next steps explained clearly
- [ ] Estimated delivery date shown based on district
- [ ] Total amount to pay on delivery shown
- [ ] Baby product reminder displayed
- [ ] "View Order Details" links to order detail page
- [ ] "Continue Shopping" links to homepage
- [ ] Print receipt opens print dialog

**Sad Path:**
- [ ] Accessing other user's order shows 403 Forbidden
- [ ] Order not found shows 404

---

## US-8.2: Order History Page

**Points:** 2 | **Priority:** P0  
**Dependencies:** Orders exist  
**Route:** `/account/orders`

### UI Components

```
OrderHistoryPage (/account/orders)
├── PageHeader ("My Orders" / "আমার অর্ডার")
├── OrderFilters
│   ├── StatusFilter (All, Pending, Shipped, Delivered)
│   └── DateFilter (Last 30 days, Last 6 months, All time)
├── OrderList
│   └── OrderCard[]
│       ├── OrderHeader
│       │   ├── OrderNumber
│       │   ├── OrderDate
│       │   └── StatusBadge
│       ├── OrderItems (collapsed, show first 2)
│       │   └── ItemRow (image, title, qty)
│       ├── OrderFooter
│       │   ├── TotalAmount
│       │   └── ViewDetailsButton
│       └── TrackingInfo (if shipped)
├── Pagination
└── EmptyState ("No orders yet")

OrderDetailPage (/account/orders/[id])
├── BackButton
├── OrderHeader
│   ├── OrderNumber
│   ├── OrderDate
│   ├── StatusBadge
│   └── StatusTimeline
├── ShippingSection
│   ├── AddressCard
│   └── TrackingInfo
├── ItemsSection
│   └── VendorGroup[]
│       ├── VendorName
│       ├── VendorStatus (if different from order status)
│       └── ItemRow[]
│           ├── ProductImage
│           ├── ProductTitle
│           ├── AgeRange ⭐
│           ├── Quantity
│           └── Price
├── PaymentSection
│   ├── PaymentMethod
│   ├── PaymentStatus
│   └── Breakdown (subtotal, shipping, total)
└── ActionsSection
    ├── CancelOrderButton (if pending)
    └── ContactSupportButton
```

### Status Badge Colors

| Status | Color | Label EN | Label BN |
|--------|-------|----------|----------|
| pending | Yellow | Pending | অপেক্ষমান |
| confirmed | Blue | Confirmed | নিশ্চিত |
| processing | Blue | Processing | প্রক্রিয়াধীন |
| shipped | Purple | Shipped | পাঠানো হয়েছে |
| delivered | Green | Delivered | পৌঁছে গেছে |
| cancelled | Red | Cancelled | বাতিল |

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Order List:**
- [ ] `/account/orders` requires authentication
- [ ] Shows all orders for current user
- [ ] Orders sorted by date (newest first)
- [ ] Each OrderCard shows order number
- [ ] Each OrderCard shows order date
- [ ] Each OrderCard shows status badge with color
- [ ] Each OrderCard shows item preview (first 2 items)
- [ ] Each OrderCard shows total amount
- [ ] Clicking card navigates to order detail
- [ ] Pagination shows if > 10 orders

**Happy Path - Filters:**
- [ ] Status filter shows all statuses
- [ ] Selecting status filters orders
- [ ] Date filter options work correctly
- [ ] Filters combine (AND logic)

**Happy Path - Order Detail:**
- [ ] Order detail shows all items
- [ ] Items grouped by vendor
- [ ] Each item shows product details
- [ ] Baby products show age range
- [ ] Shipping address displayed
- [ ] Tracking info shown if shipped
- [ ] Payment breakdown shown
- [ ] Status timeline shows order progress

**Happy Path - Actions:**
- [ ] Cancel button shown for pending orders only
- [ ] Cancel confirmation dialog
- [ ] Cancelling updates order status
- [ ] Contact support button always visible

**Sad Path:**
- [ ] No orders shows empty state
- [ ] Invalid order ID shows 404
- [ ] Other user's order shows 403

**Responsive Design (Mobile - 320px to 767px):**
- [ ] Order list: Full-width cards stacked
- [ ] Order card shows: Order #, Status badge, Date, Total, item count
- [ ] Status badge color-coded and prominent
- [ ] Item preview shows first 2 items as small thumbnails
- [ ] "View Details" as full card tap (not separate button)
- [ ] Filters as horizontal scroll chips or bottom sheet
- [ ] Status filter as horizontal pill buttons
- [ ] Date filter as dropdown

**Order Detail (Mobile):**
- [ ] Full-screen view (not modal)
- [ ] Back button top-left
- [ ] Status timeline vertical, left-aligned
- [ ] Order items stacked, full-width cards
- [ ] Each item: Image (80px) | Title + Qty + Price
- [ ] Age range badges visible on each item
- [ ] Address card collapsible
- [ ] Payment info collapsible
- [ ] Action buttons full-width at bottom
- [ ] Tracking info prominent if shipped

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] Order list: 2-column card grid
- [ ] Order detail: Slide-in drawer from right (60% width)
- [ ] Status timeline horizontal on detail
- [ ] Items in 2-column layout

**Responsive Design (Desktop - 1024px+):**
- [ ] Order list as table with sortable columns
- [ ] Order detail as side panel or modal (50% width)
- [ ] Status timeline horizontal
- [ ] All item details visible

**Touch Interactions:**
- [ ] Order cards fully tappable
- [ ] Status filter pills minimum 44px height
- [ ] Back button 44×44px
- [ ] Cancel/Contact buttons 48px height
- [ ] Tracking link tappable

**Device-Specific Testing:**
- [ ] iPhone SE (375px): Order cards fit, details scrollable
- [ ] iPhone 14 (390px): Status badges visible
- [ ] Samsung Galaxy (360px): Long order numbers truncate
- [ ] iPad (768px): Detail drawer works
- [ ] Desktop (1920px): Table layout with side panel

---

# EPIC 9: Vendor Dashboard

**Priority:** P0 - Must Have | **Total Points:** 8  
**Status:** 🔴 Not Started

---

## Schema: Vendor Payouts Table

```sql
CREATE TABLE vendor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Payout Details
  amount DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Payment Info
  payment_method VARCHAR(20) NOT NULL,  -- bank, bkash, nagad
  payment_reference VARCHAR(100),       -- Transaction ID
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  paid_at TIMESTAMP,
  paid_by UUID REFERENCES users(id),
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed'))
);

CREATE INDEX idx_vendor_payouts_vendor ON vendor_payouts(vendor_id);
CREATE INDEX idx_vendor_payouts_status ON vendor_payouts(status);
```

---

## US-9.1: Vendor Dashboard Overview

**Points:** 2 | **Priority:** P0  
**Dependencies:** Vendor approved  
**Route:** `/vendor/dashboard`

### UI Components

```
VendorDashboardPage (/vendor/dashboard)
├── VendorSidebar
│   ├── ShopLogo
│   ├── ShopName
│   ├── NavItem: Dashboard
│   ├── NavItem: Products
│   ├── NavItem: Orders
│   ├── NavItem: Earnings
│   └── NavItem: Settings
├── DashboardContent
│   ├── WelcomeHeader
│   │   ├── Greeting ("Welcome back, [Shop Name]")
│   │   └── TodayDate
│   ├── StatCardsGrid
│   │   ├── StatCard: Total Orders (all time)
│   │   ├── StatCard: Pending Orders (action needed)
│   │   ├── StatCard: Total Earnings (all time)
│   │   ├── StatCard: Pending Payout (available)
│   │   ├── StatCard: Products Listed
│   │   └── StatCard: Products Pending Approval
│   ├── RecentOrdersSection
│   │   ├── SectionHeader ("Recent Orders")
│   │   └── OrderTable (5 most recent)
│   │       └── Columns: Order#, Customer, Items, Total, Status, Date
│   ├── LowStockAlert ⭐
│   │   └── ProductsWithLowStock (< 5 items)
│   └── QuickActions
│       ├── AddProductButton
│       └── ViewAllOrdersButton
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Access:**
- [ ] `/vendor/dashboard` requires authentication
- [ ] Non-vendor users redirected to `/vendor/apply`
- [ ] Pending vendors redirected to application status
- [ ] Suspended vendors see suspension notice

**Happy Path - Stats:**
- [ ] Total Orders count accurate
- [ ] Pending Orders shows orders needing action (pending, processing)
- [ ] Total Earnings shows sum of `vendor_earning` from completed orders
- [ ] Pending Payout shows earnings not yet paid out
- [ ] Products Listed shows vendor's total products
- [ ] Products Pending shows products with status 'pending'

**Happy Path - Recent Orders:**
- [ ] Table shows 5 most recent orders
- [ ] Each row shows order number, customer name, item count, total, status
- [ ] Clicking row navigates to order detail
- [ ] "View All" links to `/vendor/orders`

**Happy Path - Baby-Specific Alerts ⭐:**
- [ ] Low stock alert shows products with `stock_quantity <= 5`
- [ ] Alert shows product name and current stock
- [ ] Clicking product links to edit page

**Happy Path - Navigation:**
- [ ] Sidebar navigation works
- [ ] Current page highlighted in sidebar
- [ ] Mobile: sidebar collapses to hamburger menu

**Sad Path:**
- [ ] API error shows error message with retry
- [ ] No orders shows "No orders yet" in table

**Responsive Design (Mobile - 320px to 767px):**
- [ ] Bottom navigation bar instead of sidebar
- [ ] Bottom nav icons: Dashboard, Products, Orders, Earnings, Settings
- [ ] Welcome header full-width, smaller text
- [ ] Stat cards in 2×3 grid (2 columns)
- [ ] Each stat card: Icon, Value (large), Label (small)
- [ ] Recent orders as stacked cards (not table)
- [ ] Order card: Order#, Customer, Total, Status badge
- [ ] "View All" button full-width
- [ ] Low stock alert as dismissible banner at top
- [ ] Quick actions as floating action button (FAB) or bottom bar
- [ ] Pull-to-refresh for dashboard data

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] Collapsible sidebar navigation (hamburger to expand)
- [ ] Stat cards in 3×2 grid
- [ ] Recent orders as compact table
- [ ] Low stock alert as sidebar card

**Responsive Design (Desktop - 1024px+):**
- [ ] Persistent sidebar navigation (240-280px width)
- [ ] Main content area with padding
- [ ] Stat cards in single row (6 cards)
- [ ] Recent orders as full table with all columns
- [ ] Low stock alert as inline card
- [ ] Hover states on navigation items

**Navigation Responsiveness:**
- [ ] Mobile: Bottom nav with 5 icon items
- [ ] Mobile: Active item highlighted
- [ ] Tablet: Collapsible sidebar, icons + labels
- [ ] Desktop: Full sidebar with icons, labels, badges
- [ ] All: Current section clearly indicated

**Touch Interactions:**
- [ ] Bottom nav items minimum 48×48px tap area
- [ ] Stat cards tappable (navigate to relevant section)
- [ ] Order cards fully tappable
- [ ] FAB minimum 56px diameter
- [ ] Pull-to-refresh gesture on dashboard

**Device-Specific Testing:**
- [ ] iPhone SE (375px): Bottom nav fits 5 items
- [ ] iPhone 14 (390px): Stat grid readable
- [ ] Samsung Galaxy (360px): No horizontal overflow
- [ ] iPad (768px): Sidebar behavior correct
- [ ] Desktop (1920px): Comfortable data density

---

## US-9.2: Vendor Product Management

**Points:** 3 | **Priority:** P0  
**Dependencies:** US-9.1  
**Routes:** `/vendor/products`, `/vendor/products/new`, `/vendor/products/[id]/edit`

### UI Components

```
VendorProductsPage (/vendor/products)
├── PageHeader
│   ├── Title ("My Products")
│   └── AddProductButton
├── ProductFilters
│   ├── StatusFilter (All, Pending, Approved, Rejected)
│   ├── CategoryFilter
│   └── SearchInput
├── ProductTable
│   └── Columns: Image, Title, Category, Price, Stock, Status, Actions
│       └── Actions: Edit, Delete, Duplicate

ProductFormPage (/vendor/products/new, /vendor/products/[id]/edit)
├── PageHeader ("Add Product" or "Edit Product")
├── ProductForm
│   ├── BasicInfoSection
│   │   ├── TitleEN (required)
│   │   ├── TitleBN (optional)
│   │   ├── Category (dropdown, required)
│   │   ├── Brand (optional)
│   │   └── SKU (optional)
│   ├── DescriptionSection
│   │   ├── DescriptionEN (rich text, required)
│   │   └── DescriptionBN (rich text, optional)
│   ├── PricingSection
│   │   ├── Price (required)
│   │   ├── CompareAtPrice (optional, for showing discount)
│   │   └── CostPrice (optional, for profit tracking)
│   ├── InventorySection
│   │   ├── StockQuantity (required)
│   │   └── TrackInventory (checkbox)
│   ├── BabyInfoSection ⭐ (Critical for baby products)
│   │   ├── AgeRangeMin (dropdown: 0, 3, 6, 12, 24 months)
│   │   ├── AgeRangeMax (dropdown: 3, 6, 12, 24, 36 months)
│   │   ├── IsBPAFree (checkbox)
│   │   ├── IsOrganic (checkbox)
│   │   ├── IsHypoallergenic (checkbox)
│   │   ├── HasSmallParts (checkbox) ⚠️ Shows choking warning
│   │   ├── WeightLimitKg (number, for carriers/seats)
│   │   └── ExpiryDate (date picker, for consumables)
│   ├── SafetySection ⭐
│   │   ├── SafetyCertifications (multi-select: BSTI, CE, ASTM)
│   │   ├── SafetyWarningEN (textarea)
│   │   └── SafetyWarningBN (textarea)
│   ├── PhysicalSection
│   │   ├── Material (text)
│   │   ├── Color (text)
│   │   ├── Size (text)
│   │   ├── WeightGrams (number)
│   │   ├── DimensionsCM (text: L x W x H)
│   │   └── CountryOfOrigin (dropdown)
│   ├── ImagesSection
│   │   ├── ImageUploader (drag & drop, max 5)
│   │   ├── ImagePreviewGrid
│   │   └── SetPrimaryImage
│   └── SEOSection (optional)
│       ├── MetaTitle
│       └── MetaDescription
└── FormActions
    ├── SaveDraftButton
    ├── PublishButton (submits for approval)
    └── CancelButton
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Product List:**
- [ ] `/vendor/products` shows all vendor's products
- [ ] Table sortable by columns
- [ ] Status filter works
- [ ] Category filter shows vendor's used categories
- [ ] Search filters by product title
- [ ] "Add Product" button navigates to form
- [ ] Edit action opens edit form
- [ ] Delete action shows confirmation dialog
- [ ] Delete removes product from database
- [ ] Duplicate action creates copy with "(Copy)" suffix

**Happy Path - Product Form (Basic):**
- [ ] TitleEN required, 10-200 characters
- [ ] TitleBN optional, supports Bangla
- [ ] Category dropdown shows all categories
- [ ] Description supports rich text (bold, lists, links)
- [ ] Price required, positive number
- [ ] CompareAtPrice must be > Price if set
- [ ] StockQuantity required, >= 0

**Happy Path - Baby Info Section ⭐:**
- [ ] AgeRangeMin dropdown: 0, 3, 6, 12, 24 months
- [ ] AgeRangeMax dropdown: 3, 6, 12, 24, 36 months
- [ ] AgeRangeMax must be >= AgeRangeMin
- [ ] IsBPAFree checkbox (default: false)
- [ ] IsOrganic checkbox (default: false)
- [ ] IsHypoallergenic checkbox (default: false)
- [ ] HasSmallParts checkbox - when checked, shows warning preview
- [ ] WeightLimitKg shows only for relevant categories (carriers, seats)
- [ ] ExpiryDate shows only for consumable categories (diapers, wipes, formula)
- [ ] ExpiryDate required for consumables, must be future date

**Happy Path - Safety Section ⭐:**
- [ ] SafetyCertifications multi-select (BSTI, CE, ASTM F963, ISO)
- [ ] SafetyWarningEN textarea for custom warnings
- [ ] SafetyWarningBN textarea for Bangla warning
- [ ] Preview shows how warnings will display to customers

**Happy Path - Images:**
- [ ] Image uploader accepts JPG, PNG, WebP
- [ ] Max file size: 5MB per image
- [ ] Max 5 images per product
- [ ] Drag to reorder images
- [ ] First image is primary by default
- [ ] Can set different image as primary
- [ ] Can remove individual images

**Happy Path - Save/Publish:**
- [ ] "Save Draft" saves with status 'draft' (not visible to customers)
- [ ] "Publish" submits for approval with status 'pending'
- [ ] New vendor's products require approval
- [ ] Success message shown after save
- [ ] Redirect to product list after save

**Sad Path / Negative Testing:**
- [ ] Invalid price shows error
- [ ] Duplicate SKU shows warning
- [ ] Image upload failure shows retry option
- [ ] Form preserves data on validation error
- [ ] Cannot delete product with pending orders
- [ ] Editing approved product keeps approved status (minor changes)
- [ ] Major edit of approved product resets to pending (future consideration)

**Schema Validation:**
- [ ] `is_bpa_free` boolean stored correctly
- [ ] `is_organic` boolean stored correctly
- [ ] `has_small_parts` boolean stored correctly
- [ ] `age_range_min` and `age_range_max` integers in months
- [ ] `safety_certifications` stored as text array
- [ ] `expiry_date` date field validated
- [ ] `weight_limit_kg` decimal field

**Responsive Design - Product List (Mobile - 320px to 767px):**
- [ ] Products as stacked cards (not table)
- [ ] Card shows: Image (80px), Title, Price, Stock, Status badge
- [ ] Actions as "..." menu (edit, duplicate, delete)
- [ ] "Add Product" floating action button (FAB) bottom-right
- [ ] Filters as horizontal scroll chips
- [ ] Search bar full-width at top
- [ ] Pull-to-refresh for product list
- [ ] Status filter as horizontal pills

**Responsive Design - Product List (Tablet - 768px to 1023px):**
- [ ] Products as compact table
- [ ] Columns: Image, Title, Price, Stock, Status, Actions
- [ ] Actions visible as icon buttons
- [ ] Add Product button in header

**Responsive Design - Product List (Desktop - 1024px+):**
- [ ] Full table with all columns
- [ ] Sortable columns
- [ ] Bulk selection checkboxes
- [ ] Action buttons with labels on hover

**Responsive Design - Product Form (Mobile - 320px to 767px):**
- [ ] Single column form layout
- [ ] Form divided into collapsible sections/accordion
- [ ] Section headers: Basic Info, Description, Pricing, Baby Info, Safety, Images
- [ ] All inputs full-width
- [ ] Rich text editor simplified (basic formatting only)
- [ ] Age range dropdowns as bottom sheets
- [ ] Checkboxes (BPA-free, Organic, etc.) as full-width rows with toggles
- [ ] Image upload as grid with add button
- [ ] Camera option for product photos
- [ ] "Save Draft" and "Publish" as bottom sticky bar
- [ ] Form progress indicator at top

**Responsive Design - Product Form (Tablet - 768px to 1023px):**
- [ ] Two-column layout for short fields (Price, Stock)
- [ ] Sections as tabs or expandable cards
- [ ] Rich text editor full-featured
- [ ] Image upload with drag-and-drop

**Responsive Design - Product Form (Desktop - 1024px+):**
- [ ] Form max-width 900px, centered
- [ ] Multi-column where logical
- [ ] Image preview gallery with reordering
- [ ] Side-by-side preview (form | preview)

**Image Upload Responsiveness:**
- [ ] Upload area minimum 120px height on mobile
- [ ] Tap to upload or capture with camera
- [ ] Image thumbnails 80×80px on mobile
- [ ] Reorder via long-press and drag
- [ ] Delete button on each image (X)
- [ ] Progress indicator during upload

**Touch Interactions:**
- [ ] Form inputs minimum 48px height
- [ ] Accordion headers 48px height
- [ ] Toggle switches instead of small checkboxes
- [ ] Dropdown triggers 48px height
- [ ] Save/Publish buttons 48px height
- [ ] Image delete buttons 44×44px

**Device-Specific Testing:**
- [ ] iPhone SE (375px): Form usable, no horizontal scroll
- [ ] iPhone 14 (390px): Image upload works with camera
- [ ] Samsung Galaxy (360px): Rich text editor functional
- [ ] iPad (768px): Two-column form layout
- [ ] Desktop (1920px): Full form with preview

---

## US-9.3: Vendor Order Management

**Points:** 3 | **Priority:** P0  
**Dependencies:** Orders exist for vendor  
**Route:** `/vendor/orders`

### UI Components

```
VendorOrdersPage (/vendor/orders)
├── PageHeader ("Orders")
├── OrderFilters
│   ├── StatusFilter (All, Pending, Processing, Shipped, Delivered)
│   ├── DateFilter
│   └── SearchInput (order #, customer name)
├── OrderTable
│   └── Columns: Order#, Customer, Items, Total, Status, Date, Actions
├── OrderDetailDrawer (slides in on row click)
│   ├── OrderHeader
│   │   ├── OrderNumber
│   │   ├── OrderDate
│   │   └── CurrentStatus
│   ├── CustomerInfo
│   │   ├── CustomerName
│   │   ├── Phone
│   │   └── Address
│   ├── OrderItems
│   │   └── ItemRow[] (only this vendor's items)
│   ├── StatusUpdateSection
│   │   ├── StatusDropdown (Processing, Shipped, Delivered)
│   │   └── UpdateButton
│   ├── TrackingSection
│   │   ├── CourierNameInput
│   │   └── TrackingNumberInput
│   └── Notes
│       └── VendorNotesTextarea
```

### Order Status Flow (Vendor Perspective)

```
Pending → Processing → Shipped → Delivered
   ↓
(Customer cancels)
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Order List:**
- [ ] Shows only orders containing vendor's products
- [ ] Multi-vendor order shows only this vendor's items
- [ ] Table shows order number, customer name, item count, total, status
- [ ] Status badge with appropriate color
- [ ] Sortable by date, status
- [ ] Filterable by status
- [ ] Searchable by order number

**Happy Path - Order Detail:**
- [ ] Drawer shows complete order info
- [ ] Customer name and phone visible
- [ ] Shipping address complete
- [ ] Only this vendor's items shown (not other vendors' items)
- [ ] Item shows product image, title, quantity, price

**Happy Path - Status Update:**
- [ ] Status dropdown shows valid next statuses only
- [ ] Pending → can update to Processing
- [ ] Processing → can update to Shipped
- [ ] Shipped → can update to Delivered
- [ ] Delivered is final state
- [ ] Updating status updates order_items.status
- [ ] Customer order.status updates when all vendors update

**Happy Path - Tracking:**
- [ ] CourierName text input
- [ ] TrackingNumber text input
- [ ] Both required when changing to "Shipped"
- [ ] Tracking info saved to order_items

**Sad Path / Negative Testing:**
- [ ] Cannot update cancelled order
- [ ] Cannot skip statuses (Pending → Shipped directly)
- [ ] API error shows retry option

**Schema Validation:**
- [ ] `order_items.status` updated for vendor's items only
- [ ] `order_items.vendor_tracking_number` stored
- [ ] Main `orders.status` derived from all order_items statuses

---

# EPIC 10: Admin Panel

**Priority:** P0 - Must Have | **Total Points:** 8  
**Status:** 🔴 Not Started

---

## Schema: Admin Role

```sql
-- Add role to users table
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'customer';
-- Roles: customer, vendor, admin

CREATE INDEX idx_users_role ON users(role);
```

---

## US-10.1: Admin Vendor Management

**Points:** 3 | **Priority:** P0  
**Dependencies:** Vendors exist  
**Route:** `/admin/vendors`

### UI Components

```
AdminVendorsPage (/admin/vendors)
├── PageHeader ("Vendor Management")
├── Tabs
│   ├── PendingApplications (count badge)
│   ├── ActiveVendors
│   └── SuspendedVendors
├── VendorTable
│   └── Columns: Shop Name, Owner, Email, Phone, Status, Applied Date, Actions
├── VendorDetailDrawer
│   ├── ShopInfo
│   │   ├── ShopName
│   │   ├── Description
│   │   └── Phone/Email
│   ├── OwnerInfo
│   │   ├── OwnerName (from user)
│   │   └── OwnerEmail
│   ├── Documents
│   │   ├── NIDFrontImage (viewable)
│   │   ├── NIDBackImage (viewable)
│   │   └── TradeLicenseImage (if provided)
│   ├── PaymentInfo
│   │   ├── BankDetails
│   │   └── MobilePaymentNumbers
│   └── Actions
│       ├── ApproveButton (for pending)
│       ├── RejectButton (for pending, requires reason)
│       ├── SuspendButton (for active, requires reason)
│       └── ReactivateButton (for suspended)
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Access:**
- [ ] `/admin/vendors` requires admin role
- [ ] Non-admin users see 403 Forbidden
- [ ] Admin sidebar navigation works

**Happy Path - Pending Tab:**
- [ ] Shows vendors with status 'pending'
- [ ] Count badge shows pending count
- [ ] Table shows application date
- [ ] Clicking row opens detail drawer
- [ ] NID images viewable (zoom/download)
- [ ] Trade license viewable if provided

**Happy Path - Approve:**
- [ ] Approve button visible for pending vendors
- [ ] Clicking Approve shows confirmation
- [ ] Confirming updates status to 'approved'
- [ ] approved_at timestamp set
- [ ] approved_by set to admin user ID
- [ ] Vendor moves to Active tab
- [ ] Email notification to vendor (if configured)

**Happy Path - Reject:**
- [ ] Reject button visible for pending vendors
- [ ] Clicking Reject opens reason modal
- [ ] Reason required (min 10 characters)
- [ ] Confirming updates status to 'rejected'
- [ ] rejection_reason stored
- [ ] Vendor can see reason and reapply

**Happy Path - Suspend:**
- [ ] Suspend button visible for active vendors
- [ ] Reason required
- [ ] Updates status to 'suspended'
- [ ] Vendor's products hidden from storefront
- [ ] Vendor cannot access dashboard

**Happy Path - Reactivate:**
- [ ] Reactivate button for suspended vendors
- [ ] Confirmation required
- [ ] Updates status to 'approved'
- [ ] Vendor's products visible again

**Sad Path:**
- [ ] Cannot approve without reviewing documents
- [ ] Cannot reject without reason
- [ ] Cannot suspend without reason

**Responsive Design (Mobile - 320px to 767px):**
- [ ] Admin panel uses bottom navigation or hamburger menu
- [ ] Tabs as horizontal scroll pills
- [ ] Pending count badge on tab
- [ ] Vendor list as stacked cards
- [ ] Card shows: Shop name, Status badge, Applied date
- [ ] Tap card to view details
- [ ] Details open as full-screen view (not drawer)
- [ ] Document images viewable with pinch-zoom
- [ ] Approve/Reject buttons full-width at bottom
- [ ] Rejection reason as bottom sheet with textarea

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] Sidebar navigation (collapsible)
- [ ] Vendors as compact table
- [ ] Detail drawer from right (60% width)
- [ ] Document images in drawer with zoom
- [ ] Action buttons in drawer footer

**Responsive Design (Desktop - 1024px+):**
- [ ] Persistent sidebar navigation
- [ ] Full table with all columns
- [ ] Detail drawer (40% width) or modal
- [ ] Document images with hover zoom
- [ ] Keyboard shortcuts for approve/reject

**Document Viewing:**
- [ ] Mobile: Full-screen image viewer with zoom
- [ ] Mobile: Swipe between NID front/back
- [ ] Tablet: Side-by-side NID images in drawer
- [ ] Desktop: Click to zoom in modal
- [ ] Download option for documents

**Touch Interactions:**
- [ ] Vendor cards fully tappable
- [ ] Tab pills minimum 44px height
- [ ] Approve/Reject buttons 48px height
- [ ] Document images tappable to view full-screen
- [ ] Phone number tappable (opens dialer)
- [ ] Rejection reason textarea minimum 120px height

**Device-Specific Testing:**
- [ ] iPhone SE (375px): Cards fit, details scrollable
- [ ] iPhone 14 (390px): Document zoom works
- [ ] Samsung Galaxy (360px): Action buttons accessible
- [ ] iPad (768px): Table + drawer layout
- [ ] Desktop (1920px): Full admin workflow smooth

---

## US-10.2: Admin Product Moderation

**Points:** 3 | **Priority:** P0  
**Dependencies:** Products exist  
**Route:** `/admin/products`

### UI Components

```
AdminProductsPage (/admin/products)
├── PageHeader ("Product Moderation")
├── Tabs
│   ├── PendingApproval (count badge)
│   ├── Approved
│   └── Rejected
├── ProductTable
│   └── Columns: Image, Title, Vendor, Category, Price, Status, Submitted, Actions
├── ProductReviewDrawer
│   ├── ProductImages (gallery)
│   ├── ProductInfo
│   │   ├── Title (EN/BN)
│   │   ├── Description
│   │   ├── Category
│   │   ├── Price
│   │   └── Stock
│   ├── BabyProductInfo ⭐
│   │   ├── AgeRange
│   │   ├── SafetyBadges (BPA-free, Organic)
│   │   ├── Certifications
│   │   ├── SafetyWarnings
│   │   └── ChokingHazardWarning (if has_small_parts)
│   ├── VendorInfo
│   │   ├── ShopName (link to vendor)
│   │   └── VendorRating
│   └── ModerationActions
│       ├── ApproveButton
│       ├── RejectButton (with reason)
│       └── RequestChangesButton (with notes)
```

### Product Moderation Checklist (for Admin)

```
Before approving, verify:
□ Product images are clear and show actual product
□ Title accurately describes product
□ Price is reasonable
□ Age range is appropriate for product type
□ Safety certifications claimed are verifiable
□ No prohibited items (replica branded goods, unsafe products)
□ Description doesn't contain contact info/external links
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Pending Tab:**
- [ ] Shows products with status 'pending'
- [ ] Count badge shows pending count
- [ ] Sorted by submission date (oldest first - FIFO)
- [ ] Product images visible in gallery
- [ ] All product details viewable

**Happy Path - Baby Product Review ⭐:**
- [ ] Age range clearly displayed
- [ ] BPA-free status shown
- [ ] Organic status shown
- [ ] Has small parts warning highlighted if true
- [ ] Safety certifications listed
- [ ] Custom safety warnings shown
- [ ] Expiry date shown for consumables

**Happy Path - Approve:**
- [ ] Approve button updates status to 'approved'
- [ ] published_at timestamp set
- [ ] Product immediately visible on storefront
- [ ] Vendor notified

**Happy Path - Reject:**
- [ ] Reject requires reason selection
- [ ] Rejection reasons: "Poor image quality", "Inaccurate description", "Inappropriate product", "Missing safety info", "Price issue", "Other"
- [ ] Additional notes field
- [ ] rejection_reason stored
- [ ] Product moves to Rejected tab
- [ ] Vendor can see reason and edit/resubmit

**Happy Path - Request Changes:**
- [ ] Request Changes sends product back to vendor
- [ ] Notes explaining required changes
- [ ] Status remains 'pending' but flagged
- [ ] Vendor sees change request in their dashboard

**Sad Path:**
- [ ] Cannot approve product without reviewing all sections
- [ ] Cannot reject without reason

**Schema Validation:**
- [ ] `status` updated to 'approved' or 'rejected'
- [ ] `rejection_reason` stored
- [ ] `published_at` set on approval

**Responsive Design (Mobile - 320px to 767px):**
- [ ] Tabs as horizontal scroll pills with count badges
- [ ] Product list as cards
- [ ] Card shows: Image (60px), Title, Vendor, Price, Status
- [ ] Tap card for full review
- [ ] Full-screen product review view
- [ ] Image gallery swipeable
- [ ] Baby product info section highlighted
- [ ] Safety warnings in prominent card
- [ ] Approve/Reject as bottom sticky buttons
- [ ] Rejection reason as bottom sheet

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] Product list as compact table
- [ ] Review drawer from right (65% width)
- [ ] Image gallery in drawer
- [ ] Baby info section expandable
- [ ] Action buttons in drawer footer

**Responsive Design (Desktop - 1024px+):**
- [ ] Full table with thumbnails
- [ ] Review modal (70% width)
- [ ] Large image gallery with thumbnails
- [ ] Side-by-side: Info | Images
- [ ] Quick approve/reject from table (for trusted vendors)

**Baby Product Review Responsiveness:**
- [ ] Age range prominently displayed on all devices
- [ ] Safety badges with icons visible at all sizes
- [ ] Choking hazard warning highlighted (yellow/orange background)
- [ ] Safety certifications as badge list
- [ ] Custom warnings in distinct card
- [ ] Expiry date warning if applicable

**Touch Interactions:**
- [ ] Product cards fully tappable
- [ ] Image gallery swipeable
- [ ] Approve/Reject buttons 48px height
- [ ] Rejection reason dropdown 48px height
- [ ] "Request Changes" button accessible

**Device-Specific Testing:**
- [ ] iPhone SE (375px): Review screen usable
- [ ] iPhone 14 (390px): All baby safety info visible
- [ ] Samsung Galaxy (360px): Image gallery works
- [ ] iPad (768px): Drawer review workflow
- [ ] Desktop (1920px): Efficient moderation workflow

---

## US-10.3: Admin Order Oversight & Payout Tracking

**Points:** 2 | **Priority:** P0  
**Dependencies:** Orders exist  
**Routes:** `/admin/orders`, `/admin/payouts`

### UI Components

```
AdminOrdersPage (/admin/orders)
├── PageHeader ("All Orders")
├── OrderFilters
│   ├── StatusFilter
│   ├── DateRangeFilter
│   ├── VendorFilter (dropdown)
│   └── SearchInput (order #, customer)
├── OrderTable
│   └── Columns: Order#, Customer, Vendor(s), Items, Total, Status, Payment, Date
├── OrderDetailDrawer
│   ├── FullOrderInfo
│   ├── AllItems (including vendor names)
│   ├── ShippingAddress
│   ├── PaymentInfo (COD status)
│   └── AdminActions
│       ├── CancelOrderButton
│       ├── RefundButton (future)
│       └── NotesTextarea

AdminPayoutsPage (/admin/payouts)
├── PageHeader ("Vendor Payouts")
├── PendingPayoutsList
│   └── VendorPayoutCard[]
│       ├── VendorName
│       ├── PendingAmount (earnings since last payout)
│       ├── LastPayoutDate
│       ├── LastPayoutAmount
│       └── MarkAsPaidButton
├── MarkAsPaidModal
│   ├── VendorInfo
│   ├── AmountToPay
│   ├── PaymentMethodSelect (Bank, bKash, Nagad)
│   ├── PaymentReferenceInput (transaction ID)
│   ├── DatePicker
│   └── ConfirmButton
├── PayoutHistory
│   └── PayoutTable
│       └── Columns: Vendor, Amount, Method, Reference, Date, Admin
```

### Payout Calculation

```typescript
// Pending payout for vendor = 
//   SUM(order_items.vendor_earning) 
//   WHERE order_items.vendor_id = vendor.id
//   AND orders.status = 'delivered'
//   AND orders.payment_status = 'collected'
//   AND NOT EXISTS (payout record for this order item)

interface VendorPendingPayout {
  vendorId: string;
  vendorName: string;
  pendingAmount: number;
  orderCount: number;
  oldestOrderDate: Date;
  lastPayoutDate: Date | null;
  lastPayoutAmount: number | null;
  paymentMethod: 'bank' | 'bkash' | 'nagad';
  paymentDetails: string; // Account number
}
```

### Acceptance Criteria (ClickUp Checklist)

**Happy Path - Admin Orders:**
- [ ] `/admin/orders` shows all marketplace orders
- [ ] Can filter by status, date, vendor
- [ ] Can search by order number or customer name
- [ ] Order detail shows all items with vendor info
- [ ] Can add admin notes
- [ ] Can cancel order (updates status, notifies customer/vendor)

**Happy Path - Payout List:**
- [ ] `/admin/payouts` shows vendors with pending payouts
- [ ] Pending amount calculated from delivered & paid orders
- [ ] Commission already deducted from pending amount
- [ ] Last payout info shown

**Happy Path - Mark as Paid:**
- [ ] "Mark as Paid" opens modal
- [ ] Amount pre-filled with pending amount
- [ ] Payment method required
- [ ] Payment reference required (transaction ID)
- [ ] Date defaults to today
- [ ] Confirming creates payout record
- [ ] Vendor's pending amount resets
- [ ] Payout history updated

**Happy Path - Payout History:**
- [ ] Shows all historical payouts
- [ ] Filterable by vendor
- [ ] Shows payment method, reference, date
- [ ] Shows admin who processed

**Sad Path:**
- [ ] Cannot mark as paid with amount > pending
- [ ] Cannot mark as paid without reference
- [ ] Duplicate payout prevention

**Schema Validation:**
- [ ] `vendor_payouts` record created
- [ ] `vendor_payouts.amount` matches calculated pending
- [ ] `vendor_payouts.payment_reference` stored
- [ ] `vendor_payouts.paid_by` references admin user

**Responsive Design - Admin Orders (Mobile - 320px to 767px):**
- [ ] Orders as stacked cards
- [ ] Card shows: Order#, Customer, Vendor(s), Total, Status
- [ ] Filters as bottom sheet
- [ ] Search bar full-width
- [ ] Order detail as full-screen view
- [ ] All items listed with vendor info
- [ ] Admin notes as expandable section

**Responsive Design - Admin Payouts (Mobile - 320px to 767px):**
- [ ] Pending payouts as cards
- [ ] Card shows: Vendor, Pending amount (large), Last payout
- [ ] "Mark as Paid" opens bottom sheet
- [ ] Payment form full-width inputs
- [ ] Amount pre-filled, editable
- [ ] Payment method as radio buttons (large tap area)
- [ ] Reference input with appropriate keyboard
- [ ] Date picker mobile-friendly
- [ ] Payout history as cards

**Responsive Design (Tablet - 768px to 1023px):**
- [ ] Orders as compact table
- [ ] Order detail as drawer
- [ ] Payouts as table
- [ ] Mark as Paid as modal

**Responsive Design (Desktop - 1024px+):**
- [ ] Full tables with all columns
- [ ] Inline filtering
- [ ] Mark as Paid modal
- [ ] Payout history with pagination

**Touch Interactions:**
- [ ] Payout cards fully tappable
- [ ] Mark as Paid button 44×44px minimum
- [ ] Payment method radio buttons 48px height
- [ ] Confirm button 48px height
- [ ] Date picker touch-friendly

**Device-Specific Testing:**
- [ ] iPhone SE (375px): Payout flow works
- [ ] iPhone 14 (390px): Payment form usable
- [ ] Samsung Galaxy (360px): Amount display clear
- [ ] iPad (768px): Table + modal workflow
- [ ] Desktop (1920px): Full admin efficiency

---

# Definition of Done (DoD) - Complete Checklist

A user story is "Done" when ALL of the following are verified:

## Code Quality
- [ ] All acceptance criteria checkboxes pass
- [ ] All sad path scenarios handled
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No console errors in browser

## Functionality
- [ ] Feature works in both Bangla and English
- [ ] Data persists correctly (database/localStorage)
- [ ] API error handling implemented
- [ ] Loading states implemented
- [ ] Empty states implemented

## Baby Product Domain
- [ ] Age range displays correctly where applicable
- [ ] Safety badges (BPA-free, Organic) display correctly
- [ ] Safety warnings display prominently
- [ ] Choking hazard warnings display for small parts products
- [ ] Expiry date warnings for consumables

## Database
- [ ] Schema matches specification
- [ ] Required fields enforced
- [ ] Foreign key constraints work
- [ ] Indexes created for query performance

## Responsive Design - MANDATORY

### Mobile Testing (320px - 767px)
- [ ] **iPhone SE (375×667)**: Layout correct, no horizontal scroll
- [ ] **iPhone 14 (390×844)**: Full functionality works
- [ ] **Samsung Galaxy S21 (360×800)**: Android rendering correct
- [ ] **Samsung Galaxy A52 (412×915)**: Large Android works
- [ ] Touch targets minimum 44×44px
- [ ] Bottom navigation accessible (if used)
- [ ] Forms usable with virtual keyboard
- [ ] Sticky elements don't overlap content
- [ ] Images scale correctly
- [ ] Text minimum 16px (readable without zoom)
- [ ] Buttons/CTAs easily tappable
- [ ] Modals/drawers fit screen
- [ ] Horizontal scroll only where intentional (carousels)

### Tablet Testing (768px - 1023px)
- [ ] **iPad Mini (768×1024)**: Layout switches correctly
- [ ] **iPad Air (820×1180)**: All features accessible
- [ ] Two-column layouts work where specified
- [ ] Sidebars collapse/expand correctly
- [ ] Touch and mouse inputs both work
- [ ] Drawers sized appropriately (not full-screen)

### Desktop Testing (1024px+)
- [ ] **Laptop (1366×768)**: Common resolution works
- [ ] **Desktop (1920×1080)**: Full layout with sidebars
- [ ] **Large Desktop (2560×1440)**: Content centered, no stretching
- [ ] Hover states work
- [ ] Keyboard navigation works
- [ ] Mouse interactions work
- [ ] Sidebars persistent where specified
- [ ] Max-width constraints applied

### Cross-Browser Testing
- [ ] Chrome (latest) - Windows/Mac
- [ ] Safari (latest) - Mac/iOS
- [ ] Firefox (latest) - Windows/Mac
- [ ] Samsung Internet - Android
- [ ] Edge (latest) - Windows

### Performance by Device
- [ ] Mobile (4G): First Contentful Paint < 1.8s
- [ ] Mobile (4G): Largest Contentful Paint < 2.5s
- [ ] Mobile (4G): Time to Interactive < 3.9s
- [ ] Desktop: All metrics under 2s

### Accessibility (All Devices)
- [ ] Color contrast meets WCAG AA
- [ ] Focus states visible
- [ ] Screen reader compatible
- [ ] Keyboard navigable (desktop)
- [ ] Touch targets adequate (mobile)

## Testing Sign-off
- [ ] Happy path tested on mobile (actual device or emulator)
- [ ] Happy path tested on tablet
- [ ] Happy path tested on desktop
- [ ] Sad paths tested
- [ ] Cross-browser spot check completed

## Deployment
- [ ] Code committed and pushed
- [ ] PR reviewed (if applicable)
- [ ] Merged to main branch

---

# Appendix: Responsive Component Patterns

## Common Component Behaviors by Breakpoint

### Navigation Patterns

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MOBILE (< 768px)                                                        │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [☰]  [LOGO]                    [🔍] [🛒]  │ ← Header (fixed top)    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│                           CONTENT                                       │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [🏠] [📦] [🛒] [📋] [👤]       │ ← Bottom Nav (fixed, 56px height) │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ DESKTOP (≥ 1024px)                                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [LOGO]  [Search...........................] [EN] [🛒] [Login]       │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│ ┌────────┐ ┌────────────────────────────────────────────────────────┐   │
│ │        │ │                                                        │   │
│ │ SIDEBAR│ │                    CONTENT                             │   │
│ │ (240px)│ │                                                        │   │
│ │        │ │                                                        │   │
│ └────────┘ └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Product Grid Patterns

```css
/* Mobile First Grid */
.product-grid {
  display: grid;
  gap: 16px;
  padding: 16px;
  
  /* Mobile: 2 columns */
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 768px) {
  .product-grid {
    /* Tablet: 3 columns */
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
}

@media (min-width: 1024px) {
  .product-grid {
    /* Desktop: 4 columns */
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }
}

@media (min-width: 1280px) {
  .product-grid {
    /* Large: 4 columns with max width */
    max-width: 1440px;
    margin: 0 auto;
  }
}
```

### Card Component Patterns

```
MOBILE ProductCard (< 768px)
┌─────────────────────┐
│ ┌─────────────────┐ │
│ │                 │ │ ← Image (1:1 ratio)
│ │     IMAGE       │ │
│ │   [AGE BADGE]   │ │ ← Age badge overlay
│ │  [-20% BADGE]   │ │ ← Discount badge
│ └─────────────────┘ │
│ Vendor Name         │ ← 12px, muted
│ Product Title That  │ ← 14px, 2 lines max
│ Might Be Long...    │
│ [BPA] [ORG]         │ ← Safety badges
│ ৳1,200  ৳1,500      │ ← Price (16px bold) + Compare
└─────────────────────┘
Min width: 150px
Touch target: Entire card

DESKTOP ProductCard (≥ 1024px)
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │                     │ │
│ │       IMAGE         │ │
│ │                     │ │
│ │  [Quick Add Button] │ │ ← Shows on hover
│ └─────────────────────┘ │
│ Vendor Name             │
│ Product Title           │
│ [BPA Free] [Organic]    │
│ ৳1,200  ৳1,500          │
│ ⭐⭐⭐⭐☆ (24)          │ ← Rating (future)
└─────────────────────────┘
Hover: Shadow + slight scale
```

### Form Patterns

```
MOBILE Form Layout (< 768px)
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ Label                           │ │ ← Label above
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Input (48px height)             │ │ ← Full width
│ └─────────────────────────────────┘ │
│ Error message (red, 12px)           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Next Label                      │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Next Input                      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

DESKTOP Form Layout (≥ 1024px)
┌───────────────────────────────────────────────────────┐
│ ┌─────────────────────┐ ┌─────────────────────┐       │
│ │ Label               │ │ Label               │       │
│ │ [Input............] │ │ [Input............] │       │ ← Side by side
│ │ Error               │ │ Error               │       │
│ └─────────────────────┘ └─────────────────────┘       │
│                                                       │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Full Width Label                                  │ │
│ │ [Full Width Input...............................] │ │
│ └───────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
Max form width: 720px
```

### Modal/Drawer Patterns

```
MOBILE: Full Screen or Bottom Sheet
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ [X]  Modal Title                │ │ ← Sticky header
│ └─────────────────────────────────┘ │
│                                     │
│           SCROLLABLE                │
│            CONTENT                  │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Cancel]     [Confirm]          │ │ ← Sticky footer
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

TABLET: Side Drawer (60% width)
┌──────────────────┬──────────────────┐
│                  │ ┌──────────────┐ │
│                  │ │ Drawer       │ │
│    BACKDROP      │ │ Content      │ │
│    (dimmed)      │ │              │ │
│                  │ │ [Actions]    │ │
│                  │ └──────────────┘ │
└──────────────────┴──────────────────┘

DESKTOP: Centered Modal (max 600px)
┌─────────────────────────────────────────┐
│                                         │
│         ┌─────────────────┐             │
│         │                 │             │
│         │  Modal Content  │             │
│         │                 │             │
│         │  [Actions]      │             │
│         └─────────────────┘             │
│                                         │
└─────────────────────────────────────────┘
```

### Table vs Card Pattern Decision

| Screen Width | Data Rows | Use Pattern |
|--------------|-----------|-------------|
| < 768px | Any | Cards (stacked) |
| 768px - 1023px | < 5 columns | Compact table |
| 768px - 1023px | ≥ 5 columns | Cards or horizontal scroll table |
| ≥ 1024px | Any | Full table |

### Sticky Element Behavior

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Header | Fixed top (56px) | Fixed top (64px) | Fixed top (72px) |
| Bottom Nav | Fixed bottom (56px) | Hidden | Hidden |
| Filter Bar | Sticky below header | Sticky below header | In sidebar |
| Add to Cart | Sticky bottom | In content | Sticky sidebar or in content |
| Form Actions | Sticky bottom | In content | In content |

### Safe Area Handling (iOS)

```css
/* For fixed bottom elements */
.bottom-nav,
.sticky-footer {
  padding-bottom: env(safe-area-inset-bottom);
}

/* For fixed top elements */
.header {
  padding-top: env(safe-area-inset-top);
}

/* For modals/full-screen views */
.modal-content {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

---

# Appendix A: Translation Keys Required

```typescript
// Complete list of translation keys needed for Epics 2-10

const requiredTranslations = {
  // Navigation
  'nav.home': 'Home',
  'nav.categories': 'Categories',
  'nav.cart': 'Cart',
  'nav.orders': 'My Orders',
  'nav.account': 'Account',
  'nav.vendor_dashboard': 'Seller Dashboard',
  'nav.admin': 'Admin',
  
  // Product
  'product.add_to_cart': 'Add to Cart',
  'product.out_of_stock': 'Out of Stock',
  'product.in_stock': 'In Stock',
  'product.low_stock': 'Only {count} left',
  'product.age_range': 'Suitable for',
  'product.bpa_free': 'BPA Free',
  'product.organic': 'Organic',
  'product.hypoallergenic': 'Hypoallergenic',
  'product.safety_warning': 'Safety Warning',
  'product.choking_hazard': 'Choking Hazard: Contains small parts. Not for children under 3.',
  'product.expiry_date': 'Expiry Date',
  'product.weight_limit': 'Maximum child weight',
  'product.certifications': 'Safety Certifications',
  
  // Cart
  'cart.title': 'Shopping Cart',
  'cart.empty': 'Your cart is empty',
  'cart.continue_shopping': 'Continue Shopping',
  'cart.subtotal': 'Subtotal',
  'cart.checkout': 'Proceed to Checkout',
  'cart.remove': 'Remove',
  'cart.quantity': 'Quantity',
  
  // Checkout
  'checkout.shipping': 'Shipping Address',
  'checkout.payment': 'Payment',
  'checkout.review': 'Review Order',
  'checkout.cod': 'Cash on Delivery',
  'checkout.cod_description': 'Pay when you receive your order',
  'checkout.place_order': 'Place Order',
  'checkout.shipping_cost': 'Shipping Cost',
  'checkout.total': 'Total',
  
  // Orders
  'order.status.pending': 'Pending',
  'order.status.confirmed': 'Confirmed',
  'order.status.processing': 'Processing',
  'order.status.shipped': 'Shipped',
  'order.status.delivered': 'Delivered',
  'order.status.cancelled': 'Cancelled',
  'order.tracking': 'Tracking Number',
  
  // Vendor
  'vendor.apply': 'Become a Seller',
  'vendor.dashboard': 'Seller Dashboard',
  'vendor.products': 'My Products',
  'vendor.orders': 'Orders',
  'vendor.earnings': 'Earnings',
  
  // Baby-specific
  'baby.age_0_3': '0-3 months',
  'baby.age_3_6': '3-6 months',
  'baby.age_6_12': '6-12 months',
  'baby.age_1_2': '1-2 years',
  'baby.age_2_3': '2-3 years',
  'baby.safety_reminder': 'Please verify all products match your child\'s age before purchase',
  
  // ... add more as needed
};
```

---

# Appendix B: API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List all categories | Public |
| GET | `/api/categories/:slug` | Category details | Public |
| GET | `/api/categories/:slug/products` | Products in category | Public |
| GET | `/api/products` | Search/list products | Public |
| GET | `/api/products/:slug` | Product details | Public |
| GET | `/api/cart` | Get current cart | Optional |
| POST | `/api/cart/items` | Add item to cart | Optional |
| PATCH | `/api/cart/items/:id` | Update cart item | Optional |
| DELETE | `/api/cart/items/:id` | Remove cart item | Optional |
| POST | `/api/checkout` | Create order | Optional |
| GET | `/api/orders` | List user orders | Required |
| GET | `/api/orders/:id` | Order details | Required |
| POST | `/api/vendors/apply` | Submit vendor application | Required |
| GET | `/api/vendor/dashboard` | Vendor dashboard stats | Vendor |
| GET | `/api/vendor/products` | Vendor's products | Vendor |
| POST | `/api/vendor/products` | Create product | Vendor |
| PATCH | `/api/vendor/products/:id` | Update product | Vendor |
| DELETE | `/api/vendor/products/:id` | Delete product | Vendor |
| GET | `/api/vendor/orders` | Vendor's orders | Vendor |
| PATCH | `/api/vendor/orders/:id` | Update order status | Vendor |
| GET | `/api/admin/vendors` | All vendors | Admin |
| PATCH | `/api/admin/vendors/:id` | Approve/reject vendor | Admin |
| GET | `/api/admin/products` | All products | Admin |
| PATCH | `/api/admin/products/:id` | Approve/reject product | Admin |
| GET | `/api/admin/orders` | All orders | Admin |
| GET | `/api/admin/payouts` | Pending payouts | Admin |
| POST | `/api/admin/payouts` | Create payout record | Admin |

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 3.1 | Jan 2026 | Team Hadi | Initial 2-week MVP PRD |
| 4.0 | Jan 2026 | Team Hadi | Spec-driven technical edition with baby domain integration, ClickUp checklists, sad paths, and schema validation |