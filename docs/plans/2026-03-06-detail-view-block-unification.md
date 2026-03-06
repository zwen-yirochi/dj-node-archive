# Shared Field Components + FieldSync Rename

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** EditFieldWrapper → FieldSync 리네이밍, 순수 필드 컴포넌트 7개 생성, 기존 블록을 shared-field 기반으로 전환, Link에 coverUrl 추가.

**Architecture:** 모든 필드 UI를 `FieldComponentProps<T>` (`value`, `onChange`, `disabled`) 인터페이스의 순수 컴포넌트로 추출. caller(DetailView/custom-blocks)가 `FieldSync → Field` 패턴으로 조합. entry 데이터 ↔ 필드 값 변환은 caller 책임.

**Tech Stack:** TypeScript, React, Zod

---

## Task 1: EditFieldWrapper → FieldSync 리네이밍

**Files:**

- Rename: `shared-fields/EditFieldWrapper.tsx` → `shared-fields/FieldSync.tsx`
- Modify: `shared-fields/index.ts`
- Modify: all consumers (find/replace)

**Step 1: 파일 리네이밍 + 내부 컴포넌트명 변경**

```bash
mv src/app/dashboard/components/ContentPanel/shared-fields/EditFieldWrapper.tsx \
   src/app/dashboard/components/ContentPanel/shared-fields/FieldSync.tsx
```

`FieldSync.tsx` 내부:

- `EditFieldWrapper` → `FieldSync`
- `EditFieldConfig` → `FieldSyncConfig`
- export default 변경

**Step 2: index.ts 업데이트**

```typescript
export { default as FieldSync } from './FieldSync';
export type { FieldSyncConfig } from './FieldSync';
// 기존 EditFieldWrapper/EditFieldConfig export 제거
```

**Step 3: 모든 소비자에서 import 변경**

```bash
# 검색 대상
grep -r "EditFieldWrapper\|EditFieldConfig" src/
```

각 파일에서:

- `EditFieldWrapper` → `FieldSync`
- `EditFieldConfig` → `FieldSyncConfig`

**Step 4: fieldConfigs.ts 타입 변경**

```typescript
import type { FieldSyncConfig } from './FieldSync';

export const IMAGE_FIELD_CONFIG: FieldSyncConfig<ImageItem[]> = { immediate: true };
```

**Step 5: tsc 확인 + Commit**

```
refactor(shared-fields): rename EditFieldWrapper → FieldSync
```

---

## Task 2: Link에 coverUrl 추가

**Files:**

- Modify: `src/types/domain.ts` (LinkEntry)
- Modify: `src/types/database.ts` (LinkEntryData)
- Modify: `src/lib/mappers.ts` (3곳: toDomain, toDatabase, createEmpty)
- Modify: `src/lib/validations/entry.schemas.ts` (link schemas)
- Modify: `src/app/dashboard/config/entryFieldConfig.ts`
- Modify: `src/app/dashboard/config/entryFormConfig.ts`
- Modify: `src/components/dna/EntryCard.tsx`
- Modify: `src/app/dashboard/config/__tests__/config-integrity.test.ts`

**Step 1: domain.ts — LinkEntry**

```typescript
export interface LinkEntry extends EntryBase {
    type: 'link';
    title: string;
    url: string;
    coverUrl?: string;
    icon?: string;
    description?: string;
}
```

**Step 2: database.ts — LinkEntryData**

```typescript
export interface LinkEntryData {
    title: string;
    url: string;
    cover_url?: string;
    icon?: string;
    description?: string;
}
```

**Step 3: mappers.ts — toDomain link case**

`coverUrl: data.cover_url as string | undefined` 추가.

**Step 4: mappers.ts — toDatabase link case**

`cover_url: linkEntry.coverUrl || undefined` 추가.

**Step 5: mappers.ts — createEmptyEntry link case**

`coverUrl: ''` 추가.

**Step 6: entry.schemas.ts — link schemas**

```typescript
export const draftLinkSchema = linkBase.extend({
    url: z.string().min(1).trim(),
    coverUrl: z.string().default(''),
});
export const publishLinkSchema = linkBase.extend({
    url: z.string().url('Must be a valid URL'),
    coverUrl: z.string().default(''),
});
```

**Step 7: entryFieldConfig.ts — link FIELD_CONFIG**

```typescript
link: [
    { key: 'title', label: 'Title', triggersPreview: true },
    { key: 'coverUrl', label: 'Cover', triggersPreview: true },
    { key: 'url', label: 'URL', triggersPreview: true },
    { key: 'icon', label: 'Icon', triggersPreview: true },
    { key: 'description', label: 'Description', triggersPreview: false },
],
```

**Step 8: entryFormConfig.ts**

`defaultValues`에 `coverUrl: ''`, `toEntry`에 `coverUrl` 매핑.

**Step 9: EntryCard.tsx — getImageUrl**

```typescript
if (entry.type === 'link') return (entry as LinkEntry).coverUrl || undefined;
```

**Step 10: config-integrity.test.ts — link 라운드트립에 coverUrl 추가**

**Step 11: 테스트 + tsc 확인 + Commit**

```
feat(link): add coverUrl field to Link entry type
```

---

## Task 3: TextField 생성 + 소비자 전환

**Files:**

- Create: `shared-fields/TextField.tsx`
- Modify: `shared-fields/index.ts`
- Modify: `detail-views/blocks/DescriptionBlock.tsx`
- Modify: `detail-views/blocks/VenueBlock.tsx`

**Step 1: TextField 생성**

```tsx
// shared-fields/TextField.tsx
'use client';

import type { FieldComponentProps } from './types';

interface TextFieldProps extends FieldComponentProps<string> {
    variant?: 'input' | 'textarea';
    placeholder?: string;
    rows?: number;
    className?: string;
}

export default function TextField({
    value,
    onChange,
    disabled,
    variant = 'input',
    placeholder,
    rows = 4,
    className,
}: TextFieldProps) {
    const baseClass = `w-full bg-transparent outline-none placeholder:text-dashboard-text-placeholder ${className ?? 'text-sm text-dashboard-text-secondary'}`;

    if (variant === 'textarea') {
        return (
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                rows={rows}
                className={`${baseClass} resize-none leading-relaxed`}
            />
        );
    }

    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className={baseClass}
        />
    );
}
```

**Step 2: index.ts에 export 추가**

**Step 3: DescriptionBlock을 FieldSync + TextField로 전환**

```tsx
'use client';

import { FieldSync } from '../../shared-fields';
import type { FieldSyncConfig } from '../../shared-fields/FieldSync';
import TextField from '../../shared-fields/TextField';
import type { FieldBlockProps } from '../types';

const DESC_CONFIG: FieldSyncConfig<string> = { debounceMs: 800 };

export default function DescriptionBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const description = 'description' in entry ? (entry.description as string) || '' : '';

    return (
        <div>
            <p className="mb-3 text-sm font-semibold text-dashboard-text">Description</p>
            <FieldSync
                config={DESC_CONFIG}
                value={description}
                onSave={(v) => onSave('description', v)}
            >
                {({ value, onChange }) => (
                    <TextField
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        variant="textarea"
                        placeholder="Add a description..."
                        className="text-sm leading-relaxed text-dashboard-text-muted"
                    />
                )}
            </FieldSync>
        </div>
    );
}
```

**Step 4: VenueBlock을 FieldSync + TextField로 전환**

```tsx
'use client';

import { MapPin } from 'lucide-react';

import { FieldSync } from '../../shared-fields';
import type { FieldSyncConfig } from '../../shared-fields/FieldSync';
import TextField from '../../shared-fields/TextField';
import type { FieldBlockProps } from '../types';

const VENUE_CONFIG: FieldSyncConfig<string> = { debounceMs: 800 };

export default function VenueBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const venue = entry.type === 'event' ? entry.venue : { name: '' };
    if (entry.type !== 'event') return null;

    return (
        <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
            <FieldSync
                config={VENUE_CONFIG}
                value={venue.name}
                onSave={(name) => onSave('venue', { ...venue, name })}
            >
                {({ value, onChange }) => (
                    <TextField
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        placeholder="Enter venue name"
                    />
                )}
            </FieldSync>
        </div>
    );
}
```

**Step 5: tsc 확인 + Commit**

```
feat(shared-fields): add TextField + convert DescriptionBlock/VenueBlock
```

---

## Task 4: DateField 생성 + DateBlock 전환

**Files:**

- Create: `shared-fields/DateField.tsx`
- Modify: `detail-views/blocks/DateBlock.tsx`

**Step 1: DateField 생성**

```tsx
// shared-fields/DateField.tsx
'use client';

import type { FieldComponentProps } from './types';

interface DateFieldProps extends FieldComponentProps<string> {
    className?: string;
}

export default function DateField({ value, onChange, disabled, className }: DateFieldProps) {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return null;
        try {
            return new Date(dateStr).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className={className}>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="w-full bg-transparent text-dashboard-text-secondary outline-none"
            />
            {value && (
                <p className="mt-0.5 text-xs text-dashboard-text-placeholder">
                    {formatDate(value)}
                </p>
            )}
        </div>
    );
}
```

**Step 2: DateBlock → FieldSync + DateField**

```tsx
'use client';

import { Calendar } from 'lucide-react';

import { FieldSync } from '../../shared-fields';
import DateField from '../../shared-fields/DateField';
import type { FieldSyncConfig } from '../../shared-fields/FieldSync';
import type { FieldBlockProps } from '../types';

const DATE_CONFIG: FieldSyncConfig<string> = { debounceMs: 800 };

export default function DateBlock({ entry, onSave, disabled }: FieldBlockProps) {
    if (entry.type !== 'event') return null;

    return (
        <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 shrink-0 text-dashboard-text-placeholder" />
            <FieldSync config={DATE_CONFIG} value={entry.date} onSave={(v) => onSave('date', v)}>
                {({ value, onChange }) => (
                    <DateField
                        value={value}
                        onChange={onChange}
                        disabled={disabled}
                        className="flex-1"
                    />
                )}
            </FieldSync>
        </div>
    );
}
```

**Step 3: tsc + Commit**

```
feat(shared-fields): add DateField + convert DateBlock
```

---

## Task 5: IconField 생성 + IconBlock 전환

**Files:**

- Create: `shared-fields/IconField.tsx`
- Modify: `detail-views/blocks/IconBlock.tsx`

**Step 1: IconField — 순수 아이콘 선택 UI**

```tsx
// shared-fields/IconField.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

import { Globe, Instagram, Mail, Music, Youtube } from 'lucide-react';

import { ICON_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';

import type { FieldComponentProps } from './types';

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
    soundcloud: Music,
    spotify: Music,
    bandcamp: Music,
    instagram: Instagram,
    youtube: Youtube,
    twitter: Globe,
    globe: Globe,
    mail: Mail,
};

export default function IconField({ value, onChange, disabled }: FieldComponentProps<string>) {
    const [showSelector, setShowSelector] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const IconComponent = iconComponents[value] || Globe;

    useEffect(() => {
        if (!showSelector) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setShowSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSelector]);

    return (
        <div ref={popoverRef} className="relative mx-auto w-fit">
            <button
                onClick={() => !disabled && setShowSelector(!showSelector)}
                disabled={disabled}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-dashboard-bg-muted transition-colors hover:bg-dashboard-bg-hover"
                title="Click to change icon"
            >
                <IconComponent className="h-8 w-8 text-dashboard-text-secondary" />
            </button>
            {showSelector && (
                <div className="absolute left-1/2 z-10 mt-2 -translate-x-1/2 rounded-xl border border-dashboard-border bg-dashboard-bg-card p-3 shadow-lg">
                    <div className="grid grid-cols-4 gap-2">
                        {ICON_OPTIONS.map((opt) => {
                            const Icon = iconComponents[opt] || Globe;
                            return (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        onChange(opt);
                                        setShowSelector(false);
                                    }}
                                    className={cn(
                                        'flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-colors',
                                        value === opt
                                            ? 'border-dashboard-text bg-dashboard-bg-muted'
                                            : 'border-transparent hover:bg-dashboard-bg-hover'
                                    )}
                                    title={opt}
                                >
                                    <Icon className="h-5 w-5" />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
```

**Step 2: IconBlock → FieldSync + IconField**

```tsx
'use client';

import { FieldSync } from '../../shared-fields';
import type { FieldSyncConfig } from '../../shared-fields/FieldSync';
import IconField from '../../shared-fields/IconField';
import type { FieldBlockProps } from '../types';

const ICON_CONFIG: FieldSyncConfig<string> = { immediate: true };

export default function IconBlock({ entry, onSave, disabled }: FieldBlockProps) {
    const icon = entry.type === 'link' ? entry.icon || '' : '';

    return (
        <FieldSync config={ICON_CONFIG} value={icon} onSave={(v) => onSave('icon', v)}>
            {({ value, onChange }) => (
                <IconField value={value} onChange={onChange} disabled={disabled} />
            )}
        </FieldSync>
    );
}
```

**Step 3: tsc + Commit**

```
feat(shared-fields): add IconField + convert IconBlock
```

---

## Task 6: TagListField 생성 + LineupBlock 전환

**Files:**

- Create: `shared-fields/TagListField.tsx`
- Modify: `detail-views/blocks/LineupBlock.tsx`

**Step 1: TagListField — 태그 입력/삭제 UI**

`FieldComponentProps<T[]>` where `T = { id?: string; name: string }`.

UI: 현재 LineupBlock의 편집 모드 (태그 칩 + input) / 뷰 모드 (텍스트 나열) 를 그대로 순수 컴포넌트로 추출. `@` prefix 같은 도메인 로직은 caller에서 처리하도록 `formatTag` prop 추가.

**Step 2: LineupBlock → FieldSync + TagListField**

**Step 3: tsc + Commit**

```
feat(shared-fields): add TagListField + convert LineupBlock
```

---

## Task 7: KeyValueField 생성 + TracklistBlock/KeyValueSection 전환

**Files:**

- Create: `shared-fields/KeyValueField.tsx`
- Modify: `detail-views/blocks/TracklistBlock.tsx`
- Modify: `custom-blocks/KeyValueSection.tsx`

**Step 1: KeyValueField — 컬럼 config 기반 key-value 편집**

```tsx
// shared-fields/KeyValueField.tsx
interface Column {
    key: string;
    placeholder: string;
    className?: string;
    width?: string; // e.g. 'w-12', 'flex-1'
}

interface KeyValueFieldProps<T extends Record<string, string>> extends FieldComponentProps<T[]> {
    columns: Column[];
    emptyItem: T;
    addLabel?: string;
}
```

TracklistBlock 사용: `columns: [{key:'time',w:'w-12'}, {key:'track',w:'flex-1'}, {key:'artist'}]`
KeyValueSection 사용: `columns: [{key:'key',w:'w-28'}, {key:'value',w:'flex-1'}]`

**Step 2: TracklistBlock → FieldSync + KeyValueField**
**Step 3: KeyValueSection → KeyValueField (직접 사용, FieldSync는 custom-blocks에서 불필요)**

**Step 4: tsc + Commit**

```
feat(shared-fields): add KeyValueField + convert TracklistBlock/KeyValueSection
```

---

## Task 8: LinkField + EmbedField 생성

**Files:**

- Create: `shared-fields/LinkField.tsx`
- Create: `shared-fields/EmbedField.tsx`
- Modify: `detail-views/blocks/UrlBlock.tsx`
- Modify: `custom-blocks/EmbedSection.tsx`

**Step 1: LinkField — 단순 URL 저장 (copy/clear 포함)**

현재 UrlBlock의 UI를 순수 컴포넌트로 추출. `FieldComponentProps<string>`.
Read 모드 (double-click to edit + copy/clear) + Edit 모드 (input).

**Step 2: EmbedField — 임베드 URL (provider 감지)**

현재 EmbedSection의 UI 기반. `FieldComponentProps<string>`.
아이콘 + URL input. 향후 provider 감지/미리보기 확장 가능.

**Step 3: UrlBlock → FieldSync + LinkField**
**Step 4: EmbedSection → EmbedField (직접 사용)**

**Step 5: tsc + Commit**

```
feat(shared-fields): add LinkField/EmbedField + convert UrlBlock/EmbedSection
```

---

## Task 9: ListSection + LinksBlock 제거

**Files:**

- Delete: `custom-blocks/ListSection.tsx`
- Delete: `detail-views/blocks/LinksBlock.tsx`
- Modify: `custom-blocks/` 관련 config (ListSection 참조 제거)
- Modify: `fieldBlockConfig.ts` (LinksBlock 참조 제거)
- Modify: `entryFieldConfig.ts` (event links 필드 제거)

**Step 1: LinksBlock 참조 제거**

`fieldBlockConfig.ts`에서 LinksBlock import + `fieldBlock('event', 'links', ...)` 제거.
`entryFieldConfig.ts`에서 event의 `links` 필드 제거.

**Step 2: ListSection 참조 제거**

`customBlockConfig.ts`(또는 해당 config)에서 ListSection 참조 제거.

**Step 3: 파일 삭제**

```bash
rm src/app/dashboard/components/ContentPanel/detail-views/blocks/LinksBlock.tsx
rm src/app/dashboard/components/ContentPanel/custom-blocks/ListSection.tsx
```

**Step 4: tsc + 테스트 + Commit**

```
refactor: remove ListSection and LinksBlock (ListField로 대체 예정)
```

---

## Task 10: RichTextSection → TextField 전환 + index.ts 정리

**Files:**

- Modify: `custom-blocks/RichTextSection.tsx`
- Modify: `shared-fields/index.ts`

**Step 1: RichTextSection → TextField 사용**

```tsx
'use client';

import TextField from '../shared-fields/TextField';
import type { SectionBlockEditorProps } from './types';

export default function RichTextSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'richtext'>) {
    return (
        <TextField
            value={data.content}
            onChange={(content) => onChange({ ...data, content })}
            disabled={disabled}
            variant="textarea"
            placeholder="Write something..."
            rows={3}
            className="min-h-[80px] text-sm text-dashboard-text"
        />
    );
}
```

**Step 2: shared-fields/index.ts — 전체 export 정리**

```typescript
// Components
export { default as FieldSync } from './FieldSync';
export { default as ImageField } from './ImageField';
export { default as TextField } from './TextField';
export { default as DateField } from './DateField';
export { default as IconField } from './IconField';
export { default as TagListField } from './TagListField';
export { default as KeyValueField } from './KeyValueField';
export { default as LinkField } from './LinkField';
export { default as EmbedField } from './EmbedField';

// Config
export { IMAGE_FIELD_CONFIG } from './fieldConfigs';

// Types
export type { FieldSyncConfig } from './FieldSync';
export type { FieldComponentProps, ImageFieldProps, ImageItem, ImageAspectRatio } from './types';
```

**Step 3: tsc + 전체 테스트 + Commit**

```
refactor: convert RichTextSection to TextField + finalize shared-fields exports
```
