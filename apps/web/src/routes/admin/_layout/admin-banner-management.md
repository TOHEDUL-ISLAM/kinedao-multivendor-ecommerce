# Admin Banner Management System Refactoring

## Context

The current admin banner management system is a 972-line monolithic file with an over-engineered staging/batch-publish workflow and inline live-editing UX. The PRD (`banner-refactor-prd.md`) and Epics (`banner-refactor-epics.md`) call for:

1. Replacing it with a clean, modular, tab-based CRUD interface (Hero Carousel + Side Cards)
2. Making hero banners image-only (no text overlays) with immediate backend saves
3. Simplifying the homepage hero carousel to clickable images without text
4. Deleting all staging/batch-publish code (~2,100 lines)

**No database schema migration is required.** The existing `placement` field already distinguishes hero vs side cards. The `titleEn` NOT NULL column will store the alt text for hero banners (defaulting to `"Hero Banner"` if empty).

---

## Phase 0: Install Dependencies

**Run:** `cd apps/web && bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @mantine/dropzone`

---

## Phase 1: API Types — `packages/api-types/src/admin.ts`

Add alongside existing schemas (keep `adminBannerFormSchema` for backward compat):

**New schemas:**
- `adminHeroBannerFormSchema` — imageUrl, s3Key, linkUrl (required), altText (optional, maps to titleEn), isActive, sortOrder, startsAt, endsAt
- `adminSideCardFormSchema` — titleEn, titleBn, subtitleEn, subtitleBn, imageUrl, s3Key, linkUrl, discountPercentage, badgeText, badgeColor, isActive, sortOrder

**New DTOs:**
- `AdminHeroBannerListItemDTO` — id, imageUrl, s3Key, linkUrl, altText, isActive, sortOrder, startsAt, endsAt, createdAt, status (computed: `"active"` | `"scheduled"` | `"inactive"`)
- `AdminSideCardListItemDTO` — id, titleEn, titleBn, subtitleEn, subtitleBn, imageUrl, s3Key, linkUrl, discountPercentage, badgeText, badgeColor, isActive, sortOrder, createdAt

---

## Phase 2: Backend API Routes — `apps/server/src/routes/admin.ts`

Add new type-specific endpoints (keep existing generic endpoints for now):

| Method | Path | Schema | Notes |
|--------|------|--------|-------|
| GET | `/admin/banners/hero` | — | Filter `placement="hero_carousel"`, compute `status` field |
| POST | `/admin/banners/hero` | `adminHeroBannerFormSchema` | Maps `altText \|\| "Hero Banner"` → `titleEn`, forces `placement="hero_carousel"` |
| PUT | `/admin/banners/hero/:bannerId` | `adminHeroBannerFormSchema` | Same mapping, deletes old S3 if image changed |
| GET | `/admin/banners/side-cards` | — | Filter `placement="promotional_card"`, max 3 |
| POST | `/admin/banners/side-cards` | `adminSideCardFormSchema` | Enforces max 3, forces `placement="promotional_card"` |
| PUT | `/admin/banners/side-cards/:bannerId` | `adminSideCardFormSchema` | Fixed position, no add/delete |

**Reuse existing:** `DELETE /admin/banners/:bannerId`, `PATCH /admin/banners/reorder`

---

## Phase 3: New Frontend Components

New directory: `apps/web/src/components/admin/banners/`

### Component tree (~1,200 lines total vs 2,100 lines deleted):

```
banners.tsx (route page, ~100 lines) — Mantine Tabs with URL state
├── banner-labels.ts (~100 lines) — bilingual labels (en/bn)
├── use-banner-mutations.ts (~120 lines) — TanStack Query mutation hooks
├── banner-image-upload.tsx (~120 lines) — Mantine Dropzone + preview
├── hero-banner-tab.tsx (~150 lines) — container: query + modal state
│   ├── hero-banner-list.tsx (~180 lines) — @dnd-kit sortable table
│   └── hero-banner-modal.tsx (~180 lines) — Mantine Modal form
└── side-cards-tab.tsx (~150 lines) — container: query + modal state
    ├── side-card-slot.tsx (~100 lines) — single slot (populated/empty)
    └── side-card-modal.tsx (~180 lines) — Mantine Modal with live preview
```

### Key design decisions:

**3a. Route page** (`apps/web/src/routes/admin/_layout/banners.tsx`)
- Replace entire 972-line file with ~100-line Mantine Tabs component
- Tab state in URL via `validateSearch: z.object({ tab: z.enum(["hero","side"]).catch("hero") })`
- Two panels: `<HeroBannerTab />` and `<SideCardsTab />`

**3b. Hero Banner Tab**
- List view: Mantine Table with columns — drag handle (GripVertical), thumbnail (80x45), link URL, alt text, status badge, actions (edit/delete)
- Drag-and-drop: `@dnd-kit/core` + `@dnd-kit/sortable` for reordering, immediately calls PATCH reorder endpoint
- Status badges: green "Active", orange "Scheduled", gray "Inactive"
- Add/Edit modal (800px centered): Image dropzone + Link URL + Alt Text + Active toggle + Date pickers for scheduling
- Delete: confirmation modal, then DELETE endpoint

**3c. Side Cards Tab**
- Three fixed slots labeled "Top Card", "Middle Card", "Bottom Card" in a vertical Stack
- Populated slots: image preview + title + badge + "Edit" button
- Empty slots: dashed border placeholder + "Configure" button
- Edit/Configure modal (800px centered): two-column layout — form (left 60%) + live preview (right 40%)
- Form: image, titles EN/BN, subtitles EN/BN, link URL, discount %, badge text, badge color swatches
- Max 3 side cards enforced by backend

**3d. Shared image upload** (`banner-image-upload.tsx`)
- `@mantine/dropzone` with drag-and-drop, click-to-browse
- Preview thumbnail from blob URL
- Replace/remove actions
- Props: `currentImageUrl`, `onFileSelect(file)`, `isUploading`, `aspectRatio`

**3e. Shared mutations hook** (`use-banner-mutations.ts`)
- `useUploadBannerImage()` — wraps fetch to `/api/upload?category=banners`
- `useCreateHeroBanner()`, `useUpdateHeroBanner()`, `useDeleteBanner()`, `useReorderBanners()`
- `useCreateSideCard()`, `useUpdateSideCard()`
- All invalidate `["admin", "banners"]` + `["banners"]` query keys on success

---

## Phase 4: Homepage Hero Simplification

**Modify:** `apps/web/src/components/homepage/hero-banners.tsx`

- Remove: gradient overlay, text content div (title, subtitle, badge, priceLabel, CTA button), `BADGE_COLORS` map, `useLanguage` import
- Add: wrap entire slide in `<a href={banner.linkUrl}>` making the whole banner clickable
- Add: `alt={banner.titleEn || "KineDao Promotion"}` on `<img>` for accessibility
- Keep: Mantine Carousel, embla autoplay (2s), responsive heights, arrows, indicators, hover pause
- Simplify fallback `DEFAULT_HERO_SLIDES` to only image/link/alt fields

**No changes to:** `promotional-banners.tsx` (side cards keep text overlays), `new-arrivals-banners.tsx`, `apps/server/src/routes/banners.ts` (public API unchanged), `packages/api-types/src/catalog.ts` (BannerDTO unchanged)

---

## Phase 5: Cleanup

**Delete entire directory** `apps/web/src/components/admin/banner-editor/` (10 files, ~2,100 lines):
- `use-banner-editor-state.ts`, `banner-editor-toolbar.tsx`, `promotional-cards-editor.tsx`
- `editable-hero-slide.tsx`, `editable-promo-card.tsx`, `editable-badge.tsx`, `editable-text-field.tsx`
- `image-upload-overlay.tsx`, `banner-editor-labels.ts`, `promo-card-layout.ts`

**Deferred cleanup** (follow-up, not this PR):
- Remove old `adminBannerFormSchema` from api-types once verified
- Remove old generic POST/PUT banner endpoints from admin.ts

---

## File Operations Summary

| Action | File | Lines |
|--------|------|-------|
| Modify | `packages/api-types/src/admin.ts` | +~60 |
| Modify | `apps/server/src/routes/admin.ts` | +~200 |
| Rewrite | `apps/web/src/routes/admin/_layout/banners.tsx` | 972 → ~100 |
| Modify | `apps/web/src/components/homepage/hero-banners.tsx` | 172 → ~60 |
| Create | `apps/web/src/components/admin/banners/banner-labels.ts` | ~100 |
| Create | `apps/web/src/components/admin/banners/use-banner-mutations.ts` | ~120 |
| Create | `apps/web/src/components/admin/banners/banner-image-upload.tsx` | ~120 |
| Create | `apps/web/src/components/admin/banners/hero-banner-tab.tsx` | ~150 |
| Create | `apps/web/src/components/admin/banners/hero-banner-list.tsx` | ~180 |
| Create | `apps/web/src/components/admin/banners/hero-banner-modal.tsx` | ~180 |
| Create | `apps/web/src/components/admin/banners/side-cards-tab.tsx` | ~150 |
| Create | `apps/web/src/components/admin/banners/side-card-slot.tsx` | ~100 |
| Create | `apps/web/src/components/admin/banners/side-card-modal.tsx` | ~180 |
| Delete | `apps/web/src/components/admin/banner-editor/*` (10 files) | -2,100 |

**Net result:** ~1,280 new lines, ~3,044 lines removed = **~1,764 fewer lines**

---

## Verification

1. **Type check:** `bun run check-types` — zero errors
2. **Dev server:** `bun run dev` — both web + server start clean
3. **Hero Tab:** Add/edit/delete/reorder hero banners via modal, verify immediate DB persistence
4. **Side Cards Tab:** Configure empty slots, edit populated slots, verify live preview in modal
5. **Homepage:** Hero carousel shows image-only clickable banners, promo cards unchanged
6. **Bilingual:** Switch to Bangla, verify all admin labels + side card form
7. **Dark mode:** All new components render correctly in both themes
8. **Accessibility:** Hero images have alt text, carousel pauses on focus, modal traps focus
