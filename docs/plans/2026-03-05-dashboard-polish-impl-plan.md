# Dashboard Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify design tokens, add subtle glassmorphism, replace back button with breadcrumb, unify Lucide icons to TypeBadge, refactor userKeys factory, and add region profile field.

**Architecture:** Four independent work streams: (1) design token cleanup, (2) navigation UX, (3) icon unification, (4) user profile expansion. Each can be committed separately.

**Tech Stack:** Tailwind CSS tokens, Zustand ContentView, TanStack Query key factories, Supabase migration

---

### Task 1: Design Token — Replace hardcoded `bg-white` with dashboard tokens

**Files:**

- Modify: `tailwind.config.ts:80-89` — add `base` token
- Modify: `src/app/dashboard/page.tsx:49`
- Modify: `src/components/ui/simple-dropdown.tsx:94`
- Modify: `src/app/dashboard/components/ui/DashboardDialog.tsx:56`
- Modify: `src/app/dashboard/components/CommandPalette.tsx:86`
- Modify: `src/app/dashboard/components/PreviewPanel.tsx:117`

**Step 1: Add `base` token to tailwind config**

In `tailwind.config.ts`, inside `dashboard.bg`, add:

```ts
base: 'rgb(255 255 255 / 0.85)', // main container — subtle glass
```

**Step 2: Replace main container bg**

In `page.tsx:49`:

```diff
- <div className="flex flex-1 overflow-hidden rounded-2xl bg-white shadow-lg">
+ <div className="flex flex-1 overflow-hidden rounded-2xl bg-dashboard-bg-base backdrop-blur-sm shadow-lg">
```

**Step 3: Apply glassmorphism to floating elements**

In `simple-dropdown.tsx:94`:

```diff
- 'w-40 border-dashboard-border/70 bg-white shadow-lg',
+ 'w-40 border-white/20 bg-white/80 shadow-lg backdrop-blur-xl',
```

In `DashboardDialog.tsx:56` (the long className string), replace `bg-white` with:

```diff
- bg-white p-6 shadow-xl
+ bg-white/80 backdrop-blur-xl p-6 shadow-xl
```

In `CommandPalette.tsx:86`:

```diff
- <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
+ <div className="overflow-hidden rounded-2xl bg-white/80 shadow-xl backdrop-blur-xl">
```

In `PreviewPanel.tsx:117`:

```diff
- className="relative overflow-hidden rounded-[27px] bg-white"
+ className="relative overflow-hidden rounded-[27px] bg-dashboard-bg-base"
```

**Step 4: Verify visually**

Run: `npm run dev`
Check: Dashboard container, dropdowns, dialogs, command palette all render with subtle glass effect on neutral-200 bg.

**Step 5: Commit**

```
feat(design): unify bg tokens and add subtle glassmorphism
```

---

### Task 2: GoBack → Breadcrumb Navigation

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/EntryDetailView.tsx:5,184-195`
- Modify: `src/app/dashboard/components/ContentPanel/CreateEntryPanel.tsx:83-101`

**Step 1: Replace back bar with breadcrumb in EntryDetailView**

In `EntryDetailView.tsx`, replace lines 184-195 (the `{onBack && ...}` block) with a breadcrumb integrated into the existing header. Find the header section that contains the title and replace:

```tsx
{
    onBack && (
        <div className="border-b border-dashboard-border/50 px-4 py-3">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>
        </div>
    );
}
```

With breadcrumb in the header area (above or alongside the title):

```tsx
{
    onBack && (
        <div className="flex items-center gap-1.5 text-sm">
            <button
                onClick={onBack}
                className="text-dashboard-text-muted transition-colors hover:text-dashboard-text"
            >
                Page
            </button>
            <span className="text-dashboard-text-placeholder">/</span>
            <span className="truncate text-dashboard-text-secondary">
                {entry?.title || 'Entry'}
            </span>
        </div>
    );
}
```

Remove `ArrowLeft` from imports if no longer used (check other usages first).

**Step 2: Replace Cancel button with breadcrumb in CreateEntryPanel**

In `CreateEntryPanel.tsx`, replace the header section (lines 86-101). Change from Cancel button to breadcrumb style:

```tsx
<div className="flex h-full flex-col bg-dashboard-bg-card">
    <div className="flex items-center justify-between border-b border-dashboard-border/50 px-6 py-5">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
                <button
                    onClick={goBack}
                    className="text-dashboard-text-muted transition-colors hover:text-dashboard-text"
                >
                    Page
                </button>
                <span className="text-dashboard-text-placeholder">/</span>
            </div>
            <TypeBadge type={config.badgeType} size="sm" />
            <h2 className="text-lg font-medium text-dashboard-text">New {config.label}</h2>
        </div>
    </div>
```

**Step 3: Verify navigation**

Run: `npm run dev`
Check: Click entry → breadcrumb shows "Page / Entry Title". Click "Page" → navigates back. Same for Create panel.

**Step 4: Commit**

```
refactor(nav): replace back button with breadcrumb navigation
```

---

### Task 3: Lucide Icons → TypeBadge in CommandPalette

**Files:**

- Modify: `src/app/dashboard/components/CommandPalette.tsx:7,101,111`
- Modify: `src/app/dashboard/config/entryConfig.ts:1,13,19,25,31`

**Step 1: Replace entry type icons with TypeBadge in CommandPalette**

In `CommandPalette.tsx`, find lines around 101-111 where `ENTRY_TYPE_CONFIG[group.entryType].icon` is used:

```tsx
const Icon = ENTRY_TYPE_CONFIG[group.entryType].icon;
// ...
<Icon className="h-3.5 w-3.5 text-dashboard-text-placeholder" />;
```

Replace with:

```tsx
<TypeBadge type={ENTRY_TYPE_CONFIG[group.entryType].badgeType} size="sm" />
```

Add `TypeBadge` import, remove unused `Icon` variable.

**Step 2: Remove `icon` field from entryConfig**

In `entryConfig.ts`, remove:

- Line 1: `import { Blocks, Calendar, Link2, Music, type LucideIcon } from 'lucide-react';`
- Lines 13, 19, 25, 31: `icon: Calendar as LucideIcon`, etc.
- Remove `LucideIcon` from the config type if explicitly typed

**Step 3: Check for other usages of `entryConfig.icon`**

Run: `grep -r "\.icon" src/app/dashboard/config/entryConfig` — ensure no other consumers.

**Step 4: Verify**

Run: `npm run dev`
Check: CommandPalette shows TypeBadge (EVT, MIX, LNK, BLK) instead of Lucide icons.

**Step 5: Commit**

```
refactor(icons): replace Lucide entry icons with TypeBadge in CommandPalette
```

---

### Task 4: Refactor userKeys Factory

**Files:**

- Modify: `src/app/dashboard/hooks/use-editor-data.ts:18-20`
- Modify: `src/app/dashboard/hooks/use-user.ts` (update references)

**Step 1: Expand userKeys factory**

In `use-editor-data.ts:18-20`, replace:

```ts
export const userKeys = {
    all: ['user'] as const,
};
```

With:

```ts
export const userKeys = {
    all: ['user'] as const,
    profile: (id: string) => ['user', 'profile', id] as const,
};
```

**Step 2: Verify existing usages still work**

All current usages reference `userKeys.all` — no changes needed to consumers. The new `profile` key is for future per-user queries.

**Step 3: Commit**

```
refactor(queries): expand userKeys factory with profile key
```

---

### Task 5: Add `region` Column — DB Migration

**Step 1: Apply Supabase migration**

```sql
ALTER TABLE users ADD COLUMN region text;
```

Migration name: `add_user_region_column`

**Step 2: Commit**

```
feat(db): add region column to users table
```

---

### Task 6: Add `region` to Types and Mappers

**Files:**

- Modify: `src/types/database.ts:9-19` — add `region` to DB User
- Modify: `src/types/domain.ts:30-36` — add `region` to domain User
- Modify: `src/lib/mappers.ts:34-51` — map region in both directions

**Step 1: Add `region` to DB User type**

In `database.ts`, inside the `User` interface (after `bio?: string;`):

```ts
region?: string;
```

**Step 2: Add `region` to domain User type**

In `domain.ts`, inside the `User` interface (after `bio?: string;`):

```ts
region?: string;
```

**Step 3: Update mappers**

In `mappers.ts:34-42`, `mapUserToDomain`:

```ts
export function mapUserToDomain(dbUser: DBUser): User {
    return {
        id: dbUser.id,
        username: dbUser.username,
        displayName: dbUser.display_name || dbUser.username,
        avatarUrl: dbUser.avatar_url,
        bio: dbUser.bio,
        region: dbUser.region,
    };
}
```

In `mappers.ts:44-51`, `mapUserToDatabase`:

```ts
export function mapUserToDatabase(user: Partial<User>): Partial<DBUser> {
    return {
        username: user.username,
        display_name: user.displayName,
        avatar_url: user.avatarUrl,
        bio: user.bio,
        region: user.region,
    };
}
```

**Step 4: Commit**

```
feat(user): add region to types and mappers
```

---

### Task 7: Add `region` to API Handler and DB Query

**Files:**

- Modify: `src/lib/api/handlers/user.handlers.ts:50,62-64`
- Modify: `src/lib/db/queries/user.queries.ts:247-253`

**Step 1: Update handler to accept `region`**

In `user.handlers.ts:50`:

```ts
let body: { displayName?: string; bio?: string; region?: string };
```

In `user.handlers.ts:62-64`, add region mapping:

```ts
const updates: { display_name?: string; bio?: string; region?: string } = {};
if (body.displayName !== undefined) updates.display_name = body.displayName;
if (body.bio !== undefined) updates.bio = body.bio;
if (body.region !== undefined) updates.region = body.region;
```

**Step 2: Update DB query to accept `region`**

In `user.queries.ts:247-253`, add `region` to the updates type:

```ts
export async function updateUser(
    userId: string,
    updates: {
        display_name?: string;
        bio?: string;
        avatar_url?: string;
        region?: string;
    }
): Promise<Result<User>> {
```

**Step 3: Commit**

```
feat(user): support region in profile update API
```

---

### Task 8: Add `region` to Client — Hook and SettingsModal

**Files:**

- Modify: `src/app/dashboard/hooks/use-user.ts:28,64-70`
- Modify: `src/app/dashboard/components/SettingsModal.tsx:237-254`

**Step 1: Update patchProfile to include region**

In `use-user.ts:28`:

```ts
async function patchProfile(userId: string, updates: Partial<Pick<User, 'displayName' | 'bio' | 'region'>>) {
```

In `use-user.ts:64-70`, update mutation type:

```ts
updates: Partial<Pick<User, 'displayName' | 'bio' | 'region'>>;
```

**Step 2: Add Region field to SettingsModal**

In `SettingsModal.tsx`, after the Bio `</div>` (around line 247), add:

```tsx
{
    /* Region */
}
<div className="space-y-2">
    <label className="text-sm font-medium text-dashboard-text-secondary">Region</label>
    <Input
        value={tempUser.region || ''}
        onChange={(e) => setTempUser({ ...tempUser, region: e.target.value })}
        placeholder="e.g. Seoul, South Korea"
        className="border-dashboard-border bg-dashboard-bg-card text-dashboard-text placeholder:text-dashboard-text-placeholder"
    />
</div>;
```

**Step 3: Update handleSave to include region**

Find where `handleSave` passes updates (around line 102-116) and add `region`:

```ts
{ displayName: tempUser.displayName, bio: tempUser.bio, region: tempUser.region }
```

**Step 4: Display region in BioDesignPanel**

In `BioDesignPanel.tsx`, after the bio display (around line 123), add:

```tsx
{
    user.region && <p className="text-xs text-dashboard-text-placeholder">{user.region}</p>;
}
```

**Step 5: Verify**

Run: `npm run dev`
Check: SettingsModal shows Region field. Save works. BioDesignPanel shows region.

**Step 6: Commit**

```
feat(user): add region field to profile settings and display
```

---

### Task 9: Final Visual QA

**Step 1: Full visual check**

- [ ] Main container has subtle glass effect
- [ ] Dropdowns have backdrop blur
- [ ] Dialogs have backdrop blur
- [ ] CommandPalette has backdrop blur + TypeBadge icons
- [ ] EntryDetailView shows breadcrumb, not back bar
- [ ] CreateEntryPanel shows breadcrumb
- [ ] Settings modal shows Region field
- [ ] BioDesignPanel shows region text
- [ ] No hardcoded `bg-white` in dashboard components

**Step 2: Run type check**

Run: `npx tsc --noEmit`

**Step 3: Run existing tests**

Run: `npx vitest run`
