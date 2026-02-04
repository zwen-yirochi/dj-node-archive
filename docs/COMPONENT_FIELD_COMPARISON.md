# 컴포넌트 필드 검증 시스템

## 개요

컴포넌트 필드 검증을 위한 2단계(Tier) 시스템 문서입니다.

### 검증 단계

| Tier | 목적 | 필수 필드 | 사용처 |
|------|------|-----------|--------|
| **create** | 컴포넌트 생성 | `title`만 | 생성 시 검증 |
| **view** | Page에 추가 | `title` + 추가 필드 | 드래그&드롭 시 검증 |

### 코드 구조

```
src/constants/componentFields.ts  ← Single Source of Truth
src/lib/validators.ts             ← 검증 함수들
```

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

### 필드별 검증

| 필드 | Tier | 설명 |
|------|------|------|
| `title` | **create** | 생성 시 필수 |
| `date` | **create** | 생성 시 필수 (기본값: 오늘) |
| `posterUrl` | **view** | Page 추가 시 필수 |
| `venue` | - | 선택 |
| `lineup` | - | 선택 (빈 배열 허용) |
| `description` | - | 선택 |
| `links` | - | 선택 (빈 배열 허용) |

---

## 2. Mixset 컴포넌트

### 필드별 검증

| 필드 | Tier | 설명 |
|------|------|------|
| `title` | **create** | 생성 시 필수 |
| `coverUrl` | **view** | Page 추가 시 필수 |
| `audioUrl` | **view** | Page 추가 시 필수 (soundcloudEmbedUrl과 OR) |
| `soundcloudEmbedUrl` | **view** | Page 추가 시 필수 (audioUrl과 OR) |
| `tracklist` | - | 선택 (빈 배열 허용) |
| `description` | - | 선택 |
| `releaseDate` | - | 선택 |
| `genre` | - | 선택 |

**특수 조건**: `audioUrl` 또는 `soundcloudEmbedUrl` 중 하나는 반드시 있어야 Page에 추가 가능

---

## 3. Link 컴포넌트

### 필드별 검증

| 필드 | Tier | 설명 |
|------|------|------|
| `title` | **create** | 생성 시 필수 |
| `url` | **view** | Page 추가 시 필수 (URL 형식 검증) |
| `icon` | - | 선택 (기본값: 'globe') |

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

## 검증 함수 사용법

### 기본 사용

```typescript
import { canCreate, canAddToView, validateComponent } from '@/lib/validators';

// Tier 1: 생성 가능 여부 (title만 확인)
if (canCreate(component)) {
    await saveComponent(component);
}

// Tier 2: Page 추가 가능 여부 (전체 필수 필드 확인)
if (canAddToView(component)) {
    addToView(pageId, component.id);
}

// 상세 검증 결과
const result = validateComponent(component, 'view');
console.log(result.errors);        // ["커버 이미지이(가) 필요합니다"]
console.log(result.missingFields); // ["coverUrl"]
```

### 헬퍼 함수

```typescript
import { getMissingFieldLabels, getCompletionPercentage } from '@/lib/validators';

// 누락된 필드 라벨 가져오기
const missing = getMissingFieldLabels(component, 'view');
// ["커버 이미지", "오디오 URL"]

// 완성도 계산 (0-100%)
const percent = getCompletionPercentage(component);
// 66
```

---

## 필드 설정 확장하기

`src/constants/componentFields.ts`에서 필드 설정을 수정합니다.

```typescript
export const EVENT_FIELDS: FieldConfig[] = [
    { key: 'title', label: '제목', required: 'create' },
    { key: 'posterUrl', label: '포스터', required: 'view', isUrl: true },
    // 새 필드 추가
    { key: 'newField', label: '새 필드', required: 'view' },
];
```

**FieldConfig 옵션:**
- `required: 'create'` - 생성 시 필수
- `required: 'view'` - Page 추가 시 필수
- `required: false` - 선택 사항
- `isUrl: true` - URL 형식 검증
- `allowEmptyArray: true` - 빈 배열 허용

---

## 구현 현황

| 항목 | 상태 | 파일 |
|------|------|------|
| 필드 설정 정의 | ✅ | `src/constants/componentFields.ts` |
| 검증 함수 | ✅ | `src/lib/validators.ts` |
| TreeItem 경고 표시 | ✅ | `TreeSidebar/TreeItem.tsx` |
| 드래그 시 검증 | ✅ | `TreeSidebar/index.tsx` |
| 생성 시 즉시 DB 저장 | ✅ | `EditorClient.tsx` |
| Form 필수 필드 불일치 | Event venue 표시 오류 | Form 또는 Validator 통일 |
