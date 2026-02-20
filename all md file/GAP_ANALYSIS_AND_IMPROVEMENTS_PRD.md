# Product Requirements Document: Gap Analysis & Improvements

## 1. Introduction
This document outlines the necessary improvements and fixes identified during the verification of the "BabyBloom" (KineDao) MVP against User Stories US-2.1, US-2.2, US-3.1, US-3.2, and US-3.3. It serves as a roadmap for the next development iteration to ensure full compliance with client requirements while leveraging existing "value-add" features.

## 2. Gap Analysis & Required Fixes (High Priority)

### 2.1. Homepage Category Navigation (Fix for US-2.1)
**Problem:** The `CategoriesSection` on the homepage currently renders static data and the items are not clickable/navigable. Users cannot browse by category from the homepage.
**Requirement:**
- **Dynamic Data:** The section should accept the `topCategories` prop fetched in `HomePage` instead of using a hardcoded list.
- **Navigation:** Each category item must be wrapped in a `Link` component pointing to `/catalog` with the appropriate query parameter (e.g., `/catalog?category=clothing`).
- **Visual Feedback:** Ensure hover states clearly indicate clickability.

**Acceptance Criteria:**
- [ ] `CategoriesSection` accepts `categories` prop.
- [ ] Clicking a category icon navigates to the catalog page filtered by that category.
- [ ] Hovering over a category shows a clear pointer cursor and visual lift.

### 2.2. Product Card Navigation (Fix for US-3.1)
**Problem:** The `ProductCard` component heavily emphasizes "Quick View" and "Add to Cart" actions. While functional, the standard e-commerce pattern of clicking the product image or title to go to a dedicated details page is not explicitly robust.
**Requirement:**
- **Dedicated Link:** Wrap the product image and title in a `Link` component pointing to `/product/$productId`.
- **Route Handling:** Ensure the `/product/$productId` route exists and handles the display of single product details (or verify it links to the correct existing route).

**Acceptance Criteria:**
- [ ] Clicking the product image navigates to the product details page.
- [ ] Clicking the product title navigates to the product details page.
- [ ] "Quick View" and "Add to Cart" buttons remain accessible and functional without triggering navigation.

## 3. Recommended Enhancements (Medium Priority)

### 3.1. Unified Route Strategy (Clarification)
**Observation:** The requirements specified distinct `/category/[slug]` and `/search?q=...` routes. The current implementation uses a unified `/catalog` route with query parameters (e.g., `/catalog?category=slug`, `/catalog?q=query`).
**Recommendation:** **Keep the current approach.** It is more maintainable and allows for easy composition of filters (e.g., searching *within* a category).
**Action:** No code change required, but this deviation should be communicated to stakeholders as a technical improvement.

### 3.2. Empty State Polish
**Observation:** The "No products found" state is functional but basic.
**Recommendation:** Add a "Reset All" button that explicitly clears all active filters and search queries to quickly return the user to a "Shop All" state.

## 4. Value-Add Features (Client Perspective)
*These features are already implemented and exceed the original requirements. They should be highlighted in client demos.*

1.  **Infinite Scroll:** Provides a seamless browsing experience compared to traditional pagination.
2.  **Mobile Filter Drawer:** A native-app-like experience for filtering on mobile devices.
3.  **Quick View Modal:** Allows users to preview product details and add to cart without losing their scroll position.
4.  **Trust & Deal Sections:** The "Trust Badges" and "Deal Wall" sections on the homepage add significant credibility and conversion potential.
5.  **Dark Mode:** Fully integrated dark mode support (exceeds standard MVP requirements).

## 5. Implementation Plan

### Phase 1: Navigation Fixes
1.  Refactor `CategoriesSection` to accept props and use `Link`.
2.  Update `ProductCard` to link image/title to product detail route.

### Phase 2: Polish
1.  Verify the `topCategories` data flow from `HomePage` to `CategoriesSection`.
2.  Ensure fallback images are robust for dynamic categories.

## 6. Sign-off
**Approver:** [Project Manager / Client]
**Date:** [Date]
