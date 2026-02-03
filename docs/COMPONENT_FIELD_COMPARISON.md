# 컴포넌트 필드 비교: DB vs 타입 vs Form vs Validator

## 개요

컴포넌트 생성/수정 시 불일치로 인한 에러 분석을 위한 문서입니다.

---

## DB 스키마 (`components` 테이블)

```sql
components (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id     uuid NOT NULL REFERENCES pages(id),
    type        varchar NOT NULL,        -- 'event' | 'mixset' | 'link'
    position    integer NOT NULL,
    data        jsonb NOT NULL,          -- 컴포넌트별 데이터
    is_visible  boolean DEFAULT true,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
)
```

**핵심:** `data` 필드는 JSONB로, 내부 구조는 애플리케이션에서 정의됨.

---

## 1. Event (Show) 컴포넌트

### 비교표

| 필드 | TypeScript 타입 | Form 필수 | Validator 필수 | 비고 |
|------|----------------|-----------|----------------|------|
| `id` | `string` (required) | - | - | uuid, 자동 생성 |
| `type` | `'show'` (literal) | - | - | 고정값 |
| `title` | `string` (required) | ✅ `*` 표시 | ✅ | |
| `date` | `string` (required) | ✅ `*` 표시 | ✅ | |
| `venue` | `string` (required) | ✅ `*` 표시 | ❌ | ⚠️ **불일치** |
| `posterUrl` | `string` (required) | ❌ | ❌ | 타입은 required지만 빈 문자열 허용 |
| `lineup` | `string[]` (required) | ❌ | ❌ | 빈 배열 허용 |
| `description` | `string` (required) | ❌ | ❌ | 빈 문자열 허용 |
| `links` | `array` (optional) | ❌ | ❌ | |
| `eventId` | `string` (optional) | ❌ | ❌ | 이벤트 import 시 |
| `venueId` | `string` (optional) | ❌ | ❌ | 이벤트 import 시 |

### 문제점
- **venue**: Form에서 필수(`*`)로 표시되지만, Validator에서는 검증하지 않음

---

## 2. Mixset 컴포넌트

### 비교표

| 필드 | TypeScript 타입 | Form 필수 | Validator 필수 | 비고 |
|------|----------------|-----------|----------------|------|
| `id` | `string` (required) | - | - | uuid, 자동 생성 |
| `type` | `'mixset'` (literal) | - | - | 고정값 |
| `title` | `string` (required) | ✅ `*` 표시 | ✅ | |
| `coverUrl` | `string` (required) | ❌ | ❌ | 빈 문자열 허용 |
| `audioUrl` | `string` (required) | ❌ | ❌ | 빈 문자열 허용 |
| `soundcloudEmbedUrl` | `string` (optional) | ❌ | ❌ | |
| `tracklist` | `array` (required) | ❌ | ❌ | 빈 배열 허용 |
| `description` | `string` (required) | ❌ | ❌ | 빈 문자열 허용 |
| `releaseDate` | `string` (required) | ❌ | ❌ | ⚠️ 타입은 required |
| `genre` | `string` (required) | ❌ | ❌ | 빈 문자열 허용 |

### 문제점
- 없음 (title만 필수로 일관됨)

---

## 3. Link 컴포넌트

### 비교표

| 필드 | TypeScript 타입 | Form 필수 | Validator 필수 | 비고 |
|------|----------------|-----------|----------------|------|
| `id` | `string` (required) | - | - | uuid, 자동 생성 |
| `type` | `'link'` (literal) | - | - | 고정값 |
| `title` | `string` (required) | ✅ `*` 표시 | ✅ | |
| `url` | `string` (required) | ✅ `*` 표시 | ✅ + URL 형식 검증 | |
| `icon` | `string` (required) | ❌ | ❌ | 기본값 'globe' |

### 문제점
- 없음 (title, url 필수로 일관됨)

---

## 초기값 비교 (`createEmptyComponent`)

### transformers.ts에서 생성하는 초기값

```typescript
// Event
{
    id: uuidv4(),
    type: 'show',
    title: '',           // 빈 문자열
    date: '2026-02-04',  // 오늘 날짜
    venue: '',           // 빈 문자열
    posterUrl: '',
    lineup: [],
    description: '',
    links: [],
}

// Mixset
{
    id: uuidv4(),
    type: 'mixset',
    title: '',           // 빈 문자열
    coverUrl: '',
    audioUrl: '',
    soundcloudEmbedUrl: '',
    tracklist: [],
    description: '',
    releaseDate: '2026-02-04',  // 오늘 날짜
    genre: '',
}

// Link
{
    id: uuidv4(),
    type: 'link',
    title: '',           // 빈 문자열
    url: '',             // 빈 문자열
    icon: 'globe',
}
```

---

## 에러 발생 시나리오

### 1. 컴포넌트 수정 실패
```
saveComponent → PATCH /api/components/[id] → 실패
```

**가능한 원인:**
- 컴포넌트가 아직 DB에 저장되지 않은 상태에서 수정 시도
- 빈 컴포넌트 생성 후 바로 저장 시 data 필드 검증 실패

### 2. View item 추가 실패
```
addToView → POST /api/view-items → 실패
```

**가능한 원인:**
- 컴포넌트가 DB에 없는 상태에서 View에 추가 시도
- component_id FK 제약 조건 위반

---

## 현재 Flow 분석

### 빈 컴포넌트 생성 Flow

```
1. handleAddComponent('mixset')
2. createEmptyComponent('mixset')  → 빈 Mixset 객체 생성
3. setComponents([...components, newComponent])  → 로컬 상태에만 추가
4. selectComponent(newComponent.id)  → 선택
5. setEditMode('edit')  → 편집 모드 진입

⚠️ 이 시점에서 DB에는 저장되지 않음!
```

### 편집 후 저장 Flow

```
1. handleSave() in EditMode/index.tsx
2. onSave(component) in ContentPanel/index.tsx
3. saveComponent(component) in editorStore.ts
4. 기존 컴포넌트인지 확인 (existingIndex)
5. PATCH /api/components/[id]  ← 실패! (DB에 없는 ID)
```

---

## 핵심 문제

### ❌ 현재 문제점

1. **빈 컴포넌트가 DB에 저장되지 않은 채 로컬 상태에만 존재**
2. **편집 후 저장 시 PATCH 요청 → 존재하지 않는 ID로 요청**
3. **View 추가 시 FK 제약 위반**

### ✅ 해결 방안

**Option A: 생성 시 즉시 DB 저장**
- 빈 컴포넌트를 생성하면서 바로 DB에 저장
- 이후 수정은 정상적인 PATCH

**Option B: 새 컴포넌트 감지 후 POST 호출**
- saveComponent에서 DB에 없는 컴포넌트인 경우 POST 호출
- 현재 코드는 로컬 배열 인덱스로만 판단 (문제)

**권장: Option B 수정**
- `existingIndex` 체크를 더 정교하게 (예: 서버에서 확인하거나, 플래그 추가)

---

## 요약

| 문제 | 원인 | 해결 |
|------|------|------|
| 컴포넌트 수정 실패 | 새 컴포넌트를 PATCH로 요청 | POST/PATCH 분기 로직 수정 |
| View 추가 실패 | DB에 없는 컴포넌트 참조 | 컴포넌트 저장 후 View 추가 |
| Form 필수 필드 불일치 | Event venue 표시 오류 | Form 또는 Validator 통일 |
