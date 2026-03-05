# Zod 코드리뷰

> 프로젝트 내 Zod 사용 패턴을 파일별로 분석한 학습 문서.

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [스키마 정의 — 단일 소스](#2-스키마-정의--단일-소스)
3. [Dual-Schema 패턴 (Draft / Publish)](#3-dual-schema-패턴-draft--publish)
4. [API Request 스키마](#4-api-request-스키마)
5. [Handler에서의 Validation](#5-handler에서의-validation)
6. [zodValidationErrorResponse — 에러 변환](#6-zodvalidationerrorresponse--에러-변환)
7. [React Hook Form 연동 (zodResolver)](#7-react-hook-form-연동-zodresolver)
8. [Config-Driven Validation (entryFieldConfig)](#8-config-driven-validation-entryfieldconfig)
9. [Type Inference (z.infer)](#9-type-inference-zinfer)
10. [Import 스키마](#10-import-스키마)
11. [Zod 주요 API 정리](#11-zod-주요-api-정리)
12. [개선 포인트 & 메모](#12-개선-포인트--메모)

---

## 1. 아키텍처 개요

```
스키마 정의                    사용처
┌─────────────────┐
│ entry.schemas.ts │─── Handler: safeParse (서버 검증)
│  - draft/publish │─── Form: zodResolver (클라이언트 검증)
│  - API request   │─── Config: ENTRY_SCHEMAS 레지스트리
│  - sub-schemas   │─── Type: z.infer<> (타입 추론)
└─────────────────┘
┌─────────────────┐
│ import.schemas.ts│─── Handler: safeParse (서버 검증)
└─────────────────┘
┌─────────────────┐
│ page.handlers.ts │─── 핸들러 내 로컬 스키마
└─────────────────┘
```

**Zod를 사용하는 7개 파일:**

| 파일                                       | 역할                              | import 방식                      |
| ------------------------------------------ | --------------------------------- | -------------------------------- |
| `lib/validations/entry.schemas.ts`         | 스키마 정의 (entry + API request) | `import { z } from 'zod'`        |
| `lib/validations/import.schemas.ts`        | 스키마 정의 (import)              | `import { z } from 'zod'`        |
| `lib/api/handlers/entry.handlers.ts`       | 서버 검증                         | `import { ZodError } from 'zod'` |
| `lib/api/handlers/page.handlers.ts`        | 서버 검증 + 로컬 스키마           | `import { z } from 'zod'`        |
| `lib/api/handlers/import.handlers.ts`      | 서버 검증                         | 스키마만 import                  |
| `lib/api/responses.ts`                     | 에러 응답 변환                    | `import type { z } from 'zod'`   |
| `dashboard/hooks/use-create-entry-form.ts` | 폼 검증                           | `import { zodResolver }`         |
| `dashboard/config/entryFieldConfig.ts`     | 스키마 레지스트리                 | `import type { ZodSchema }`      |

**핵심 원칙**: 스키마는 `lib/validations/`에 정의하고, 서버(Handler)와 클라이언트(Form) 양쪽에서 재사용한다.

---

## 2. 스키마 정의 — 단일 소스

📁 `lib/validations/entry.schemas.ts`

### Sub-schemas (재사용 가능한 부품)

```typescript
export const venueReferenceSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).trim(),
});

export const artistReferenceSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).trim(),
});

export const externalLinkSchema = z.object({
    title: z.string().min(1).trim(),
    url: z.string().url(),
});
```

**패턴**: 여러 스키마에서 공유되는 구조를 별도 스키마로 추출. `venueReferenceSchema`는 `publishEventSchema`에서, `artistReferenceSchema`는 `draftEventSchema`와 `publishEventSchema` 양쪽에서 사용.

### 체이닝 해설

```typescript
z.string() // 문자열이어야 함
    .uuid() // UUID 형식이어야 함
    .optional(); // undefined 허용 (필드 생략 가능)

z.string()
    .min(1) // 최소 1자 (빈 문자열 거부)
    .trim(); // 앞뒤 공백 자동 제거 (transform)
```

**`.trim()`은 검증이 아니라 변환(transform)**이다. `safeParse` 통과 후 `parsed.data`에는 trim된 값이 들어간다.

---

## 3. Dual-Schema 패턴 (Draft / Publish)

📁 `lib/validations/entry.schemas.ts:30-64`

하나의 엔트리 타입에 대해 **두 가지 엄격도의 스키마**를 정의:

### Event

```typescript
// 공통 필드 — draft와 publish 모두에서 동일한 검증
const eventBaseFields = {
    title: z.string().min(2, '제목은 2자 이상이어야 합니다').max(100).trim(),
    posterUrl: z.string().min(1, '포스터 이미지가 필요합니다').trim(),
    links: z.array(externalLinkSchema).optional(),
};

// Draft: 최소한만 필수 (title + posterUrl)
export const draftEventSchema = z.object({
    ...eventBaseFields,
    date: z.string().default(''), // 빈 문자열 OK
    venue: z
        .object({
            // name 빈 문자열 OK
            id: z.string().uuid().optional(),
            name: z.string().default(''),
        })
        .default({ name: '' }),
    lineup: z.array(artistReferenceSchema).default([]), // 빈 배열 OK
    description: z.string().default(''), // 빈 문자열 OK
});

// Publish: 모든 필드 엄격 검증
export const publishEventSchema = z.object({
    ...eventBaseFields,
    date: z.string().min(1, '날짜를 입력해야 합니다'),
    venue: venueReferenceSchema, // name.min(1) 필수
    lineup: z.array(artistReferenceSchema).min(1, '아티스트를 1명 이상 추가해야 합니다'),
    description: z.string().min(1, '설명을 입력해야 합니다').trim(),
});
```

### 왜 2개인가?

| 상황                  | 사용 스키마          | 목적                                       |
| --------------------- | -------------------- | ------------------------------------------ |
| "임시 저장" (private) | `draftEventSchema`   | 최소한만 검증 → 작업 중 저장 가능          |
| "공개 발행" (publish) | `publishEventSchema` | 모든 필드 엄격 검증 → 불완전한 데이터 방지 |

이 2개 스키마는 3곳에서 사용된다:

1. **폼 검증** (`zodResolver`) — publish/private 전환에 따라 스키마 동적 교체
2. **API 검증** (`handleCreateEntry`) — `publishOption === 'publish'`일 때 `publishEventSchema`로 추가 검증
3. **Config 레지스트리** (`ENTRY_SCHEMAS`) — `canCreate()`, `canAddToView()` 등 UI 판정

### Mixset & Link

```typescript
// 공통 base를 .extend()로 확장
const mixsetBase = z.object({ title: z.string().min(1).max(100).trim() });

export const draftMixsetSchema = mixsetBase.extend({
    coverUrl: z.string().default(''), // 빈 문자열 OK
    url: z.string().default(''), // 빈 문자열 OK
});

export const publishMixsetSchema = mixsetBase.extend({
    coverUrl: z.string().min(1, '커버 이미지가 필요합니다'),
    url: z.string().url('유효한 URL이어야 합니다'), // URL 형식 검증
});
```

**`.extend()`**: 기존 스키마의 필드를 유지하면서 새 필드를 추가/덮어쓴다. `mixsetBase`에 정의된 `title`은 draft와 publish 모두에서 동일한 검증을 받는다.

### `.default()` vs `.optional()`

```typescript
date: z.string().default('')     // parse 시 undefined → '' 로 변환
lineup: z.array(...).default([]) // parse 시 undefined → [] 로 변환
venue: z.object({...}).optional() // parse 시 undefined → undefined 유지
```

- `.default(value)`: 값이 없으면 기본값으로 채운다. **`parsed.data`에 항상 값이 존재**.
- `.optional()`: 값이 없어도 OK. `parsed.data`에서 해당 필드가 `undefined`일 수 있다.

Draft 스키마에서 `.default('')`를 쓰는 이유: 폼 초기값을 빈 문자열로 보장하여 controlled input을 유지.

---

## 4. API Request 스키마

📁 `lib/validations/entry.schemas.ts:108-177`

API 엔드포인트별로 요청 바디의 형태를 정의:

### `createEntryRequestSchema` (POST /api/entries)

```typescript
export const createEntryRequestSchema = z.object({
    pageId: z.string().uuid('유효하지 않은 페이지 ID입니다'),
    entry: z
        .object({
            id: z.string().uuid(),
            type: z.enum(['event', 'mixset', 'link']),
        })
        .passthrough(), // ← 나머지 필드 유지
    publishOption: z.enum(['publish', 'private']).default('private'),
});
```

**`.passthrough()`**: 기본적으로 `z.object()`는 정의하지 않은 필드를 **제거(strip)**한다. `.passthrough()`를 붙이면 정의하지 않은 필드도 그대로 통과시킨다.

```typescript
// .passthrough() 없이
z.object({ id: z.string(), type: z.string() }).parse({ id: '1', type: 'event', title: 'Hello' });
// → { id: '1', type: 'event' }  (title 삭제됨!)

// .passthrough() 있으면
z.object({ id: z.string(), type: z.string() })
    .passthrough()
    .parse({ id: '1', type: 'event', title: 'Hello' });
// → { id: '1', type: 'event', title: 'Hello' }  (title 유지)
```

여기서 `.passthrough()`를 쓰는 이유: entry의 `id`와 `type`만 구조 검증하고, 나머지 필드(`title`, `date`, `venue` 등)는 타입별로 다르므로 handler에서 별도 검증.

### `updateEntryRequestSchema` (PATCH /api/entries/[id])

```typescript
export const updateEntryRequestSchema = z
    .object({
        entry: z.object({ id: z.string().uuid(), type: z.enum([...]) })
            .passthrough().optional(),
        displayOrder: z.number().int().nullable().optional(),
        isVisible: z.boolean().optional(),
    })
    .refine(
        (data) => data.entry !== undefined ||
                   data.displayOrder !== undefined ||
                   data.isVisible !== undefined,
        { message: 'entry, displayOrder, isVisible 중 하나 이상 필요합니다' }
    );
```

**`.refine()`**: 스키마 레벨의 커스텀 검증. 개별 필드 검증이 아닌, **필드 간 관계**를 검증할 때 사용.

```typescript
.refine(
    (data) => /* 조건: true면 통과, false면 에러 */,
    { message: '에러 메시지' }
)
```

여기서는 "세 필드 모두 undefined면 안 된다" (빈 PATCH 요청 방지)라는 교차 검증을 수행한다.

**`.nullable()` vs `.optional()`**:

```typescript
displayOrder: z.number().int().nullable().optional();
//  nullable() → null 허용       (displayOrder: null → "Page에서 제거")
//  optional() → undefined 허용  (displayOrder 키 자체가 없음 → "변경 안 함")
```

### Reorder 스키마

```typescript
export const reorderEntriesRequestSchema = z.object({
    updates: z
        .array(
            z.object({
                id: z.string().uuid(),
                position: z.number().int().min(0),
            })
        )
        .min(1, '하나 이상의 업데이트가 필요합니다'),
});
```

`z.array(...).min(1)` — 빈 배열을 거부. 최소 1개 이상의 업데이트가 있어야 한다.

---

## 5. Handler에서의 Validation

📁 `lib/api/handlers/entry.handlers.ts`

### 기본 패턴: `safeParse` → 분기

```typescript
export async function handleCreateEntry(request: Request, { user }: AuthContext) {
    const body = await request.json();
    const parsed = createEntryRequestSchema.safeParse(body);

    if (!parsed.success) {
        return zodValidationErrorResponse(parsed.error);
        // parsed.error: ZodError 객체 (issues 배열 포함)
    }

    // parsed.data는 타입 안전함
    const { pageId, entry, publishOption } = parsed.data;
    // ...
}
```

**`safeParse` vs `parse`**:

|         | `parse(data)`      | `safeParse(data)`                     |
| ------- | ------------------ | ------------------------------------- |
| 성공 시 | 변환된 데이터 반환 | `{ success: true, data: T }`          |
| 실패 시 | **throw ZodError** | `{ success: false, error: ZodError }` |
| 사용처  | try-catch 필요     | if 분기로 처리                        |

이 프로젝트는 **`safeParse`만 사용**한다. API handler에서 throw를 하면 500 에러가 되지만, `safeParse`는 400 에러로 적절한 에러 응답을 반환할 수 있다.

### 이중 검증 (구조 → 내용)

```typescript
// 1차: 요청 구조 검증
const parsed = createEntryRequestSchema.safeParse(body);
// → pageId는 UUID인가? entry에 id와 type이 있는가?

// 2차: 타입별 내용 검증 (publish 시에만)
if (publishOption === 'publish' && entry.type === 'event') {
    const eventParsed = publishEventSchema.safeParse(entry);
    if (!eventParsed.success) {
        return zodValidationErrorResponse(eventParsed.error);
    }
    const eventData = eventParsed.data; // 타입: CreateEventData
    // eventData.title, eventData.venue 등이 모두 존재함이 보장
}
```

1차 검증은 `.passthrough()`로 느슨하게, 2차 검증은 타입별 스키마로 엄격하게. 이렇게 나누는 이유:

- 1차에서 entry의 모든 필드를 검증하려면 `type` 값에 따라 다른 스키마를 적용해야 하는데, Zod의 `z.discriminatedUnion`이 필요
- 대신 `.passthrough()` + 조건부 2차 검증으로 단순하게 처리

### `new ZodError()` — 수동 에러 생성

📁 `lib/api/handlers/entry.handlers.ts:199-207`

```typescript
if (!entry) {
    return zodValidationErrorResponse(
        new ZodError([
            {
                code: 'custom',
                path: ['entry'],
                message: 'entry, isVisible, 또는 displayOrder가 필요합니다',
            },
        ])
    );
}
```

Zod 검증이 아닌 로직 분기에서도 동일한 에러 형식을 유지하기 위해 `ZodError`를 직접 생성한다. `zodValidationErrorResponse`에 넘기면 클라이언트는 항상 동일한 에러 구조를 받게 된다.

---

## 6. zodValidationErrorResponse — 에러 변환

📁 `lib/api/responses.ts:98-113`

```typescript
export function zodValidationErrorResponse(zodError: z.ZodError) {
    return NextResponse.json(
        {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: zodError.errors.map((err) => ({
                    path: err.path.join('.'), // ['entry', 'title'] → 'entry.title'
                    message: err.message,
                })),
            },
        },
        { status: 400 }
    );
}
```

**ZodError의 구조:**

```typescript
zodError.errors = [
    {
        code: 'too_small',
        minimum: 2,
        path: ['title'],
        message: '제목은 2자 이상이어야 합니다',
    },
    {
        code: 'invalid_type',
        path: ['venue', 'name'],
        message: 'Required',
    },
];
```

이 함수는 Zod의 상세한 에러 구조를 `{ path, message }` 형태로 단순화하여 API 응답에 포함한다. 클라이언트에서 `details[].path`를 보고 어떤 필드에 에러가 있는지 파악 가능.

---

## 7. React Hook Form 연동 (zodResolver)

📁 `dashboard/hooks/use-create-entry-form.ts`

### 기본 연결

```typescript
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<T>({
    resolver: zodResolver(draftSchema), // Zod 스키마 → RHF resolver
    mode: 'onTouched', // blur 시 검증
    defaultValues,
});
```

**`zodResolver`란?** React Hook Form은 자체 검증 시스템을 갖고 있지만, Zod 같은 외부 라이브러리의 스키마를 연결할 수 있는 `resolver` 인터페이스를 제공한다. `zodResolver(schema)`는 RHF가 호출할 수 있는 검증 함수를 반환한다.

```
사용자 입력  →  RHF 내부  →  resolver(values)  →  zodResolver(schema)
                                                    →  schema.safeParse(values)
                                                    →  성공: { values, errors: {} }
                                                    →  실패: { values: {}, errors: { ... } }
```

### 동적 스키마 교체

```typescript
const form = useForm<T>({
    resolver: hasPublishOption
        ? (values, context, options) => {
              // publishOptionRef의 현재 값에 따라 스키마를 동적으로 선택
              const schema = publishOptionRef.current === 'publish' ? publishSchema : draftSchema;
              return zodResolver(schema)(values, context, options);
          }
        : zodResolver(draftSchema),
    mode: 'onTouched',
    defaultValues,
});
```

**왜 ref를 쓰나?** `useForm`의 `resolver`는 초기 렌더 시 한 번 설정된다. `useState`의 값은 클로저에 캡처되어 업데이트를 반영하지 못하므로, `useRef`로 항상 최신 값을 참조한다.

```
publishOption = 'private' → publishOptionRef.current = 'private'
                          → resolver가 draftSchema 사용

publishOption = 'publish' → publishOptionRef.current = 'publish'
                          → resolver가 publishSchema 사용 (더 엄격)
```

### publish 전환 시 검증

📁 `dashboard/hooks/use-create-entry-form.ts:97-113`

```typescript
const handlePublishOptionChange = hasPublishOption
    ? (value: PublishOption) => {
          if (value === 'publish') {
              // publish 스키마로 현재 폼 값을 미리 검증
              const result = publishSchema.safeParse(form.getValues());
              if (!result.success) {
                  toast({
                      variant: 'destructive',
                      title: 'Cannot publish',
                      description: 'All fields must be filled to publish.',
                  });
                  return; // publish로 전환하지 않음
              }
          }
          setPublishOption(value);
          trigger(); // 폼 전체 재검증 트리거
      }
    : undefined;
```

사용자가 "publish"를 선택하는 순간:

1. `publishSchema.safeParse()`로 즉시 검증
2. 실패 → toast 메시지 + publish 전환 차단
3. 성공 → `publishOption` 변경 + `trigger()`로 RHF 재검증

### `canCreate` — 스키마 기반 UI 판정

```typescript
const formValues = watch();
const canCreate = draftSchema.safeParse(formValues).success;
```

`watch()`는 모든 폼 필드의 현재 값을 실시간으로 반환한다. 이 값을 `draftSchema.safeParse()`에 넘겨서 "생성 가능한지" 여부를 판정 → 버튼 활성화/비활성화에 사용.

### 서버 에러 → 폼 필드 매핑

📁 `dashboard/hooks/use-create-entry-form.ts:140-153`

```typescript
} catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    // errorFieldMap에서 키워드 매칭
    const matchedEntry = Object.entries(errorFieldMap).find(([keyword]) =>
        message.includes(keyword)
    );

    if (matchedEntry) {
        // 매칭된 필드에 서버 에러 표시
        setError(matchedEntry[1] as Path<T>, { type: 'server', message });
    } else {
        // root 에러 + toast
        setError('root', { type: 'server', message });
        toast({ variant: 'destructive', title: 'Creation failed', description: message });
    }
}
```

📁 `dashboard/config/entryFormConfig.ts:36`

```typescript
errorFieldMap: { title: 'title', poster: 'posterUrl' },
```

서버 에러 메시지에 "poster"라는 키워드가 포함되면 → `posterUrl` 필드에 에러를 표시. 이를 통해 서버 검증 에러가 폼의 올바른 필드에 인라인으로 표시된다.

---

## 8. Config-Driven Validation (entryFieldConfig)

📁 `dashboard/config/entryFieldConfig.ts:61-65`

### 스키마 레지스트리

```typescript
export const ENTRY_SCHEMAS: Record<EntryType, { create: ZodSchema; view: ZodSchema }> = {
    event: { create: draftEventSchema, view: publishEventSchema },
    mixset: { create: draftMixsetSchema, view: publishMixsetSchema },
    link: { create: draftLinkSchema, view: publishLinkSchema },
};
```

타입별 스키마를 레지스트리에 등록하여, 타입 문자열로 스키마를 동적으로 조회할 수 있게 한다.

### 사용처: `validateEntry()`

📁 `dashboard/config/entryFieldConfig.ts:79-105`

```typescript
export function validateEntry(
    entry: ContentEntry,
    tier: 'create' | 'view' = 'view'
): ValidationResult {
    const type: EntryType = entry.type;
    const schema = tier === 'create' ? ENTRY_SCHEMAS[type].create : ENTRY_SCHEMAS[type].view;
    const result = schema.safeParse(entry);

    if (result.success) {
        return { isValid: true, errors: [], missingFields: [] };
    }

    // Zod 에러를 사람이 읽을 수 있는 형태로 변환
    const fields = FIELD_CONFIG[type];
    const errors: string[] = [];
    const missingFields: string[] = [];

    for (const issue of result.error.issues) {
        const fieldKey = issue.path[0]?.toString() ?? '';
        if (!missingFields.includes(fieldKey)) missingFields.push(fieldKey);
        const label = fields.find((f) => f.key === fieldKey)?.label ?? fieldKey;
        errors.push(`${label}: ${issue.message}`);
    }

    return { isValid: false, errors, missingFields };
}
```

**흐름:**

1. `entry.type`으로 스키마 레지스트리 조회
2. `tier`에 따라 draft 또는 publish 스키마 선택
3. `safeParse` 실행
4. 실패 시 `FIELD_CONFIG`의 label로 에러 메시지를 한국어 변환

### 파생 헬퍼

```typescript
// 엔트리가 draft로 저장 가능한가?
export function canCreate(entry: ContentEntry): boolean {
    return validateEntry(entry, 'create').isValid;
}

// 엔트리가 Page에 추가될 수 있을 만큼 완성되었는가?
export function canAddToView(entry: ContentEntry): boolean {
    return validateEntry(entry, 'view').isValid;
}

// 부족한 필드를 라벨로 반환
export function getMissingFieldLabels(entry, tier): string[] {
    // validateEntry 결과에서 FIELD_CONFIG label 조회
}
```

이 헬퍼들은 사이드바 TreeItem의 상태 표시, Page에 드래그앤드롭 가능 여부 판단 등에서 사용된다.

---

## 9. Type Inference (z.infer)

📁 `lib/validations/entry.schemas.ts:67-68`

```typescript
export type CreateEventData = z.infer<typeof publishEventSchema>;
export type CreateMixsetFormData = z.infer<typeof draftMixsetSchema>;
```

**`z.infer<typeof schema>`**: Zod 스키마에서 TypeScript 타입을 자동 추론한다.

```typescript
const publishEventSchema = z.object({
    title: z.string(),
    date: z.string(),
    venue: venueReferenceSchema,
    lineup: z.array(artistReferenceSchema),
    description: z.string(),
    posterUrl: z.string(),
    links: z.array(externalLinkSchema).optional(),
});

// z.infer가 만들어내는 타입:
type CreateEventData = {
    title: string;
    date: string;
    venue: { id?: string; name: string };
    lineup: { id?: string; name: string }[];
    description: string;
    posterUrl: string;
    links?: { title: string; url: string }[];
};
```

**단일 소스의 장점**: 스키마를 수정하면 타입도 자동으로 바뀐다. 타입과 검증 로직이 동기화를 잃을 수 없다.

### 폼 설정에서의 활용

📁 `dashboard/config/entryFormConfig.ts:17`

```typescript
export const EVENT_FORM_CONFIG: CreateEntryFormConfig<CreateEventData> = {
    type: 'event',
    publishable: true,
    defaultValues: {
        title: '',
        posterUrl: '',
        date: '',
        venue: { name: '' },
        lineup: [],
        description: '',
    },
    toEntry: (formData) =>
        ({
            // formData: CreateEventData (타입 안전)
            ...createEmptyEntry('event'),
            ...formData,
        }) as EventEntry,
};
```

`CreateEntryFormConfig<CreateEventData>`로 제네릭을 지정하면:

- `defaultValues`의 키가 `CreateEventData`의 필드와 일치하는지 컴파일 타임에 검증
- `toEntry`의 `formData` 파라미터가 `CreateEventData` 타입으로 추론

---

## 10. Import 스키마

📁 `lib/validations/import.schemas.ts`

```typescript
const RA_VENUE_URL_REGEX = /^https?:\/\/(www\.)?ra\.co\/clubs\/\d+/;

export const venueImportPreviewSchema = z.object({
    ra_url: z
        .string()
        .min(1, 'RA URL is required')
        .regex(
            RA_VENUE_URL_REGEX,
            'Invalid RA venue URL. Expected format: https://ra.co/clubs/{id}'
        ),
});

export const venueImportConfirmSchema = z.object({
    ra_url: z.string().min(1).regex(RA_VENUE_URL_REGEX, '...'),
    options: z
        .object({
            maxEvents: z.number().int().min(1).max(500).optional(),
        })
        .optional(),
});
```

**`.regex()`**: 정규식 패턴 매칭 검증. RA 베뉴 URL의 형식(`https://ra.co/clubs/{숫자}`)을 강제한다.

**`z.infer`로 타입 추출:**

```typescript
export type VenueImportPreviewInput = z.infer<typeof venueImportPreviewSchema>;
// → { ra_url: string }

export type VenueImportConfirmInput = z.infer<typeof venueImportConfirmSchema>;
// → { ra_url: string; options?: { maxEvents?: number } }
```

handler에서의 사용 패턴은 entry와 동일:

```typescript
const parsed = venueImportPreviewSchema.safeParse(body);
if (!parsed.success) return zodValidationErrorResponse(parsed.error);
const { ra_url } = parsed.data;
```

---

## 11. Zod 주요 API 정리

이 프로젝트에서 사용하는 Zod API 레퍼런스:

### 타입 빌더

| API            | 용도   | 예시                                  |
| -------------- | ------ | ------------------------------------- |
| `z.string()`   | 문자열 | `z.string().min(1)`                   |
| `z.number()`   | 숫자   | `z.number().int().min(0)`             |
| `z.boolean()`  | 불리언 | `z.boolean()`                         |
| `z.object({})` | 객체   | `z.object({ name: z.string() })`      |
| `z.array()`    | 배열   | `z.array(schema).min(1)`              |
| `z.enum([])`   | 열거형 | `z.enum(['event', 'mixset', 'link'])` |

### 수정자

| API           | 효과                              |
| ------------- | --------------------------------- |
| `.optional()` | `undefined` 허용                  |
| `.nullable()` | `null` 허용                       |
| `.default(v)` | 값 없으면 기본값 `v`              |
| `.trim()`     | 문자열 앞뒤 공백 제거 (transform) |

### 검증

| API           | 효과             |
| ------------- | ---------------- |
| `.min(n)`     | 최솟값/최소 길이 |
| `.max(n)`     | 최댓값/최대 길이 |
| `.url()`      | URL 형식 검증    |
| `.uuid()`     | UUID 형식 검증   |
| `.regex(r)`   | 정규식 매칭      |
| `.refine(fn)` | 커스텀 검증      |

### 스키마 조합

| API              | 효과                           |
| ---------------- | ------------------------------ |
| `.extend({})`    | 기존 object 스키마에 필드 추가 |
| `.passthrough()` | 정의하지 않은 필드 유지        |

### 실행

| API                | 성공 시                   | 실패 시                     |
| ------------------ | ------------------------- | --------------------------- |
| `.parse(data)`     | 변환된 데이터 반환        | throw ZodError              |
| `.safeParse(data)` | `{ success: true, data }` | `{ success: false, error }` |

### 타입 유틸리티

| API                      | 효과                        |
| ------------------------ | --------------------------- |
| `z.infer<typeof schema>` | 스키마에서 TS 타입 추론     |
| `ZodSchema`              | 모든 Zod 스키마의 상위 타입 |
| `ZodError`               | 검증 에러 클래스            |

---

## 12. 개선 포인트 & 메모

### 현재 잘 된 점

- **Dual-Schema**: draft/publish 분리로 "작업 중 저장"과 "공개 발행"의 검증 수준을 독립 관리
- **단일 소스**: `z.infer`로 타입을 추론하여 스키마 ↔ 타입 동기화 보장
- **서버/클라이언트 동일 스키마**: `publishEventSchema`가 handler(서버)와 form(클라이언트) 양쪽에서 사용
- **일관된 에러 응답**: `zodValidationErrorResponse`로 Zod 에러를 통일된 API 에러 형태로 변환
- **Config 레지스트리**: `ENTRY_SCHEMAS[type]`으로 타입 문자열에서 스키마를 동적 조회

### 향후 검토할 점

1. **`page.handlers.ts`의 로컬 스키마**
    - `updatePageSchema`가 handler 파일 안에 정의되어 있음
    - 다른 스키마들은 `lib/validations/`에 있으므로 위치 통일 검토

2. **`.passthrough()` + 2차 검증 vs `z.discriminatedUnion`**
    - 현재 `createEntryRequestSchema`는 `.passthrough()`로 entry 내용을 그냥 통과시킴
    - `z.discriminatedUnion('type', [eventSchema, mixsetSchema, linkSchema])`로 1차에서 모든 검증을 처리하는 것도 가능
    - 트레이드오프: 1차 통합 vs 단계별 분리의 가독성

3. **`z.infer` 타입의 불일치**
    - `CreateEventData = z.infer<typeof publishEventSchema>` (publish 기준)
    - `CreateMixsetFormData = z.infer<typeof draftMixsetSchema>` (draft 기준)
    - 같은 패턴인데 event는 publish, mixset은 draft 기준 → 의도적인지 확인 필요

4. **에러 메시지 언어 혼재**
    - entry.schemas.ts: 한국어 (`'제목은 2자 이상이어야 합니다'`)
    - import.schemas.ts: 영어 (`'RA URL is required'`)
    - 공개 대상에 따라 의도적일 수 있으나, 통일 방향 검토
