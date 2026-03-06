# Shared-Fields Cleanup & Block Renderer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** shared-fields를 ContentPanel에서 분리하고, custom-blocks Section을 config-driven BlockFieldRenderer로 교체하며, 미사용 코드를 정리한다.

**Architecture:** fields/ 디렉토리를 dashboard/components/ 직하로 승격하고, 타입을 fields/types.ts에 통합한다. custom-blocks의 Section 5개를 BLOCK_FIELD_DEFS config + BlockFieldRenderer로 대체하여 모든 블록이 FieldSync 파이프라인을 경유하게 한다.

**Tech Stack:** React, TypeScript, dnd-kit, Zod

---

## Task 1: alt/caption 삭제 + editable-field 삭제

독립적인 정리 작업. 다른 태스크에 영향 없음.

**Files:**

- Modify: `src/types/domain.ts:71-75` (ImageBlockData)
- Modify: `src/app/dashboard/components/ContentPanel/shared-fields/types.ts:8-14` (ImageItem)
- Modify: `src/app/dashboard/config/customBlockConfig.ts:47-51,85` (image schema, defaultData)
- Modify: `src/app/dashboard/components/ContentPanel/custom-blocks/ImageSection.tsx:13-19` (변환 로직)
- Modify: `src/app/dashboard/components/ContentPanel/shared-fields/image/ImageCard.tsx:67` (alt prop)
- Modify: `src/app/dashboard/components/ContentPanel/shared-fields/image/ImageField.tsx:188` (alt prop)
- Delete: `src/components/ui/editable-field.tsx`

**Step 1: ImageBlockData에서 alt/caption 제거**

`src/types/domain.ts` — ImageBlockData를 `{ url: string }`으로 축소:

```ts
// Before
export interface ImageBlockData {
    url: string;
    alt?: string;
    caption?: string;
}

// After
export interface ImageBlockData {
    url: string;
}
```

**Step 2: ImageItem에서 alt/caption 제거**

`src/app/dashboard/components/ContentPanel/shared-fields/types.ts`:

```ts
// Before
export interface ImageItem {
    id: string;
    url: string;
    alt?: string;
    caption?: string;
}

// After
export interface ImageItem {
    id: string;
    url: string;
}
```

**Step 3: customBlockConfig image schema/defaultData 정리**

`src/app/dashboard/config/customBlockConfig.ts`:

```ts
// Before
image: z.object({
    url: z.string().min(1, 'Image URL is required'),
    alt: z.string().optional(),
    caption: z.string().optional(),
}),
// ...
defaultData: () => ({ url: '', alt: undefined, caption: undefined }),

// After
image: z.object({
    url: z.string().min(1, 'Image URL is required'),
}),
// ...
defaultData: () => ({ url: '' }),
```

**Step 4: ImageSection 변환 로직 단순화**

`src/app/dashboard/components/ContentPanel/custom-blocks/ImageSection.tsx`:

```ts
// Before
const imageItems: ImageItem[] = data.url
    ? [{ id: 'block-img', url: data.url, alt: data.alt, caption: data.caption }]
    : [];

const handleSave = (items: ImageItem[]) => {
    const first = items[0];
    onChange({ url: first?.url || '', alt: first?.alt, caption: first?.caption });
};

// After
const imageItems: ImageItem[] = data.url ? [{ id: 'block-img', url: data.url }] : [];

const handleSave = (items: ImageItem[]) => {
    onChange({ url: items[0]?.url || '' });
};
```

**Step 5: ImageCard/ImageField의 alt 참조 정리**

`ImageCard.tsx:67` — `alt={item.alt || ''}` → `alt=""`
`ImageField.tsx:188` — `alt={activeItem.alt || ''}` → `alt=""`

**Step 6: editable-field.tsx 삭제**

```bash
rm src/components/ui/editable-field.tsx
```

**Step 7: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: PASS (alt/caption이 optional이었으므로 참조 제거만으로 충분)

**Step 8: Commit**

```bash
git add -A
git commit -m "refactor(fields): remove alt/caption from ImageBlockData/ImageItem + delete editable-field"
```

---

## Task 2: 타입 통합 — SaveOptions + FieldSyncConfig를 fields/types.ts로 이동

디렉토리 이동(Task 3) 전에 타입 위치를 정리. 역방향 import 해소.

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/shared-fields/types.ts`
- Modify: `src/app/dashboard/components/ContentPanel/shared-fields/FieldSync.tsx`
- Modify: `src/app/dashboard/components/ContentPanel/detail-views/types.ts`
- Modify: `src/app/dashboard/config/fieldConfigs.ts`
- Modify: `src/app/dashboard/components/ContentPanel/shared-fields/index.ts`

**Step 1: SaveOptions + FieldSyncConfig를 shared-fields/types.ts로 이동**

`shared-fields/types.ts`에 추가:

```ts
import type { ZodSchema } from 'zod';

/** 저장 옵션 — immediate 여부 */
export interface SaveOptions {
    immediate?: boolean;
}

/** FieldSync 설정 — 저장 전략 + 검증 */
export interface FieldSyncConfig<T> {
    immediate?: boolean;
    schema?: ZodSchema;
    debounceMs?: number;
}
```

**Step 2: FieldSync.tsx에서 FieldSyncConfig 정의 제거, types.ts에서 import**

```ts
// Before (FieldSync.tsx)
export interface FieldSyncConfig<T> { ... }
import type { SaveOptions } from '../detail-views/types';

// After (FieldSync.tsx)
import type { FieldSyncConfig, SaveOptions } from './types';
```

**Step 3: detail-views/types.ts에서 SaveOptions 제거, re-export**

```ts
// Before
export interface SaveOptions {
    immediate?: boolean;
}

// After
export type { SaveOptions } from '../../fields/types';
// (임시 — Task 3 디렉토리 이동 후 경로 변경)
```

실제로는 detail-views/types.ts에서 SaveOptions를 제거하고, 소비자들이 shared-fields에서 import하도록 변경.

**Step 4: fieldConfigs.ts import 경로 수정**

```ts
// Before
import type { FieldSyncConfig } from '@/app/dashboard/components/ContentPanel/shared-fields/FieldSync';
// After
import type { FieldSyncConfig } from '@/app/dashboard/components/ContentPanel/shared-fields/types';
```

**Step 5: index.ts에서 FieldSyncConfig export 유지**

shared-fields/index.ts에서 이미 `FieldSyncConfig`를 re-export하므로 소스만 변경.

```ts
// Before
export type { FieldSyncConfig } from './FieldSync';

// After
export type { FieldSyncConfig } from './types';
```

**Step 6: 타입 체크 + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "refactor(fields): consolidate SaveOptions + FieldSyncConfig into shared-fields/types"
```

---

## Task 3: 디렉토리 이동 — shared-fields → fields/

ContentPanel 종속을 제거하여 재사용 가능하게 한다.

**Files:**

- Move: `src/app/dashboard/components/ContentPanel/shared-fields/` → `src/app/dashboard/components/fields/`
- Update: 모든 import 경로 (6+ 파일)

**Step 1: 디렉토리 이동**

```bash
mv src/app/dashboard/components/ContentPanel/shared-fields src/app/dashboard/components/fields
```

**Step 2: 내부 import 수정**

fields/ 내부 파일은 상대 경로를 사용하므로 변경 불필요. 단, FieldSync.tsx의 `use-field-sync` import 확인:

```ts
// FieldSync.tsx — 이미 절대 경로 사용
import { useFieldSync } from '@/app/dashboard/hooks/use-field-sync';

// → 변경 없음
```

**Step 3: 외부 소비자 import 경로 일괄 수정**

변경이 필요한 파일 목록과 패턴:

| 파일                               | Before                                                      | After                                   |
| ---------------------------------- | ----------------------------------------------------------- | --------------------------------------- |
| detail-views/UnifiedDetailView.tsx | `../shared-fields`                                          | `../../fields`                          |
| custom-blocks/ImageSection.tsx     | `../shared-fields`                                          | `../../fields`                          |
| custom-blocks/EmbedSection.tsx     | `../shared-fields/EmbedField`                               | `../../fields/EmbedField`               |
| custom-blocks/RichTextSection.tsx  | `../shared-fields/TextField`                                | `../../fields/TextField`                |
| custom-blocks/KeyValueSection.tsx  | `../shared-fields/KeyValueField`                            | `../../fields/KeyValueField`            |
| config/fieldConfigs.ts             | `@/app/dashboard/components/ContentPanel/shared-fields/...` | `@/app/dashboard/components/fields/...` |
| config/detailViewConfig.ts         | `@/app/dashboard/components/ContentPanel/shared-fields/...` | `@/app/dashboard/components/fields/...` |

**Step 4: 타입 체크 + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "refactor(fields): move shared-fields → fields/ (ContentPanel 종속 제거)"
```

---

## Task 4: KEYVALUE_FIELD_CONFIG 추가

BlockFieldRenderer에서 사용할 keyvalue 전용 config.

**Files:**

- Modify: `src/app/dashboard/config/fieldConfigs.ts`
- Modify: `src/app/dashboard/components/fields/index.ts` (re-export)

**Step 1: fieldConfigs.ts에 추가**

```ts
export const KEYVALUE_FIELD_CONFIG: FieldSyncConfig<{ key: string; value: string }[]> = {
    debounceMs: 800,
};
```

**Step 2: index.ts에 re-export 추가**

```ts
export { KEYVALUE_FIELD_CONFIG } from '@/app/dashboard/config/fieldConfigs';
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(fields): add KEYVALUE_FIELD_CONFIG for block keyvalue fields"
```

---

## Task 5: BlockFieldRenderer 생성 + Section 삭제

핵심 작업. SECTION_BLOCK_CONFIG에 fields 배열을 추가하고, BlockFieldRenderer를 만들어 Section 5개를 대체.

**Files:**

- Modify: `src/app/dashboard/config/customBlockConfig.ts` (BlockFieldDef 추가)
- Create: `src/app/dashboard/components/ContentPanel/BlockFieldRenderer.tsx`
- Modify: `src/app/dashboard/components/ContentPanel/CustomEntryEditor.tsx` (Section → BlockFieldRenderer)
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/ImageSection.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/EmbedSection.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/HeaderSection.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/RichTextSection.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/KeyValueSection.tsx`
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/types.ts`
- Delete: `src/app/dashboard/components/ContentPanel/custom-blocks/index.ts`
- Move: `src/app/dashboard/components/ContentPanel/custom-blocks/BlockWrapper.tsx` → `src/app/dashboard/components/ContentPanel/BlockWrapper.tsx`

**Step 1: BlockFieldDef 타입 + BLOCK_FIELD_DEFS config 작성**

`src/app/dashboard/config/customBlockConfig.ts`에 추가:

```ts
import type { ComponentType } from 'react';

import type { FieldComponentProps, FieldSyncConfig } from '@/app/dashboard/components/fields/types';

export interface BlockFieldDef {
    /** block.data 내 키. '$root'이면 블록 data 전체를 transform */
    dataKey: string;
    component: ComponentType<FieldComponentProps<any> & Record<string, unknown>>;
    fieldConfig: FieldSyncConfig<any>;
    props?: Record<string, unknown>;
    toFieldValue?: (data: any) => any;
    fromFieldValue?: (fieldValue: any) => any;
}
```

`SECTION_BLOCK_CONFIG`에 `fields` 배열을 추가하여 확장:

```ts
import { urlToStableId } from '@/app/dashboard/components/ContentPanel/detail-views/utils';
import EmbedField from '@/app/dashboard/components/fields/EmbedField';
import { ImageField } from '@/app/dashboard/components/fields/image';
import KeyValueField from '@/app/dashboard/components/fields/KeyValueField';
import TextField from '@/app/dashboard/components/fields/TextField';

import {
    IMAGE_FIELD_CONFIG,
    KEYVALUE_FIELD_CONFIG,
    TEXT_FIELD_CONFIG,
    URL_FIELD_CONFIG,
} from './fieldConfigs';

// SECTION_BLOCK_CONFIG에 fields 추가 — 기존 icon/label/schema/defaultData 유지
export const SECTION_BLOCK_CONFIG: Record<SectionBlockType, SectionBlockConfig> = {
    header: {
        // ...기존 필드 유지
        fields: [
            {
                dataKey: 'title',
                component: TextField,
                fieldConfig: TEXT_FIELD_CONFIG,
                props: {
                    placeholder: 'Heading',
                    className: 'text-lg font-bold text-dashboard-text',
                },
            },
            {
                dataKey: 'subtitle',
                component: TextField,
                fieldConfig: TEXT_FIELD_CONFIG,
                props: { placeholder: 'Subtitle (optional)' },
            },
        ],
    },
    richtext: {
        // ...기존 필드 유지
        fields: [
            {
                dataKey: 'content',
                component: TextField,
                fieldConfig: TEXT_FIELD_CONFIG,
                props: { variant: 'textarea', placeholder: 'Write something...', rows: 3 },
            },
        ],
    },
    image: {
        // ...기존 필드 유지
        fields: [
            {
                dataKey: '$root',
                component: ImageField,
                fieldConfig: IMAGE_FIELD_CONFIG,
                props: { maxCount: 1 },
                toFieldValue: (data: { url: string }) =>
                    data.url ? [{ id: urlToStableId(data.url), url: data.url }] : [],
                fromFieldValue: (items: { url: string }[]) => ({
                    url: items[0]?.url || '',
                }),
            },
        ],
    },
    embed: {
        // ...기존 필드 유지
        fields: [
            {
                dataKey: 'url',
                component: EmbedField,
                fieldConfig: URL_FIELD_CONFIG,
            },
        ],
    },
    keyvalue: {
        // ...기존 필드 유지
        fields: [
            {
                dataKey: 'items',
                component: KeyValueField,
                fieldConfig: KEYVALUE_FIELD_CONFIG,
                props: {
                    columns: [
                        {
                            key: 'key',
                            placeholder: 'Label',
                            width: 'w-28 shrink-0',
                            className: 'font-medium text-dashboard-text-secondary',
                        },
                        { key: 'value', placeholder: 'Value', width: 'flex-1' },
                    ],
                    emptyItem: { key: '', value: '' },
                    addLabel: 'Add field',
                },
            },
        ],
    },
};
```

**주의:** `SectionBlockConfig` interface에 `fields: BlockFieldDef[]` 추가 필요.

**Step 2: BlockFieldRenderer 생성**

`src/app/dashboard/components/ContentPanel/BlockFieldRenderer.tsx`:

```tsx
'use client';

import type { SectionBlockDataMap, SectionBlockType } from '@/types';
import FieldSync from '@/app/dashboard/components/fields/FieldSync';
import { SECTION_BLOCK_CONFIG, type BlockFieldDef } from '@/app/dashboard/config/customBlockConfig';

interface BlockFieldRendererProps {
    blockType: SectionBlockType;
    data: SectionBlockDataMap[SectionBlockType];
    onChange: (data: SectionBlockDataMap[SectionBlockType]) => void;
    disabled?: boolean;
}

export default function BlockFieldRenderer({
    blockType,
    data,
    onChange,
    disabled,
}: BlockFieldRendererProps) {
    const { fields } = SECTION_BLOCK_CONFIG[blockType];

    return (
        <>
            {fields.map((fieldDef: BlockFieldDef) => {
                const value = fieldDef.toFieldValue
                    ? fieldDef.toFieldValue(data)
                    : (data as Record<string, unknown>)[fieldDef.dataKey];

                const handleSave = (newValue: unknown) => {
                    if (fieldDef.fromFieldValue) {
                        onChange(fieldDef.fromFieldValue(newValue));
                    } else {
                        onChange({ ...data, [fieldDef.dataKey]: newValue } as typeof data);
                    }
                };

                const Component = fieldDef.component;

                return (
                    <FieldSync
                        key={fieldDef.dataKey}
                        config={fieldDef.fieldConfig}
                        value={value}
                        onSave={handleSave}
                    >
                        {({ value: syncedValue, onChange: syncedOnChange }) => (
                            <Component
                                value={syncedValue}
                                onChange={syncedOnChange}
                                disabled={disabled}
                                {...fieldDef.props}
                            />
                        )}
                    </FieldSync>
                );
            })}
        </>
    );
}
```

**Step 3: BlockWrapper 이동**

```bash
mv src/app/dashboard/components/ContentPanel/custom-blocks/BlockWrapper.tsx \
   src/app/dashboard/components/ContentPanel/BlockWrapper.tsx
```

**Step 4: CustomEntryEditor에서 Section → BlockFieldRenderer 교체**

`src/app/dashboard/components/ContentPanel/CustomEntryEditor.tsx`:

```tsx
// Before
import {
    EmbedSection, HeaderSection, ImageSection,
    KeyValueSection, RichTextSection,
} from './custom-blocks';
import BlockWrapper from './custom-blocks/BlockWrapper';
import type { SectionBlockEditorProps } from './custom-blocks/types';

const BLOCK_COMPONENT_MAP: Record<SectionBlockType, ComponentType<SectionBlockEditorProps<any>>> = {
    header: HeaderSection,
    richtext: RichTextSection,
    image: ImageSection,
    embed: EmbedSection,
    keyvalue: KeyValueSection,
};

// SortableBlock 내부:
const BlockComponent = BLOCK_COMPONENT_MAP[block.type];
<BlockWrapper ...>
    <BlockComponent
        data={block.data as any}
        onChange={(newData) => onUpdate(block.id, newData)}
        disabled={disabled}
    />
</BlockWrapper>

// After
import BlockFieldRenderer from './BlockFieldRenderer';
import BlockWrapper from './BlockWrapper';

// SortableBlock 내부 — BLOCK_COMPONENT_MAP 삭제:
<BlockWrapper ...>
    <BlockFieldRenderer
        blockType={block.type}
        data={block.data}
        onChange={(newData) => onUpdate(block.id, newData)}
        disabled={disabled}
    />
</BlockWrapper>
```

`ComponentType` import, `SectionBlockEditorProps` import, `BLOCK_COMPONENT_MAP` 상수 모두 제거.

**Step 5: custom-blocks 디렉토리 삭제**

```bash
rm -rf src/app/dashboard/components/ContentPanel/custom-blocks/
```

**Step 6: 타입 체크 + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "refactor(blocks): replace Section components with config-driven BlockFieldRenderer"
```

---

## Task 6: VenueField query/onChange 상태 분리

**Files:**

- Modify: `src/app/dashboard/components/fields/VenueField.tsx`

**Step 1: query state를 searchQuery + inputValue로 분리**

현재 `query` state 하나가 검색 API와 표시값 양쪽에 사용됨. 분리:

```tsx
// Before
const [query, setQuery] = useState('');

// input onChange:
const v = e.target.value;
setQuery(v);
onChange({ name: v });

// search effect:
useEffect(() => {
    if (query.length < 1) { ... }
    const timer = setTimeout(async () => {
        const data = await searchVenues(query);
        ...
    }, 300);
}, [query]);

// input value:
value={query || value.name}

// After
const [inputValue, setInputValue] = useState(value.name);
const [searchQuery, setSearchQuery] = useState('');

// 외부 value 동기화
useEffect(() => {
    if (!value.id) {
        setInputValue(value.name);
    }
}, [value]);

// input onChange:
const v = e.target.value;
setInputValue(v);
setSearchQuery(v);
onChange({ name: v });

// search effect — searchQuery 기반:
useEffect(() => {
    if (searchQuery.length < 1) {
        setResults([]);
        setIsOpen(false);
        return;
    }
    const timer = setTimeout(async () => {
        setIsLoading(true);
        try {
            const data = await searchVenues(searchQuery);
            setResults(toSearchResults(data));
            setIsOpen(true);
            setHighlightedIndex(-1);
        } catch {
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, 300);
    return () => clearTimeout(timer);
}, [searchQuery]);

// input value:
value={inputValue}

// handleSelect:
const handleSelect = useCallback((result: SearchResult) => {
    onChange({ id: result.id, name: result.name });
    setInputValue(result.name);
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
}, [onChange]);

// handleClear:
const handleClear = useCallback(() => {
    onChange({ name: '' });
    setInputValue('');
    setSearchQuery('');
    inputRef.current?.focus();
}, [onChange]);
```

**Step 2: 타입 체크 + Commit**

```bash
npx tsc --noEmit
git add -A
git commit -m "refactor(VenueField): separate searchQuery from inputValue for clarity"
```

---

## Task 7: KeyValueField key 안정성 GitHub 이슈 생성

구현 작업 아님. 내용:

**Title:** `refactor(KeyValueField): improve React key stability for dynamic rows`

**Body:**
KeyValueField의 `keysRef` + `nextKeyRef` 패턴에서 key가 monotonically 증가만 하고 재활용되지 않음.
외부에서 아이템 삭제 후 추가 시 key가 계속 커지기만 함.
기능상 문제는 없으나 구조적 개선 권장.

옵션: 각 row에 stable ID를 부여하거나, value 기반 key 생성.

---

## 실행 순서 요약

| Task | 의존성    | 설명                                      |
| ---- | --------- | ----------------------------------------- |
| 1    | 없음      | alt/caption 삭제 + editable-field 삭제    |
| 2    | 없음      | 타입 통합 (SaveOptions + FieldSyncConfig) |
| 3    | Task 2    | 디렉토리 이동 (shared-fields → fields/)   |
| 4    | Task 3    | KEYVALUE_FIELD_CONFIG 추가                |
| 5    | Task 3, 4 | BlockFieldRenderer + Section 삭제         |
| 6    | Task 3    | VenueField 상태 분리                      |
| 7    | 없음      | GitHub 이슈 생성                          |

Task 1, 2, 7은 병렬 실행 가능.
