# Frontend Knowledge Base (apps/web)

## Overview

React 19 + TanStack Start SSR frontend. File-based routing, Zustand state, bilingual UI.

## Structure

```
src/
├── routes/           # File-based pages (__root.tsx is layout)
├── components/
│   ├── ui/           # Primitives (button, card, input)
│   ├── home/         # Homepage blocks
│   └── catalog/      # Catalog UI
├── stores/           # Zustand persisted stores
├── hooks/            # Custom hooks (use-translation)
├── lib/
│   ├── i18n/         # translations.ts
│   └── utils.ts      # cn() helper
├── middleware/       # TanStack Start middleware
└── functions/        # Server functions (createServerFn)
```

## Where to Look

| Task | Location |
|------|----------|
| Add page | `src/routes/new-page.tsx` |
| Add component | `src/components/` (feature folder or top-level) |
| Add UI primitive | `src/components/ui/` |
| Add translation | `src/lib/i18n/translations.ts` (en + bn) |
| Add store | `src/stores/` (use persist middleware) |
| Change theme colors | `src/index.css` (CSS vars) |

## Conventions

- **Translations**: Use `t("key")` from `useTranslation()`. Never hard-code UI text.
- **Class merging**: Always use `cn()` from `@/lib/utils` for className composition
- **UI variants**: Use `cva()` from class-variance-authority for variant-based styling
- **Stores**: Zustand with `persist` middleware, localStorage key: `kinedao-*`
- **Icons**: Import from `lucide-react`

## Anti-Patterns

| Pattern | Why |
|---------|-----|
| Hard-coded English strings | Breaks bilingual requirement |
| `className="..."` without `cn()` | Tailwind class conflicts |
| State in components | Use Zustand stores for shared state |
| Direct API URLs | Use `env.VITE_SERVER_URL` |

## Key Files

| File | Purpose |
|------|---------|
| `routes/__root.tsx` | Root layout, providers, global modals |
| `lib/i18n/translations.ts` | All EN/BN translation strings |
| `stores/language-store.ts` | Language toggle (persisted) |
| `stores/cart-store.ts` | Cart state (persisted) |
| `hooks/use-translation.ts` | `t()` function + `language` |
| `lib/utils.ts` | `cn()` = clsx + twMerge |
| `index.css` | Tailwind entry + design tokens |

## Adding Translations

1. Edit `src/lib/i18n/translations.ts`
2. Add key to both `en` and `bn` objects
3. Use `t("new.key")` in component
4. TypeScript will validate key exists

## Providers (in __root.tsx)

- `ThemeProvider` (next-themes) - dark mode
- `QueryClientProvider` (TanStack Query) - data fetching
- `ReactLenis` - smooth scrolling
- Global: `QuickViewModal`, `Toaster`
