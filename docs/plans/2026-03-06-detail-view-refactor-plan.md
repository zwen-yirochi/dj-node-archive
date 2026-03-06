# DetailView Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** UnifiedDetailView Slot 패턴을 개별 DetailView로 전환하고, SyncedField 래퍼로 save indicator를 추가하며, 이중 버퍼링을 제거한다.

**Architecture:** FieldSync render-props를 SyncedField children-cloneElement 패턴으로 교체. EntryDetailView의 localEntry/useDebouncedSave를 제거하고 SyncedField → updateField mutation → TQ optimistic update로 직결. 3개 개별 DetailView가 각자 entry 타입을 직접 사용.

**Tech Stack:** React, TypeScript, TanStack Query, Zustand, Vitest, Tailwind CSS

**Design doc:** `docs/plans/2026-03-06-detail-view-refactor-design.md`

---

### Task 1: SaveIndicator 컴포넌트 생성

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/shared-fields/SaveIndicator.tsx`

**Step 1: SaveIndicator 컴포넌트 작성**

```tsx
// src/app/dashboard/components/ContentPanel/shared-fields/SaveIndicator.tsx
'use client';

import { useEffect, useState } from 'react';

import { Check } from 'lucide-react';

import type { SaveStatus } from '@/app/dashboard/hooks/use-field-sync';

interface SaveIndicatorProps {
    status: SaveStatus;
}

export default function SaveIndicator({ status }: SaveIndicatorProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (status === 'saving' || status === 'error') {
            setVisible(true);
        } else if (status === 'saved') {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 2000);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [status]);

    if (!visible) return null;

    if (status === 'saving') {
        return (
            <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-400" />
        );
    }

    if (status === 'saved') {
        return (
            <Check className="h-3 w-3 shrink-0 text-green-500 duration-200 animate-in fade-in" />
        );
    }

    if (status === 'error') {
        return <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-500" />;
    }

    return null;
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/components/ContentPanel/shared-fields/SaveIndicator.tsx
git commit -m "feat(shared-fields): add SaveIndicator component"
```

---

### Task 2: FieldSync → SyncedField 전환

기존 FieldSync render-props를 SyncedField children-cloneElement 패턴으로 교체한다.
`useFieldSync` 훅은 그대로 유지.

**Files:**

- Delete: `src/app/dashboard/components/ContentPanel/shared-fields/FieldSync.tsx`
- Create: `src/app/dashboard/components/ContentPanel/shared-fields/SyncedField.tsx`
- Modify: `src/app/dashboard/components/ContentPanel/shared-fields/index.ts`

**Step 1: SyncedField 컴포넌트 작성**

```tsx
// src/app/dashboard/components/ContentPanel/shared-fields/SyncedField.tsx
'use client';

import { cloneElement, isValidElement, type ReactElement } from 'react';

import { useFieldSync, type SaveStatus } from '@/app/dashboard/hooks/use-field-sync';

import SaveIndicator from './SaveIndicator';
import type { FieldSyncConfig } from './types';

interface SyncedFieldProps<T> {
    config: FieldSyncConfig<T>;
    value: T;
    onSave: (value: T) => void;
    children: ReactElement<{ value?: T; onChange?: (value: T) => void }>;
}

/**
 * SyncedField — config 기반 sync 전략 + save indicator 내장.
 *
 * immediate: true → passthrough (변경 즉시 onSave, schema 검증 후)
 * immediate: false → useFieldSync debounce (로컬 상태 + 디바운스 후 onSave)
 *
 * children에 value/onChange를 cloneElement로 주입한다.
 */
export default function SyncedField<T>({ config, value, onSave, children }: SyncedFieldProps<T>) {
    const immediate = config.immediate ?? false;

    const validate = (v: T): boolean => {
        if (!config.schema) return true;
        return config.schema.safeParse(v).success;
    };

    if (immediate) {
        const handleChange = (v: T) => {
            if (!validate(v)) return;
            onSave(v);
        };

        return (
            <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                    {isValidElement(children) &&
                        cloneElement(children, { value, onChange: handleChange })}
                </div>
            </div>
        );
    }

    return (
        <DebouncedSyncedField config={config} value={value} onSave={onSave} validate={validate}>
            {children}
        </DebouncedSyncedField>
    );
}

/** 디바운스 모드 — useFieldSync 사용 (훅 조건부 호출 방지용 분리) */
function DebouncedSyncedField<T>({
    config,
    value,
    onSave,
    validate,
    children,
}: {
    config: FieldSyncConfig<T>;
    value: T;
    onSave: (value: T) => void;
    validate: (v: T) => boolean;
    children: ReactElement<{ value?: T; onChange?: (value: T) => void }>;
}) {
    const handleSave = (v: T) => {
        if (!validate(v)) return;
        onSave(v);
    };

    const { localValue, setLocalValue, saveStatus } = useFieldSync({
        value,
        onSave: handleSave,
        debounceMs: config.debounceMs,
    });

    return (
        <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
                {isValidElement(children) &&
                    cloneElement(children, { value: localValue, onChange: setLocalValue })}
            </div>
            <div className="flex h-6 items-center pt-1">
                <SaveIndicator status={saveStatus} />
            </div>
        </div>
    );
}
```

**Step 2: index.ts 업데이트**

`shared-fields/index.ts`에서 `FieldSync` export를 `SyncedField`로 교체:

```ts
// 변경: export { default as FieldSync } from './FieldSync';
export { default as SyncedField } from './SyncedField';
```

**Step 3: 기존 FieldSync.tsx 삭제**

```bash
rm src/app/dashboard/components/ContentPanel/shared-fields/FieldSync.tsx
```

**Step 4: custom-blocks/ImageSection.tsx 업데이트**

`FieldSync` → `SyncedField` 전환:

```tsx
// Before:
// import { FieldSync, IMAGE_FIELD_CONFIG, ImageField } from '../shared-fields';
// <FieldSync config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleSave}>
//     {({ value, onChange: onFieldChange }) => (
//         <ImageField value={value} onChange={onFieldChange} disabled={disabled} />
//     )}
// </FieldSync>

// After:
import { IMAGE_FIELD_CONFIG, ImageField, SyncedField } from '../shared-fields';

<SyncedField config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleSave}>
    <ImageField disabled={disabled} />
</SyncedField>;
```

**Step 5: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor(shared-fields): replace FieldSync render-props with SyncedField cloneElement"
```

---

### Task 3: updateField mutation 추가

`use-mutations.ts`에 필드 단위 mutation을 추가한다.

**Files:**

- Modify: `src/app/dashboard/hooks/use-mutations.ts`

**Step 1: updateField mutation 추가**

`useEntryMutations` 내부, 기존 `update` mutation 아래에 추가:

```tsx
const updateField = useMutation(
    m<{ entryId: string; fieldKey: string; value: unknown }>({
        mutationFn: ({ entryId, fieldKey, value }, entries) => {
            const current = entries?.find((e) => e.id === entryId);
            if (!current) throw new Error('Entry not found in cache');
            const updated = { ...current, [fieldKey]: value } as ContentEntry;
            return updateEntry({ id: entryId, entry: updated });
        },
        optimisticUpdate: ({ entryId, fieldKey, value }, entries) =>
            entries.map((e) =>
                e.id === entryId ? ({ ...e, [fieldKey]: value } as ContentEntry) : e
            ),
        triggersPreview: ({ entryId, fieldKey }, snapshot) => {
            const entry = snapshot.find((e) => e.id === entryId);
            return entry ? hasPreviewField(entry.type, [fieldKey]) : false;
        },
        previewTarget: 'entry-detail',
    })
);
```

return 문에 `updateField` 추가:

```tsx
return {
    create,
    update,
    updateField, // 추가
    remove,
    // ...
};
```

**Step 2: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 3: Commit**

```bash
git add src/app/dashboard/hooks/use-mutations.ts
git commit -m "feat(mutations): add updateField mutation for per-field optimistic updates"
```

---

### Task 4: 개별 DetailView 컴포넌트 생성

3개의 개별 DetailView를 생성한다. UnifiedDetailView는 아직 삭제하지 않는다.

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/detail-views/EventDetailView.tsx`
- Create: `src/app/dashboard/components/ContentPanel/detail-views/MixsetDetailView.tsx`
- Create: `src/app/dashboard/components/ContentPanel/detail-views/LinkDetailView.tsx`
- Modify: `src/app/dashboard/components/ContentPanel/detail-views/types.ts`

**Step 1: types.ts에 타입별 props 추가**

```ts
// detail-views/types.ts
import type { ContentEntry, EventEntry, LinkEntry, MixsetEntry } from '@/types';

export type FieldSaveFn = (fieldKey: string, value: unknown) => void;

export interface EventDetailViewProps {
    entry: EventEntry;
    onSave: FieldSaveFn;
    disabled?: boolean;
}

export interface MixsetDetailViewProps {
    entry: MixsetEntry;
    onSave: FieldSaveFn;
    disabled?: boolean;
}

export interface LinkDetailViewProps {
    entry: LinkEntry;
    onSave: FieldSaveFn;
    disabled?: boolean;
}
```

**Step 2: EventDetailView.tsx 작성**

```tsx
// detail-views/EventDetailView.tsx
'use client';

import { useMemo } from 'react';

import type { EventEntry } from '@/types';

import {
    DATE_FIELD_CONFIG,
    DateField,
    IMAGE_FIELD_CONFIG,
    ImageField,
    LINEUP_FIELD_CONFIG,
    LineupField,
    SyncedField,
    TEXT_FIELD_CONFIG,
    TextField,
    VENUE_FIELD_CONFIG,
    VenueField,
} from '../shared-fields';
import type { ImageItem } from '../shared-fields/types';
import type { EventDetailViewProps } from './types';
import { urlToStableId } from './utils';

export default function EventDetailView({ entry, onSave, disabled }: EventDetailViewProps) {
    const imageItems: ImageItem[] = useMemo(
        () => entry.imageUrls.map((url) => ({ id: urlToStableId(url), url })),
        [entry.imageUrls]
    );

    const handleImageSave = (items: ImageItem[]) => {
        onSave(
            'imageUrls',
            items.map((item) => item.url)
        );
    };

    return (
        <div className="space-y-8">
            <SyncedField
                config={TEXT_FIELD_CONFIG}
                value={entry.title}
                onSave={(v) => onSave('title', v)}
            >
                <TextField
                    disabled={disabled}
                    placeholder="Event title"
                    className="text-center text-xl font-bold text-dashboard-text"
                />
            </SyncedField>

            <SyncedField config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleImageSave}>
                <ImageField disabled={disabled} aspectRatio="portrait" maxCount={10} />
            </SyncedField>

            <SyncedField
                config={DATE_FIELD_CONFIG}
                value={entry.date}
                onSave={(v) => onSave('date', v)}
            >
                <DateField disabled={disabled} />
            </SyncedField>

            <SyncedField
                config={VENUE_FIELD_CONFIG}
                value={entry.venue}
                onSave={(v) => onSave('venue', v)}
            >
                <VenueField disabled={disabled} />
            </SyncedField>

            <SyncedField
                config={LINEUP_FIELD_CONFIG}
                value={entry.lineup}
                onSave={(v) => onSave('lineup', v)}
            >
                <LineupField disabled={disabled} />
            </SyncedField>

            <div>
                <p className="mb-3 text-sm font-semibold text-dashboard-text">Description</p>
                <SyncedField
                    config={TEXT_FIELD_CONFIG}
                    value={entry.description || ''}
                    onSave={(v) => onSave('description', v)}
                >
                    <TextField
                        disabled={disabled}
                        variant="textarea"
                        placeholder="Add a description..."
                        className="text-sm leading-relaxed text-dashboard-text-muted"
                    />
                </SyncedField>
            </div>
        </div>
    );
}
```

**Step 3: MixsetDetailView.tsx 작성**

```tsx
// detail-views/MixsetDetailView.tsx
'use client';

import { useMemo } from 'react';

import type { MixsetEntry, TracklistItem } from '@/types';

import {
    IMAGE_FIELD_CONFIG,
    ImageField,
    KeyValueField,
    LinkField,
    SyncedField,
    TEXT_FIELD_CONFIG,
    TextField,
    TRACKLIST_FIELD_CONFIG,
    URL_FIELD_CONFIG,
} from '../shared-fields';
import type { ImageItem } from '../shared-fields/types';
import type { MixsetDetailViewProps } from './types';
import { urlToStableId } from './utils';

const TRACKLIST_COLUMNS = [
    {
        key: 'time',
        placeholder: '0:00',
        width: 'w-12 shrink-0',
        className: 'font-mono text-xs text-dashboard-text-placeholder',
    },
    { key: 'track', placeholder: 'Track title', width: 'min-w-0 flex-1' },
    {
        key: 'artist',
        placeholder: 'Artist',
        className: 'text-dashboard-text-placeholder',
    },
] as const;

const EMPTY_TRACK: TracklistItem = { track: '', artist: '', time: '0:00' };

export default function MixsetDetailView({ entry, onSave, disabled }: MixsetDetailViewProps) {
    const imageItems: ImageItem[] = useMemo(
        () => entry.imageUrls.map((url) => ({ id: urlToStableId(url), url })),
        [entry.imageUrls]
    );

    const handleImageSave = (items: ImageItem[]) => {
        onSave(
            'imageUrls',
            items.map((item) => item.url)
        );
    };

    return (
        <div className="space-y-8">
            <SyncedField
                config={TEXT_FIELD_CONFIG}
                value={entry.title}
                onSave={(v) => onSave('title', v)}
            >
                <TextField
                    disabled={disabled}
                    placeholder="Mixset title"
                    className="text-center text-xl font-bold text-dashboard-text"
                />
            </SyncedField>

            <SyncedField config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleImageSave}>
                <ImageField disabled={disabled} aspectRatio="square" maxCount={1} />
            </SyncedField>

            <SyncedField
                config={URL_FIELD_CONFIG}
                value={entry.url || ''}
                onSave={(v) => onSave('url', v)}
            >
                <LinkField disabled={disabled} />
            </SyncedField>

            <div>
                <p className="mb-3 text-sm font-semibold text-dashboard-text">Description</p>
                <SyncedField
                    config={TEXT_FIELD_CONFIG}
                    value={entry.description || ''}
                    onSave={(v) => onSave('description', v)}
                >
                    <TextField
                        disabled={disabled}
                        variant="textarea"
                        placeholder="Add a description..."
                        className="text-sm leading-relaxed text-dashboard-text-muted"
                    />
                </SyncedField>
            </div>

            <div>
                <h3 className="mb-4 text-sm font-semibold text-dashboard-text">Tracklist</h3>
                <SyncedField
                    config={TRACKLIST_FIELD_CONFIG}
                    value={entry.tracklist || []}
                    onSave={(v) => onSave('tracklist', v)}
                >
                    <KeyValueField
                        disabled={disabled}
                        columns={[...TRACKLIST_COLUMNS]}
                        emptyItem={EMPTY_TRACK}
                        addLabel="Add track"
                    />
                </SyncedField>
            </div>
        </div>
    );
}
```

**Step 4: LinkDetailView.tsx 작성**

```tsx
// detail-views/LinkDetailView.tsx
'use client';

import { useMemo } from 'react';

import type { LinkEntry } from '@/types';

import {
    ICON_FIELD_CONFIG,
    IconField,
    IMAGE_FIELD_CONFIG,
    ImageField,
    LinkField,
    SyncedField,
    TEXT_FIELD_CONFIG,
    TextField,
    URL_FIELD_CONFIG,
} from '../shared-fields';
import type { ImageItem } from '../shared-fields/types';
import type { LinkDetailViewProps } from './types';
import { urlToStableId } from './utils';

export default function LinkDetailView({ entry, onSave, disabled }: LinkDetailViewProps) {
    const imageItems: ImageItem[] = useMemo(
        () => entry.imageUrls.map((url) => ({ id: urlToStableId(url), url })),
        [entry.imageUrls]
    );

    const handleImageSave = (items: ImageItem[]) => {
        onSave(
            'imageUrls',
            items.map((item) => item.url)
        );
    };

    return (
        <div className="space-y-8">
            <SyncedField
                config={ICON_FIELD_CONFIG}
                value={entry.icon || ''}
                onSave={(v) => onSave('icon', v)}
            >
                <IconField disabled={disabled} />
            </SyncedField>

            <SyncedField
                config={TEXT_FIELD_CONFIG}
                value={entry.title}
                onSave={(v) => onSave('title', v)}
            >
                <TextField
                    disabled={disabled}
                    placeholder="Link title"
                    className="text-center text-xl font-bold text-dashboard-text"
                />
            </SyncedField>

            <SyncedField config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={handleImageSave}>
                <ImageField disabled={disabled} aspectRatio="video" maxCount={1} />
            </SyncedField>

            <SyncedField
                config={URL_FIELD_CONFIG}
                value={entry.url || ''}
                onSave={(v) => onSave('url', v)}
            >
                <LinkField disabled={disabled} />
            </SyncedField>

            <div>
                <p className="mb-3 text-sm font-semibold text-dashboard-text">Description</p>
                <SyncedField
                    config={TEXT_FIELD_CONFIG}
                    value={entry.description || ''}
                    onSave={(v) => onSave('description', v)}
                >
                    <TextField
                        disabled={disabled}
                        variant="textarea"
                        placeholder="Add a description..."
                        className="text-sm leading-relaxed text-dashboard-text-muted"
                    />
                </SyncedField>
            </div>
        </div>
    );
}
```

**Step 5: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 6: Commit**

```bash
git add src/app/dashboard/components/ContentPanel/detail-views/
git commit -m "feat(detail-views): create EventDetailView, MixsetDetailView, LinkDetailView"
```

---

### Task 5: EntryDetailView 리팩터링 — 이중 버퍼링 제거 + 헤더 indicator

localEntry/useDebouncedSave를 제거하고, TQ 직결 구조로 전환한다.
헤더의 텍스트 save status를 아이콘+애니메이션으로 교체한다.

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/EntryDetailView.tsx`

**Step 1: EntryDetailView 리팩터링**

전체 파일을 다음으로 교체:

```tsx
// EntryDetailView.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';

import { AlertCircle, ArrowLeft, Check, Loader2, MoreHorizontal } from 'lucide-react';

import type { ContentEntry, CustomEntry } from '@/types';
import { ENTRY_TYPE_CONFIG } from '@/app/dashboard/config/entryConfig';
import { canAddToView, getMissingFieldLabels } from '@/app/dashboard/config/entryFieldConfig';
import { EDITOR_MENU_CONFIG, resolveMenuItems } from '@/app/dashboard/config/menuConfig';
import { TypeBadge } from '@/components/dna';
import { Button } from '@/components/ui/button';
import { SimpleDropdown } from '@/components/ui/simple-dropdown';

import { useEntryDetail, useEntryMutations } from '../../hooks';
import { useConfirmAction } from '../../hooks/use-confirm-action';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import CustomEntryEditor from './CustomEntryEditor';
import EventDetailView from './detail-views/EventDetailView';
import LinkDetailView from './detail-views/LinkDetailView';
import MixsetDetailView from './detail-views/MixsetDetailView';

// ============================================
// Header Save Indicator
// ============================================

function HeaderSaveIndicator({ status }: { status: 'idle' | 'pending' | 'success' | 'error' }) {
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (status === 'success') {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
        setShowSuccess(false);
    }, [status]);

    if (status === 'pending') {
        return <Loader2 className="h-3.5 w-3.5 animate-spin text-dashboard-text-muted" />;
    }

    if (showSuccess) {
        return <Check className="h-3.5 w-3.5 text-green-500 duration-200 animate-in fade-in" />;
    }

    if (status === 'error') {
        return (
            <span className="flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-dashboard-danger" />
                <span className="text-xs text-dashboard-danger">Save failed</span>
            </span>
        );
    }

    return null;
}

// ============================================
// EntryDetailView
// ============================================

interface EntryDetailViewProps {
    entryId: string;
    onBack?: () => void;
}

export default function EntryDetailView({ entryId, onBack }: EntryDetailViewProps) {
    const { data: entry } = useEntryDetail(entryId);
    const { updateField, remove: deleteMutation } = useEntryMutations();

    const confirmAction = useConfirmAction();

    // Field-level save — SyncedField debounce 후 직접 호출됨
    const handleFieldSave = useCallback(
        (fieldKey: string, value: unknown) => {
            updateField.mutate({ entryId, fieldKey, value });
        },
        [entryId, updateField]
    );

    // Custom entry — blocks 저장 (debounce는 CustomEntryEditor 내부에서 처리)
    const handleBlocksSave = useCallback(
        (blocks: CustomEntry['blocks']) => {
            updateField.mutate({ entryId, fieldKey: 'blocks', value: blocks });
        },
        [entryId, updateField]
    );

    // Delete handler
    const handleDelete = async () => {
        await deleteMutation.mutateAsync(entry.id);
        onBack?.();
    };

    const config = ENTRY_TYPE_CONFIG[entry.type];

    // Warning for view-readiness
    const isViewReady = canAddToView(entry);
    const missingFields = isViewReady ? [] : getMissingFieldLabels(entry, 'create');

    // "..." menu items
    const menuConfig = EDITOR_MENU_CONFIG[entry.type];
    const handlers = confirmAction.wrapHandlers(
        menuConfig,
        { delete: handleDelete },
        entry as unknown as Record<string, unknown>
    );
    const menuItems = resolveMenuItems(menuConfig, handlers);

    return (
        <div className="flex h-full flex-col">
            {/* Editor Header */}
            <div className="flex items-center justify-between border-b border-dashboard-border/50 px-6 py-4">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="flex items-center gap-1.5 text-sm text-dashboard-text-muted transition-colors hover:text-dashboard-text"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                    )}
                    <TypeBadge type={config.badgeType} size="sm" />
                    <HeaderSaveIndicator status={updateField.status} />
                    {!isViewReady && (
                        <span
                            title={`Required to add to Page: ${missingFields.join(', ')}`}
                            className="flex items-center gap-1.5"
                        >
                            <AlertCircle className="h-3.5 w-3.5 text-dashboard-warning" />
                            <span className="text-xs text-dashboard-warning">Incomplete</span>
                        </span>
                    )}
                </div>
                <SimpleDropdown
                    trigger={
                        <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    }
                    items={menuItems}
                />
            </div>

            {/* Detail View Content */}
            <div className="scrollbar-thin flex-1 overflow-y-auto p-6">
                {entry.type === 'custom' ? (
                    <>
                        <input
                            value={entry.title}
                            onChange={(e) => handleFieldSave('title', e.target.value)}
                            placeholder="Untitled"
                            className="mb-6 w-full bg-transparent text-xl font-semibold text-dashboard-text outline-none placeholder:text-dashboard-text-placeholder"
                        />
                        <CustomEntryEditor
                            entry={entry as CustomEntry}
                            onBlocksChange={handleBlocksSave}
                        />
                    </>
                ) : entry.type === 'event' ? (
                    <EventDetailView entry={entry} onSave={handleFieldSave} />
                ) : entry.type === 'mixset' ? (
                    <MixsetDetailView entry={entry} onSave={handleFieldSave} />
                ) : entry.type === 'link' ? (
                    <LinkDetailView entry={entry} onSave={handleFieldSave} />
                ) : null}
            </div>

            <ConfirmDialog
                pending={confirmAction.pending}
                matchValue={confirmAction.matchValue}
                onConfirm={confirmAction.confirm}
                onClose={confirmAction.close}
            />
        </div>
    );
}
```

**주요 변경 사항 확인:**

- `localEntry`, `localEntryRef`, `useDebouncedSave`, `handleFieldSave` options.immediate 분기 → 삭제
- `getSaveStatus()` 텍스트 → `HeaderSaveIndicator` 컴포넌트로 교체
- `updateField.mutate` 직접 호출
- entry는 `useEntryDetail`에서 TQ 캐시 직접 참조

**Step 2: CustomEntryEditor 인터페이스 확인**

`CustomEntryEditor`의 `onBlocksChange` prop이 `(blocks) => void`인지 확인. 기존에는 `setLocalEntry` 후 `debouncedSave`를 호출했으므로, 이제 `updateField.mutate`로 교체됨. CustomEntryEditor 내부에 자체 debounce가 있다면 그대로 유지.

Run: `grep -n 'onBlocksChange' src/app/dashboard/components/ContentPanel/CustomEntryEditor.tsx | head -5`

**Step 3: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (CustomEntryEditor 인터페이스 불일치 시 조정 필요)

**Step 4: Commit**

```bash
git add src/app/dashboard/components/ContentPanel/EntryDetailView.tsx
git commit -m "refactor(EntryDetailView): remove double buffering, add header save indicator"
```

---

### Task 6: UnifiedDetailView + detailViewConfig 삭제 & 정리

**Files:**

- Delete: `src/app/dashboard/components/ContentPanel/detail-views/UnifiedDetailView.tsx`
- Delete: `src/app/dashboard/config/detailViewConfig.ts`
- Modify: `src/app/dashboard/components/ContentPanel/shared-fields/index.ts` (불필요한 FieldSync re-export 정리)

**Step 1: 삭제 대상에 대한 import 참조 확인**

Run: `grep -r 'UnifiedDetailView\|detailViewConfig' src/ --include='*.ts' --include='*.tsx' -l`

Expected: `EntryDetailView.tsx`에서만 참조 (이미 Task 5에서 제거됨)

**Step 2: 파일 삭제**

```bash
rm src/app/dashboard/components/ContentPanel/detail-views/UnifiedDetailView.tsx
rm src/app/dashboard/config/detailViewConfig.ts
```

**Step 3: 빌드 확인**

Run: `npx tsc --noEmit`
Expected: 에러 없음

**Step 4: 기존 테스트 실행**

Run: `npx vitest run`
Expected: 모든 테스트 통과

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove UnifiedDetailView and detailViewConfig"
```

---

### Task 7: 수동 검증

**Step 1: 개발 서버 실행 후 기능 테스트**

Run: `npm run dev`

**검증 항목:**

1. Event entry 열기 → 모든 필드 편집 가능, save indicator 동작 (title 타이핑 시 amber dot → 체크)
2. Mixset entry 열기 → tracklist 추가/삭제, URL 편집, save indicator 동작
3. Link entry 열기 → icon 변경, URL 편집, save indicator 동작
4. Custom entry 열기 → blocks 편집 동작 확인
5. 헤더 indicator → mutation pending 시 spinner, success 시 체크 fade out
6. Entry 삭제 → confirm dialog → 정상 삭제

**Step 2: 페이지 새로고침 후 데이터 유지 확인**

편집 후 페이지 새로고침 → 변경 사항이 서버에 저장되어 유지되는지 확인.

---

### Summary: 삭제 대상 전체 목록

| 파일/코드                                             | 상태                           |
| ----------------------------------------------------- | ------------------------------ |
| `shared-fields/FieldSync.tsx`                         | 삭제 (SyncedField로 대체)      |
| `config/detailViewConfig.ts`                          | 삭제                           |
| `detail-views/UnifiedDetailView.tsx`                  | 삭제                           |
| `EntryDetailView.tsx` 내 `useDebouncedSave`           | 삭제                           |
| `EntryDetailView.tsx` 내 `localEntry`/`localEntryRef` | 삭제                           |
| `detail-views/types.ts` 내 `SaveOptions` re-export    | 삭제 (SyncedField가 내부 처리) |
