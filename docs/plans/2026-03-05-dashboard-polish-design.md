# Dashboard Polish Design

Date: 2026-03-05
Branch: `feat/dashboard-polish`

## 1. Design Token Unification + Subtle Glassmorphism

### Problem

`bg-white` hardcoded in multiple places (main container, CommandPalette, dialogs) conflicts with the `dashboard.*` token system.

### Changes

- Replace all hardcoded `bg-white` with dashboard tokens
- Add new token `dashboard.bg.base: 'rgb(255 255 255 / 0.85)'` for the main container card
- Floating elements (dropdown, dialog, command palette): `backdrop-blur-xl bg-white/80 border-white/20`
- Main container: `bg-white/85 backdrop-blur-sm` (subtle glass on the neutral-200 layout bg)
- Keep `dashboard-bg-card` for inline cards (no blur needed)

### Files

- `tailwind.config.ts` — add `dashboard.bg.base` token
- `page.tsx` — main container bg
- `simple-dropdown.tsx` — dropdown content
- `DashboardDialog.tsx` — dialog content
- `CommandPalette.tsx` — palette content
- `ConfirmDialog.tsx` — dialog content

## 2. GoBack → Breadcrumb

### Problem

Back button in EntryDetailView takes a full `border-b` row, wasting vertical space.

### Changes

- Remove the standalone back bar from EntryDetailView
- Add breadcrumb to the header area: `Page > Entry Name` (English text)
- "Page" is clickable → triggers `goBack()`
- CreateEntryPanel: same pattern — `Page > New Entry`
- Keep `previousView` 1-level stack (sufficient for current UX)

### Files

- `ContentPanel/EntryDetailView.tsx` — replace back bar with breadcrumb in header
- `ContentPanel/CreateEntryPanel.tsx` — add breadcrumb header

## 3. Lucide Icons → TypeBadge Unification

### Problem

CommandPalette uses Lucide icons (Music, Calendar, Link2, Blocks) for entry types while the rest of the UI uses `TypeBadge`.

### Changes

- Replace Lucide entry-type icons in CommandPalette with `TypeBadge` component
- Remove unused Lucide icon imports from `entryConfig.ts` (the `icon` field)
- Keep utility icons (ArrowLeft, MoreHorizontal, Search, etc.) as-is

### Files

- `CommandPalette.tsx` — swap icons to TypeBadge
- `config/entryConfig.ts` — remove `icon` field if no longer used elsewhere

## 4. userKeys Factory + Profile Fields

### userKeys

```ts
export const userKeys = {
    all: ['user'] as const,
    profile: (id: string) => ['user', 'profile', id] as const,
};
```

### DB Migration

- Add `region` column (text, nullable) to profiles/users table

### Type Changes

- `User` interface: add `region?: string`
- `patchProfile`: include `region` in partial update

### UI Changes

- `SettingsModal`: add Region text input field below Bio
- `BioDesignPanel`: display region if present

### Files

- Supabase migration — add region column
- `src/types/domain.ts` — User type
- `src/app/dashboard/hooks/use-editor-data.ts` — userKeys factory
- `src/app/dashboard/hooks/use-user.ts` — patchProfile update
- `src/app/dashboard/components/SettingsModal.tsx` — region field
- `src/app/dashboard/components/ContentPanel/BioDesignPanel.tsx` — display region
- `src/lib/services/user.service.ts` — EditorData mapper if needed
