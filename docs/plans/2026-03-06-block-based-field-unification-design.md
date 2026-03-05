# Block-Based Field Unification Design

> 2026-03-06 | feat/dashboard-polish branch

## 목표

커스텀 블록과 엔트리 폼의 필드 컴포넌트를 통합하여, 하나의 코어 컴포넌트를 Event(필수 고정)와 Custom(자유 추가/제거) 양쪽에서 공유한다. 이후 다중 이미지 등 변경 시 코어 컴포넌트 하나만 수정하면 되는 구조.

## 핵심 결정사항

| 항목              | 결정                                                         |
| ----------------- | ------------------------------------------------------------ |
| 전환 범위         | 모든 필드를 블록 기반으로 (점진적)                           |
| DB 전략           | 하이브리드 — blocks[] + 기존 flat 필드 동기화                |
| Source of Truth   | blocks[] (기존 필드는 하위호환용 동기화)                     |
| Event 블록 순서   | 고정 (템플릿 순서)                                           |
| 이미지 편집 방식  | 코어는 인라인, 모달은 선택적 래퍼                            |
| 필수 블록 처리    | 렌더링 주체로 결정 (직접 렌더링 = 필수, BlockWrapper = 선택) |
| 첫 번째 전환 대상 | 이미지 (posterUrl) — 구조 확립 후 나머지 패턴화              |

## 아키텍처

### 3-Layer 컴포넌트 구조

```
Event Edit                              Custom Edit
  │                                       │
  │                                 ┌─────▼──────┐
  │                                 │ BlockWrapper │ ← 삭제/드래그/리오더
  │                                 └─────┬──────┘
  │                                       │
  ▼                                       ▼
EditFieldWrapper (검증 + 저장 전략 - 훅 주입)
  │
  ▼
코어 필드 컴포넌트 (ImageField, DateField, ...)
  └─ 순수 UI: value/onChange만. 저장/검증을 모름.
```

Create Form에서는 RHF `FormField`이 `EditFieldWrapper`와 같은 역할.

### 1. 코어 필드 컴포넌트 (`shared-fields/`)

순수 입력 UI. 블록인지, 필수인지, 저장 방식을 모름.

```typescript
interface FieldComponentProps<T> {
    value: T;
    onChange: (value: T) => void; // "값이 바뀌었다" 신호. 저장을 의미하지 않음.
    disabled?: boolean;
}

interface ImageFieldProps extends FieldComponentProps<ImageFieldValue> {
    aspectRatio?: 'video' | 'square' | 'portrait';
}
```

### 2. EditFieldWrapper (검증 + 저장 래퍼)

Edit 모드 전용. config에서 **저장 훅을 주입**받아 실행.

```typescript
// 저장 훅 인터페이스
type UseSaveHook<T> = (value: T, onSave: (v: T) => void) => SaveSyncReturn<T>;

// EditFieldWrapper — config.useSave로 저장 전략 실행, config.schema로 Zod 검증
function EditFieldWrapper<T>({ config, value, onSave, children }) {
    const { localValue, setLocalValue, saveStatus } = config.useSave(value, (v) => {
        if (config.schema) {
            const result = config.schema.safeParse(v);
            if (!result.success) return;
        }
        onSave(v);
    });
    return children({ value: localValue, onChange: setLocalValue, saveStatus });
}
```

저장 훅 구현체:

- `useImmediateSave` — 이미지, 날짜, 토글 등 즉시 저장
- `useDebouncedSave` — 텍스트 등 keystroke 디바운스 후 저장 (내부적으로 useFieldSync 사용)

### 3. useFieldSync 훅 (useDebouncedSave 내부 도구)

```typescript
interface FieldSyncOptions<T> {
    value: T;
    onSave: (value: T) => void;
    debounceMs?: number;
}

interface FieldSyncReturn<T> {
    localValue: T;
    setLocalValue: (v: T) => void;
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}
```

### 4. BlockWrapper (Custom 전용)

```typescript
interface BlockWrapperProps {
    blockId: string;
    onDelete: () => void;
    dragHandleProps: DragHandleProps;
    children: ReactNode; // 코어 필드 컴포넌트
}
```

블록 크롬(삭제, 드래그 핸들, 테두리)만 제공.

### 5. 엔트리 블록 템플릿 (`config/entryBlockTemplate.ts`)

```typescript
interface BlockTemplate {
    type: SectionBlockType;
    fieldKey: string; // flat 필드와의 매핑 키
    required: boolean;
    props?: Record<string, unknown>; // aspectRatio 등 필드별 설정
}

const EVENT_BLOCK_TEMPLATE: BlockTemplate[] = [
    { type: 'image', fieldKey: 'posterUrl', required: true, props: { aspectRatio: 'portrait' } },
    { type: 'date', fieldKey: 'date', required: true },
    { type: 'venue', fieldKey: 'venue', required: true },
    { type: 'lineup', fieldKey: 'lineup', required: true },
    { type: 'description', fieldKey: 'description', required: false },
    { type: 'links', fieldKey: 'links', required: false },
];

const MIXSET_BLOCK_TEMPLATE: BlockTemplate[] = [
    { type: 'image', fieldKey: 'coverUrl', required: true, props: { aspectRatio: 'square' } },
    { type: 'url', fieldKey: 'url', required: true },
    { type: 'description', fieldKey: 'description', required: false },
    { type: 'tracklist', fieldKey: 'tracklist', required: false },
];

const CUSTOM_BLOCK_TEMPLATE: BlockTemplate[] = []; // 자유 구성
```

## 데이터 흐름

### 하이브리드 저장

```
blocks[] (Source of Truth)
    │
    ├─ UI 렌더링에 직접 사용
    │
    └─ 저장 시 syncBlocksToFlatFields() ──→ 기존 flat 필드
                                             (posterUrl, date, ...)
                                             하위호환 / 검색 / API
```

### 기존 데이터 마이그레이션

기존 Event 데이터 로드 시 flat 필드 → blocks[] 변환:

```typescript
function hydrateBlocksFromFlat(entry: EventEntry, template: BlockTemplate[]): SectionBlock[] {
    return template.map((tmpl) => ({
        id: generateId(),
        type: tmpl.type,
        data: extractFieldData(entry, tmpl.fieldKey),
    }));
}
```

## 파일 구조 변경

```
src/app/dashboard/components/ContentPanel/
  shared-fields/                    [NEW]
    ImageField.tsx                  ← 코어 이미지 컴포넌트
    types.ts                        ← FieldComponentProps
    index.ts
  hooks/
    use-field-sync.ts               [NEW] ← useFieldSync 훅
  custom-blocks/
    BlockWrapper.tsx                 [NEW] ← 삭제/드래그 크롬
    ImageSection.tsx                 ← ImageField 사용하도록 리팩터
    ...

src/app/dashboard/config/
  entryBlockTemplate.ts             [NEW] ← 타입별 블록 템플릿

src/lib/
  mappers.ts                        ← syncBlocksToFlatFields, hydrateBlocksFromFlat 추가
```

## Phase 1 스코프 (이미지)

1. `shared-fields/ImageField.tsx` 생성
2. `useFieldSync` 훅 생성
3. `entryBlockTemplate.ts` 구조 도입
4. Custom: `ImageSection` → `ImageField` + `BlockWrapper` 로 교체
5. Event: `EventDetailView`에서 posterUrl 영역을 `ImageField` 사용하도록 수정
6. `syncBlocksToFlatFields` / `hydrateBlocksFromFlat` 매퍼 추가
7. 기존 동작 유지 확인 (하위호환)

## Phase 2+ (이후)

같은 패턴으로 나머지 필드를 하나씩 코어 컴포넌트로 추출:

- description → DescriptionField
- date → DateField
- venue → VenueField
- ...

EventDetailView가 점진적으로 템플릿 기반 렌더링으로 전환.
