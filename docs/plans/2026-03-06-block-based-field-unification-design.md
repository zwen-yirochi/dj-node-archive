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
Event (고정 순서, 직접 렌더링)          Custom (BlockWrapper)
         │                                    │
         │                              ┌─────▼──────┐
         │                              │ BlockWrapper │ ← 삭제/드래그/리오더
         │                              └─────┬──────┘
         │                                    │
         ▼                                    ▼
   코어 필드 컴포넌트 (ImageField, DateField, ...)
         │
         └─ useFieldSync 훅 내장
              ├─ 낙관적 로컬 상태
              ├─ 디바운스 저장
              ├─ 저장 상태 (idle | saving | saved | error)
              └─ StatusIndicator 반환
```

### 1. 코어 필드 컴포넌트 (`shared-fields/`)

순수 입력 UI. 블록인지, 필수인지 모름.

```typescript
interface FieldComponentProps<T> {
    value: T;
    onChange: (value: T) => void;
    disabled?: boolean;
}

// ImageField
interface ImageFieldProps extends FieldComponentProps<ImageFieldValue> {
    aspectRatio?: 'video' | 'square' | 'portrait'; // 16:9 | 1:1 | 3:4
}
```

### 2. useFieldSync 훅

모든 코어 필드가 내부적으로 사용. 저장 피드백 + 낙관적 업데이트 통합.

```typescript
interface FieldSyncOptions<T> {
    value: T; // 서버 상태 (외부)
    onSave: (value: T) => void; // 저장 콜백
    fieldKey: string; // 필드 식별자
    debounceMs?: number; // 디바운스 (기본 800ms)
}

interface FieldSyncReturn<T> {
    localValue: T; // 낙관적 로컬 상태
    setLocalValue: (v: T) => void; // 로컬 업데이트 (+ 디바운스 저장 트리거)
    saveStatus: 'idle' | 'saving' | 'saved' | 'error';
    StatusIndicator: ComponentType; // 시각적 피드백 UI
}
```

### 3. BlockWrapper (Custom 전용)

```typescript
interface BlockWrapperProps {
    blockId: string;
    onDelete: () => void;
    dragHandleProps: DragHandleProps;
    children: ReactNode; // 코어 필드 컴포넌트
}
```

블록 크롬(삭제, 드래그 핸들, 테두리)만 제공.

### 4. 엔트리 블록 템플릿 (`config/entryBlockTemplate.ts`)

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
