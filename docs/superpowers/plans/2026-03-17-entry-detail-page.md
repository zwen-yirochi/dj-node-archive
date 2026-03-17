# Entry Detail Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자 공개 페이지에서 self-contained Event, Mixset, Custom 엔트리의 상세 페이지를 `/:user/:slug` 라우트로 구현한다.

**Architecture:** 설정 객체(`entryDetailConfig`)가 엔트리 타입별 렌더링 구성을 선언하고, `EntryDetailShell`이 이를 기반으로 범용 렌더러 컴포넌트를 조합한다. Slug 기반 URL로 접근하며, DB에 slug 컬럼을 추가한다. 4-layer 아키텍처(Database → Service → Route → Component)를 따른다.

**Tech Stack:** Next.js 16 (App Router) · TypeScript · Supabase · Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-17-entry-detail-page-design.md`
**ADR:** `docs/ADR/0001~0004`

---

## File Structure

### 신규 파일

| 파일                                                                | 역할                                    |
| ------------------------------------------------------------------- | --------------------------------------- |
| `src/lib/utils/slug.ts`                                             | slug 생성/유일성 유틸                   |
| `src/lib/utils/__tests__/slug.test.ts`                              | slug 유틸 테스트                        |
| `src/components/dna/DnaBreadcrumb.tsx`                              | 범용 breadcrumb                         |
| `src/components/dna/EntryDetailShell.tsx`                           | 상세 페이지 공통 쉘 (DnaPageShell 래핑) |
| `src/components/dna/entry-detail/entry-detail.config.ts`            | 타입별 설정 객체                        |
| `src/components/dna/entry-detail/CoverImage.tsx`                    | 히어로 커버 이미지 렌더러               |
| `src/components/dna/entry-detail/MetaSection.tsx`                   | 메타 정보 섹션 (기존 MetaTable 활용)    |
| `src/components/dna/entry-detail/TracklistTimeline.tsx`             | Mixset 트랙리스트 타임라인              |
| `src/components/dna/entry-detail/ExternalLinks.tsx`                 | 외부 링크 목록                          |
| `src/components/dna/entry-detail/BlockRenderer.tsx`                 | Custom 블록 디스패처                    |
| `src/components/dna/entry-detail/block-views/HeaderBlockView.tsx`   | header 블록 뷰                          |
| `src/components/dna/entry-detail/block-views/RichtextBlockView.tsx` | richtext 블록 뷰 (Description 겸용)     |
| `src/components/dna/entry-detail/block-views/ImageBlockView.tsx`    | image 블록 뷰                           |
| `src/components/dna/entry-detail/block-views/EmbedBlockView.tsx`    | embed 블록 뷰                           |
| `src/components/dna/entry-detail/block-views/KeyvalueBlockView.tsx` | keyvalue 블록 뷰                        |
| `src/app/(dna)/[user]/[slug]/page.tsx`                              | 상세 페이지 라우트                      |
| `src/app/(dna)/[user]/[slug]/not-found.tsx`                         | 404 페이지                              |
| `supabase/migrations/XXXXXX_add_entry_slug.sql`                     | slug 컬럼 마이그레이션                  |

### 수정 파일

| 파일                                                             | 변경 내용                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| `src/lib/db/queries/entry.queries.ts`                            | `getEntryBySlug()` 추가                                    |
| `src/lib/services/user.service.ts`                               | `getEntryDetailData()` 추가                                |
| `src/types/database.ts`                                          | Entry 타입에 slug 추가                                     |
| `src/types/domain.ts`                                            | EntryBase에 slug 추가                                      |
| `src/lib/mappers.ts`                                             | mapEntryToDomain의 base 객체에 slug 매핑 추가              |
| `src/lib/utils/entry-link.ts`                                    | getEntryHref 공통 유틸 (신규)                              |
| `src/app/(dna)/[user]/components/section-views/ListView.tsx`     | 링크 로직 변경 + username prop                             |
| `src/app/(dna)/[user]/components/section-views/CarouselView.tsx` | 링크 로직 변경 + username prop                             |
| `src/app/(dna)/[user]/components/section-views/FeatureView.tsx`  | username prop 추가                                         |
| `src/app/(dna)/[user]/components/section-views/GridView.tsx`     | username prop 추가                                         |
| `src/app/(dna)/[user]/components/SectionRenderer.tsx`            | SectionViewProps에 username 추가, UserPageContent에서 전달 |
| `src/app/(dna)/[user]/components/UserPageContent.tsx`            | SectionRenderer에 username 전달                            |
| `src/components/dna/EntryCard.tsx`                               | 링크 로직 변경 + username prop                             |
| `src/lib/api/handlers/entry.handlers.ts`                         | 엔트리 생성 시 slug 자동 생성                              |
| `src/lib/db/queries/entry.queries.ts`                            | ensureUniqueSlug 추가 (서버 전용), CreateEntryInput에 slug |

### 삭제 파일

| 파일                              | 이유            |
| --------------------------------- | --------------- |
| `src/app/(dna)/[user]/[entryId]/` | `[slug]`로 교체 |

---

## Task 1: Slug 유틸리티

**Files:**

- Create: `src/lib/utils/slug.ts`
- Create: `src/lib/utils/__tests__/slug.test.ts`

- [ ] **Step 1: Write failing tests for `generateSlug`**

```typescript
// src/lib/utils/__tests__/slug.test.ts
import { describe, expect, it } from 'vitest';

import { generateSlug } from '../slug';

describe('generateSlug', () => {
    it('converts spaces to hyphens and lowercases', () => {
        expect(generateSlug('Sunset Mix 2026')).toBe('sunset-mix-2026');
    });

    it('removes special characters', () => {
        expect(generateSlug('Hello! @World #2026')).toBe('hello-world-2026');
    });

    it('preserves unicode characters (Korean)', () => {
        expect(generateSlug('서울의 밤')).toBe('서울의-밤');
    });

    it('preserves unicode characters (Japanese)', () => {
        expect(generateSlug('東京の夜')).toBe('東京の夜');
    });

    it('collapses multiple hyphens', () => {
        expect(generateSlug('hello---world')).toBe('hello-world');
    });

    it('trims leading/trailing hyphens', () => {
        expect(generateSlug('--hello--')).toBe('hello');
    });

    it('returns "untitled" for empty string', () => {
        expect(generateSlug('')).toBe('untitled');
    });

    it('returns "untitled" for whitespace-only', () => {
        expect(generateSlug('   ')).toBe('untitled');
    });

    it('returns "untitled" for special-chars-only', () => {
        expect(generateSlug('!@#$%')).toBe('untitled');
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/utils/__tests__/slug.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement `generateSlug`**

```typescript
// src/lib/utils/slug.ts

/**
 * title 기반 slug 생성.
 * 유니코드 유지, 특수문자 제거, 공백 → -, lowercase.
 */
export function generateSlug(title: string): string {
    const slug = title
        .trim()
        .toLowerCase()
        // 유니코드 문자(한글, 일본어 등), 알파벳, 숫자, 공백, 하이픈 유지. 나머지 제거.
        .replace(/[^\p{L}\p{N}\s-]/gu, '')
        // 공백 → 하이픈
        .replace(/\s+/g, '-')
        // 연속 하이픈 → 단일 하이픈
        .replace(/-+/g, '-')
        // 앞뒤 하이픈 제거
        .replace(/^-|-$/g, '');

    return slug || 'untitled';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/utils/__tests__/slug.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/slug.ts src/lib/utils/__tests__/slug.test.ts
git commit -m "feat: add generateSlug utility with unicode support"
```

---

## Task 2: DB 마이그레이션 — slug 컬럼

**Files:**

- Create: `supabase/migrations/XXXXXX_add_entry_slug.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/20260317000000_add_entry_slug.sql

-- Step 1: nullable로 추가
ALTER TABLE entries ADD COLUMN slug TEXT;

-- Step 2: unique 제약 (page_id 범위 내)
ALTER TABLE entries ADD CONSTRAINT entries_page_id_slug_unique UNIQUE (page_id, slug);
```

> Note: 백필은 application level에서 별도 스크립트로 처리. NOT NULL 제약은 백필 완료 후 추가.

- [ ] **Step 2: Update Entry type in database.ts**

`src/types/database.ts` — Entry 인터페이스에 slug 추가:

```typescript
// Entry 인터페이스 내 slug 필드 추가
slug: string | null;
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260317000000_add_entry_slug.sql src/types/database.ts
git commit -m "feat: add slug column to entries table"
```

---

## Task 3: DB 쿼리 — `getEntryBySlug`

**Files:**

- Modify: `src/lib/db/queries/entry.queries.ts`

- [ ] **Step 1: Add `getEntryBySlug` query**

기존 `getEntryById` 패턴을 따라 `entry.queries.ts` 끝에 추가:

```typescript
export async function getEntryBySlug(pageId: string, slug: string): Promise<Result<Entry>> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('entries')
            .select()
            .eq('page_id', pageId)
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return failure(createNotFoundError('엔트리를 찾을 수 없습니다.', 'entry'));
            }
            return failure(createDatabaseError(error.message, 'getEntryBySlug', error));
        }

        return success(data);
    } catch (err) {
        return failure(
            createDatabaseError('엔트리 조회 중 오류가 발생했습니다.', 'getEntryBySlug', err)
        );
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db/queries/entry.queries.ts
git commit -m "feat: add getEntryBySlug database query"
```

---

## Task 4: 서비스 레이어 — `getEntryDetailData`

**Files:**

- Modify: `src/lib/services/user.service.ts`

- [ ] **Step 1: Add `EntryDetailData` interface and `getEntryDetailData` function**

`user.service.ts` 끝에 추가:

```typescript
import { getEntryBySlug } from '@/lib/db/queries/entry.queries';

export interface EntryDetailData {
    user: User;
    entry: ContentEntry;
    username: string; // URL param 용
}

export const getEntryDetailData = cache(
    async (username: string, slug: string): Promise<Result<EntryDetailData>> => {
        const result = await findUserWithPages(username);

        if (!isSuccess(result)) {
            return result;
        }

        const dbData = result.data;
        const user = mapUserToDomain(dbData);
        const page = getFirstPage(dbData.pages);

        if (!page) {
            return failure(
                createNotFoundError(`'${username}'의 페이지를 찾을 수 없습니다.`, 'page')
            );
        }

        const entryResult = await getEntryBySlug(page.id, slug);

        if (!isSuccess(entryResult)) {
            return entryResult;
        }

        const entry = mapEntryToDomain(entryResult.data);

        return success({ user, entry, username });
    }
);
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/user.service.ts
git commit -m "feat: add getEntryDetailData service function"
```

---

## Task 5: DnaBreadcrumb 범용 컴포넌트

**Files:**

- Create: `src/components/dna/DnaBreadcrumb.tsx`

- [ ] **Step 1: Implement DnaBreadcrumb**

```typescript
// src/components/dna/DnaBreadcrumb.tsx
import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface DnaBreadcrumbProps {
    items: BreadcrumbItem[];
}

export function DnaBreadcrumb({ items }: DnaBreadcrumbProps) {
    return (
        <nav className="flex items-center gap-2 text-dna-label tracking-dna-system text-dna-ink-light">
            {items.map((item, i) => (
                <span key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="text-dna-ink-ghost">/</span>}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="uppercase text-dna-ink-light no-underline hover:text-dna-ink"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="uppercase text-dna-ink">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dna/DnaBreadcrumb.tsx
git commit -m "feat: add DnaBreadcrumb reusable component"
```

---

## Task 6: BlockView 컴포넌트들

**Files:**

- Create: `src/components/dna/entry-detail/block-views/HeaderBlockView.tsx`
- Create: `src/components/dna/entry-detail/block-views/RichtextBlockView.tsx`
- Create: `src/components/dna/entry-detail/block-views/ImageBlockView.tsx`
- Create: `src/components/dna/entry-detail/block-views/EmbedBlockView.tsx`
- Create: `src/components/dna/entry-detail/block-views/KeyvalueBlockView.tsx`

- [ ] **Step 1: HeaderBlockView**

```typescript
// src/components/dna/entry-detail/block-views/HeaderBlockView.tsx
import type { HeaderBlockData } from '@/types/domain';

interface HeaderBlockViewProps {
    data: HeaderBlockData;
}

export function HeaderBlockView({ data }: HeaderBlockViewProps) {
    return (
        <div className="py-4">
            <h2 className="text-lg font-semibold uppercase tracking-dna-heading">
                {data.title}
            </h2>
            {data.subtitle && (
                <p className="mt-1 text-dna-meta-val text-dna-ink-light">{data.subtitle}</p>
            )}
        </div>
    );
}
```

- [ ] **Step 2: RichtextBlockView**

```typescript
// src/components/dna/entry-detail/block-views/RichtextBlockView.tsx
import type { RichTextBlockData } from '@/types/domain';

interface RichtextBlockViewProps {
    data: RichTextBlockData;
}

export function RichtextBlockView({ data }: RichtextBlockViewProps) {
    if (!data.content) return null;

    return (
        <div className="py-4">
            <p className="dna-text-body whitespace-pre-wrap leading-relaxed">
                {data.content}
            </p>
        </div>
    );
}
```

- [ ] **Step 3: ImageBlockView**

```typescript
// src/components/dna/entry-detail/block-views/ImageBlockView.tsx
import type { ImageBlockData } from '@/types/domain';

interface ImageBlockViewProps {
    data: ImageBlockData;
}

export function ImageBlockView({ data }: ImageBlockViewProps) {
    if (!data.url) return null;

    return (
        <div className="py-4">
            <div className="overflow-hidden border border-dna-ink-faint">
                <img
                    src={data.url}
                    alt={data.alt || ''}
                    className="w-full object-contain"
                />
            </div>
            {data.caption && (
                <p className="mt-2 text-dna-label text-dna-ink-light">{data.caption}</p>
            )}
        </div>
    );
}
```

- [ ] **Step 4: EmbedBlockView**

```typescript
// src/components/dna/entry-detail/block-views/EmbedBlockView.tsx
import type { EmbedBlockData } from '@/types/domain';

interface EmbedBlockViewProps {
    data: EmbedBlockData;
}

export function EmbedBlockView({ data }: EmbedBlockViewProps) {
    if (!data.url) return null;

    return (
        <div className="py-4">
            <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-dna-ink-faint px-4 py-3 text-dna-meta-val uppercase tracking-dna-system text-dna-ink-mid no-underline hover:border-dna-ink-light hover:text-dna-ink"
            >
                <span>{data.provider || (() => { try { return new URL(data.url).hostname; } catch { return 'Link'; } })()}</span>
                <span className="ml-2 text-dna-ink-ghost">&rarr;</span>
            </a>
        </div>
    );
}
```

- [ ] **Step 5: KeyvalueBlockView**

```typescript
// src/components/dna/entry-detail/block-views/KeyvalueBlockView.tsx
import type { KeyValueBlockData } from '@/types/domain';
import { MetaTable } from '@/components/dna/MetaTable';

interface KeyvalueBlockViewProps {
    data: KeyValueBlockData;
}

export function KeyvalueBlockView({ data }: KeyvalueBlockViewProps) {
    if (!data.items || data.items.length === 0) return null;

    return (
        <div className="py-4">
            <MetaTable items={data.items.map((item) => ({ key: item.key, value: item.value }))} />
        </div>
    );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/dna/entry-detail/block-views/
git commit -m "feat: add Custom block view components (Header, Richtext, Image, Embed, Keyvalue)"
```

---

## Task 7: BlockRenderer

**Files:**

- Create: `src/components/dna/entry-detail/BlockRenderer.tsx`

- [ ] **Step 1: Implement BlockRenderer**

```typescript
// src/components/dna/entry-detail/BlockRenderer.tsx
import type { ContentBlock, ContentBlockType } from '@/types/domain';
import { HeaderBlockView } from './block-views/HeaderBlockView';
import { RichtextBlockView } from './block-views/RichtextBlockView';
import { ImageBlockView } from './block-views/ImageBlockView';
import { EmbedBlockView } from './block-views/EmbedBlockView';
import { KeyvalueBlockView } from './block-views/KeyvalueBlockView';
import type { ComponentType } from 'react';

const blockViewMap: Record<ContentBlockType, ComponentType<{ data: any }>> = {
    header: HeaderBlockView,
    richtext: RichtextBlockView,
    image: ImageBlockView,
    embed: EmbedBlockView,
    keyvalue: KeyvalueBlockView,
};

interface BlockRendererProps {
    blocks: ContentBlock[];
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
    return (
        <>
            {blocks.map((block) => {
                const View = blockViewMap[block.type];
                if (!View) return null;
                return <View key={block.id} data={block.data} />;
            })}
        </>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dna/entry-detail/BlockRenderer.tsx
git commit -m "feat: add BlockRenderer for Custom entry block dispatching"
```

---

## Task 8: 범용 렌더러 컴포넌트들

**Files:**

- Create: `src/components/dna/entry-detail/CoverImage.tsx`
- Create: `src/components/dna/entry-detail/MetaSection.tsx`
- Create: `src/components/dna/entry-detail/TracklistTimeline.tsx`
- Create: `src/components/dna/entry-detail/ExternalLinks.tsx`

- [ ] **Step 1: CoverImage**

기존 `event/[id]/page.tsx`의 포스터 패턴을 따름:

```typescript
// src/components/dna/entry-detail/CoverImage.tsx
import { ImageFrame } from '@/components/dna/ImageFrame';

interface CoverImageProps {
    src: string | undefined;
    alt: string;
}

export function CoverImage({ src, alt }: CoverImageProps) {
    return (
        <section className="pb-4 pt-6 md:pt-8">
            {src ? (
                <div className="mx-auto w-full md:max-w-[480px]">
                    <ImageFrame src={src} alt={alt} className="aspect-[3/4]" priority />
                </div>
            ) : (
                <div className="mx-auto flex aspect-[3/4] w-full items-center justify-center border border-dna-ink-faint bg-dna-bg-dark md:max-w-[480px]">
                    <span className="dna-text-system">// NO IMAGE</span>
                </div>
            )}
        </section>
    );
}
```

- [ ] **Step 2: MetaSection**

기존 MetaTable을 래핑해서 section 레이아웃 제공:

```typescript
// src/components/dna/entry-detail/MetaSection.tsx
import { MetaTable } from '@/components/dna/MetaTable';
import { SectionLabel } from '@/components/dna/SectionLabel';

interface MetaItem {
    key: string;
    value: string;
    href?: string;
}

interface MetaSectionProps {
    label: string;
    labelRight?: string;
    items: MetaItem[];
}

export function MetaSection({ label, labelRight, items }: MetaSectionProps) {
    if (items.length === 0) return null;

    return (
        <div>
            <SectionLabel right={labelRight}>{label}</SectionLabel>
            <MetaTable items={items} />
        </div>
    );
}
```

- [ ] **Step 3: TracklistTimeline**

```typescript
// src/components/dna/entry-detail/TracklistTimeline.tsx
import { AsciiDivider } from '@/components/dna/AsciiDivider';
import { SectionLabel } from '@/components/dna/SectionLabel';

interface Track {
    track: string;
    artist: string;
    time: string;
}

interface TracklistTimelineProps {
    tracklist: Track[];
}

export function TracklistTimeline({ tracklist }: TracklistTimelineProps) {
    if (!tracklist || tracklist.length === 0) return null;

    return (
        <>
            <AsciiDivider text="TRACKLIST" />
            <section className="my-5">
                <SectionLabel right={`${tracklist.length} TRACKS`}>Tracklist</SectionLabel>
                <div className="my-3">
                    {tracklist.map((track, i) => (
                        <div
                            key={i}
                            className="dna-border-row flex items-center gap-3 border-b py-2.5 last:border-b-0"
                        >
                            <span className="min-w-[40px] text-dna-label text-dna-ink-ghost">
                                {track.time || String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="flex-1">
                                <span className="text-dna-body font-medium">{track.track}</span>
                                {track.artist && (
                                    <span className="ml-2 text-dna-label text-dna-ink-light">
                                        — {track.artist}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
```

- [ ] **Step 4: ExternalLinks**

기존 event 상세의 링크 패턴 추출:

```typescript
// src/components/dna/entry-detail/ExternalLinks.tsx
import { AsciiDivider } from '@/components/dna/AsciiDivider';
import { SectionLabel } from '@/components/dna/SectionLabel';
import type { ExternalLink } from '@/types/domain';

interface ExternalLinksProps {
    links: ExternalLink[];
}

export function ExternalLinks({ links }: ExternalLinksProps) {
    if (!links || links.length === 0) return null;

    return (
        <>
            <AsciiDivider text="LINKS" />
            <section className="my-5">
                <SectionLabel right={`${links.length} LINKS`}>External Links</SectionLabel>
                <div className="my-3 flex flex-col gap-2">
                    {links.map((link, i) => (
                        <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between border border-dna-ink-faint px-4 py-3 text-dna-meta-val uppercase tracking-dna-system text-dna-ink-mid no-underline hover:border-dna-ink-light hover:text-dna-ink"
                        >
                            <span>{link.title}</span>
                            <span className="text-dna-ink-ghost">&rarr;</span>
                        </a>
                    ))}
                </div>
            </section>
        </>
    );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/dna/entry-detail/CoverImage.tsx src/components/dna/entry-detail/MetaSection.tsx src/components/dna/entry-detail/TracklistTimeline.tsx src/components/dna/entry-detail/ExternalLinks.tsx
git commit -m "feat: add entry detail renderers (CoverImage, MetaSection, TracklistTimeline, ExternalLinks)"
```

---

## Task 9: 설정 객체

**Files:**

- Create: `src/components/dna/entry-detail/entry-detail.config.ts`

- [ ] **Step 1: Define config types and entry detail config**

```typescript
// src/components/dna/entry-detail/entry-detail.config.ts
import type { ComponentType } from 'react';
import type { ContentEntry, User } from '@/types/domain';
import type { EntryType } from '@/types/database';

// Link를 제외한 상세 페이지 대상 타입
export type DetailableEntryType = Exclude<EntryType, 'link'>;

export interface MetaFieldConfig {
    label: string;
    dataKey: string;
    format: 'text' | 'date' | 'duration' | 'link' | 'list';
}

export interface SectionConfig {
    component: ComponentType<{ entry: ContentEntry }>;
    dataKey?: keyof ContentEntry;
    fields?: MetaFieldConfig[];
}

export interface EntryDetailConfig {
    sections: SectionConfig[];
    generateMeta: (entry: ContentEntry, user: User) => {
        title: string;
        description: string;
        images: string[];
    };
}

// --- 타입별 섹션 컴포넌트 (entry를 받아 내부에서 필요 데이터 추출) ---
import { CoverImage } from './CoverImage';
import { MetaSection } from './MetaSection';
import { TracklistTimeline } from './TracklistTimeline';
import { ExternalLinks } from './ExternalLinks';
import { BlockRenderer } from './BlockRenderer';
import { RichtextBlockView } from './block-views/RichtextBlockView';
import { formatEventDate } from '@/lib/formatters';

// 각 렌더러를 entry → props 어댑터로 감싸는 wrapper
function EventDetail({ entry }: { entry: ContentEntry }) {
    if (entry.type !== 'event') return null;
    return (
        <>
            <CoverImage src={entry.imageUrls?.[0]} alt={entry.title} />
            <MetaSection
                label="Event Info"
                labelRight="META"
                items={[
                    { key: 'Title', value: entry.title },
                    { key: 'Date', value: formatEventDate(entry.date) },
                    { key: 'Venue', value: entry.venue?.name || 'NULL' },
                    { key: 'Lineup', value: `${entry.lineup.length} artists` },
                ]}
            />
            {entry.description && (
                <RichtextBlockView data={{ content: entry.description }} />
            )}
            {entry.links && <ExternalLinks links={entry.links} />}
        </>
    );
}

function MixsetDetail({ entry }: { entry: ContentEntry }) {
    if (entry.type !== 'mixset') return null;
    return (
        <>
            <CoverImage src={entry.imageUrls?.[0]} alt={entry.title} />
            <MetaSection
                label="Mixset Info"
                labelRight="META"
                items={[
                    ...(entry.durationMinutes
                        ? [{ key: 'Duration', value: `${entry.durationMinutes} min` }]
                        : []),
                    ...(entry.url ? [{ key: 'URL', value: entry.url, href: entry.url }] : []),
                ]}
            />
            <TracklistTimeline tracklist={entry.tracklist} />
            {entry.description && (
                <RichtextBlockView data={{ content: entry.description }} />
            )}
        </>
    );
}

function CustomDetail({ entry }: { entry: ContentEntry }) {
    if (entry.type !== 'custom') return null;
    return <BlockRenderer blocks={entry.blocks} />;
}

export const entryDetailConfig: Record<DetailableEntryType, EntryDetailConfig> = {
    event: {
        sections: [{ component: EventDetail }],
        generateMeta: (entry, user) => ({
            title: `${entry.title} — ${user.displayName}`,
            description:
                entry.type === 'event'
                    ? `${entry.title} @ ${entry.venue?.name || ''} — ${formatEventDate(entry.date)}`
                    : entry.title,
            images: entry.type !== 'custom' ? (entry.imageUrls?.slice(0, 1) ?? []) : [],
        }),
    },
    mixset: {
        sections: [{ component: MixsetDetail }],
        generateMeta: (entry, user) => ({
            title: `${entry.title} — ${user.displayName}`,
            description:
                entry.type === 'mixset' && entry.durationMinutes
                    ? `${entry.title} (${entry.durationMinutes}min)`
                    : entry.title,
            images: entry.type !== 'custom' ? (entry.imageUrls?.slice(0, 1) ?? []) : [],
        }),
    },
    custom: {
        sections: [{ component: CustomDetail }],
        generateMeta: (entry, user) => ({
            title: `${entry.title} — ${user.displayName}`,
            description: entry.title,
            images: [],
        }),
    },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dna/entry-detail/entry-detail.config.ts
git commit -m "feat: add entry detail config with type-specific rendering"
```

---

## Task 10: EntryDetailShell + 상세 페이지 라우트

**Files:**

- Create: `src/components/dna/EntryDetailShell.tsx`
- Create: `src/app/(dna)/[user]/[slug]/page.tsx`
- Create: `src/app/(dna)/[user]/[slug]/not-found.tsx`
- Delete: `src/app/(dna)/[user]/[entryId]/` (전체 폴더)

- [ ] **Step 1: EntryDetailShell**

```typescript
// src/components/dna/EntryDetailShell.tsx
import type { ContentEntry, User } from '@/types/domain';
import { DnaPageShell } from './DnaPageShell';
import { DnaBreadcrumb } from './DnaBreadcrumb';
import { NodeLabel } from './NodeLabel';
import { entryDetailConfig, type DetailableEntryType } from './entry-detail/entry-detail.config';

interface EntryDetailShellProps {
    entry: ContentEntry;
    user: User;
    username: string;
}

function getTypeLabel(type: string): string {
    if (type === 'event') return 'Event';
    if (type === 'mixset') return 'Mixset';
    return 'Custom';
}

export function EntryDetailShell({ entry, user, username }: EntryDetailShellProps) {
    const config = entryDetailConfig[entry.type as DetailableEntryType];
    if (!config) return null;

    return (
        <DnaPageShell
            pathBar={{
                path: `root / ${username} / ${entry.title.toLowerCase()}`,
                meta: `type: ${entry.type}`,
            }}
            footerMeta={[`DJ-NODE-ARCHIVE // ${getTypeLabel(entry.type).toUpperCase()}: ${entry.title.toUpperCase()}`]}
        >
            <div className="pb-4 pt-2">
                <DnaBreadcrumb
                    items={[
                        { label: user.displayName, href: `/${username}` },
                        { label: entry.title },
                    ]}
                />
            </div>

            <section className="pb-6">
                <NodeLabel right={getTypeLabel(entry.type)}>
                    {getTypeLabel(entry.type)} Node
                </NodeLabel>
                <h1 className="dna-heading-page md:mt-2">{entry.title}</h1>
            </section>

            {config.sections.map((section, i) => {
                const Component = section.component;
                return <Component key={i} entry={entry} />;
            })}
        </DnaPageShell>
    );
}
```

- [ ] **Step 2: Page route**

```typescript
// src/app/(dna)/[user]/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { isSuccess } from '@/types/result';
import { getEntryDetailData } from '@/lib/services/user.service';
import { EntryDetailShell } from '@/components/dna/EntryDetailShell';
import { entryDetailConfig, type DetailableEntryType } from '@/components/dna/entry-detail/entry-detail.config';

interface PageProps {
    params: Promise<{ user: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { user, slug } = await params;
    const result = await getEntryDetailData(user, slug);

    if (!isSuccess(result)) {
        return { title: 'Not Found' };
    }

    const { entry, user: userData } = result.data;
    const config = entryDetailConfig[entry.type as DetailableEntryType];

    if (!config) {
        return { title: entry.title };
    }

    const meta = config.generateMeta(entry, userData);

    return {
        title: meta.title,
        description: meta.description,
        openGraph: {
            title: meta.title,
            description: meta.description,
            images: meta.images,
        },
    };
}

export const revalidate = 300;

export default async function EntryDetailPage({ params }: PageProps) {
    const { user, slug } = await params;
    const result = await getEntryDetailData(user, slug);

    if (!isSuccess(result)) {
        notFound();
    }

    const { entry, user: userData, username } = result.data;

    // link 타입은 상세 페이지 없음
    if (entry.type === 'link') {
        notFound();
    }

    return <EntryDetailShell entry={entry} user={userData} username={username} />;
}
```

- [ ] **Step 3: not-found.tsx**

```typescript
// src/app/(dna)/[user]/[slug]/not-found.tsx
import { DnaPageShell } from '@/components/dna/DnaPageShell';

export default function NotFound() {
    return (
        <DnaPageShell footerMeta={['DJ-NODE-ARCHIVE // 404']}>
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
                <span className="dna-text-system text-lg">// ENTRY NOT FOUND</span>
                <p className="text-dna-meta-val text-dna-ink-light">
                    요청하신 엔트리를 찾을 수 없습니다.
                </p>
            </div>
        </DnaPageShell>
    );
}
```

- [ ] **Step 4: Delete old `[entryId]` route**

```bash
rm -rf src/app/\(dna\)/\[user\]/\[entryId\]/
```

- [ ] **Step 5: Commit**

```bash
git add src/components/dna/EntryDetailShell.tsx src/app/\(dna\)/\[user\]/\[slug\]/
git add -u src/app/\(dna\)/\[user\]/\[entryId\]/
git commit -m "feat: add entry detail page route with EntryDetailShell"
```

---

## Task 11: 링크 로직 업데이트

**Files:**

- Modify: `src/app/(dna)/[user]/components/section-views/ListView.tsx`
- Modify: `src/app/(dna)/[user]/components/section-views/CarouselView.tsx`
- Modify: `src/components/dna/EntryCard.tsx`

Entry 링크 분기 로직을 공통 함수로 추출하여 세 곳에 적용한다.

- [ ] **Step 1: Create shared link resolver utility**

`src/components/dna/entry-detail/` 에 아래 유틸을 추가하거나 또는 각 컴포넌트에 인라인으로 적용. 여기서는 각 파일에 인라인 적용:

링크 분기 로직:

```typescript
// 공통 패턴 — 각 파일에 적용
// isPublicEventEntry → /event/:eventId (위키)
// self-contained event / mixset / custom (slug 있으면) → /:user/:slug
// link → null

function getEntryHref(entry: ContentEntry, username: string): string | null {
    if (isEventEntry(entry) && isPublicEventEntry(entry)) {
        return `/event/${entry.eventId}`;
    }
    if (entry.type === 'link') return null;
    // self-contained event, mixset, custom → slug 기반
    if ('slug' in entry && entry.slug) {
        return `/${username}/${entry.slug}`;
    }
    return null;
}
```

> **주의**: 이 함수가 동작하려면 `ContentEntry`에 `slug` 필드가 있어야 한다. 이는 `mapEntryToDomain`에서 DB entry의 slug를 매핑해야 함을 의미한다.

- [ ] **Step 2: Update EntryBase type to include slug**

`src/types/domain.ts` — `EntryBase`에 slug 추가:

```typescript
interface EntryBase {
    id: string;
    position: number;
    slug?: string; // 추가
    createdAt: string;
    updatedAt: string;
}
```

- [ ] **Step 3: Update mapEntryToDomain to include slug**

`src/lib/mappers.ts` — `mapEntryToDomain`의 `base` 객체에 slug 추가 (한 곳만 수정하면 모든 타입에 적용):

```typescript
// mapEntryToDomain 내부 base 객체 (line 73-78)
const base = {
    id: dbEntry.id,
    position: dbEntry.position,
    slug: dbEntry.slug ?? undefined, // 추가
    createdAt: dbEntry.created_at,
    updatedAt: dbEntry.updated_at,
};
```

- [ ] **Step 4: Create `getEntryHref` utility**

```typescript
// src/lib/utils/entry-link.ts
import { isEventEntry, isPublicEventEntry, type ContentEntry } from '@/types/domain';

export function getEntryHref(entry: ContentEntry, username: string): string | null {
    // reference event → 위키 페이지
    if (isEventEntry(entry) && isPublicEventEntry(entry)) {
        return `/event/${entry.eventId}`;
    }
    // link → 외부 URL (상세 페이지 없음)
    if (entry.type === 'link') return null;
    // self-contained event, mixset, custom → slug 기반 상세
    if (entry.slug) {
        return `/${username}/${entry.slug}`;
    }
    return null;
}
```

- [ ] **Step 5: Update ListView.tsx**

`toTimelineEntry` 함수에 `username` 파라미터 추가 필요. `ListView` props에 `username` 추가:

```typescript
// ListView.tsx 변경
import { getEntryHref } from '@/lib/utils/entry-link';

interface ListViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
    username: string;  // 추가
}

function toTimelineEntry(entry: ContentEntry, username: string): TimelineEntry {
    // ... 기존 코드 유지 ...
    const link = getEntryHref(entry, username);
    // ... 나머지 동일 ...
}

export function ListView({ entries, username }: ListViewProps) {
    return <Timeline entries={entries.map((e) => toTimelineEntry(e, username))} />;
}
```

- [ ] **Step 6: Update CarouselView.tsx**

```typescript
// CarouselView.tsx 변경
import { getEntryHref } from '@/lib/utils/entry-link';

interface CarouselViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
    username: string; // 추가
}

// CarouselCard에 username prop 추가
function CarouselCard({ entry, username }: { entry: ContentEntry; username: string }) {
    const href = getEntryHref(entry, username);
    // ... 나머지 동일 ...
}
```

- [ ] **Step 7: Update EntryCard.tsx**

```typescript
// EntryCard.tsx 변경
import { getEntryHref } from '@/lib/utils/entry-link';

interface EntryCardProps {
    entry: ContentEntry;
    index: number;
    username: string; // 추가
    className?: string;
}

export function EntryCard({ entry, index, username }: EntryCardProps) {
    const href = getEntryHref(entry, username);
    // ... 나머지 동일 ...
}
```

- [ ] **Step 8: Update FeatureView and GridView**

`FeatureView`와 `GridView`도 `EntryCard`에 `username`을 전달해야 함:

```typescript
// src/app/(dna)/[user]/components/section-views/FeatureView.tsx
interface FeatureViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
    username: string;  // 추가
}

export function FeatureView({ entries, username }: FeatureViewProps) {
    const featured = entries[0];
    if (!featured) return null;
    return (
        <div className="my-3">
            <EntryCard entry={featured} index={0} username={username} />
        </div>
    );
}
```

```typescript
// src/app/(dna)/[user]/components/section-views/GridView.tsx
interface GridViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
    username: string;  // 추가
}

export function GridView({ entries, username }: GridViewProps) {
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {entries.map((entry, i) => (
                <EntryCard key={entry.id} entry={entry} index={i} username={username} />
            ))}
        </div>
    );
}
```

- [ ] **Step 9: Update SectionRenderer and UserPageContent**

`SectionViewProps`에 `username` 추가하고, `UserPageContent`에서 전달:

```typescript
// src/app/(dna)/[user]/components/SectionRenderer.tsx
interface SectionViewProps {
    entries: ContentEntry[];
    options: Record<string, unknown>;
    username: string;  // 추가
}

const VIEW_RENDERERS: Record<ViewType, ComponentType<SectionViewProps>> = {
    carousel: CarouselView,
    list: ListView,
    feature: FeatureView,
};

interface Props {
    section: ResolvedSection;
    username: string;  // 추가
}

export function SectionRenderer({ section, username }: Props) {
    const View = VIEW_RENDERERS[section.viewType];
    return (
        <section className="my-5">
            {section.title && (
                <SectionLabel right={`${section.entries.length} ITEMS`}>
                    {section.title}
                </SectionLabel>
            )}
            <View entries={section.entries} options={section.options} username={username} />
        </section>
    );
}
```

```typescript
// src/app/(dna)/[user]/components/UserPageContent.tsx
// Props에 추가 없음 — user.username을 사용
// SectionRenderer 호출 부분 변경:
{sections.map((section) => (
    <SectionRenderer key={section.id} section={section} username={user.username} />
))}
```

- [ ] **Step 10: Commit**

```bash
git add src/types/domain.ts src/lib/mappers.ts src/lib/utils/entry-link.ts
git add src/app/\(dna\)/\[user\]/components/section-views/ListView.tsx
git add src/app/\(dna\)/\[user\]/components/section-views/CarouselView.tsx
git add src/app/\(dna\)/\[user\]/components/section-views/FeatureView.tsx
git add src/app/\(dna\)/\[user\]/components/section-views/GridView.tsx
git add src/app/\(dna\)/\[user\]/components/SectionRenderer.tsx
git add src/app/\(dna\)/\[user\]/components/UserPageContent.tsx
git add src/components/dna/EntryCard.tsx
git commit -m "feat: update entry link routing — slug-based detail + wiki event links"
```

---

## Task 12: 엔트리 생성 시 slug 자동 생성

**Files:**

- Modify: `src/lib/db/queries/entry.queries.ts` — `CreateEntryInput`에 slug 추가 + `ensureUniqueSlug` 추가
- Modify: `src/lib/api/handlers/entry.handlers.ts` — slug 생성 로직

- [ ] **Step 1: Add `ensureUniqueSlug` to entry.queries.ts**

`ensureUniqueSlug`는 DB 접근이 필요하므로 쿼리 레이어에 배치 (slug.ts는 순수 유틸로 유지):

```typescript
// src/lib/db/queries/entry.queries.ts — 끝에 추가

export async function ensureUniqueSlug(slug: string, pageId: string): Promise<string> {
    const supabase = await createClient();
    let candidate = slug;
    let suffix = 1;

    while (true) {
        const { data } = await supabase
            .from('entries')
            .select('id')
            .eq('page_id', pageId)
            .eq('slug', candidate)
            .single();

        if (!data) return candidate;

        suffix++;
        candidate = `${slug}-${suffix}`;
    }
}
```

- [ ] **Step 2: Update CreateEntryInput and createEntry**

```typescript
// entry.queries.ts — CreateEntryInput에 slug 추가
export interface CreateEntryInput {
    page_id: string;
    type: EntryType;
    position: number;
    reference_id?: string | null;
    data: EntryData;
    slug?: string; // 추가
}

// createEntry 함수의 insert 객체에 추가:
// slug: input.slug ?? null,
```

- [ ] **Step 3: Update handleCreateEntry**

`entry.handlers.ts`에서 엔트리 생성 전 slug 생성 로직 추가. 기존 `handleCreateEntry` 함수 내 `createEntry` 호출 전에 삽입:

```typescript
import { ensureUniqueSlug } from '@/lib/db/queries/entry.queries';
import { generateSlug } from '@/lib/utils/slug';

// handleCreateEntry 내부, createEntry 호출 전:
const title = ((body.data as Record<string, unknown>)?.title as string) || 'untitled';
const rawSlug = generateSlug(title);
const slug = await ensureUniqueSlug(rawSlug, body.pageId);

// createEntry 호출에 slug 추가:
const result = await createEntry(body.id, {
    page_id: body.pageId,
    type: body.type,
    position: maxPosResult.data + 1,
    reference_id: body.referenceId ?? null,
    data: body.data,
    slug, // 추가
});
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/queries/entry.queries.ts src/lib/api/handlers/entry.handlers.ts
git commit -m "feat: auto-generate slug on entry creation"
```

---

## Task 13: 통합 테스트 & 검증

- [ ] **Step 1: Run all existing tests**

Run: `npx vitest run`
Expected: All existing tests PASS

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run lint**

Run: `npx next lint`
Expected: No errors

- [ ] **Step 4: Run dev server and verify**

Run: `npm run dev`

수동 검증:

1. `/:user` 페이지에서 엔트리 카드 클릭 → slug 기반 상세 페이지로 이동 확인
2. reference event 클릭 → `/event/:id` 위키 페이지로 이동 확인
3. self-contained event/mixset/custom → `/:user/:slug` 상세 페이지 확인
4. 존재하지 않는 slug → 404 페이지 확인
5. Breadcrumb 동작 확인

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address integration issues from manual testing"
```
