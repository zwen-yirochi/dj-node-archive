# Form Factory Hook 설계 결정 기록

> 작성일: 2026-02-28
> 관련 파일:
>
> - `src/app/dashboard/hooks/use-create-entry-form.ts` — 팩토리 훅
> - `src/app/dashboard/config/entryFormConfig.ts` — 폼 전용 설정
> - `src/app/dashboard/config/entryFieldConfig.ts` — 스키마 레지스트리 + 필드 메타
> - `src/app/dashboard/config/entryConfig.ts` — 타입별 라벨/뱃지

---

## 1. 왜 팩토리 훅을 만들었나?

### 문제

Event/Mixset 각각 전용 훅(`use-create-event-form.ts`, `use-create-mixset-form.ts`)이 있었다. 두 훅의 95%가 동일한 패턴:

```
useForm + zodResolver → watch → canCreate 판정 → onSubmit(toEntry → mutate → toast) → 서버 에러 매핑
```

차이점은 **데이터**뿐: 어떤 스키마, 어떤 기본값, 어떤 변환 함수.

### 결정

**로직은 훅에, 데이터는 설정에** 분리.

```
useCreateEntryForm<T>(config) — 공통 로직 (1개)
EVENT_FORM_CONFIG               — Event 설정 (데이터)
MIXSET_FORM_CONFIG              — Mixset 설정 (데이터)
```

새 엔트리 타입(Link 등) 추가 시 설정 객체만 정의하면 된다.

---

## 2. config에서 파생 가능한 것은 전부 파생

### 문제

첫 번째 버전의 config는 7개 필드였다:

```typescript
interface CreateEntryFormConfig<T> {
    draftSchema: ZodSchema; // ← 중복
    publishSchema?: ZodSchema; // ← 중복
    defaultValues: DefaultValues<T>;
    requiredFields: Path<T>[]; // ← 중복
    toEntry: (formData: T) => ContentEntry;
    label: string; // ← 중복
    errorFieldMap?: Record<string, Path<T>>;
}
```

이 중 4개가 이미 다른 config에 존재하는 정보의 복사본이었다.

### 분석: 어디서 파생되는가

| 필드             | 기존 소스                       | 파생 방법                 |
| ---------------- | ------------------------------- | ------------------------- |
| `draftSchema`    | `ENTRY_SCHEMAS[type].create`    | `type` 키로 조회          |
| `publishSchema`  | `ENTRY_SCHEMAS[type].view`      | `type` 키로 조회          |
| `requiredFields` | `draftSchema` 자체              | `draftSchema.safeParse()` |
| `label`          | `ENTRY_TYPE_CONFIG[type].label` | `type` 키로 조회          |

### 결정

`type: EntryType` 하나로 4개 필드를 모두 파생한다.

```typescript
// After — config에 type만 넣으면 나머지는 훅 내부에서 파생
interface CreateEntryFormConfig<T> {
    type: EntryType; // ← 이것 하나로
    publishable?: boolean;
    defaultValues: DefaultValues<T>; // 폼 전용
    toEntry: (formData: T) => ContentEntry; // 폼 전용
    errorFieldMap?: Record<string, Path<T>>; // 폼 전용
}

// 훅 내부
const { create: draftSchema, view: publishSchema } = ENTRY_SCHEMAS[type];
const { label } = ENTRY_TYPE_CONFIG[type];
const canCreate = draftSchema.safeParse(watch()).success;
```

---

## 3. requiredFields → draftSchema.safeParse

### 문제

```typescript
requiredFields: ['title', 'posterUrl'];
```

이 배열은 `draftEventSchema`에서 `z.string().min(1)`로 이미 정의된 내용의 수동 복사본이다. 스키마를 수정하면 `requiredFields`도 같이 수정해야 하는 이중 관리 문제.

### Before

```typescript
// config에 수동 나열
requiredFields: ['title', 'posterUrl'],

// 훅에서 해당 필드만 watch → 비어있는지 체크
const watchedValues = watch(requiredFields);
const canCreate = watchedValues.every(v => !!String(v ?? '').trim());
```

### After

```typescript
// config에서 requiredFields 제거

// 훅에서 스키마가 직접 판정
const formValues = watch();
const canCreate = draftSchema.safeParse(formValues).success;
```

### 트레이드오프

- **장점**: 스키마가 유일한 진실의 소스. 스키마 수정하면 canCreate도 자동 반영.
- **단점**: `watch()` 인자 없이 호출하면 모든 필드 변경에 리렌더. 하지만 폼 필드가 3~7개로 적어서 성능 영향 무시 가능.

---

## 4. publishable 플래그

### 문제

Event는 publish/private 토글이 필요하고, Mixset은 불필요하다. 기존에는 `publishSchema` 존재 여부로 판별했다:

```typescript
const hasPublishOption = !!publishSchema;
```

그런데 `ENTRY_SCHEMAS`에는 모든 타입에 `create`와 `view` 스키마가 모두 있다. 스키마 존재 여부로는 구분 불가.

### 결정

`publishable?: boolean` 플래그를 config에 추가.

```typescript
EVENT_FORM_CONFIG  = { type: 'event',  publishable: true, ... };
MIXSET_FORM_CONFIG = { type: 'mixset', /* publishable 미설정 = false */ ... };
```

이유:

- "이 폼에서 publish/private 토글을 보여줄 것인가"는 **UX 결정**이지 스키마 구조에서 파생되는 것이 아님
- `ENTRY_TYPE_CONFIG`에 넣을 수도 있지만, publish 토글은 생성 폼에서만 쓰이므로 폼 설정에 두는 것이 적절

---

## 5. 남은 폼 전용 관심사

config에 남은 3개 필드는 다른 곳에서 파생 불가능한 **순수 폼 관심사**:

| 필드            | 왜 파생 불가                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `defaultValues` | 폼 스키마 shape의 빈 값. `createEmptyEntry()`와 겹치지만 메타 필드(id, type, position 등) 포함 여부가 다름 |
| `toEntry`       | formData → ContentEntry 변환 로직. 타입별 trim/fallback 처리가 다름                                        |
| `errorFieldMap` | 서버 에러 메시지 키워드 → 폼 필드 매핑. 서버 에러 형식에 의존하는 폼 전용 라우팅                           |

---

## 6. Config 의존성 흐름 (최종)

```
entryConfig.ts          — EntryType, label, badge
       ↓
entryFieldConfig.ts     — FIELD_CONFIG(필드 메타), ENTRY_SCHEMAS(스키마 레지스트리)
       ↓
entryFormConfig.ts      — EVENT_FORM_CONFIG, MIXSET_FORM_CONFIG (폼 전용 설정)
       ↓
use-create-entry-form.ts — 팩토리 훅 (config 조합 + 폼 로직)
       ↓
CreateEventForm.tsx      — UI 컴포넌트 (훅 호출 + JSX)
CreateMixsetForm.tsx
```

각 레이어의 책임:

- **entryConfig**: "엔트리 타입이 뭐가 있고, 각각의 표시 이름은?"
- **entryFieldConfig**: "각 타입의 필드/스키마/검증 규칙은?"
- **entryFormConfig**: "폼으로 새 엔트리를 만들 때 필요한 초기값/변환/에러 매핑은?"
- **use-create-entry-form**: "위 설정을 조합해서 useForm + 상태 + submit 로직 실행"
- **CreateXxxForm**: "어떤 필드를 어떤 UI로 보여줄 것인가"
