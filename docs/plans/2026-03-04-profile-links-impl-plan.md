# Profile Links Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bio & Design 섹션에 프로필 링크 기능 추가. pages.links JSONB 배열로 소셜/플랫폼 링크를 관리하고, 기존 users.instagram/soundcloud를 대체한다.

**Architecture:** pages 테이블에 links JSONB 칼럼 추가 → 4-layer 아키텍처(DB → Handler → Route → Client) 순서로 확장 → 대시보드 LinksSection 컴포넌트에서 RHF+Zod 검증 → 공개 페이지 SocialLinks 리팩토링.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase, TanStack Query, Zustand, Zod, React Hook Form, Radix DropdownMenu

---

## Task 1: Database Migration

**Files:**

- Supabase migration (via MCP `apply_migration`)

**Step 1: Apply migration — add links column to pages**

```sql
ALTER TABLE pages ADD COLUMN links JSONB DEFAULT '[]';
```

Apply via `mcp__supabase__apply_migration` with name `add_links_to_pages`.

**Step 2: Apply migration — migrate existing data and drop old columns**

```sql
-- Migrate instagram/soundcloud from users to pages.links
UPDATE pages p
SET links = (
  SELECT COALESCE(jsonb_agg(link ORDER BY link->>'type'), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object('type', 'instagram', 'url', 'https://instagram.com/' || REPLACE(u.instagram, '@', '')) AS link
    FROM users u WHERE u.id = p.user_id AND u.instagram IS NOT NULL AND u.instagram != ''
    UNION ALL
    SELECT jsonb_build_object('type', 'soundcloud', 'url', 'https://soundcloud.com/' || u.soundcloud)
    FROM users u WHERE u.id = p.user_id AND u.soundcloud IS NOT NULL AND u.soundcloud != ''
  ) sub
)
WHERE EXISTS (
  SELECT 1 FROM users u
  WHERE u.id = p.user_id
  AND (
    (u.instagram IS NOT NULL AND u.instagram != '')
    OR (u.soundcloud IS NOT NULL AND u.soundcloud != '')
  )
);

-- Drop old columns
ALTER TABLE users DROP COLUMN IF EXISTS instagram;
ALTER TABLE users DROP COLUMN IF EXISTS soundcloud;
```

Apply via `mcp__supabase__apply_migration` with name `migrate_social_links_to_pages`.

**Step 3: Verify migration**

Run `mcp__supabase__execute_sql`:

```sql
SELECT id, links FROM pages LIMIT 5;
```

**Step 4: Commit**

```bash
git commit --allow-empty -m "chore(db): migrate social links from users to pages.links JSONB"
```

---

## Task 2: Types & Validation Schemas

**Files:**

- Modify: `src/types/database.ts:9-21` (User), `src/types/database.ts:23-34` (Page)
- Modify: `src/types/domain.ts:4-10` (PageSettings), `src/types/domain.ts:13-21` (User), `src/types/domain.ts:24-32` (Page)
- Modify: `src/types/index.ts` (re-exports if needed)
- Create: `src/lib/validations/profile-link.schemas.ts`
- Create: `src/app/dashboard/config/profileLinksConfig.ts`

**Step 1: Update database.ts — add ProfileLinkData, update Page, update User**

In `src/types/database.ts`:

1. Add before the Page interface:

```typescript
export interface ProfileLinkData {
    type: string;
    url: string;
    label?: string;
}
```

2. Add to `Page` interface:

```typescript
links?: ProfileLinkData[];
```

3. Remove from `User` interface:

```typescript
// DELETE these lines:
instagram?: string;
soundcloud?: string;
```

**Step 2: Update domain.ts — add ProfileLink types, update PageSettings, User, Page**

In `src/types/domain.ts`:

1. Add after HeaderStyle:

```typescript
export type ProfileLinkType =
    | 'instagram'
    | 'bandcamp'
    | 'spotify'
    | 'apple_music'
    | 'soundcloud'
    | 'region'
    | 'custom';

export interface ProfileLink {
    type: ProfileLinkType;
    url: string;
    label?: string;
}
```

2. Add `links` to `PageSettings`:

```typescript
export interface PageSettings {
    headerStyle: HeaderStyle;
    links: ProfileLink[];
}
```

3. Remove from `User`:

```typescript
// DELETE these lines:
instagram?: string;
soundcloud?: string;
```

4. Add to `Page`:

```typescript
links: ProfileLink[];
```

**Step 3: Create Zod schema — `src/lib/validations/profile-link.schemas.ts`**

```typescript
import { z } from 'zod';

export const PROFILE_LINK_TYPES = [
    'instagram',
    'bandcamp',
    'spotify',
    'apple_music',
    'soundcloud',
    'region',
    'custom',
] as const;

export const profileLinkSchema = z
    .object({
        type: z.enum(PROFILE_LINK_TYPES),
        url: z.string().url('유효한 URL을 입력해 주세요'),
        label: z.string().max(50).optional(),
    })
    .refine((data) => data.type !== 'custom' || (data.label && data.label.trim().length > 0), {
        message: '커스텀 링크에는 라벨이 필요합니다',
        path: ['label'],
    });

export const profileLinksArraySchema = z.array(profileLinkSchema).max(20);

export type ProfileLinkFormData = z.infer<typeof profileLinkSchema>;
```

**Step 4: Create platform config — `src/app/dashboard/config/profileLinksConfig.ts`**

```typescript
import type { ProfileLinkType } from '@/types/domain';

export interface PlatformPreset {
    type: ProfileLinkType;
    label: string;
    placeholder: string;
}

export const PLATFORM_PRESETS: PlatformPreset[] = [
    { type: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
    { type: 'bandcamp', label: 'Bandcamp', placeholder: 'https://__.bandcamp.com' },
    { type: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/...' },
    { type: 'apple_music', label: 'Apple Music', placeholder: 'https://music.apple.com/...' },
    { type: 'soundcloud', label: 'SoundCloud', placeholder: 'https://soundcloud.com/...' },
    { type: 'region', label: 'Region', placeholder: 'URL' },
    { type: 'custom', label: 'Custom Link', placeholder: 'https://...' },
];

export function getPlatformLabel(type: ProfileLinkType): string {
    return PLATFORM_PRESETS.find((p) => p.type === type)?.label ?? type;
}

export function getPlatformPlaceholder(type: ProfileLinkType): string {
    return PLATFORM_PRESETS.find((p) => p.type === type)?.placeholder ?? 'https://...';
}
```

**Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: Type errors in files that still reference `user.instagram`/`user.soundcloud` — these are addressed in later tasks.

**Step 6: Commit**

```bash
git add src/types/database.ts src/types/domain.ts src/lib/validations/profile-link.schemas.ts src/app/dashboard/config/profileLinksConfig.ts
git commit -m "feat(types): add ProfileLink types, Zod schema, and platform config"
```

---

## Task 3: Backend Layers (DB → Handler)

**Files:**

- Modify: `src/lib/db/queries/page.queries.ts:35-39` (UpdatePageInput), `src/lib/db/queries/page.queries.ts:41-67` (updatePage)
- Modify: `src/lib/api/handlers/page.handlers.ts` (entire file — extend updatePageSchema + handler)
- Modify: `src/lib/mappers.ts:32-53` (User mappers)

**Step 1: Extend page.queries.ts — add links to UpdatePageInput**

In `src/lib/db/queries/page.queries.ts`:

1. Add import:

```typescript
import type { ProfileLinkData } from '@/types/database';
```

2. Update `UpdatePageInput`:

```typescript
export interface UpdatePageInput {
    theme?: string;
    is_public?: boolean;
    header_style?: string;
    links?: ProfileLinkData[];
}
```

3. Add to `updatePage` function body (after the `header_style` line):

```typescript
if (input.links !== undefined) updateData.links = input.links;
```

**Step 2: Extend page.handlers.ts — add links validation to schema**

In `src/lib/api/handlers/page.handlers.ts`:

1. Add import:

```typescript
import { profileLinksArraySchema } from '@/lib/validations/profile-link.schemas';
```

2. Update `updatePageSchema` to include `links`:

```typescript
const updatePageSchema = z
    .object({
        theme: z.string().max(50).optional(),
        is_public: z.boolean().optional(),
        header_style: z.enum(VALID_HEADER_STYLES).optional(),
        links: profileLinksArraySchema.optional(),
    })
    .refine(
        (data) =>
            data.theme !== undefined ||
            data.is_public !== undefined ||
            data.header_style !== undefined ||
            data.links !== undefined,
        {
            message: 'theme, is_public, header_style, links 중 하나 이상 필요합니다',
        }
    );
```

3. Update the destructure and DB call:

```typescript
const { theme, is_public, header_style, links } = parsed.data;

const result = await updatePage(id, { theme, is_public, header_style, links });
```

**Step 3: Update mappers.ts — remove instagram/soundcloud from User mappers**

In `src/lib/mappers.ts`:

1. `mapUserToDomain`: Remove `instagram` and `soundcloud` lines
2. `mapUserToDatabase`: Remove `instagram` and `soundcloud` lines

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 5: Commit**

```bash
git add src/lib/db/queries/page.queries.ts src/lib/api/handlers/page.handlers.ts src/lib/mappers.ts
git commit -m "feat(api): extend page PATCH to support links JSONB field"
```

---

## Task 4: Service Layer & Editor Data

**Files:**

- Modify: `src/lib/services/user.service.ts:22-28` (buildPageSettings), `src/lib/services/user.service.ts:189-227` (PublicPageData, getPublicPageData)
- Modify: `src/app/dashboard/hooks/use-editor-data.ts:31-34` (PageMeta), `src/app/dashboard/hooks/use-editor-data.ts:54-61` (fetchPageMeta)

**Step 1: Update user.service.ts — extend buildPageSettings with links**

In `src/lib/services/user.service.ts`:

1. Add import:

```typescript
import type { ProfileLink } from '@/types/domain';
```

2. Update `DEFAULT_PAGE_SETTINGS`:

```typescript
const DEFAULT_PAGE_SETTINGS: PageSettings = { headerStyle: 'minimal', links: [] };
```

3. Update `buildPageSettings`:

```typescript
function buildPageSettings(dbPage?: { header_style?: string; links?: unknown[] }): PageSettings {
    return {
        headerStyle: (dbPage?.header_style as HeaderStyle) ?? 'minimal',
        links: (dbPage?.links as ProfileLink[]) ?? [],
    };
}
```

**Step 2: Update use-editor-data.ts — extend PageMeta fetch**

In `src/app/dashboard/hooks/use-editor-data.ts`:

The `PageMeta` type already derives from `PageSettings` which now includes `links`. Verify that `fetchPageMeta` passes through the `links` data correctly. The server already returns `pageSettings` which now includes `links` from `buildPageSettings`. No code change needed here — just verify.

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 4: Commit**

```bash
git add src/lib/services/user.service.ts
git commit -m "feat(service): include links in PageSettings from DB"
```

---

## Task 5: Client Mutation Hook

**Files:**

- Modify: `src/app/dashboard/hooks/use-page.ts:19-26` (patchPage), `src/app/dashboard/hooks/use-page.ts:32-57` (usePageMutations)

**Step 1: Extend use-page.ts — add updateLinks mutation**

In `src/app/dashboard/hooks/use-page.ts`:

1. Add import:

```typescript
import type { HeaderStyle, ProfileLink } from '@/types';
```

2. Extend `patchPage` input type:

```typescript
async function patchPage(
    pageId: string,
    updates: { header_style?: HeaderStyle; links?: ProfileLink[] }
): Promise<void> {
    const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update page');
}
```

3. Add `updateLinks` mutation inside `usePageMutations`:

```typescript
const updateLinks = useMutation({
    mutationFn: ({ pageId, links }: { pageId: string; links: ProfileLink[] }) =>
        patchPage(pageId, { links }),
    onMutate: async ({ links }) => {
        await queryClient.cancelQueries({ queryKey: pageKeys.all });
        const previous = queryClient.getQueryData<PageMeta>(pageKeys.all);
        if (previous) {
            queryClient.setQueryData<PageMeta>(pageKeys.all, {
                ...previous,
                pageSettings: { ...previous.pageSettings, links },
            });
        }
        return { previous };
    },
    onError: (_err, _vars, ctx) => {
        if (ctx?.previous) {
            queryClient.setQueryData(pageKeys.all, ctx.previous);
        }
    },
});

return { updateHeaderStyle, updateLinks };
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add src/app/dashboard/hooks/use-page.ts
git commit -m "feat(hooks): add updateLinks mutation with optimistic update"
```

---

## Task 6: Dashboard LinksSection Component

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/LinksSection.tsx`
- Modify: `src/app/dashboard/components/ContentPanel/BioDesignPanel.tsx`

**Step 1: Create LinksSection component**

Create `src/app/dashboard/components/ContentPanel/LinksSection.tsx`:

```typescript
'use client';

import { useState, useRef } from 'react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react';

import type { ProfileLink, ProfileLinkType } from '@/types/domain';
import { useDebounce } from '@/hooks/useDebounce';
import { profileLinkSchema, type ProfileLinkFormData } from '@/lib/validations/profile-link.schemas';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
    PLATFORM_PRESETS,
    getPlatformLabel,
    getPlatformPlaceholder,
} from '../../config/profileLinksConfig';

interface LinksSectionProps {
    links: ProfileLink[];
    onSave: (links: ProfileLink[]) => void;
}

export default function LinksSection({ links, onSave }: LinksSectionProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const urlInputRef = useRef<HTMLInputElement>(null);

    const debouncedSave = useDebounce((updatedLinks: ProfileLink[]) => {
        onSave(updatedLinks);
    }, 500);

    // Filter out already-added preset platforms (allow multiple custom)
    const availablePlatforms = PLATFORM_PRESETS.filter(
        (preset) => preset.type === 'custom' || !links.some((link) => link.type === preset.type)
    );

    const handleAddLink = (type: ProfileLinkType) => {
        const newLink: ProfileLink = { type, url: '' };
        if (type === 'custom') {
            newLink.label = '';
        }
        const updated = [...links, newLink];
        setEditingIndex(updated.length - 1);
        // Don't save yet — user needs to enter URL first
        // Optimistically update the local state via parent
        onSave(updated);
        // Focus URL input after render
        setTimeout(() => urlInputRef.current?.focus(), 50);
    };

    const handleRemoveLink = (index: number) => {
        const updated = links.filter((_, i) => i !== index);
        onSave(updated);
        if (editingIndex === index) setEditingIndex(null);
    };

    const handleUpdateLink = (index: number, field: keyof ProfileLink, value: string) => {
        const updated = links.map((link, i) =>
            i === index ? { ...link, [field]: value } : link
        );
        debouncedSave(updated);
    };

    return (
        <section>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex w-full items-center gap-2 text-left"
            >
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-dashboard-text-muted" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-dashboard-text-muted" />
                )}
                <h3 className="text-sm font-semibold uppercase tracking-wide text-dashboard-text-placeholder">
                    Links
                </h3>
            </button>

            {isOpen && (
                <div className="mt-4 space-y-3">
                    {/* Link List */}
                    {links.map((link, index) => (
                        <LinkRow
                            key={`${link.type}-${index}`}
                            link={link}
                            isEditing={editingIndex === index}
                            urlInputRef={editingIndex === index ? urlInputRef : undefined}
                            onFocus={() => setEditingIndex(index)}
                            onUpdate={(field, value) => handleUpdateLink(index, field, value)}
                            onRemove={() => handleRemoveLink(index)}
                        />
                    ))}

                    {/* Add Link Button */}
                    {availablePlatforms.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-1.5 text-sm text-dashboard-text-muted hover:text-dashboard-text">
                                    <Plus className="h-3.5 w-3.5" />
                                    링크 추가
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {availablePlatforms.map((preset) => (
                                    <DropdownMenuItem
                                        key={preset.type}
                                        onClick={() => handleAddLink(preset.type)}
                                    >
                                        {preset.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            )}
        </section>
    );
}

// ── Sub-component: LinkRow ──

interface LinkRowProps {
    link: ProfileLink;
    isEditing: boolean;
    urlInputRef?: React.Ref<HTMLInputElement>;
    onFocus: () => void;
    onUpdate: (field: keyof ProfileLink, value: string) => void;
    onRemove: () => void;
}

function LinkRow({ link, isEditing, urlInputRef, onFocus, onUpdate, onRemove }: LinkRowProps) {
    const {
        register,
        formState: { errors },
    } = useForm<ProfileLinkFormData>({
        resolver: zodResolver(profileLinkSchema),
        defaultValues: { type: link.type, url: link.url, label: link.label },
        mode: 'onChange',
    });

    const label = link.type === 'custom' ? link.label || 'Custom' : getPlatformLabel(link.type);
    const placeholder = getPlatformPlaceholder(link.type);

    return (
        <div className="flex items-center gap-2 rounded border border-dashboard-border px-3 py-2">
            {/* Platform label */}
            <span className="w-24 flex-shrink-0 text-xs font-medium uppercase tracking-wide text-dashboard-text-muted">
                {label}
            </span>

            {/* Custom label input */}
            {link.type === 'custom' && (
                <Input
                    value={link.label || ''}
                    onChange={(e) => onUpdate('label', e.target.value)}
                    onFocus={onFocus}
                    placeholder="Label"
                    className="h-7 w-24 border-dashboard-border bg-transparent text-xs text-dashboard-text placeholder:text-dashboard-text-placeholder"
                />
            )}

            {/* URL input */}
            <Input
                ref={urlInputRef}
                value={link.url}
                onChange={(e) => onUpdate('url', e.target.value)}
                onFocus={onFocus}
                placeholder={placeholder}
                className="h-7 flex-1 border-dashboard-border bg-transparent text-xs text-dashboard-text placeholder:text-dashboard-text-placeholder"
            />

            {/* Validation error */}
            {errors.url && (
                <span className="text-xs text-red-500">{errors.url.message}</span>
            )}

            {/* Remove button */}
            <button
                onClick={onRemove}
                className="flex-shrink-0 text-dashboard-text-muted hover:text-red-500"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
```

**Step 2: Update BioDesignPanel.tsx — add LinksSection**

In `src/app/dashboard/components/ContentPanel/BioDesignPanel.tsx`:

1. Add import:

```typescript
import LinksSection from './LinksSection';
```

2. Add hooks usage (after existing hooks):

```typescript
const { updateLinks } = usePageMutations();
```

Note: `usePageMutations` is already imported and used. Just destructure `updateLinks` alongside `updateHeaderStyle`.

3. Add `handleLinksChange` function:

```typescript
const handleLinksChange = (links: ProfileLink[]) => {
    if (pageId) {
        updateLinks.mutate({ pageId, links });
    }
};
```

4. Add `LinksSection` between Profile section and HeaderStyleSection:

```tsx
{
    /* Links Section */
}
<LinksSection links={pageMeta.pageSettings.links} onSave={handleLinksChange} />;
```

5. Add import for `ProfileLink`:

```typescript
import type { ProfileLink, User } from '@/types';
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

**Step 4: Commit**

```bash
git add src/app/dashboard/components/ContentPanel/LinksSection.tsx src/app/dashboard/components/ContentPanel/BioDesignPanel.tsx
git commit -m "feat(dashboard): add LinksSection component to BioDesignPanel"
```

---

## Task 7: Public Page — Refactor SocialLinks & Headers

**Files:**

- Modify: `src/components/dna/headers/MinimalHeader.tsx:79-110` (SocialLinks)
- Modify: `src/components/dna/headers/MinimalHeader.tsx:41` (usage)
- Modify: `src/components/dna/headers/BannerHeader.tsx:62` (usage)
- Modify: `src/components/dna/headers/PortraitHeader.tsx:52-54` (usage)
- Modify: `src/components/dna/headers/ShapesHeader.tsx:72` (usage)
- Modify: `src/components/dna/headers/index.ts:11-14` (HeaderProps)
- Modify: `src/app/(dna)/[user]/components/UserPageContent.tsx:23-27` (Props), lines 71-78 (MetaTable)
- Modify: `src/app/(dna)/[user]/page.tsx:22-29` (pass links)
- Modify: `src/lib/services/user.service.ts:189-226` (PublicPageData)

**Step 1: Extend HeaderProps to include links**

In `src/components/dna/headers/index.ts`:

```typescript
import type { ContentEntry, ProfileLink, User } from '@/types';

export interface HeaderProps {
    user: User;
    entries: ContentEntry[];
    links: ProfileLink[];
}
```

**Step 2: Refactor SocialLinks in MinimalHeader.tsx**

Replace the existing `SocialLinks` component:

```typescript
export function SocialLinks({
    links,
    className,
}: {
    links: ProfileLink[];
    className?: string;
}) {
    if (links.length === 0) return null;

    const externalLinks = links
        .filter((link) => link.url)
        .map((link) => ({
            label: link.type === 'custom' ? (link.label || 'Link') : getPlatformLabel(link.type),
            href: link.url,
        }));

    if (externalLinks.length === 0) return null;

    return (
        <ExternalLinks
            links={externalLinks}
            className={className ?? 'mt-2 justify-center md:justify-start'}
        />
    );
}
```

Add imports:

```typescript
import type { ProfileLink } from '@/types/domain';
import { getPlatformLabel } from '@/app/dashboard/config/profileLinksConfig';
```

Note: `getPlatformLabel` import from dashboard config is not ideal for public page. Move it to a shared location:

Actually, move `getPlatformLabel` to a shared util. Create the function inline in SocialLinks instead to avoid cross-boundary import:

```typescript
const PLATFORM_LABELS: Record<string, string> = {
    instagram: 'Instagram',
    bandcamp: 'Bandcamp',
    spotify: 'Spotify',
    apple_music: 'Apple Music',
    soundcloud: 'SoundCloud',
    region: 'Region',
};
```

Use this inline map instead of importing from dashboard config.

**Step 3: Update SocialLinks usage in all headers**

In MinimalHeader.tsx (line ~41):

```typescript
<SocialLinks links={links} />
```

Props destructure:

```typescript
export function MinimalHeader({ user, entries, links }: HeaderProps) {
```

In BannerHeader.tsx (line ~62):

```typescript
export function BannerHeader({ user, entries, links }: HeaderProps) {
// ...
<SocialLinks links={links} />
```

In PortraitHeader.tsx (line ~52):

```typescript
export function PortraitHeader({ user, entries, links }: HeaderProps) {
// ...
<SocialLinks links={links} />
```

In ShapesHeader.tsx (line ~72):

```typescript
export function ShapesHeader({ user, entries, links }: HeaderProps) {
// ...
<SocialLinks links={links} />
```

**Step 4: Extend PublicPageData in user.service.ts**

Add `links` to `PublicPageData`:

```typescript
export interface PublicPageData {
    user: User;
    components: ContentEntry[];
    pageSettings: PageSettings;
}
```

`pageSettings` already includes `links` now (from Task 4), so no change needed here. The data flows through `buildPageSettings`.

**Step 5: Update page.tsx — pass links to UserPageContent**

In `src/app/(dna)/[user]/page.tsx`:

```typescript
const { user: userData, components, pageSettings } = result.data;

return (
    <UserPageContent
        user={userData}
        entries={components}
        headerStyle={pageSettings.headerStyle}
        links={pageSettings.links}
    />
);
```

**Step 6: Update UserPageContent — accept links prop, pass to header, fix MetaTable**

In `src/app/(dna)/[user]/components/UserPageContent.tsx`:

1. Update Props:

```typescript
import type { ProfileLink } from '@/types/domain';

interface Props {
    user: User;
    entries: ContentEntry[];
    headerStyle?: HeaderStyle;
    links?: ProfileLink[];
}
```

2. Destructure and pass to header:

```typescript
export default function UserPageContent({
    user,
    entries,
    headerStyle = 'minimal',
    links = [],
}: Props) {
    // ...
    return (
        // ...
        <HeaderComponent user={user} entries={entries} links={links} />
        // ...
    );
}
```

3. Update MetaTable — remove Instagram/SoundCloud rows, add Links count:

```typescript
<MetaTable
    items={[
        { key: 'Username', value: user.username },
        { key: 'Display Name', value: user.displayName },
        { key: 'Links', value: String(links.length) },
        { key: 'Entries', value: String(entries.length) },
        { key: 'Status', value: 'ACTIVE' },
    ]}
/>
```

**Step 7: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors.

**Step 8: Commit**

```bash
git add src/components/dna/headers/ src/app/\(dna\)/\[user\]/ src/lib/services/user.service.ts
git commit -m "feat(public): refactor SocialLinks to use page.links array"
```

---

## Task 8: Cleanup & Verify

**Files:**

- Check: all files referencing `user.instagram` or `user.soundcloud`
- Modify: `src/types/database.ts` (Artist interface still has instagram/soundcloud — keep, it's different)

**Step 1: Search for stale references**

```bash
grep -rn "user\.instagram\|user\.soundcloud" src/ --include="*.ts" --include="*.tsx"
```

Fix any remaining references. Note: `Artist` type has its own `instagram`/`soundcloud` — these are independent and should remain.

**Step 2: Full TypeScript check**

```bash
npx tsc --noEmit
```

**Step 3: Run dev server and verify**

```bash
npm run dev
```

Manually test:

1. Dashboard: Bio Design panel → Links section visible
2. Add Instagram link → enters URL → saves
3. Add custom link → enters label + URL → saves
4. Remove a link → disappears
5. Public page: links appear in header

**Step 4: Run Supabase advisors**

Check for security/performance issues after schema changes.

**Step 5: Final commit**

```bash
git add -A
git commit -m "fix: clean up stale instagram/soundcloud references"
```

---

## Summary

| Task | Description        | Key Files                                                              |
| ---- | ------------------ | ---------------------------------------------------------------------- |
| 1    | DB Migration       | Supabase MCP                                                           |
| 2    | Types & Validation | database.ts, domain.ts, profile-link.schemas.ts, profileLinksConfig.ts |
| 3    | Backend Layers     | page.queries.ts, page.handlers.ts, mappers.ts                          |
| 4    | Service Layer      | user.service.ts, use-editor-data.ts                                    |
| 5    | Client Mutation    | use-page.ts                                                            |
| 6    | Dashboard UI       | LinksSection.tsx, BioDesignPanel.tsx                                   |
| 7    | Public Page        | SocialLinks, all headers, UserPageContent, page.tsx                    |
| 8    | Cleanup & Verify   | stale references, tsc, manual test                                     |
