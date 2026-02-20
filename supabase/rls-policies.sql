-- =============================================================================
-- KineDao — Row Level Security (RLS) Policies
-- =============================================================================
-- HOW TO APPLY:
--   Paste this file into the Supabase SQL Editor and run it.
--   Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- ARCHITECTURE:
--   • Backend (Hono/Drizzle) connects as 'postgres' superuser
--     → bypasses RLS automatically. No backend changes needed.
--   • Supabase REST API / anon key → subject to these policies.
--   • Better-Auth manages auth (not Supabase Auth), so auth.uid() is
--     NOT used. User-specific tables are locked to backend-only access.
--
-- POLICY STRATEGY:
--   ✅ Public SELECT — catalog, marketing, and homepage content
--   ✅ Public INSERT — newsletter subscription form only
--   🔒 Backend-only — all user, order, payment, and admin data
-- =============================================================================


-- =============================================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- =============================================================================

-- Authentication (Better-Auth managed)
ALTER TABLE public."user"                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification                 ENABLE ROW LEVEL SECURITY;

-- Admin
ALTER TABLE public.admin_users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations            ENABLE ROW LEVEL SECURITY;

-- Catalog
ALTER TABLE public.vendors                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_skus                 ENABLE ROW LEVEL SECURITY;

-- Marketing / Featured
ALTER TABLE public.campaigns                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_metrics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mega_menu_featured_products  ENABLE ROW LEVEL SECURITY;

-- Shopping
ALTER TABLE public.carts                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items               ENABLE ROW LEVEL SECURITY;

-- Shipping
ALTER TABLE public.shipping_addresses           ENABLE ROW LEVEL SECURITY;

-- Orders
ALTER TABLE public.order_number_sequence        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items                  ENABLE ROW LEVEL SECURITY;

-- Reviews
ALTER TABLE public.product_reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies               ENABLE ROW LEVEL SECURITY;

-- Vendor Management
ALTER TABLE public.vendor_applications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_payouts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions                 ENABLE ROW LEVEL SECURITY;

-- Homepage Content
ALTER TABLE public.testimonials                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_collections         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_posts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners                      ENABLE ROW LEVEL SECURITY;

-- Notifications & Settings
ALTER TABLE public.notifications                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings                ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- STEP 2: PUBLIC READ POLICIES
-- Catalog and marketing data is publicly readable (with filtering).
-- =============================================================================

-- Vendors: anyone can browse vendor profiles
CREATE POLICY "vendors_public_select"
  ON public.vendors
  FOR SELECT TO anon, authenticated
  USING (true);

-- Brands: only active brands are visible
CREATE POLICY "brands_public_select"
  ON public.brands
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Categories: all categories are publicly visible
CREATE POLICY "categories_public_select"
  ON public.categories
  FOR SELECT TO anon, authenticated
  USING (true);

-- Products: only approved and active products are publicly visible
CREATE POLICY "products_public_select"
  ON public.products
  FOR SELECT TO anon, authenticated
  USING (status = 'approved' AND is_active = true);

-- Product Images: visible only for approved, active products
CREATE POLICY "product_images_public_select"
  ON public.product_images
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_images.product_id
        AND p.status = 'approved'
        AND p.is_active = true
    )
  );

-- Product Options: visible only for approved, active products
CREATE POLICY "product_options_public_select"
  ON public.product_options
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_options.product_id
        AND p.status = 'approved'
        AND p.is_active = true
    )
  );

-- Product SKUs: visible only for approved, active products
CREATE POLICY "product_skus_public_select"
  ON public.product_skus
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_skus.product_id
        AND p.status = 'approved'
        AND p.is_active = true
    )
  );

-- Campaigns: active campaigns within their date window
CREATE POLICY "campaigns_public_select"
  ON public.campaigns
  FOR SELECT TO anon, authenticated
  USING (
    (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

-- Campaign Products: visible alongside their campaign
CREATE POLICY "campaign_products_public_select"
  ON public.campaign_products
  FOR SELECT TO anon, authenticated
  USING (true);

-- Category Metrics: for trending/popular UI sections
CREATE POLICY "category_metrics_public_select"
  ON public.category_metrics
  FOR SELECT TO anon, authenticated
  USING (true);

-- Mega Menu Featured Products: active entries within their date window
CREATE POLICY "mega_menu_featured_products_public_select"
  ON public.mega_menu_featured_products
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

-- Product Reviews: only published reviews are publicly visible
CREATE POLICY "product_reviews_public_select"
  ON public.product_reviews
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Review Replies: only non-hidden replies are visible
CREATE POLICY "review_replies_public_select"
  ON public.review_replies
  FOR SELECT TO anon, authenticated
  USING (is_hidden = false);

-- Testimonials: only active testimonials
CREATE POLICY "testimonials_public_select"
  ON public.testimonials
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Featured Collections: only active collections
CREATE POLICY "featured_collections_public_select"
  ON public.featured_collections
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Instagram Posts: only active posts
CREATE POLICY "instagram_posts_public_select"
  ON public.instagram_posts
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Banners: active banners within their date window
CREATE POLICY "banners_public_select"
  ON public.banners
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );


-- =============================================================================
-- STEP 3: NEWSLETTER SUBSCRIBERS — Public INSERT only
-- The subscribe form submits directly; reading is backend-only.
-- =============================================================================

CREATE POLICY "newsletter_subscribers_public_insert"
  ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);


-- =============================================================================
-- STEP 4: NO DIRECT ACCESS (backend-only tables)
-- =============================================================================
-- The following tables have NO policies for anon/authenticated roles.
-- All access goes through the Hono backend via the 'postgres' superuser
-- connection, which bypasses RLS. This is intentional and correct.
--
-- Locked-down tables:
--   Authentication : user, session, account, verification
--   Admin          : admin_users, admin_audit_log, admin_invitations
--   Shopping       : carts, cart_items, wishlists, wishlist_items
--   Shipping       : shipping_addresses
--   Orders         : order_number_sequence, orders, order_items
--   Reviews        : review_votes
--   Vendors        : vendor_applications, vendor_payouts, transactions
--   Notifications  : notifications, push_subscriptions,
--                    notification_preferences
--   Settings       : site_settings
-- =============================================================================


-- =============================================================================
-- VERIFICATION QUERIES (run these to confirm policies are in place)
-- =============================================================================
--
-- Check which tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
--
-- List all policies:
-- SELECT schemaname, tablename, policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
-- =============================================================================
