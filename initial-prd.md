# কিনেদাও (KineDao.com)
## 2-Week MVP Roadmap - Multivendor Baby Products Marketplace

# AGILE PRODUCT REQUIREMENTS DOCUMENT (PRD)
### *Strict 2-Week MVP with Fibonacci Story Points*
### *Optimized for AI Coding Agent Generation*

---

| Field | Value |
|-------|-------|
| **Document Version** | 3.1 (2-Week MVP Re-estimated) |
| **Last Updated** | January 2026 |
| **Status** | Ready for AI Agent Execution |
| **Team** | Team Hadi |
| **Total Story Points** | 55 points |
| **Sprint Duration** | 7 days each |
| **Total Duration** | 14 days (2 Sprints) |
| **Velocity** | ~28 points/sprint |

---

## Scope Definition

### IN SCOPE (MVP)
- Customer Storefront (browse, search, cart, checkout, orders)
- Vendor Dashboard (products, orders, earnings)
- Admin Panel (vendors, products, orders)
- Email + Google/Facebook Social Login
- Cash on Delivery (COD) only
- Manual Payout Tracking (Admin marks as paid)
- Bilingual UI (Bangla/English)

### OUT OF SCOPE (Removed from MVP)
- ❌ SMS/OTP Authentication
- ❌ bKash/Nagad/Rocket Payment
- ❌ SSLCommerz Card Payment
- ❌ Courier API Integration (manual tracking only)
- ❌ WhatsApp Notifications
- ❌ Voice Search
- ❌ Wishlist Sharing
- ❌ Photo Reviews
- ❌ Bulk Product Upload

---

## Fibonacci Story Point Reference

| Points | Size | Effort Estimate |
|--------|------|-----------------|
| **1** | Trivial | < 2 hours |
| **2** | Simple | 2-4 hours |
| **3** | Small | 4-8 hours (half day to 1 day) |
| **5** | Medium | 1-2 days |
| **8** | Large | 2-3 days |
| **13** | XL | 3-5 days (consider splitting) |

---

## Sprint Overview

| Sprint | Duration | Focus | Points | Key Deliverables |
|--------|----------|-------|--------|------------------|
| **Sprint 1** | Days 1-7 | Foundation & Core Shopping | 28 | Auth, Homepage, Product Catalog, Cart, Vendor Registration |
| **Sprint 2** | Days 8-14 | Checkout & Management | 27 | Checkout (COD), Order Management, Admin Panel, Vendor Dashboard |

---

# SPRINT 1: Foundation & Core Shopping (Days 1-7)
## Target: 28 Story Points

---

## Epic 1: Customer Authentication
**Priority & Revised Story Points:** P0 - Must Have | **Total Points:** 7

### User Stories (Sprint 1)

#### US-1.1: Email Registration Form
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees a `RegistrationForm` component with fields: Full Name, Email, Password, Confirm Password
- User sees a "Create Account" button (disabled until form is valid)
- User sees inline validation errors below each field
- User sees a "Already have an account? Login" link

**Acceptance Criteria:**
- [ ] Verify `RegistrationForm` component renders with 4 input fields
- [ ] Verify "Create Account" button is disabled when any field is empty
- [ ] Verify email field shows error "Invalid email format" when email lacks @ symbol
- [ ] Verify password field shows error "Minimum 8 characters" when password < 8 chars
- [ ] Verify confirm password shows error "Passwords do not match" when values differ
- [ ] Verify clicking "Create Account" with valid data creates user in database
- [ ] Verify successful registration redirects to `/` homepage
- [ ] Verify "Already have an account?" link navigates to `/login`

---

#### US-1.2: Email Login Form
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees a `LoginForm` component with fields: Email, Password
- User sees a "Login" button
- User sees "Forgot Password?" link
- User sees "Don't have an account? Register" link

**Acceptance Criteria:**
- [ ] Verify `LoginForm` component renders with Email and Password fields
- [ ] Verify "Login" button submits credentials to auth endpoint
- [ ] Verify invalid credentials show error "Invalid email or password"
- [ ] Verify successful login stores auth token in session/cookie
- [ ] Verify successful login redirects to `/` homepage
- [ ] Verify "Don't have an account?" link navigates to `/register`

---

#### US-1.3: Google Social Login
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees a "Continue with Google" button with Google icon on Login/Register pages
- User sees Google OAuth popup when button is clicked

**Acceptance Criteria:**
- [ ] Verify "Continue with Google" button renders on `/login` page
- [ ] Verify "Continue with Google" button renders on `/register` page
- [ ] Verify clicking button opens Google OAuth consent screen
- [ ] Verify successful Google auth creates/links user account
- [ ] Verify user email and name are populated from Google profile
- [ ] Verify successful auth redirects to `/` homepage

---

#### US-1.4: Facebook Social Login
**Points:** 1 | **Priority:** P1

**UI Components (Visible First):**
- User sees a "Continue with Facebook" button with Facebook icon on Login/Register pages

**Acceptance Criteria:**
- [ ] Verify "Continue with Facebook" button renders on `/login` page
- [ ] Verify clicking button opens Facebook OAuth consent screen
- [ ] Verify successful Facebook auth creates/links user account
- [ ] Verify successful auth redirects to `/` homepage

---

## Epic 2: Homepage & Navigation
**Priority & Revised Story Points:** P0 - Must Have | **Total Points:** 3

### User Stories (Sprint 1)

#### US-2.1: Homepage Layout
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees a `Header` component with: Logo, Search bar, Language toggle (BN/EN), Cart icon with count, User menu
- User sees a `HeroSection` component with promotional banner
- User sees a `CategoryGrid` component showing baby product categories (6-8 categories)
- User sees a `FeaturedProducts` section showing 8 product cards
- User sees a `Footer` component with links and copyright

**Acceptance Criteria:**
- [ ] Verify `Header` renders with logo linking to `/`
- [ ] Verify search bar is visible and accepts text input
- [ ] Verify language toggle switches between "EN" and "বাং" labels
- [ ] Verify cart icon shows `cartCount` from global state (default 0)
- [ ] Verify `CategoryGrid` renders 6+ clickable category cards
- [ ] Verify clicking category card navigates to `/category/[slug]`
- [ ] Verify `FeaturedProducts` renders 8 `ProductCard` components
- [ ] Verify `Footer` renders with "About", "Contact", "Terms" links

---

#### US-2.2: Language Toggle (Bangla/English)
**Points:** 1 | **Priority:** P0

**UI Components (Visible First):**
- User sees a `LanguageToggle` component in Header showing current language
- User sees dropdown with "English" and "বাংলা" options

**Acceptance Criteria:**
- [ ] Verify `LanguageToggle` displays current language (default: English)
- [ ] Verify clicking toggle shows dropdown with both language options
- [ ] Verify selecting "বাংলা" updates all UI text to Bangla
- [ ] Verify language preference persists in localStorage
- [ ] Verify page refresh maintains selected language
- [ ] Verify all static text (buttons, labels, headings) translates correctly

---

## Epic 3: Product Catalog
**Priority & Revised Story Points:** P0 - Must Have | **Total Points:** 7

### User Stories (Sprint 1)

#### US-3.1: Category Page with Product Grid
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees a `CategoryHeader` showing category name and product count
- User sees a `FilterSidebar` with price range, brand checkboxes
- User sees a `SortDropdown` with options: "Price: Low to High", "Price: High to Low", "Newest"
- User sees a `ProductGrid` with `ProductCard` components (12 per page)
- User sees a `Pagination` component at bottom

**Acceptance Criteria:**
- [ ] Verify `/category/[slug]` page renders `CategoryHeader` with category name
- [ ] Verify `ProductGrid` displays up to 12 `ProductCard` components
- [ ] Verify each `ProductCard` shows: image, title, price (৳), vendor name
- [ ] Verify clicking `ProductCard` navigates to `/product/[id]`
- [ ] Verify `Pagination` shows page numbers and enables navigation
- [ ] Verify "No products found" message shows when category is empty

---

#### US-3.2: Product Search
**Points:** 3 | **Priority:** P0

**UI Components (Visible First):**
- User sees a `SearchBar` component in Header
- User sees a `SearchResults` page at `/search?q=[query]`
- User sees matching products in `ProductGrid` format

**Acceptance Criteria:**
- [ ] Verify `SearchBar` accepts text input
- [ ] Verify pressing Enter or clicking search icon navigates to `/search?q=[query]`
- [ ] Verify search results page shows products matching query in title or description
- [ ] Verify search works for both Bangla and English queries
- [ ] Verify "No results for '[query]'" message shows when no matches
- [ ] Verify search results count is displayed (e.g., "24 results for 'diaper'")

---

#### US-3.3: Product Filtering & Sorting
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees `FilterSidebar` with: Price range slider, Brand checkboxes, Age group checkboxes
- User sees `SortDropdown` above product grid

**Acceptance Criteria:**
- [ ] Verify price range slider filters products within min-max range
- [ ] Verify selecting brand checkbox filters to only that brand's products
- [ ] Verify multiple filters can be combined (AND logic)
- [ ] Verify selecting "Price: Low to High" sorts products ascending by price
- [ ] Verify selecting "Newest" sorts products by `createdAt` descending
- [ ] Verify "Clear Filters" button resets all filters to default

---

## Epic 4: Product Details
**Priority & Revised Story Points:** P0 - Must Have | **Total Points:** 4

### User Stories (Sprint 1)

#### US-4.1: Product Detail Page
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees `ProductImageGallery` with main image and thumbnail navigation
- User sees `ProductInfo` section with: title, price (৳), description, stock status
- User sees `VariantSelector` for size/color options (if applicable)
- User sees `QuantitySelector` with +/- buttons
- User sees "Add to Cart" button
- User sees `VendorCard` showing vendor name and rating

**Acceptance Criteria:**
- [ ] Verify `/product/[id]` page renders with product data
- [ ] Verify `ProductImageGallery` shows main image and clickable thumbnails
- [ ] Verify clicking thumbnail updates main image display
- [ ] Verify price displays in Taka format (৳XXX)
- [ ] Verify "In Stock" / "Out of Stock" badge shows based on `stockQuantity > 0`
- [ ] Verify `QuantitySelector` defaults to 1, min 1, max = stockQuantity
- [ ] Verify "Add to Cart" button is disabled when out of stock

---

#### US-4.2: Add to Cart from Product Page
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees "Add to Cart" button on product detail page
- User sees success toast notification when item added
- User sees cart icon count update in Header

**Acceptance Criteria:**
- [ ] Verify clicking "Add to Cart" adds product with selected quantity to cart state
- [ ] Verify success toast shows "Added to cart" message
- [ ] Verify cart icon count in Header increments by selected quantity
- [ ] Verify adding same product again increases quantity (not duplicate entry)
- [ ] Verify cart data persists in localStorage/session

---

## Epic 5: Shopping Cart
**Priority & Revised Story Points:** P0 - Must Have | **Total Points:** 4

### User Stories (Sprint 1)

#### US-5.1: Cart Page
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees `CartPage` at `/cart` route
- User sees `CartItemList` with each item showing: image, title, variant, quantity, price, remove button
- User sees `QuantityControl` (+/-) for each item
- User sees `CartSummary` showing: Subtotal, Shipping (TBD), Total
- User sees "Proceed to Checkout" button
- User sees "Continue Shopping" link

**Acceptance Criteria:**
- [ ] Verify `/cart` page renders `CartItemList` with all cart items
- [ ] Verify each cart item displays product image, title, unit price, line total
- [ ] Verify items are grouped by vendor with vendor name headers
- [ ] Verify `QuantityControl` allows changing quantity (min 1)
- [ ] Verify changing quantity updates line total and cart total
- [ ] Verify clicking remove button removes item from cart
- [ ] Verify empty cart shows "Your cart is empty" message with "Continue Shopping" CTA

---

#### US-5.2: Cart Persistence
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- (No new UI - background functionality)

**Acceptance Criteria:**
- [ ] Verify cart contents persist after page refresh
- [ ] Verify cart contents persist after browser close/reopen
- [ ] Verify logged-in user's cart syncs to their account
- [ ] Verify guest cart merges with account cart upon login

---

## Epic 6: Vendor Registration
**Priority & Revised Story Points:** P0 - Must Have | **Total Points:** 3

### User Stories (Sprint 1)

#### US-6.1: Vendor Application Form
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees "Become a Seller" link in Footer
- User sees `VendorApplicationForm` at `/vendor/apply` with sections:
  - Personal Info: Name, Email, Phone
  - Business Info: Shop Name, Business Type (Individual/Business)
  - Documents: NID Upload, Trade License Upload (optional for individuals)
- User sees "Submit Application" button
- User sees terms & conditions checkbox

**Acceptance Criteria:**
- [ ] Verify `/vendor/apply` page renders multi-section form
- [ ] Verify all required fields show validation errors if empty on submit
- [ ] Verify NID upload accepts image files (JPG, PNG, PDF)
- [ ] Verify file upload shows preview/filename after selection
- [ ] Verify terms checkbox must be checked to enable submit
- [ ] Verify successful submission shows "Application submitted" confirmation
- [ ] Verify application record created in database with status "pending"

---

#### US-6.2: Vendor Application Status
**Points:** 1 | **Priority:** P0

**UI Components (Visible First):**
- User sees `ApplicationStatus` component at `/vendor/status`
- User sees status badge: "Pending Review", "Approved", "Rejected"
- User sees rejection reason if applicable

**Acceptance Criteria:**
- [ ] Verify `/vendor/status` page shows current application status
- [ ] Verify "Pending Review" status shows with appropriate message
- [ ] Verify "Approved" status shows with "Go to Dashboard" button
- [ ] Verify "Rejected" status shows rejection reason from admin
- [ ] Verify unauthenticated users redirect to login

---

# SPRINT 2: Checkout & Management (Days 8-14)
## Target: 27 Story Points

---

## Epic 7: Checkout Process
**Priority & Revised Story Points:** P0 - Must Have | **Total Points:** 7

### User Stories (Sprint 2)

#### US-7.1: Checkout Page - Shipping Address
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees `CheckoutPage` at `/checkout`
- User sees `AddressForm` with fields: Full Name, Phone, Address Line 1, Address Line 2, City/District, Division
- User sees saved addresses (if any) with radio selection
- User sees "Add New Address" button
- User sees delivery zone selection: "Inside Dhaka" / "Outside Dhaka"

**Acceptance Criteria:**
- [ ] Verify `/checkout` redirects to `/login` if user not authenticated
- [ ] Verify `AddressForm` renders with all required fields
- [ ] Verify saved addresses display with radio buttons for selection
- [ ] Verify selecting saved address populates it as shipping address
- [ ] Verify new address form validates phone (11 digits, 01X format)
- [ ] Verify delivery zone selection updates shipping cost display

---

#### US-7.2: Checkout Page - Order Review
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees `OrderSummary` section showing all cart items
- User sees per-vendor subtotals and shipping
- User sees grand total in Taka (৳)

**Acceptance Criteria:**
- [ ] Verify `OrderSummary` displays all items from cart
- [ ] Verify items grouped by vendor with vendor-specific shipping
- [ ] Verify subtotal calculation is correct (sum of line items)
- [ ] Verify shipping cost shows based on delivery zone
- [ ] Verify grand total = subtotal + total shipping
- [ ] Verify all prices display in ৳ format

---

#### US-7.3: Cash on Delivery Payment
**Points:** 3 | **Priority:** P0

**UI Components (Visible First):**
- User sees `PaymentMethod` section with "Cash on Delivery" option (pre-selected)
- User sees COD info text: "Pay when your order arrives"
- User sees "Place Order" button

**Acceptance Criteria:**
- [ ] Verify "Cash on Delivery" is the only payment option displayed
- [ ] Verify COD option is selected by default
- [ ] Verify "Place Order" button is enabled when address is complete
- [ ] Verify clicking "Place Order" creates order with status "pending"
- [ ] Verify clicking "Place Order" creates order with `paymentMethod: "COD"`
- [ ] Verify successful order clears the cart
- [ ] Verify successful order redirects to `/order/[orderId]/confirmation`

---

## Epic 8: Order Confirmation & History
**Priority & Revised Story Points:** P0 - Must Have | **Total Points:** 4

### User Stories (Sprint 2)

#### US-8.1: Order Confirmation Page
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees `OrderConfirmation` page at `/order/[id]/confirmation`
- User sees success icon and "Order Placed Successfully!" message
- User sees order number prominently displayed
- User sees order summary (items, address, total)
- User sees "Continue Shopping" and "View Orders" buttons

**Acceptance Criteria:**
- [ ] Verify `/order/[id]/confirmation` displays order details
- [ ] Verify order number is shown (format: KD-XXXXXX)
- [ ] Verify shipping address displays correctly
- [ ] Verify order items list matches placed order
- [ ] Verify "Continue Shopping" navigates to `/`
- [ ] Verify "View Orders" navigates to `/account/orders`

---

#### US-8.2: Customer Order History
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees `OrderHistory` page at `/account/orders`
- User sees `OrderList` with cards showing: Order #, Date, Status, Total, Item count
- User sees `OrderDetail` page at `/account/orders/[id]`

**Acceptance Criteria:**
- [ ] Verify `/account/orders` lists all customer orders
- [ ] Verify orders sorted by date (newest first)
- [ ] Verify each order card shows status badge (Pending, Processing, Shipped, Delivered)
- [ ] Verify clicking order card navigates to detail page
- [ ] Verify order detail page shows all items, shipping address, payment method
- [ ] Verify "No orders yet" message shows for new customers

---

## Epic 9: Vendor Dashboard
**Priority & Revised Story Points:** P0 - Must Have | **Total Points:** 8

### User Stories (Sprint 2)

#### US-9.1: Vendor Dashboard Overview
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees `VendorDashboard` at `/vendor/dashboard`
- User sees `StatCards` showing: Total Orders, Pending Orders, Total Earnings, Products Count
- User sees `RecentOrders` table with 5 latest orders
- User sees sidebar navigation: Dashboard, Products, Orders, Earnings, Settings

**Acceptance Criteria:**
- [ ] Verify `/vendor/dashboard` renders for authenticated vendors only
- [ ] Verify non-vendors redirect to `/vendor/apply`
- [ ] Verify stat cards show accurate counts from database
- [ ] Verify `RecentOrders` table shows order #, customer, total, status
- [ ] Verify sidebar navigation links work correctly

---

#### US-9.2: Vendor Product Management
**Points:** 3 | **Priority:** P0

**UI Components (Visible First):**
- User sees `ProductList` at `/vendor/products`
- User sees table with: Image, Title, Price, Stock, Status, Actions
- User sees "Add Product" button
- User sees `ProductForm` at `/vendor/products/new` and `/vendor/products/[id]/edit`

**Acceptance Criteria:**
- [ ] Verify product list shows all vendor's products
- [ ] Verify product status shows "Pending", "Approved", "Rejected"
- [ ] Verify "Edit" action opens product edit form
- [ ] Verify "Delete" action shows confirmation dialog
- [ ] Verify `ProductForm` has fields: Title (EN/BN), Description, Category, Price, Stock, Images
- [ ] Verify image upload accepts multiple images (max 5)
- [ ] Verify saving product creates record with status "pending" (for admin approval)

---

#### US-9.3: Vendor Order Management
**Points:** 3 | **Priority:** P0

**UI Components (Visible First):**
- User sees `VendorOrders` at `/vendor/orders`
- User sees order table with: Order #, Customer, Items, Total, Status, Date
- User sees `OrderDetail` modal/page with full order info
- User sees status update dropdown: "Processing", "Shipped", "Delivered"
- User sees manual tracking number input field

**Acceptance Criteria:**
- [ ] Verify order list shows only orders containing vendor's products
- [ ] Verify order detail shows customer name, address, phone
- [ ] Verify status dropdown allows updating order status
- [ ] Verify tracking number field accepts manual courier tracking input
- [ ] Verify updating status updates the customer-facing order status
- [ ] Verify filtering by status (All, Pending, Shipped, Delivered)

---

## Epic 10: Admin Panel
**Priority & Revised Story Points:** P0 - Must Have | **Total Points:** 8

### User Stories (Sprint 2)

#### US-10.1: Admin Vendor Management
**Points:** 3 | **Priority:** P0

**UI Components (Visible First):**
- User sees `AdminVendors` at `/admin/vendors`
- User sees tabs: "Pending Applications", "Active Vendors", "Suspended"
- User sees vendor table with: Shop Name, Email, Status, Date Applied
- User sees `VendorDetail` drawer showing application documents
- User sees "Approve" / "Reject" buttons with reason input for rejection

**Acceptance Criteria:**
- [ ] Verify `/admin/vendors` renders for admin users only
- [ ] Verify "Pending Applications" tab shows vendors with status "pending"
- [ ] Verify clicking vendor row opens detail drawer with NID/documents
- [ ] Verify "Approve" button updates status to "approved"
- [ ] Verify "Reject" button requires reason input, updates status to "rejected"
- [ ] Verify approved vendors appear in "Active Vendors" tab

---

#### US-10.2: Admin Product Moderation
**Points:** 3 | **Priority:** P0

**UI Components (Visible First):**
- User sees `AdminProducts` at `/admin/products`
- User sees tabs: "Pending Approval", "Approved", "Rejected"
- User sees product table with: Image, Title, Vendor, Price, Status
- User sees "Approve" / "Reject" buttons
- User sees product detail modal with full info

**Acceptance Criteria:**
- [ ] Verify "Pending Approval" shows products with status "pending"
- [ ] Verify clicking product opens detail modal with images and description
- [ ] Verify "Approve" button updates product status to "approved"
- [ ] Verify approved products appear on customer-facing storefront
- [ ] Verify "Reject" button requires reason, updates status to "rejected"
- [ ] Verify rejected products show reason to vendor in their dashboard

---

#### US-10.3: Admin Order Oversight & Payout Tracking
**Points:** 2 | **Priority:** P0

**UI Components (Visible First):**
- User sees `AdminOrders` at `/admin/orders`
- User sees all orders across all vendors
- User sees `AdminPayouts` at `/admin/payouts`
- User sees vendor payout table: Vendor, Pending Amount, Last Payout, Action
- User sees "Mark as Paid" button with date input

**Acceptance Criteria:**
- [ ] Verify `/admin/orders` shows all marketplace orders
- [ ] Verify order search by order number works
- [ ] Verify `/admin/payouts` shows vendor pending earnings
- [ ] Verify pending amount = (vendor sales - commission) since last payout
- [ ] Verify "Mark as Paid" updates vendor's payout record with date
- [ ] Verify payout history shows all past payouts per vendor

---

# Summary: 2-Week MVP Story Point Allocation

## Sprint 1: Foundation & Core Shopping (28 Points)

| Epic | Stories | Points |
|------|---------|--------|
| E1: Customer Authentication | 4 | 7 |
| E2: Homepage & Navigation | 2 | 3 |
| E3: Product Catalog | 3 | 7 |
| E4: Product Details | 2 | 4 |
| E5: Shopping Cart | 2 | 4 |
| E6: Vendor Registration | 2 | 3 |
| **Sprint 1 Total** | **15** | **28** |

## Sprint 2: Checkout & Management (27 Points)

| Epic | Stories | Points |
|------|---------|--------|
| E7: Checkout Process | 3 | 7 |
| E8: Order Confirmation & History | 2 | 4 |
| E9: Vendor Dashboard | 3 | 8 |
| E10: Admin Panel | 3 | 8 |
| **Sprint 2 Total** | **11** | **27** |

---

## Grand Total

| Metric | Value |
|--------|-------|
| **Total Epics** | 10 |
| **Total User Stories** | 26 |
| **Total Story Points** | 55 |
| **Sprint 1 Points** | 28 |
| **Sprint 2 Points** | 27 |
| **Avg Points/Sprint** | 27.5 |

---

## Definition of Done (DoD)

A user story is "Done" when:

- [ ] UI components render as specified
- [ ] All acceptance criteria checkboxes pass
- [ ] Component works in both Bangla and English
- [ ] Mobile responsive (tested at 375px width)
- [ ] No console errors
- [ ] Data persists correctly (localStorage/database)
- [ ] Code committed to repository

---

## AI Agent Execution Notes

1. **UI-First Approach**: Build visible components before backend logic
2. **Acceptance Criteria = Test Cases**: Each checkbox is a verifiable condition
3. **State Management**: Use global state for cart, auth, language
4. **Bilingual**: All user-facing text must support EN/BN toggle
5. **COD Only**: No payment gateway integration needed
6. **Manual Tracking**: Courier tracking is manual text input, no API

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | Team Hadi | Initial PRD draft |
| 2.0 | Jan 2026 | Team Hadi | Agile edition with Fibonacci story points |
| 3.0 | Jan 2026 | Team Hadi | 2-Week MVP - Removed SMS/OTP, payment gateways. COD only. AI-optimized acceptance criteria. |
| 3.1 | Jan 2026 | Team Hadi | Re-estimated Fibonacci points to fit 2-week timeline (55 points total). |
