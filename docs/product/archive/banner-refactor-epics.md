# Epic Breakdown: Admin Banner Management Refactoring
**Project:** KineDao.com  
**Total Story Points:** 34 points  
**Estimated Duration:** 7 working days (1 sprint)  
**Team Size:** 2 developers (1 frontend, 1 full-stack)

---

## Epic Overview

This document breaks down the banner management refactoring into actionable epics with detailed user stories, acceptance criteria, and implementation guidance.

---

## Epic 1: Tab-Based Banner Organization & Hero Carousel Management
**Epic ID:** BANNER-001  
**Priority:** P0 (Must Have)  
**Story Points:** 16  
**Owner:** Frontend Team  
**Sprint:** Sprint 1  

### Description
Create a clean, tab-based interface to separate hero carousel management from side promotional cards. Implement full CRUD operations for image-only hero banners with drag-and-drop reordering.

### Business Value
- Reduces admin cognitive load by organizing banners into logical groups
- Speeds up banner updates from 45 seconds to <15 seconds
- Enables rapid A/B testing of hero images without text field editing

---

### User Story 1.1: Tab Navigation Component
**Story ID:** BANNER-001-1  
**Story Points:** 3  
**As an** admin  
**I want** to switch between "Hero Carousel" and "Side Cards" tabs  
**So that** I can focus on one banner type at a time

#### Acceptance Criteria
- [ ] Page displays 2 tabs: "Hero Carousel" (default) and "Side Cards"
- [ ] Active tab has teal underline and semibold font
- [ ] Clicking tab updates URL query parameter
- [ ] Tab state persists on page reload
- [ ] Tab switching happens without full page reload
- [ ] Keyboard accessible: Tab key cycles through tabs, Enter selects

#### Implementation Notes
- Use Mantine UI Tabs component for consistent styling
- Integrate with TanStack Router for URL state management
- Store active tab in query parameter (?tab=hero or ?tab=side)
- Components render conditionally based on selected tab

#### Dependencies
- Mantine UI library (already installed)
- TanStack Router search params API

#### Testing
- [ ] Unit: Tab state management logic
- [ ] Integration: URL param updates on click
- [ ] E2E: Tab persistence after page reload

---

### User Story 1.2: Hero Banner List View
**Story ID:** BANNER-001-2  
**Story Points:** 5  
**As an** admin  
**I want** to see all hero banners in a sortable list  
**So that** I can quickly identify which banners are active

#### Acceptance Criteria
- [ ] List displays: Thumbnail (120×60px), Alt Text, Link URL, Status Badge, Actions
- [ ] Status badges: 
  - Active → Green pill
  - Scheduled → Orange pill with countdown
  - Inactive → Gray pill
- [ ] Empty state shows: "No hero banners yet. Click 'Add Banner' to create your first."
- [ ] "Add Hero Banner" button (teal, top-right corner)
- [ ] Each row has: Drag Handle (⋮⋮), Edit icon, Delete icon
- [ ] Hover effect on rows (subtle background color change)
- [ ] Loading state shows skeleton placeholders
- [ ] Error state shows retry button

#### Implementation Notes
- Fetch banners using TanStack Query for caching and automatic refetching
- Filter by type='hero' when querying backend
- Use Mantine Badge component for status indicators
- Implement skeleton loading state for better UX
- Show friendly error message with retry button on failure

#### Dependencies
- TanStack Query for data fetching
- Drag-and-drop library for reordering
- Mantine Badge, Button, and Skeleton components

#### Testing
- [ ] Unit: Status badge color logic
- [ ] Integration: API data fetching and display
- [ ] E2E: Empty state → Add banner → List updates

---

### User Story 1.3: Hero Banner Creation Modal
**Story ID:** BANNER-001-3  
**Story Points:** 8  
**As a** marketing manager  
**I want** to create image-only hero banners  
**So that** I can launch promotions without text overlays

#### Acceptance Criteria
- [ ] "Add Hero Banner" button opens centered modal (800px width)
- [ ] Modal title: "Create Hero Banner"
- [ ] Form fields:
  1. **Image Upload** (required)
     - Drag-and-drop zone with dashed border
     - Accepts JPG, PNG, WebP (max 2MB)
     - Shows preview thumbnail after upload
     - "Replace" button to re-upload
     - Recommended size: 1920×600px (16:5 aspect ratio)
  2. **Link URL** (required)
     - Input with URL validation
     - Placeholder: `/collections/summer-sale`
     - Helper text: "Where should this banner lead?"
  3. **Alt Text** (optional)
     - Character count: 5-150 chars
     - Placeholder: "Summer Sale - Up to 50% Off"
     - Helper text: "For SEO and accessibility"
  4. **Status** (required)
     - Radio group: Active, Scheduled, Inactive
     - If Scheduled → Show date pickers for Start/End
- [ ] "Cancel" and "Save" buttons at bottom
- [ ] "Save" disabled until image + link URL provided
- [ ] Success toast: "Hero banner created successfully!"
- [ ] Error toast: "Failed to create banner. Please try again."
- [ ] Modal closes after successful save
- [ ] Pressing Esc closes modal (with unsaved changes warning)

#### Implementation Notes
- Use Mantine Modal component with centered prop
- Implement form validation with Mantine form hooks
- Image upload should use existing S3 upload infrastructure
- Date pickers should only appear when "Scheduled" status is selected
- Form should validate before allowing submission
- Show loading state on Save button during API call

#### API Integration
- Endpoint: POST to admin banners endpoint
- Request should include banner type, image URL, link URL, alt text, and status
- Response returns created banner with generated ID
- Handle both success and error states gracefully

#### Dependencies
- Mantine form hooks and validation
- TanStack Query mutations for API calls
- S3 upload utility (reuse from product images)
- Date/time picker component

#### Testing
- [ ] Unit: Form validation logic
- [ ] Integration: Image upload → S3 → form population
- [ ] E2E: Full create flow with Playwright

---

### User Story 1.4: Hero Banner Drag-and-Drop Reordering
**Story ID:** BANNER-001-4  
**Story Points:** 5  
**As a** category manager  
**I want** to reorder hero banners by dragging  
**So that** I can prioritize seasonal promotions

#### Acceptance Criteria
- [ ] Each banner row has drag handle icon (⋮⋮) on left
- [ ] Cursor changes to grab hand on hover over handle
- [ ] Dragging shows:
  - Semi-transparent ghost of dragged item
  - Dashed placeholder in drop position
  - Other items shift smoothly
- [ ] Dropping updates position immediately (optimistic UI)
- [ ] Backend receives reorder request with new banner order
- [ ] If API fails, positions revert with error toast
- [ ] Touch-friendly on mobile (long-press to drag)
- [ ] Keyboard accessible: Arrow keys + Space to grab/drop

#### Implementation Notes
- Use dnd-kit library for drag-and-drop functionality
- Implement optimistic updates for immediate visual feedback
- On successful drag, send reorder request to backend
- If backend fails, rollback to previous order
- Store banner positions in database for persistence
- Ensure smooth animations during drag operations

#### API Integration
- Endpoint: PATCH to reorder endpoint
- Request body contains array of banner IDs in new order
- Backend updates position field for each banner
- Use database transaction to ensure consistency

#### Dependencies
- @dnd-kit/core and @dnd-kit/sortable libraries
- TanStack Query optimistic updates

#### Testing
- [ ] Unit: Position calculation logic
- [ ] Integration: Optimistic update → API call → rollback on error
- [ ] E2E: Drag banner 3 → position 1 → verify order persists

---

## Epic 2: Side Promotional Cards Management
**Epic ID:** BANNER-002  
**Priority:** P0 (Must Have)  
**Story Points:** 8  
**Owner:** Frontend Team  
**Sprint:** Sprint 1

### Description
Implement a fixed 3-slot system for side promotional cards with text overlays (title, subtitle, discount badge). Unlike hero banners, these small cards retain promotional text for category highlights.

### Business Value
- Enables weekly category promotions without full homepage redesign
- Maintains text overlays where they're effective (small card format)
- Enforces 3-card limit to prevent UI clutter

---

### User Story 2.1: Side Cards Dashboard View
**Story ID:** BANNER-002-1  
**Story Points:** 3  
**As an** admin  
**I want** to see the 3 side card slots in a dashboard  
**So that** I can quickly update category promotions

#### Acceptance Criteria
- [ ] "Side Cards" tab displays 3 fixed slots: Top, Middle, Bottom
- [ ] Each slot shows:
  - Slot label (e.g., "Slot 1: Top Position")
  - Current card preview (image + text overlay)
  - "Edit" button
  - Last updated timestamp
- [ ] Empty slots show:
  - Placeholder image (dashed border box)
  - "No card configured" message
  - "Configure" button
- [ ] Layout: 3 cards in vertical stack (not grid)
- [ ] No "Add New Card" button (limit enforced)

#### Implementation Notes
- Query banners with type='side' filter
- Map slots 1-3 to banner positions
- Display empty state for unconfigured slots
- Use Mantine Stack component for vertical layout
- Show last updated timestamp in readable format

#### Testing
- [ ] Unit: Slot mapping logic
- [ ] Integration: Empty state rendering
- [ ] E2E: Navigate to Side Cards tab → See 3 slots

---

### User Story 2.2: Side Card Edit Modal
**Story ID:** BANNER-002-2  
**Story Points:** 5  
**As a** category manager  
**I want** to edit side card text and images  
**So that** I can update weekly promotions

#### Acceptance Criteria
- [ ] "Edit" button opens centered modal (800px width)
- [ ] Modal title: "Edit Side Card - Slot 1"
- [ ] Form fields:
  1. **Image Upload** (required, 400×300px recommended)
  2. **Title** (required)
     - English input (max 30 chars)
     - Bangla input (max 30 chars)
     - Live preview shows text overlay
  3. **Subtitle** (required)
     - English input (max 50 chars)
     - Bangla input (max 50 chars)
  4. **Link URL** (required)
  5. **Discount Badge** (optional, max 20 chars, e.g., "৳499")
  6. **Status** (Active/Scheduled/Inactive)
- [ ] Live preview panel on right side of modal
- [ ] "Save" updates card immediately
- [ ] Cannot change position (fixed to slot)

#### Implementation Notes
- Use two-column layout: form on left, preview on right
- Preview updates in real-time as user types
- Enforce character limits on all text fields
- Position is fixed and cannot be changed
- Validate all required fields before allowing save
- Show character count for title and subtitle fields

#### Testing
- [ ] Unit: Character count validation
- [ ] Integration: Form submission → API → modal close
- [ ] E2E: Edit card → Change title → Verify homepage updates

---

## Epic 3: Homepage Hero Section Refactor
**Epic ID:** BANNER-003  
**Priority:** P0 (Must Have)  
**Story Points:** 5  
**Owner:** Full-Stack Team  
**Sprint:** Sprint 1

### Description
Simplify the homepage hero section to display clean, clickable image banners without text overlays or CTA buttons. Entire banner navigates to link URL on click.

### Business Value
- Improves mobile UX (no text blocking images)
- Increases CTR from 2.3% to >4.5% (based on competitor benchmarks)
- Aligns with modern e-commerce design patterns (Amazon, Alibaba)

---

### User Story 3.1: Image-Only Hero Carousel
**Story ID:** BANNER-003-1  
**Story Points:** 3  
**As a** customer  
**I want** to see clean clickable banner images  
**So that** I can navigate to promotions faster

#### Acceptance Criteria
- [ ] Hero carousel displays only images (no text overlays)
- [ ] Entire banner is clickable (cursor: pointer)
- [ ] Clicking navigates to banner's link URL
- [ ] Auto-rotation every 5 seconds
- [ ] Manual navigation: Left/right arrows + dot indicators
- [ ] Smooth fade transition between slides (300ms)
- [ ] Mobile: Full-width, maintains aspect ratio (no cropping)
- [ ] Desktop: Max 1920px width, centered

#### Implementation Notes
- Remove all text overlay rendering from hero section component
- Wrap entire image in clickable link component
- Use carousel library for auto-rotation and navigation
- Implement smooth fade transitions between slides
- Ensure responsive behavior on all screen sizes
- Maintain aspect ratio to prevent image distortion

#### Testing
- [ ] Unit: Banner data fetching logic
- [ ] Integration: Click banner → Navigate to correct URL
- [ ] E2E: Auto-rotation works → Manual navigation works

---

### User Story 3.2: SEO & Accessibility
**Story ID:** BANNER-003-2  
**Story Points:** 2  
**As a** customer using screen reader  
**I want** banner images to have descriptive alt text  
**So that** I understand the promotion

#### Acceptance Criteria
- [ ] All image tags have alt attribute
- [ ] Alt text populated from banner's alt text field
- [ ] Fallback alt text: "KineDao Promotion" if alt text is empty
- [ ] Link elements have aria-label describing destination
- [ ] Carousel pause on hover or keyboard focus
- [ ] Arrow buttons keyboard accessible (Tab + Enter)

#### Implementation Notes
- Always include alt attribute on images
- Use fallback text when alt text is not provided
- Add descriptive aria-labels to all interactive elements
- Implement pause on hover functionality
- Ensure all carousel controls are keyboard navigable
- Test with screen readers for proper announcements

#### Testing
- [ ] Accessibility: Lighthouse score >95
- [ ] Manual: Test with NVDA screen reader
- [ ] E2E: Keyboard navigation through carousel

---

## Epic 4: Technical Debt Cleanup
**Epic ID:** BANNER-004  
**Priority:** P1 (Should Have)  
**Story Points:** 5  
**Owner:** Full-Stack Team  
**Sprint:** Sprint 1

### Description
Remove all staging/batch-publish logic, delete obsolete files, and modularize the 972-line monolithic component.

### Business Value
- Reduces future maintenance cost by 40%
- Improves code readability for new developers
- Eliminates 300+ lines of unused staging code

---

### User Story 4.1: Remove Staging System
**Story ID:** BANNER-004-1  
**Story Points:** 3  
**As a** developer  
**I want** to delete all staging and batch-publish logic  
**So that** the codebase is simpler

#### Acceptance Criteria
- [ ] Banner editor state file deleted
- [ ] All draft-related type references removed
- [ ] Database columns for drafts and publishing dropped
- [ ] API routes for staging and batch publish deleted
- [ ] No TypeScript errors after cleanup
- [ ] Migration script to clean up existing data

#### Implementation Steps
1. Delete banner editor state management file
2. Remove all imports and references to staging logic
3. Update database schema to remove draft-related columns
4. Generate and apply database migration
5. Delete staging-related API route files
6. Run TypeScript check to ensure no errors
7. Update tests to remove staging-related test cases

#### Testing
- [ ] Unit: TypeScript compilation passes
- [ ] Integration: All API routes return expected responses
- [ ] E2E: Banner CRUD still works after cleanup

---

### User Story 4.2: Component Modularization
**Story ID:** BANNER-004-2  
**Story Points:** 2  
**As a** developer  
**I want** the 972-line file split into focused components  
**So that** I can debug issues faster

#### Acceptance Criteria
- [ ] Main page file is <150 lines
- [ ] Each component file is <200 lines
- [ ] Components organized in dedicated banners directory
- [ ] Clear separation of concerns (list, form, modal, dropzone)
- [ ] All components have TypeScript prop types
- [ ] No code duplication between hero and side card forms

#### Component Structure
**Main Files:**
- Banner management page (layout and routing)
- Tab navigation component
- Hero carousel tab (list and actions)
- Side cards tab (3-slot dashboard)
- Banner modal wrapper
- Banner list item component

**Form Components:**
- Hero banner form (image-only)
- Side card form (with text fields)
- Image upload dropzone (shared)

**Utility Hooks:**
- Banner mutations hook (CRUD operations)
- Form validation hooks

#### Implementation Guidelines
- Extract reusable logic into custom hooks
- Use Mantine components for consistent styling
- Ensure each component has single responsibility
- Add TypeScript interfaces for all props
- Document complex components with JSDoc comments

#### Testing
- [ ] Unit: Each component renders independently
- [ ] Integration: Component composition works correctly
- [ ] E2E: Full user flow still functional

---

## Implementation Timeline

### Day 1-2: Backend Foundation
**Tasks:**
- [ ] Update banners database structure
- [ ] Add type field (hero/side)
- [ ] Add position field for ordering
- [ ] Make text fields optional for hero banners
- [ ] Generate and apply migrations
- [ ] Create migration script for existing data
- [ ] Update API validation rules
- [ ] Test CRUD endpoints

**Deliverables:**
- Updated database schema
- Migration script
- Updated API endpoints
- API test results

---

### Day 3-4: Frontend Structure
**Tasks:**
- [ ] Create component directory structure
- [ ] Build tab navigation component
- [ ] Build modal wrapper component
- [ ] Implement hero carousel tab
- [ ] Implement drag-and-drop reordering
- [ ] Build image upload dropzone
- [ ] Create mutation hooks

**Deliverables:**
- Component file structure
- Tab navigation working
- Hero carousel list displaying
- Image upload functional

---

### Day 5-6: Forms & Side Cards
**Tasks:**
- [ ] Build hero banner form
- [ ] Build side card form with preview
- [ ] Implement side cards tab
- [ ] Connect forms to API
- [ ] Add form validation
- [ ] Implement optimistic updates
- [ ] Add error handling

**Deliverables:**
- Working hero banner creation/editing
- Working side card editing
- Form validation functional
- Error handling in place

---

### Day 7: Homepage & Cleanup
**Tasks:**
- [ ] Refactor homepage hero section
- [ ] Remove text overlays
- [ ] Make images clickable
- [ ] Delete staging state file
- [ ] Remove staging API routes
- [ ] Drop unused database columns
- [ ] Run full regression testing
- [ ] Update documentation

**Deliverables:**
- Clean homepage hero section
- No staging system remnants
- All tests passing
- Updated documentation

---

## Testing Checklist

### Unit Tests (20 tests)
- [ ] Banner form validation
- [ ] Image upload utilities
- [ ] Reorder position calculation
- [ ] Status badge color logic
- [ ] Date picker validation
- [ ] Character count validation
- [ ] URL validation
- [ ] Component prop validation

### Integration Tests (15 tests)
- [ ] Create hero banner flow
- [ ] Edit hero banner flow
- [ ] Delete banner with confirmation
- [ ] Reorder banners
- [ ] Edit side card flow
- [ ] API error handling
- [ ] Optimistic update rollback
- [ ] Form submission
- [ ] Image upload to S3
- [ ] Tab navigation

### E2E Tests (10 tests)
- [ ] Admin creates hero banner
- [ ] Admin edits hero banner
- [ ] Admin deletes banner
- [ ] Admin reorders banners
- [ ] Admin edits side card
- [ ] Customer clicks hero banner
- [ ] Carousel auto-rotates
- [ ] Keyboard navigation works
- [ ] Mobile responsiveness
- [ ] Dark mode compatibility

### Manual QA
- [ ] Chrome testing
- [ ] Firefox testing
- [ ] Safari testing
- [ ] Edge testing
- [ ] iOS Safari mobile testing
- [ ] Chrome Android testing
- [ ] Screen reader testing (NVDA)
- [ ] Screen reader testing (JAWS)
- [ ] Keyboard-only navigation
- [ ] RTL layout for Bangla text
- [ ] Touch device testing
- [ ] Slow network simulation

---

## Definition of Done

Each user story is considered "Done" when:

1. ✅ Code is written and passes TypeScript checks
2. ✅ Unit tests written and passing (80% coverage minimum)
3. ✅ Integration tests passing
4. ✅ E2E test written (for critical user paths)
5. ✅ Code reviewed and approved by team lead
6. ✅ Tested on Chrome, Firefox, and Safari
7. ✅ Mobile responsive (iOS and Android)
8. ✅ Accessibility: WCAG 2.1 AA compliant
9. ✅ Documentation updated (inline comments and README)
10. ✅ Deployed to staging environment
11. ✅ Product owner acceptance

---

## Risk Mitigation

### High Priority Risks

**Risk: Data Loss During Migration**
- Impact: High
- Likelihood: Low
- Mitigation: 
  - Create full database backup before migration
  - Test migration script on development environment first
  - Have rollback plan ready
  - Monitor migration closely

**Risk: Image Upload Failures**
- Impact: Medium
- Likelihood: Medium
- Mitigation:
  - Implement retry logic with exponential backoff
  - Show clear error messages to users
  - Provide manual file picker fallback
  - Monitor S3 upload success rates

**Risk: Carousel Performance on Mobile**
- Impact: Medium
- Likelihood: Low
- Mitigation:
  - Lazy load images
  - Use WebP format for smaller file sizes
  - Implement proper image optimization
  - Test on actual mobile devices

**Risk: Admin Workflow Disruption**
- Impact: Low
- Likelihood: Medium
- Mitigation:
  - Release on weekend with low traffic
  - Provide training video before launch
  - Have support team ready for questions
  - Implement gradual rollout if possible

---

## Success Metrics (Post-Launch)

### Week 1 Targets
- [ ] Banner update time: <15 seconds (currently 45 seconds)
- [ ] Admin errors: <2% (currently 12%)
- [ ] Hero carousel CTR: >3.5% (currently 2.3%)
- [ ] Zero critical bugs reported
- [ ] Admin satisfaction score: >4/5

### Week 4 Targets
- [ ] Zero staging-related support tickets
- [ ] Code complexity: <10 (Cyclomatic complexity)
- [ ] Page load time: <500ms (95th percentile)
- [ ] Hero carousel CTR: >4.5%
- [ ] Admin training time: <5 minutes

### Month 3 Targets
- [ ] 50% reduction in banner-related support tickets
- [ ] 90% admin satisfaction score
- [ ] Zero staging system references in codebase
- [ ] Component reusability: >80%
- [ ] Code maintainability index: >85

---

## Communication Plan

### Stakeholder Updates
- **Weekly:** Status update email to product team
- **Bi-weekly:** Demo session with stakeholders
- **Daily:** Stand-up notes in project channel
- **Ad-hoc:** Slack updates for blockers or major decisions

### Documentation
- **Technical:** Update architecture docs
- **User-facing:** Create admin guide with screenshots
- **Training:** Record video walkthrough
- **API:** Update endpoint documentation

### Launch Communication
- **Pre-launch:** Email to all admins (3 days before)
- **Launch day:** In-app announcement banner
- **Post-launch:** Follow-up training session
- **Week 1:** Feedback collection survey

---

## Next Steps

1. **Review Documents:** Team reviews PRD and Epic Breakdown
2. **Assign Owners:** Assign each user story to developers
3. **Sprint Planning:** Schedule sprint planning meeting
4. **Setup Environment:** Prepare development environment
5. **Kickoff Meeting:** Conduct project kickoff with full team
6. **Begin Development:** Start Day 1 backend foundation work

---

**Document Status:** Ready for Sprint Planning  
**Last Updated:** February 13, 2026  
**Review Due:** February 14, 2026
