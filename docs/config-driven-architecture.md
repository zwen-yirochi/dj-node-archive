# Config-Driven Architecture 현황

Dashboard의 설정 기반 구조를 정리한 문서.
새 엔트리 타입 추가, 필드 변경, 메뉴 확장 시 어떤 config를 어디서 수정해야 하는지 파악하기 위한 레퍼런스.

---

## 파일 구조

```
constants/
  entryConfig.ts            ← UI 메타 (badge, label, placeholder)
  entryEditorConfig.ts      ← 에디터 행동 (fields, triggersPreview, menuItems)
  entryValidationConfig.ts  ← 검증 규칙 (필드별 create/view rule)
  workflowOptions.ts        ← 워크플로우 옵션 (Event 생성, Publish)

types/
  entryFields.ts            ← 타입 정의 + resolveMenuItems 브릿지

lib/
  validators.ts             ← VALIDATION_CONFIG 소비 (검증 로직)
  previewTrigger.ts         ← EDITOR_CONFIG 소비 (미리보기 트리거)
```

---

## 1. Config 파일별 역할

### `entryConfig.ts` — UI 메타데이터

| 키                 | 타입        | 용도                      |
| ------------------ | ----------- | ------------------------- |
| `badgeType`        | `BadgeType` | TypeBadge 컴포넌트 렌더링 |
| `label`            | `string`    | 토스트, 헤더 등 표시명    |
| `titlePlaceholder` | `string`    | 생성 폼 placeholder       |

```ts
export const ENTRY_TYPE_CONFIG = {
    event: { badgeType: 'EVT', label: 'Event', titlePlaceholder: '...' },
    mixset: { badgeType: 'MIX', label: 'Mixset', titlePlaceholder: '...' },
    link: { badgeType: 'LNK', label: 'Link', titlePlaceholder: '...' },
};
export type EntryType = keyof typeof ENTRY_TYPE_CONFIG;
```

**소비자:** EntryDetailView, CreateEntryPanel, PageListView, TreeItem, dashboardStore(re-export)

---

### `entryEditorConfig.ts` — 에디터 행동

두 가지 관심사:

1. **fields** — 어떤 필드가 있고, 변경 시 미리보기를 트리거하는지
2. **menuItems** — "..." 메뉴에 어떤 액션을 노출할지

```ts
export const EDITOR_CONFIG: Record<EntryType, EntryEditorConfig> = {
    event: {
        fields: [
            { key: 'title', label: '제목', triggersPreview: true },
            { key: 'date', label: '날짜', triggersPreview: true },
            { key: 'venue', label: '장소', triggersPreview: true },
            { key: 'posterUrl', label: '포스터 이미지', triggersPreview: true },
            { key: 'lineup', label: '라인업', triggersPreview: true },
            { key: 'description', label: '설명', triggersPreview: false },
            { key: 'links', label: '링크', triggersPreview: false },
        ],
        menuItems: [EDIT_TITLE, EDIT_IMAGE, SEPARATOR, DELETE],
    },
    // mixset: menuItems에 EDIT_IMAGE 포함
    // link:   menuItems에 EDIT_IMAGE 없음
};
```

**소비자:**

- `previewTrigger.ts` — `fields[].triggersPreview`로 변경 감지
- `EntryDetailView.tsx` — `menuItems` → `resolveMenuItems()`로 드롭다운 생성

---

### `entryValidationConfig.ts` — 검증 규칙

필드별로 create(생성 시) / view(페이지 추가 시) 두 단계의 규칙 선언.

```ts
export const VALIDATION_CONFIG: Record<EntryType, FieldValidationConfig[]> = {
    event: [
        { key: 'title', create: 'required', view: 'required' },
        { key: 'date', create: 'required', view: 'required' },
        { key: 'posterUrl', create: false, view: 'required', isUrl: true },
        { key: 'lineup', create: false, view: false, allowEmptyArray: true },
        // ...
    ],
    link: [
        { key: 'url', create: 'required', view: 'url', isUrl: true },
        // view: 'url' → URL 형식까지 검증
    ],
};
```

**규칙 타입:**

- `'required'` — 값 존재 필수
- `'url'` — 값 존재 + URL 형식 검증
- `false` — 검증 안 함

**소비자:** `validators.ts` (getRequiredFields, validateEntry, canCreate, canAddToView)

**특수 케이스:** Mixset의 `audioUrl || soundcloudEmbedUrl` OR 조건은 config로 표현 불가 → `validators.ts:133`에 하드코딩

---

### `workflowOptions.ts` — 워크플로우 옵션

```ts
EVENT_CREATE_OPTIONS  → CreateEntryPanel (import vs create)
PUBLISH_OPTIONS       → CreateEventForm  (publish vs private)
PublishOption type    → use-mutations.ts (create mutation param)
```

---

## 2. 데이터 흐름

### 미리보기 트리거 흐름

```
EDITOR_CONFIG[type].fields[].triggersPreview
        ↓
previewTrigger.shouldTriggerPreview(prev, next)
  → 변경된 필드 중 triggersPreview=true 있으면 true
        ↓
use-mutations.ts — update mutation의 triggersPreview 콜백
        ↓
optimistic-mutation.ts — onPreviewTrigger() 콜백 호출
        ↓
useDashboardStore.triggerPreviewRefresh()
```

`optimistic-mutation.ts`는 스토어를 직접 import하지 않음.
`use-mutations.ts`가 `onPreviewTrigger` 콜백을 주입 (의존성 역전).

### 검증 흐름

```
VALIDATION_CONFIG[type]
        ↓
validators.getRequiredFields(type, tier)
  → tier='create': field.create !== false 인 필드
  → tier='view':   field.create !== false OR field.view !== false 인 필드
        ↓
validators.validateEntry(entry, tier)
  → 각 필드에 validateFieldValue(value, config, tier) 적용
  → Mixset 특수 케이스: audioUrl || soundcloudEmbedUrl
        ↓
canCreate(entry)   → validateEntry(entry, 'create').isValid
canAddToView(entry) → validateEntry(entry, 'view').isValid
```

### 메뉴 액션 흐름

```
EDITOR_CONFIG[type].menuItems
  → 선언적 데이터: { action: { type: 'set-editing-field', field: 'title' }, label, icon }
        ↓
resolveMenuItems(menuItems, context)
  → context = { setEditingField, onDelete } (컴포넌트가 제공)
  → action.type별 switch로 onClick 생성
        ↓
DropdownMenuItemConfig[] → SimpleDropdown에 전달
```

새 액션 추가 시:

1. `MenuAction` union에 variant 추가
2. `resolveAction`에 case 추가
3. `MenuActionContext`에 필요한 콜백 추가
4. 컴파일러가 누락된 곳을 에러로 알려줌

---

## 3. Config가 아직 커버하지 않는 영역

### 에디터 컴포넌트 라우팅 — type guard 분기

```tsx
// EntryDetailView.tsx:168-191
{isEventEntry(localEntry) && <EventEditor ... />}
{isMixsetEntry(localEntry) && <MixsetEditor ... />}
{isLinkEntry(localEntry) && <LinkEditor ... />}
```

각 에디터(EventEditor, MixsetEditor, LinkEditor)는 독립 컴포넌트.
새 타입 추가 시 에디터 컴포넌트 + 분기 추가 필요.

**가능한 개선:** 에디터 컴포넌트 레지스트리

```ts
const EDITORS: Record<EntryType, ComponentType<EditorProps>> = {
    event: EventEditor,
    mixset: MixsetEditor,
    link: LinkEditor,
};
// 사용: const Editor = EDITORS[entry.type]; <Editor ... />
```

---

### 에디터 컴포넌트 내부 — 필드 렌더링 하드코딩

각 에디터가 자체적으로 필드를 하드코딩:

- EventEditor: posterUrl, title, date, venue, lineup(배열), description, links(배열)
- MixsetEditor: coverUrl, title, soundcloudUrl, description, tracklist(배열)
- LinkEditor: icon selector, title, url

**공통 패턴 — 배열 에디터:**

- lineup (EventEditor) — add/update/remove performer
- links (EventEditor) — add/update/remove link
- tracklist (MixsetEditor) — add/update/remove track

3개 모두 동일한 CRUD 패턴 (약 220줄 중복).

**가능한 개선:** 배열 에디터 팩토리 또는 공통 훅 추출

---

### `createEmptyEntry` — switch 문 하드코딩

```ts
// lib/mappers.ts:354-405
switch (type) {
    case 'event':  return { id, type: 'event', title: '', date: today(), ... };
    case 'mixset': return { id, type: 'mixset', title: '', tracklist: [], ... };
    case 'link':   return { id, type: 'link', title: '', url: '', ... };
}
```

타입별 기본값이 코드에 직접 들어있음.
`mapEntryToDomain` (line 68), `mapEntryToDatabase` (line 150)도 동일 패턴.

**가능한 개선:** 타입별 factory/default-values config

---

### TreeSidebar 필터링 — 3중 useMemo

```ts
// TreeSidebar/index.tsx:64-77
const events  = useMemo(() => entries.filter(e => e.type === 'event').sort(...),  [entries]);
const mixsets = useMemo(() => entries.filter(e => e.type === 'mixset').sort(...), [entries]);
const links   = useMemo(() => entries.filter(e => e.type === 'link').sort(...),   [entries]);
```

**가능한 개선:** `Object.keys(ENTRY_TYPE_CONFIG)` 루프 또는 `useEntriesByType()` 훅

---

### Mixset OR 검증 — validators.ts 하드코딩

```ts
// validators.ts:132-146
if (type === 'mixset' && tier === 'view') {
    // audioUrl 또는 soundcloudEmbedUrl 중 하나 필요
}
```

현재 `FieldValidationConfig`로 표현 불가한 "OR 조건".

**가능한 개선:** `requireOneOf: ['audioUrl', 'soundcloudEmbedUrl']` 같은 config 확장

---

## 4. 새 엔트리 타입 추가 시 체크리스트

새 타입 (예: `bio`) 추가 시 수정이 필요한 파일:

| #   | 파일                                 | 작업                                                                     |
| --- | ------------------------------------ | ------------------------------------------------------------------------ |
| 1   | `types/domain.ts`                    | `BioEntry` 타입 + `ContentEntry` union 추가 + type guard                 |
| 2   | `constants/entryConfig.ts`           | `ENTRY_TYPE_CONFIG`에 `bio` 항목 추가                                    |
| 3   | `constants/entryEditorConfig.ts`     | `EDITOR_CONFIG`에 `bio` 항목 (fields + menuItems)                        |
| 4   | `constants/entryValidationConfig.ts` | `VALIDATION_CONFIG`에 `bio` 항목                                         |
| 5   | `editors/BioEditor.tsx`              | 에디터 컴포넌트 생성                                                     |
| 6   | `EntryDetailView.tsx`                | type guard 분기 추가                                                     |
| 7   | `lib/mappers.ts`                     | `createEmptyEntry`, `mapEntryToDomain`, `mapEntryToDatabase`에 case 추가 |
| 8   | `TreeSidebar/index.tsx`              | 섹션 필터 + SectionItem 추가                                             |

**Config만으로 처리되는 것:** 2, 3, 4 (badge, 에디터 필드/메뉴, 검증 규칙)
**코드 수정이 필요한 것:** 1, 5, 6, 7, 8

---

## 5. Config 간 필드 키 매핑

같은 필드가 여러 config에 걸쳐 등장하며, 현재 동기화는 수동.

### Event

| 필드 키     | EditorConfig | ValidationConfig | triggersPreview |  create  |   view   |
| ----------- | :----------: | :--------------: | :-------------: | :------: | :------: |
| title       |      O       |        O         |      true       | required | required |
| date        |      O       |        O         |      true       | required | required |
| venue       |      O       |        O         |      true       |  false   |  false   |
| posterUrl   |      O       |        O         |      true       |  false   | required |
| lineup      |      O       |        O         |      true       |  false   |  false   |
| description |      O       |        O         |      false      |  false   |  false   |
| links       |      O       |        O         |      false      |  false   |  false   |

### Mixset

| 필드 키            | EditorConfig | ValidationConfig | triggersPreview |  create  |   view   |
| ------------------ | :----------: | :--------------: | :-------------: | :------: | :------: |
| title              |      O       |        O         |      true       | required | required |
| coverUrl           |      O       |        O         |      true       |  false   | required |
| audioUrl           |      O       |        O         |      true       |  false   | false\*  |
| soundcloudEmbedUrl |      O       |        O         |      true       |  false   | false\*  |
| tracklist          |      O       |        O         |      false      |  false   |  false   |
| description        |      O       |        O         |      false      |  false   |  false   |
| releaseDate        |      O       |        O         |      true       |  false   |  false   |
| genre              |      O       |        O         |      true       |  false   |  false   |

\* `audioUrl || soundcloudEmbedUrl` OR 조건은 validators.ts에서 별도 처리

### Link

| 필드 키 | EditorConfig | ValidationConfig | triggersPreview |  create  |   view   |
| ------- | :----------: | :--------------: | :-------------: | :------: | :------: |
| title   |      O       |        O         |      true       | required | required |
| url     |      O       |        O         |      true       | required |   url    |
| icon    |      O       |        O         |      true       |  false   |  false   |
