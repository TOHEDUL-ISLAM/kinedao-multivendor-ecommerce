# Product Requirements Document
# Admin Banner Management System Refactoring

**Project:** KineDao.com  
**Document Version:** 1.0  
**Last Updated:** February 13, 2026  
**Document Owner:** Product Team  
**Status:** Draft

---

## Executive Summary

This PRD outlines the complete refactoring of the Admin Banner Management system for KineDao.com. The current implementation suffers from over-engineering (972-line monolithic file), complex staging/batch-publish workflows, and poor UX with cluttered live previews and drawer-based editing. 

The refactoring will deliver a clean, intuitive, and modular CRUD interface with immediate backend updates, tab-based organization, and centered modal workflows—significantly improving admin efficiency and maintainability.

---

## Problem Statement

### Current Pain Points

1. **Monolithic Architecture** 
   - Single 972-line file violates separation of concerns
   - State management spread across complex staging logic
   - Difficult to maintain, debug, and extend

2. **Over-Engineered Workflow**
   - Unnecessary staging and batch-publishing system adds cognitive overhead
   - Admins expect immediate updates (standard CRUD), not staged changes
   - No real business value for delayed publishing in banner management

3. **Poor UX Design**
   - Slide-out drawer UI is cramped and non-standard for admin interfaces
   - Cluttered live preview interface mixes editing with visualization
   - No clear organization between different banner types (Hero vs Side Cards)

4. **Homepage Hero Section Limitations**
   - Text overlays and CTA buttons on hero carousel reduce click-through rates
   - Marketing team wants clean, clickable image banners (like Amazon/Alibaba)
   - Current design forces text editing for image-only use cases

### Business Impact

- **Admin Time Waste:** Complex staging workflow adds 2-3 extra clicks per banner update
- **Marketing Friction:** Cannot quickly A/B test hero images without editing text fields
- **Technical Debt:** Monolithic file blocks future banner features (video banners, geo-targeting)
- **Onboarding Cost:** New admins require training on staging system

---

## Goals & Success Metrics

### Primary Goals

1. **Simplify Admin Workflow:** Reduce banner creation/editing from 8 clicks to 3 clicks
2. **Improve Code Maintainability:** Break 972-line file into modular components (<200 lines each)
3. **Enable Marketing Agility:** Allow image-only hero banners without text fields
4. **Standardize UX:** Align with industry-standard admin CRUD patterns

### Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Average Banner Update Time | 45 seconds | <15 seconds | Time tracking |
| Code File Size | 972 lines | <200 lines/file | LOC analysis |
| Admin Training Time | 30 minutes | <5 minutes | Onboarding survey |
| Banner Update Errors | 12% | <2% | Error logs |
| Hero Carousel CTR | 2.3% | >4.5% | Analytics |

---

## Target Users

### Primary: Admin Users
- **Marketing Managers:** Update promotional banners weekly
- **Category Managers:** Add seasonal collection banners monthly
- **Super Admins:** Configure homepage layout

### Secondary: End Users (Customers)
- **Benefit:** Cleaner homepage hero with clickable images
- **Impact:** Improved mobile UX (no text overlay blocking images)

---

## Core Requirements

### Functional Requirements

#### FR1: Tab-Based Banner Organization
- **Tab 1:** Main Hero Carousel (unlimited image banners)
- **Tab 2:** Side Promotional Cards (fixed 3 slots: Top, Middle, Bottom)
- **Removed:** Grid Arrivals section (auto-populated by backend logic)

#### FR2: Hero Carousel Specifications
- **Display:** Simple list/grid with image thumbnails, status badges, and link URLs
- **Actions:** Add New, Edit, Delete, Reorder (drag-and-drop)
- **Form Fields (Centered Modal):**
  - Image Upload Dropzone (required)
  - Destination URL (required)
  - Alt Text for SEO (optional, 5-150 characters)
  - Status Toggle: Active/Scheduled (with start/end date pickers)
- **Validation:** 
  - Image: JPG/PNG/WebP, max 2MB, min 1920×600px
  - URL: Valid HTTP/HTTPS or internal path
  - Alt Text: 5-150 characters
- **Removed Fields:** 
  - Title (English/Bangla)
  - Subtitle (English/Bangla)
  - CTA Button Text
  - Color pickers, gradient overlays

#### FR3: Side Promotional Cards Specifications
- **Display:** Dashboard with exactly 3 fixed slots (cannot add more)
- **Actions:** Edit only (no Add/Delete buttons)
- **Form Fields (Centered Modal):**
  - Image Upload Dropzone (required, 400×300px recommended)
  - Title (Bangla/English, max 30 chars)
  - Subtitle (Bangla/English, max 50 chars)
  - Destination URL (required)
  - Optional Discount Badge (e.g., "30% OFF", "৳499")
- **Layout:** 
  - Slot 1: Top position (above fold)
  - Slot 2: Middle position
  - Slot 3: Bottom position

#### FR4: Immediate Backend Updates
- **Create:** Creates new banner and returns banner ID and image URL
- **Update:** Updates existing banner and returns updated object
- **Delete:** Removes banner and returns success confirmation
- **Reorder:** Updates position of multiple banners in single request
- **No Staging:** All changes persist immediately to database
- **Optimistic UI:** Show updates instantly, rollback on error

#### FR5: Image Upload Flow
- **Drag-and-Drop Zone:** 
  - Visual feedback on hover/drag (dashed border → solid teal)
  - Preview thumbnail after upload
  - Replace button for re-upload
- **S3 Upload:** 
  - Uses existing upload endpoint for hero banners
  - Returns URL for storage in banner record
- **Error Handling:** 
  - Show toast notification on upload failure
  - Retry button with exponential backoff
- **Accessibility:** 
  - Keyboard-navigable file picker fallback
  - Screen reader announcements for upload status

### Non-Functional Requirements

#### NFR1: Performance
- **Page Load:** Initial banner list renders in <500ms
- **Modal Open:** Centered modal animates in <200ms
- **Image Upload:** S3 upload completes in <3 seconds (2MB image)
- **API Latency:** CRUD operations respond in <300ms (95th percentile)

#### NFR2: Accessibility (WCAG 2.1 AA)
- All form inputs have visible labels
- Modal traps focus (cannot tab outside)
- ESC key closes modal
- Status messages announced to screen readers
- Minimum contrast ratio 4.5:1 for text

#### NFR3: Browser Support
- Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
- Mobile Safari iOS 17+, Chrome Android 120+

#### NFR4: Security
- CSRF tokens on all mutation requests
- File upload whitelist: `.jpg, .jpeg, .png, .webp`
- Admin-only routes protected by Better-Auth middleware
- SQL injection prevention via Drizzle ORM

---

## Technical Architecture

### Frontend Structure

**Component Organization:**
- Main page: Banner management root with tabs
- Tab navigation component
- Hero carousel tab with list and reorder functionality
- Side cards tab with 3-slot dashboard
- Single banner list item component
- Centered modal wrapper
- Form for hero banners (image-only)
- Form for side cards (with text overlays)
- Reusable image upload dropzone component

**State Management:**
- Remove existing staging state management file
- Use TanStack Query for server state
- Implement mutation hooks for CRUD operations
- Optimistic updates with automatic rollback on errors

### Backend Architecture

**Database Changes:**
- Add banner type field (hero vs side)
- Add position field for ordering
- Make text fields optional for hero banners
- Keep text fields required for side cards
- Add scheduling fields (start/end dates)

**API Endpoints:**
- List all banners (with optional type filter)
- Create new banner
- Update existing banner
- Delete banner
- Reorder multiple banners

**Validation:**
- Different validation rules for hero vs side banners
- Hero banners: image + URL required, text optional
- Side cards: image + URL + titles required
- Position enforcement for side cards (1-3 only)

### Homepage Hero Section

**Current Implementation (Remove):**
- Text overlay with title, subtitle, and CTA button
- Complex gradient backgrounds
- Multiple text fields per banner

**New Implementation (Replace With):**
- Clean clickable images only
- No text overlays
- Entire banner is a navigation link
- Alt text for SEO and accessibility

---

## User Stories & Epics

### Epic 1: Admin Banner Management Refactor
**Priority:** P0 (Critical)  
**Story Points:** 21  
**Sprint:** Sprint 1

#### User Story 1.1: Tab-Based Banner Organization
**As an** admin  
**I want** to see hero carousel and side cards in separate tabs  
**So that** I can quickly navigate to the banner type I need to edit  

**Acceptance Criteria:**
- [ ] Banner management page displays 2 tabs: "Hero Carousel" and "Side Cards"
- [ ] Tab state persists in URL query parameter
- [ ] Default tab is "Hero Carousel"
- [ ] Active tab has visual indicator (teal underline, bold text)
- [ ] Clicking tab switches content without page reload

**Story Points:** 3

---

#### User Story 1.2: Hero Carousel CRUD Interface
**As a** marketing manager  
**I want** to create/edit image-only hero banners  
**So that** I can run promotional campaigns without text overlays  

**Acceptance Criteria:**
- [ ] "Add Hero Banner" button opens centered modal
- [ ] Form contains: Image Upload, Link URL, Alt Text, Status Toggle
- [ ] Image upload shows drag-and-drop zone with preview
- [ ] "Save" button creates banner and closes modal
- [ ] Banner appears in list immediately after creation
- [ ] Edit icon on banner opens same modal with pre-filled data
- [ ] Delete button shows confirmation dialog before deletion
- [ ] Success/error toasts appear for all actions

**Story Points:** 8

---

#### User Story 1.3: Hero Banner Reordering
**As a** category manager  
**I want** to drag-and-drop hero banners to reorder them  
**So that** I can prioritize seasonal promotions  

**Acceptance Criteria:**
- [ ] Each banner row has drag handle icon (6 dots)
- [ ] Dragging banner shows visual placeholder
- [ ] Dropping banner updates position immediately (optimistic UI)
- [ ] Backend receives reorder request with new order
- [ ] Error toast appears if reorder fails (position reverts)
- [ ] Reordering works on touch devices (mobile)

**Story Points:** 5

---

#### User Story 1.4: Side Promotional Cards Management
**As an** admin  
**I want** to edit the 3 fixed side card slots  
**So that** I can update category promotions weekly  

**Acceptance Criteria:**
- [ ] Side Cards tab shows exactly 3 slots (Top, Middle, Bottom)
- [ ] Each slot displays current image, title, subtitle, and discount badge
- [ ] "Edit" button opens centered modal with pre-filled form
- [ ] Form contains: Image Upload, Title (EN/BN), Subtitle (EN/BN), Link URL, Discount Badge
- [ ] Saving updates database and refreshes card preview
- [ ] Empty slots show placeholder image and "No card configured" message
- [ ] Cannot add more than 3 cards (Add button hidden)

**Story Points:** 5

---

### Epic 2: Homepage Hero Section Simplification
**Priority:** P0 (Critical)  
**Story Points:** 8  
**Sprint:** Sprint 1

#### User Story 2.1: Image-Only Hero Carousel
**As a** customer  
**I want** to see clean clickable banner images  
**So that** I can navigate to promotions faster without text blocking the view  

**Acceptance Criteria:**
- [ ] Hero carousel displays only images (no text overlays)
- [ ] Entire banner is clickable and navigates to destination URL
- [ ] Carousel auto-rotates every 5 seconds
- [ ] Manual navigation via arrow buttons and dot indicators
- [ ] Smooth transitions between slides (fade or slide animation)
- [ ] Mobile responsive (full-width, maintains aspect ratio)

**Story Points:** 5

---

#### User Story 2.2: SEO & Accessibility for Image Banners
**As a** customer using screen reader  
**I want** banner images to have descriptive alt text  
**So that** I understand the promotion without seeing the image  

**Acceptance Criteria:**
- [ ] All hero images have alt attribute populated from banner data
- [ ] Fallback alt text is "KineDao Promotion" if alt text is empty
- [ ] Banner links have aria-label describing destination
- [ ] Carousel controls (arrows, dots) are keyboard accessible
- [ ] Auto-rotation pauses on hover or focus

**Story Points:** 3

---

### Epic 3: Technical Debt Cleanup
**Priority:** P1 (High)  
**Story Points:** 5  
**Sprint:** Sprint 1

#### User Story 3.1: Remove Staging System
**As a** developer  
**I want** to delete all staging and batch-publish logic  
**So that** the codebase is simpler and easier to maintain  

**Acceptance Criteria:**
- [ ] Banner editor state file deleted
- [ ] All references to drafts and staged changes removed
- [ ] Database columns for drafts and publish dates dropped
- [ ] API routes for staging and batch publish deleted
- [ ] No TypeScript errors after cleanup

**Story Points:** 3

---

#### User Story 3.2: Component Modularization
**As a** developer  
**I want** the 972-line file split into focused components  
**So that** I can find and fix bugs faster  

**Acceptance Criteria:**
- [ ] Main page file is <150 lines
- [ ] Each component file is <200 lines
- [ ] Components organized in dedicated banners directory
- [ ] Clear separation of concerns (list, form, modal, dropzone)
- [ ] All components have TypeScript prop types
- [ ] No code duplication between hero and side card forms

**Story Points:** 2

---

## Design Specifications

### UI Components

**Banner Tabs:**
- Two tabs at top of page
- Active tab indicated by teal underline and bold text
- Content switches without page reload

**Centered Modal:**
- Opens in center of screen
- Dims background with overlay
- Large size (800px width)
- Title describes action (e.g., "Edit Hero Banner")
- Cancel and Save buttons at bottom

**Image Upload Dropzone:**
- Dashed border when empty
- Solid teal border on hover/drag
- Preview thumbnail after upload
- Replace button to re-upload
- Drag-and-drop or click to browse

### Color Scheme (OKLCH)
- **Primary Teal:** `oklch(0.65 0.15 175)`
- **Success Green:** `oklch(0.60 0.15 145)`
- **Error Red:** `oklch(0.55 0.18 25)`
- **Background (Light):** `oklch(0.98 0.005 175)`
- **Background (Dark):** `oklch(0.20 0.02 175)`

### Spacing & Typography
- **Modal Padding:** 24px
- **Button Height:** 40px
- **Input Height:** 42px
- **Font (Headings):** Noto Sans Bangla, 20px semibold
- **Font (Body):** Noto Sans Bangla, 14px regular

---

## Migration Plan

### Phase 1: Backend Preparation (Day 1-2)
1. Update banners database structure
2. Generate and apply database migrations
3. Create script to migrate existing banner data
4. Update API routes with new validation
5. Test endpoints

### Phase 2: Frontend Refactor (Day 3-5)
1. Create new component structure
2. Build tab navigation and modal components
3. Implement hero carousel management
4. Implement side cards management
5. Build reusable image upload component
6. Create mutation hooks

### Phase 3: Homepage Update (Day 6)
1. Update hero section component
2. Remove text overlay rendering
3. Wrap images in clickable links
4. Test carousel navigation and auto-rotation
5. Verify mobile responsiveness

### Phase 4: Cleanup & Testing (Day 7)
1. Delete staging state management
2. Remove staging API routes
3. Drop unused database columns
4. Run full regression testing
5. Update admin documentation

---

## Testing Strategy

### Unit Tests
- [ ] Banner form validation
- [ ] Image upload utility functions
- [ ] Reorder logic (position calculation)
- [ ] Date picker validation (start/end dates)

### Integration Tests
- [ ] Create hero banner flow (upload → API → list refresh)
- [ ] Edit side card flow (open modal → update → close)
- [ ] Delete banner with confirmation dialog
- [ ] Reorder banners with drag-and-drop

### E2E Tests
- [ ] Admin creates hero banner
- [ ] Admin edits side card
- [ ] Customer clicks hero banner
- [ ] Carousel auto-rotates
- [ ] Dark mode compatibility

### Manual QA Checklist
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Mobile testing on iOS Safari and Chrome Android
- [ ] Screen reader testing (NVDA/JAWS)
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Dark mode compatibility
- [ ] RTL layout for Bangla text

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data loss during migration | High | Low | Create full database backup before migration |
| Image upload failures | Medium | Medium | Implement retry logic with exponential backoff |
| Carousel performance on mobile | Medium | Low | Lazy load images, use WebP format |
| Admin workflow disruption | Low | Medium | Release on weekend, provide training video |
| SEO impact from text removal | Low | Low | Ensure alt text is always populated |

---

## Open Questions

1. **Q:** Should we support video banners in the future?  
   **A:** Not in this phase, but architecture should allow easy extension

2. **Q:** Do we need banner analytics (impressions, clicks)?  
   **A:** Not in MVP, add tracking events for future implementation

3. **Q:** Should admins be able to preview banners before saving?  
   **A:** Yes, show live preview in modal as user fills form

4. **Q:** What happens to scheduled banners when start date arrives?  
   **A:** Implement cron job to auto-activate scheduled banners

---

## Appendix

### Related Documents
- Initial PRD - KineDao.com MVP requirements
- Architecture documentation
- Knowledge base

### Banner Types

**Hero Carousel Banners:**
- Type: hero
- Image URL (required)
- Link URL (required)
- Alt Text (optional, for SEO)
- Status: Active/Scheduled/Inactive
- Start Date/Time (optional, for scheduled)
- End Date/Time (optional, for scheduled)

**Side Promotional Cards:**
- Type: side
- Position: 1, 2, or 3 (fixed slots)
- Image URL (required, 400×300px recommended)
- Link URL (required)
- Title English (required, max 30 chars)
- Title Bangla (required, max 30 chars)
- Subtitle English (required, max 50 chars)
- Subtitle Bangla (required, max 50 chars)
- Discount Badge (optional, max 20 chars)
- Status: Active/Scheduled/Inactive

---

**Document Status:** Ready for Review  
**Next Steps:** Schedule design review → Begin Phase 1 backend work  
**Estimated Delivery:** 7 working days from approval
