# Block-Based Field Unification Implementation Plan (Phase 1: Image)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** ImageField 코어 컴포넌트를 만들어 Event(posterUrl)와 Custom(image block) 양쪽에서 공유하는 구조를 확립한다.

**Architecture:** 3-Layer (코어 필드 + useFieldSync 훅 + BlockWrapper). 코어 필드는 블록/필수 여부를 모르는 순수 UI. Event는 직접 렌더링, Custom은 BlockWrapper로 감싸서 삭제/드래그 크롬을 추가.

**Tech Stack:** React, TypeScript, Next.js Image, dnd-kit, Zod

**Design Doc:** `docs/plans/2026-03-06-block-based-field-unification-design.md`

**GitHub Issue:** #108

---

### Task 1: shared-fields 타입 정의

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/shared-fields/types.ts`

**Step 1: 타입 파일 생성**

```typescript
// shared-fields/types.ts
import type { ComponentType } from 'react';

/** 모든 코어 필드 컴포넌트의 기본 props */
export interface FieldComponentProps<T> {
    value: T;
    onChange: (value: T) => void;
    disabled?: boolean;
}

/** 이미지 필드 값 (ImageBlockData와 동일 구조) */
export interface ImageFieldValue {
    url: string;
    alt?: string;
    caption?: string;
}

/** 이미지 필드 aspect ratio 옵션 */
export type ImageAspectRatio = 'video' | 'square' | 'portrait';

/** ImageField 전용 props */
export interface ImageFieldProps extends FieldComponentProps<ImageFieldValue> {
    aspectRatio?: ImageAspectRatio;
    placeholder?: {
        icon?: ComponentType<{ className?: string }>;
        text?: string;
    };
}
```

**Step 2: 타입 체크**

Run: `./node_modules/.bin/tsc --noEmit --pretty`
Expected: PASS (no errors related to new file)

**Step 3: Commit**

```
feat(shared-fields): add core field component types (#108)
```

---

### Task 2: useFieldSync 훅

**Files:**

- Create: `src/app/dashboard/hooks/use-field-sync.ts`

**Step 1: 훅 구현**

```typescript
// hooks/use-field-sync.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseFieldSyncOptions<T> {
    /** 서버 상태 (외부에서 주입) */
    value: T;
    /** 저장 콜백 — 디바운스 후 호출됨 */
    onSave: (value: T) => void;
    /** 디바운스 ms (기본 800) */
    debounceMs?: number;
    /** 비교 함수 (기본: JSON.stringify 비교) */
    isEqual?: (a: T, b: T) => boolean;
}

interface UseFieldSyncReturn<T> {
    /** 낙관적 로컬 상태 */
    localValue: T;
    /** 로컬 업데이트 + 디바운스 저장 트리거 */
    setLocalValue: (value: T) => void;
    /** 저장 상태 */
    saveStatus: SaveStatus;
}

const defaultIsEqual = <T>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);

export function useFieldSync<T>({
    value,
    onSave,
    debounceMs = 800,
    isEqual = defaultIsEqual,
}: UseFieldSyncOptions<T>): UseFieldSyncReturn<T> {
    const [localValue, setLocalState] = useState<T>(value);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const latestLocalRef = useRef<T>(localValue);
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;

    // 외부 값 동기화 — 로컬 변경 없으면 서버 값으로 업데이트
    useEffect(() => {
        if (!timeoutRef.current && !isEqual(latestLocalRef.current, value)) {
            setLocalState(value);
            latestLocalRef.current = value;
        }
    }, [value, isEqual]);

    const setLocalValue = useCallback(
        (newValue: T) => {
            setLocalState(newValue);
            latestLocalRef.current = newValue;
            setSaveStatus('saving');

            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            timeoutRef.current = setTimeout(() => {
                timeoutRef.current = null;
                onSaveRef.current(newValue);
                setSaveStatus('saved');

                // 2초 후 idle로 복귀
                setTimeout(() => setSaveStatus('idle'), 2000);
            }, debounceMs);
        },
        [debounceMs]
    );

    // Cleanup
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return { localValue, setLocalValue, saveStatus };
}
```

**Step 2: 타입 체크**

Run: `./node_modules/.bin/tsc --noEmit --pretty`
Expected: PASS

**Step 3: Commit**

```
feat(hooks): add useFieldSync hook for field-level optimistic sync (#108)
```

---

### Task 3: ImageField 코어 컴포넌트

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/shared-fields/ImageField.tsx`
- Create: `src/app/dashboard/components/ContentPanel/shared-fields/index.ts`

**Step 1: ImageField 구현**

기존 `ImageSection.tsx`의 UI를 기반으로, `FieldComponentProps<ImageFieldValue>` 인터페이스를 사용하는 순수 컴포넌트로 작성.

```typescript
// shared-fields/ImageField.tsx
'use client';

import Image from 'next/image';

import { ImagePlus } from 'lucide-react';

import { Input } from '@/components/ui/input';

import type { ImageFieldProps } from './types';

const ASPECT_RATIO_CLASS: Record<string, string> = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
};

export default function ImageField({
    value,
    onChange,
    disabled,
    aspectRatio = 'video',
    placeholder,
}: ImageFieldProps) {
    const ratioClass = ASPECT_RATIO_CLASS[aspectRatio] ?? 'aspect-video';
    const PlaceholderIcon = placeholder?.icon ?? ImagePlus;
    const placeholderText = placeholder?.text ?? 'Enter image URL below';

    return (
        <div className="space-y-2">
            {value.url ? (
                <div className={`relative ${ratioClass} w-full overflow-hidden rounded-lg`}>
                    <Image
                        src={value.url}
                        alt={value.alt || ''}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 600px"
                    />
                </div>
            ) : (
                <div
                    className={`flex ${ratioClass} w-full items-center justify-center rounded-lg border-2 border-dashed border-dashboard-border`}
                >
                    <div className="text-center">
                        <PlaceholderIcon className="mx-auto mb-2 h-8 w-8 text-dashboard-text-placeholder" />
                        <p className="text-xs text-dashboard-text-muted">{placeholderText}</p>
                    </div>
                </div>
            )}
            <Input
                value={value.url}
                onChange={(e) => onChange({ ...value, url: e.target.value })}
                placeholder="Image URL"
                disabled={disabled}
                className="border-dashboard-border bg-dashboard-bg-muted text-sm text-dashboard-text placeholder:text-dashboard-text-placeholder"
            />
            <Input
                value={value.caption || ''}
                onChange={(e) => onChange({ ...value, caption: e.target.value || undefined })}
                placeholder="Caption (optional)"
                disabled={disabled}
                className="border-none bg-transparent p-0 text-xs text-dashboard-text-muted placeholder:text-dashboard-text-placeholder focus-visible:ring-0"
            />
        </div>
    );
}
```

**Step 2: index.ts 배럴 파일**

```typescript
// shared-fields/index.ts
export { default as ImageField } from './ImageField';
export type {
    FieldComponentProps,
    ImageFieldProps,
    ImageFieldValue,
    ImageAspectRatio,
} from './types';
```

**Step 3: 타입 체크**

Run: `./node_modules/.bin/tsc --noEmit --pretty`
Expected: PASS

**Step 4: Commit**

```
feat(shared-fields): add ImageField core component (#108)
```

---

### Task 4: Custom ImageSection을 ImageField로 교체

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/custom-blocks/ImageSection.tsx`

**Step 1: ImageSection을 ImageField 래퍼로 변경**

기존 `ImageSection`은 `SectionBlockEditorProps<'image'>` 인터페이스를 유지하되, 내부는 `ImageField`에 위임.

```typescript
// custom-blocks/ImageSection.tsx
'use client';

import { ImageField } from '../shared-fields';
import type { ImageFieldValue } from '../shared-fields/types';

import type { SectionBlockEditorProps } from './types';

export default function ImageSection({
    data,
    onChange,
    disabled,
}: SectionBlockEditorProps<'image'>) {
    // ImageBlockData → ImageFieldValue (동일 구조이므로 직접 전달)
    const handleChange = (value: ImageFieldValue) => {
        onChange({ url: value.url, alt: value.alt, caption: value.caption });
    };

    return (
        <ImageField
            value={data}
            onChange={handleChange}
            disabled={disabled}
        />
    );
}
```

**Step 2: 타입 체크**

Run: `./node_modules/.bin/tsc --noEmit --pretty`
Expected: PASS

**Step 3: 빌드 확인**

Run: `./node_modules/.bin/next build`
Expected: PASS (기존 CustomEntryEditor가 ImageSection을 import하므로, 인터페이스 유지 확인)

**Step 4: Commit**

```
refactor(custom-blocks): delegate ImageSection to shared ImageField (#108)
```

---

### Task 5: EventDetailView posterUrl을 ImageField로 교체

**Files:**

- Modify: `src/app/dashboard/components/ContentPanel/detail-views/EventDetailView.tsx`

**Step 1: posterUrl 영역을 ImageField로 교체**

기존 읽기 전용 이미지 + Music placeholder를 `ImageField`로 교체. Event에서는 `portrait` aspect ratio 사용. 모달 편집은 그대로 유지 (선택적 래퍼).

```typescript
// detail-views/EventDetailView.tsx
'use client';

import { EVENT_FIELD_BLOCKS } from '@/app/dashboard/config/fieldBlockConfig';

import { ImageField } from '../shared-fields';
import type { ImageFieldValue } from '../shared-fields/types';

import { ImageEditModal, TitleEditModal } from './EditModals';
import type { DetailViewProps } from './types';

export default function EventDetailView({
    entry,
    onSave,
    editingField,
    onEditingDone,
    disabled,
}: DetailViewProps) {
    if (entry.type !== 'event') return null;

    const posterUrl = entry.posterUrl;
    const title = entry.title;

    const imageValue: ImageFieldValue = { url: posterUrl || '' };

    const handleImageChange = (value: ImageFieldValue) => {
        onSave('posterUrl', value.url);
    };

    return (
        <div className="space-y-8">
            {/* Header — Image + title */}
            <div className="space-y-3">
                <div className="mx-auto max-w-[200px]">
                    <ImageField
                        value={imageValue}
                        onChange={handleImageChange}
                        aspectRatio="portrait"
                        disabled={disabled}
                    />
                </div>
                <h2 className="text-center text-xl font-bold text-dashboard-text">{title}</h2>
            </div>

            {/* Info Grid */}
            <div className="space-y-3">
                {EVENT_FIELD_BLOCKS.slice(0, 3).map((block) => (
                    <block.component
                        key={block.key}
                        entry={entry}
                        onSave={onSave}
                        disabled={disabled}
                    />
                ))}
            </div>

            {/* Content blocks */}
            {EVENT_FIELD_BLOCKS.slice(3).map((block) => (
                <block.component
                    key={block.key}
                    entry={entry}
                    onSave={onSave}
                    disabled={disabled}
                />
            ))}

            {/* Edit Modals */}
            {editingField === 'image' && (
                <ImageEditModal
                    value={posterUrl || ''}
                    onSave={(url) => {
                        onSave('posterUrl', url);
                        onEditingDone();
                    }}
                    onClose={onEditingDone}
                />
            )}
            {editingField === 'title' && (
                <TitleEditModal
                    value={title}
                    onSave={(newTitle) => {
                        onSave('title', newTitle);
                        onEditingDone();
                    }}
                    onClose={onEditingDone}
                />
            )}
        </div>
    );
}
```

**주의:** EventDetailView에서 `ImageField`는 URL 입력 + 프리뷰를 인라인으로 보여줌. 기존 읽기 전용 → 인라인 편집으로 변경됨. `ImageEditModal`은 파일 업로드용으로 유지.

**Step 2: 타입 체크**

Run: `./node_modules/.bin/tsc --noEmit --pretty`
Expected: PASS

**Step 3: 빌드 확인**

Run: `./node_modules/.bin/next build`
Expected: PASS

**Step 4: Commit**

```
refactor(event): use shared ImageField for posterUrl display (#108)
```

---

### Task 6: BlockWrapper 컴포넌트 추출

**Files:**

- Create: `src/app/dashboard/components/ContentPanel/custom-blocks/BlockWrapper.tsx`
- Modify: `src/app/dashboard/components/ContentPanel/CustomEntryEditor.tsx`

**Step 1: SortableBlock에서 BlockWrapper 추출**

현재 `SortableBlock` (CustomEntryEditor.tsx:59-120)의 "블록 크롬" 부분을 `BlockWrapper`로 분리. `SortableBlock`은 dnd-kit + `BlockWrapper` 조합으로 유지.

```typescript
// custom-blocks/BlockWrapper.tsx
'use client';

import type { ReactNode } from 'react';

import { GripVertical, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface BlockWrapperProps {
    /** 블록 라벨 */
    label: string;
    /** 블록 아이콘 */
    icon: LucideIcon;
    /** 삭제 핸들러 — 없으면 삭제 버튼 숨김 */
    onDelete?: () => void;
    /** 드래그 핸들 props (dnd-kit) — 없으면 드래그 핸들 숨김 */
    dragHandleProps?: {
        attributes: Record<string, unknown>;
        listeners: Record<string, unknown>;
    };
    /** 드래그 중 opacity 처리 */
    isDragging?: boolean;
    disabled?: boolean;
    children: ReactNode;
}

export default function BlockWrapper({
    label,
    icon: Icon,
    onDelete,
    dragHandleProps,
    isDragging,
    disabled,
    children,
}: BlockWrapperProps) {
    return (
        <div
            className={`group relative rounded-lg border border-transparent p-3 transition-colors hover:border-dashboard-border/50 hover:bg-dashboard-bg-muted/30 ${
                isDragging ? 'opacity-50' : ''
            }`}
        >
            {/* Block Header */}
            <div className="mb-2 flex items-center gap-2">
                {dragHandleProps && (
                    <button
                        {...dragHandleProps.attributes}
                        {...(dragHandleProps.listeners as React.HTMLAttributes<HTMLButtonElement>)}
                        className="cursor-grab rounded p-0.5 opacity-0 transition-opacity hover:bg-dashboard-bg-muted active:cursor-grabbing group-hover:opacity-100"
                    >
                        <GripVertical className="h-3.5 w-3.5 text-dashboard-text-placeholder" />
                    </button>
                )}
                <Icon className="h-3.5 w-3.5 text-dashboard-text-muted" />
                <span className="text-xs font-medium text-dashboard-text-muted">{label}</span>
                <div className="flex-1" />
                {!disabled && onDelete && (
                    <button
                        onClick={onDelete}
                        className="rounded p-0.5 opacity-0 transition-opacity hover:bg-dashboard-bg-muted group-hover:opacity-100"
                    >
                        <Trash2 className="h-3.5 w-3.5 text-dashboard-text-muted hover:text-dashboard-danger" />
                    </button>
                )}
            </div>

            {/* Block Content */}
            {children}
        </div>
    );
}
```

**Step 2: CustomEntryEditor에서 SortableBlock 리팩터**

`SortableBlock`의 UI를 `BlockWrapper`에 위임. dnd-kit 로직만 유지.

```typescript
// CustomEntryEditor.tsx의 SortableBlock 수정 (lines 59-120)

// 기존 import에 추가:
import BlockWrapper from './custom-blocks/BlockWrapper';

// SortableBlock 수정:
function SortableBlock({ block, onUpdate, onRemove, disabled }: SortableBlockProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: block.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const config = SECTION_BLOCK_CONFIG[block.type];
    const BlockComponent = BLOCK_COMPONENT_MAP[block.type];

    return (
        <div ref={setNodeRef} style={style}>
            <BlockWrapper
                label={config.label}
                icon={config.icon}
                onDelete={() => onRemove(block.id)}
                dragHandleProps={{ attributes, listeners }}
                isDragging={isDragging}
                disabled={disabled}
            >
                <BlockComponent
                    data={block.data as any}
                    onChange={(newData) => onUpdate(block.id, newData)}
                    disabled={disabled}
                />
            </BlockWrapper>
        </div>
    );
}
```

**Step 3: custom-blocks/index.ts에 BlockWrapper export 추가**

```typescript
// 기존 index.ts에 추가
export { default as BlockWrapper } from './BlockWrapper';
```

**Step 4: 타입 체크**

Run: `./node_modules/.bin/tsc --noEmit --pretty`
Expected: PASS

**Step 5: 빌드 확인**

Run: `./node_modules/.bin/next build`
Expected: PASS

**Step 6: Commit**

```
refactor(custom-blocks): extract BlockWrapper from SortableBlock (#108)
```

---

### Task 7: entryBlockTemplate 설정 도입

**Files:**

- Create: `src/app/dashboard/config/entryBlockTemplate.ts`

**Step 1: 블록 템플릿 설정 파일 생성**

Phase 1에서는 이미지만 정의하지만, 나머지 필드의 자리를 주석으로 마킹.

```typescript
// config/entryBlockTemplate.ts
import type { SectionBlockType } from '@/types';

import type { ImageAspectRatio } from '../components/ContentPanel/shared-fields/types';

/**
 * 엔트리 타입별 블록 구성 템플릿.
 *
 * - Event/Mixset: 고정 순서, 필수 블록 포함
 * - Custom: 빈 배열 (사용자가 자유롭게 구성)
 */

export interface BlockTemplate {
    /** SectionBlockType */
    type: SectionBlockType;
    /** flat 필드와의 매핑 키 (e.g., 'posterUrl', 'date') */
    fieldKey: string;
    /** 삭제 불가 여부 (Event의 필수 필드) */
    required: boolean;
    /** 컴포넌트에 전달할 추가 props */
    props?: {
        aspectRatio?: ImageAspectRatio;
        [key: string]: unknown;
    };
}

export const EVENT_BLOCK_TEMPLATE: BlockTemplate[] = [
    { type: 'image', fieldKey: 'posterUrl', required: true, props: { aspectRatio: 'portrait' } },
    // Phase 2+:
    // { type: 'date', fieldKey: 'date', required: true },
    // { type: 'venue', fieldKey: 'venue', required: true },
    // { type: 'lineup', fieldKey: 'lineup', required: true },
    // { type: 'description', fieldKey: 'description', required: false },
    // { type: 'links', fieldKey: 'links', required: false },
];

export const MIXSET_BLOCK_TEMPLATE: BlockTemplate[] = [
    { type: 'image', fieldKey: 'coverUrl', required: true, props: { aspectRatio: 'square' } },
    // Phase 2+:
    // { type: 'url', fieldKey: 'url', required: true },
    // { type: 'description', fieldKey: 'description', required: false },
    // { type: 'tracklist', fieldKey: 'tracklist', required: false },
];

export const CUSTOM_BLOCK_TEMPLATE: BlockTemplate[] = [];

export const BLOCK_TEMPLATES: Record<string, BlockTemplate[]> = {
    event: EVENT_BLOCK_TEMPLATE,
    mixset: MIXSET_BLOCK_TEMPLATE,
    custom: CUSTOM_BLOCK_TEMPLATE,
};
```

**Step 2: 타입 체크**

Run: `./node_modules/.bin/tsc --noEmit --pretty`
Expected: PASS

**Step 3: Commit**

```
feat(config): add entry block template definitions (#108)
```

---

### Task 8: 통합 검증 및 정리

**Step 1: 전체 빌드 확인**

Run: `./node_modules/.bin/next build`
Expected: PASS

**Step 2: 미사용 import 정리**

EventDetailView.tsx에서 `Image` (next/image), `Music` (lucide-react) import가 제거되었는지 확인. 빌드에서 경고가 나오면 정리.

**Step 3: 최종 커밋 (필요 시)**

```
chore: clean up unused imports after field unification (#108)
```

---

## 요약

| Task | 파일                               | 설명                     |
| ---- | ---------------------------------- | ------------------------ |
| 1    | `shared-fields/types.ts`           | 코어 필드 타입 정의      |
| 2    | `hooks/use-field-sync.ts`          | useFieldSync 훅          |
| 3    | `shared-fields/ImageField.tsx`     | ImageField 코어 컴포넌트 |
| 4    | `custom-blocks/ImageSection.tsx`   | Custom → ImageField 위임 |
| 5    | `detail-views/EventDetailView.tsx` | Event → ImageField 사용  |
| 6    | `custom-blocks/BlockWrapper.tsx`   | BlockWrapper 추출        |
| 7    | `config/entryBlockTemplate.ts`     | 블록 템플릿 설정         |
| 8    | 전체                               | 통합 검증 + 정리         |

## Phase 1에서 의도적으로 제외한 것

- DB 매퍼 변경 (`syncBlocksToFlatFields`, `hydrateBlocksFromFlat`) — Phase 2에서 실제 블록 데이터 흐름 전환 시 구현
- `useFieldSync`를 코어 컴포넌트 내부에 통합 — 현재는 훅만 생성. 실제 연결은 기존 `useDebouncedSave`와의 관계 정리 후 Phase 2에서
- MixsetDetailView 변경 — Event와 동일 패턴이므로 Event 완료 후 별도 태스크로
