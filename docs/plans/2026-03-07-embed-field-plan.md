# EmbedField Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add URL parsing and iframe preview to EmbedField in the dashboard editor.

**Architecture:** Client-side URL pattern matching with a provider registry. `parseEmbedUrl(url)` matches against registered providers (YouTube, SoundCloud) and returns embed URL + dimensions. EmbedField renders an iframe preview below the URL input.

**Tech Stack:** TypeScript, React, Vitest (tests)

---

### Task 1: Create embed types

**Files:**

- Create: `src/lib/embed/types.ts`

**Step 1: Create the types file**

```typescript
export interface EmbedProvider {
    name: string;
    displayName: string;
    regex: RegExp[];
    toEmbedUrl: (match: RegExpMatchArray) => string;
    dimensions: { aspectRatio: string } | { height: number };
}

export interface ParsedEmbed {
    provider: string;
    displayName: string;
    embedUrl: string;
    dimensions: { aspectRatio: string } | { height: number };
}
```

**Step 2: Commit**

```bash
git add src/lib/embed/types.ts
git commit -m "feat(embed): add EmbedProvider and ParsedEmbed types"
```

---

### Task 2: Create provider definitions

**Files:**

- Create: `src/lib/embed/providers.ts`
- Reference: `src/lib/embed/types.ts`

**Step 1: Create providers file with YouTube and SoundCloud**

```typescript
import type { EmbedProvider } from './types';

export const youtube: EmbedProvider = {
    name: 'youtube',
    displayName: 'YouTube',
    regex: [/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]+)/, /youtu\.be\/([\w-]+)/],
    toEmbedUrl: (match) => `https://www.youtube.com/embed/${match[1]}`,
    dimensions: { aspectRatio: '16/9' },
};

export const soundcloud: EmbedProvider = {
    name: 'soundcloud',
    displayName: 'SoundCloud',
    regex: [/(soundcloud\.com\/[\w-]+\/[\w-]+)/],
    toEmbedUrl: (match) =>
        `https://w.soundcloud.com/player/?url=https://${match[1]}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`,
    dimensions: { height: 166 },
};

export const providers: EmbedProvider[] = [youtube, soundcloud];
```

**Step 2: Commit**

```bash
git add src/lib/embed/providers.ts
git commit -m "feat(embed): add YouTube and SoundCloud provider definitions"
```

---

### Task 3: Create parseEmbedUrl with tests

**Files:**

- Create: `src/lib/embed/parse.ts`
- Create: `src/lib/embed/__tests__/parse.test.ts`
- Create: `src/lib/embed/index.ts`

**Step 1: Write the tests**

```typescript
// src/lib/embed/__tests__/parse.test.ts
import { describe, expect, it } from 'vitest';

import { parseEmbedUrl } from '../parse';

describe('parseEmbedUrl', () => {
    describe('YouTube', () => {
        it('parses youtube.com/watch?v=ID', () => {
            const result = parseEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
            expect(result).toEqual({
                provider: 'youtube',
                displayName: 'YouTube',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                dimensions: { aspectRatio: '16/9' },
            });
        });

        it('parses youtu.be/ID', () => {
            const result = parseEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
            expect(result).toEqual({
                provider: 'youtube',
                displayName: 'YouTube',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                dimensions: { aspectRatio: '16/9' },
            });
        });

        it('parses youtube.com/embed/ID', () => {
            const result = parseEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
            expect(result).toEqual({
                provider: 'youtube',
                displayName: 'YouTube',
                embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                dimensions: { aspectRatio: '16/9' },
            });
        });

        it('handles extra query params', () => {
            const result = parseEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30');
            expect(result?.provider).toBe('youtube');
            expect(result?.embedUrl).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
        });
    });

    describe('SoundCloud', () => {
        it('parses soundcloud.com/user/track', () => {
            const result = parseEmbedUrl('https://soundcloud.com/artist-name/track-name');
            expect(result).not.toBeNull();
            expect(result?.provider).toBe('soundcloud');
            expect(result?.displayName).toBe('SoundCloud');
            expect(result?.embedUrl).toContain('w.soundcloud.com/player');
            expect(result?.embedUrl).toContain('soundcloud.com%2Fartist-name%2Ftrack-name');
            expect(result?.dimensions).toEqual({ height: 166 });
        });
    });

    describe('unsupported URLs', () => {
        it('returns null for unsupported URL', () => {
            expect(parseEmbedUrl('https://example.com')).toBeNull();
        });

        it('returns null for empty string', () => {
            expect(parseEmbedUrl('')).toBeNull();
        });

        it('returns null for non-URL text', () => {
            expect(parseEmbedUrl('not a url')).toBeNull();
        });
    });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/embed/__tests__/parse.test.ts`
Expected: FAIL (module not found)

**Step 3: Implement parseEmbedUrl**

```typescript
// src/lib/embed/parse.ts
import { providers } from './providers';
import type { ParsedEmbed } from './types';

export function parseEmbedUrl(url: string): ParsedEmbed | null {
    if (!url) return null;

    for (const provider of providers) {
        for (const regex of provider.regex) {
            const match = url.match(regex);
            if (match) {
                return {
                    provider: provider.name,
                    displayName: provider.displayName,
                    embedUrl: provider.toEmbedUrl(match),
                    dimensions: provider.dimensions,
                };
            }
        }
    }

    return null;
}
```

```typescript
// src/lib/embed/index.ts
export { parseEmbedUrl } from './parse';
export type { EmbedProvider, ParsedEmbed } from './types';
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/embed/__tests__/parse.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/lib/embed/
git commit -m "feat(embed): add parseEmbedUrl with YouTube and SoundCloud support"
```

---

### Task 4: Update EmbedField with iframe preview

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/shared-fields/EmbedField.tsx`

**Context:**

- Current EmbedField takes `FieldComponentProps<string>` (just URL string)
- It's wrapped in `SyncedField` with `URL_FIELD_CONFIG` in CustomEntryEditor
- `SyncedField` injects `value` and `onChange` via `cloneElement`
- We need to keep the value type as `string` (URL) since that's what SyncedField passes
- Provider detection happens inside the component via `parseEmbedUrl`

**Step 1: Update EmbedField**

```tsx
'use client';

import { useMemo } from 'react';

import { ExternalLink, Link2 } from 'lucide-react';

import { parseEmbedUrl } from '@/lib/embed';

import type { FieldComponentProps } from './types';

interface EmbedFieldProps extends FieldComponentProps<string> {
    placeholder?: string;
}

export default function EmbedField({
    value = '',
    onChange,
    disabled,
    placeholder = 'Paste URL (SoundCloud, YouTube, etc.)',
}: EmbedFieldProps) {
    const parsed = useMemo(() => parseEmbedUrl(value), [value]);

    return (
        <div className="space-y-2">
            {/* URL Input */}
            <div className="flex items-center gap-2 rounded-lg border border-dashboard-border bg-dashboard-bg-muted p-3">
                <Link2 className="h-4 w-4 shrink-0 text-dashboard-text-muted" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full border-none bg-transparent p-0 text-sm text-dashboard-text outline-none placeholder:text-dashboard-text-placeholder"
                />
            </div>

            {/* Preview */}
            {value && parsed && (
                <div className="overflow-hidden rounded-lg border border-dashboard-border">
                    <div className="flex items-center gap-1.5 border-b border-dashboard-border bg-dashboard-bg-muted px-3 py-1.5">
                        <span className="text-xs font-medium text-dashboard-text-secondary">
                            {parsed.displayName}
                        </span>
                    </div>
                    {'aspectRatio' in parsed.dimensions ? (
                        <div style={{ aspectRatio: parsed.dimensions.aspectRatio }}>
                            <iframe
                                src={parsed.embedUrl}
                                className="h-full w-full"
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                                title={`${parsed.displayName} embed`}
                            />
                        </div>
                    ) : (
                        <iframe
                            src={parsed.embedUrl}
                            style={{ height: parsed.dimensions.height }}
                            className="w-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title={`${parsed.displayName} embed`}
                        />
                    )}
                </div>
            )}

            {/* Unsupported URL fallback — clickable link */}
            {value && !parsed && (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-dashboard-border px-3 py-2 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="truncate">{value}</span>
                </a>
            )}
        </div>
    );
}
```

**Step 2: Verify it works visually**

Open the dashboard, add a Custom entry, add an Embed block, paste a YouTube or SoundCloud URL. Verify:

- YouTube URL shows 16:9 iframe preview
- SoundCloud URL shows 166px height iframe preview
- Random URL shows clickable link
- Empty input shows just the input

**Step 3: Commit**

```bash
git add src/app/dashboard/components/ContentPanel/shared-fields/EmbedField.tsx
git commit -m "feat(embed): add iframe preview to EmbedField"
```

---

### Task 5: Auto-save provider to EmbedBlockData

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/detail-views/CustomEntryEditor.tsx:126-136`

**Context:**

- Currently the embed block renderer saves only `url` via `onChange({ ...d, url: v })`
- We want to also save `provider` when the URL is parsed successfully
- The `SyncedField` `onSave` callback receives the URL string from the EmbedField
- We run `parseEmbedUrl` in the `onSave` callback to extract provider

**Step 1: Update embed block renderer**

Change the embed entry in `BLOCK_RENDERERS` (line 126-136) to:

```tsx
embed: ({ data, onChange, disabled }) => {
    const d = data as SectionBlockDataMap['embed'];
    return (
        <SyncedField
            config={URL_FIELD_CONFIG}
            value={d.url}
            onSave={(v) => {
                const parsed = parseEmbedUrl(v);
                onChange({ url: v, provider: parsed?.provider });
            }}
        >
            <EmbedField disabled={disabled} />
        </SyncedField>
    );
},
```

Add import at top of file:

```typescript
import { parseEmbedUrl } from '@/lib/embed';
```

**Step 2: Verify provider is saved**

In dashboard, add embed block, paste YouTube URL, check that the block data includes `provider: 'youtube'` (inspect via React DevTools or check network request).

**Step 3: Commit**

```bash
git add src/app/dashboard/components/ContentPanel/detail-views/CustomEntryEditor.tsx
git commit -m "feat(embed): auto-save provider name on URL change"
```
