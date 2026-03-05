# React Hook Form 코드리뷰

> 프로젝트 내 React Hook Form(v7) 사용 패턴을 파일별로 분석한 학습 문서.

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [Create vs Edit — 폼 전략 분리](#2-create-vs-edit--폼-전략-분리)
3. [UI 컴포넌트 라이브러리 (form.tsx)](#3-ui-컴포넌트-라이브러리-formtsx)
4. [팩토리 훅 (useCreateEntryForm)](#4-팩토리-훅-usecreateentryform)
5. [폼 설정 객체 (entryFormConfig)](#5-폼-설정-객체-entryformconfig)
6. [폼 컴포넌트 (CreateEventForm / CreateMixsetForm)](#6-폼-컴포넌트-createeventform--createmixsetform)
7. [RHF 핵심 API 해설](#7-rhf-핵심-api-해설)
8. [검증 흐름 — zodResolver 연동](#8-검증-흐름--zodresolver-연동)
9. [에러 처리 패턴](#9-에러-처리-패턴)
10. [RHF를 쓰지 않는 곳 — Editor 패턴](#10-rhf를-쓰지-않는-곳--editor-패턴)
11. [API 정리](#11-api-정리)
12. [개선 포인트 & 메모](#12-개선-포인트--메모)

---

## 1. 아키텍처 개요

```
Config                      Hook                        Component
┌──────────────────┐   ┌────────────────────┐   ┌───────────────────┐
│ entryFormConfig  │──▶│ useCreateEntryForm │──▶│ CreateEventForm   │
│  - defaultValues │   │  - useForm()       │   │  <Form {...form}> │
│  - toEntry()     │   │  - zodResolver     │   │  <FormField>      │
│  - errorFieldMap │   │  - handleSubmit    │   │  <FormControl>    │
└──────────────────┘   │  - canCreate       │   │  <FormMessage>    │
                       │  - publishOption   │   └───────────────────┘
┌──────────────────┐   │  - 서버 에러 매핑   │
│ ENTRY_SCHEMAS    │──▶│  - mutation 호출   │
│  - draftSchema   │   └────────────────────┘
│  - publishSchema │
└──────────────────┘
```

**파일별 역할:**

| 파일                                | 역할                                                   | RHF 의존                                       |
| ----------------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| `components/ui/form.tsx`            | UI 컴포넌트 라이브러리 (FormProvider, Controller 래핑) | `Controller`, `FormProvider`, `useFormContext` |
| `hooks/use-create-entry-form.ts`    | 팩토리 훅 — 폼 로직 통합                               | `useForm`, `zodResolver`                       |
| `config/entryFormConfig.ts`         | 타입별 폼 설정 (defaultValues, toEntry, errorFieldMap) | `DefaultValues<T>`, `Path<T>` (타입만)         |
| `ContentPanel/CreateEventForm.tsx`  | Event 생성 폼 UI                                       | 훅 소비 + `<Form>`, `<FormField>`              |
| `ContentPanel/CreateMixsetForm.tsx` | Mixset 생성 폼 UI                                      | 훅 소비 + `<Form>`, `<FormField>`              |

**핵심 원칙**: RHF는 **생성 폼(Create)**에서만 사용. 편집(Edit)은 `useState` + 디바운스 패턴.

---

## 2. Create vs Edit — 폼 전략 분리

이 프로젝트에는 두 가지 폼 패턴이 공존한다:

### Create 폼 — RHF 사용

```
사용자 입력 → RHF form state → zodResolver 검증 → handleSubmit → mutation
```

- 새 엔트리 생성 시 사용
- 모든 필드를 채우고 "Create" 버튼으로 한 번에 제출
- 검증: submit 시 전체 검증 + blur 시 필드 검증 (`mode: 'onTouched'`)
- 파일: `CreateEventForm.tsx`, `CreateMixsetForm.tsx`

### Edit 폼 — RHF 미사용

```
사용자 입력 → localEntry (useState) → debouncedSave → mutation
```

- 기존 엔트리 수정 시 사용
- 더블클릭 → 인라인 편집 → Enter/blur로 개별 필드 저장
- 검증: 없음 (자유 편집, 서버에서 검증)
- 파일: `EntryDetailView.tsx` + `EventEditor.tsx`, `MixsetEditor.tsx`, `LinkEditor.tsx`

### 왜 다른가?

|           | Create            | Edit                      |
| --------- | ----------------- | ------------------------- |
| UX 모델   | 폼 제출 (한 번에) | 인라인 편집 (필드별 즉시) |
| 검증 시점 | blur + submit     | 없음 (자동 저장)          |
| 저장 방식 | 명시적 제출       | 디바운스 자동 저장        |
| 상태 관리 | RHF 내부          | `useState` + `useRef`     |

RHF는 "폼 제출" 패턴에 최적화되어 있다. 인라인 편집처럼 필드별로 즉시 저장하는 UX에서는 RHF의 이점(submit 검증, 에러 추적, dirty 상태)이 크지 않으므로, 단순한 `useState`가 더 적합하다.

---

## 3. UI 컴포넌트 라이브러리 (form.tsx)

📁 `components/ui/form.tsx`

shadcn/ui 기반의 RHF 래핑 컴포넌트. **RHF의 Context API를 UI 컴포넌트로 추상화**한다.

### 컴포넌트 계층

```
<Form {...form}>                    ← FormProvider (RHF 컨텍스트 주입)
  <form onSubmit={handleSubmit}>
    <FormField                      ← Controller 래핑 (name + control 바인딩)
      control={control}
      name="title"
      render={({ field }) => (
        <FormItem>                  ← 필드 컨테이너 (id 생성)
          <FormLabel>Title</FormLabel>     ← 에러 시 스타일 변경
          <FormControl>                    ← Slot (a11y 속성 주입)
            <Input {...field} />           ← 실제 입력 컴포넌트
          </FormControl>
          <FormDescription />              ← 도움말 텍스트
          <FormMessage />                  ← 에러 메시지 표시
        </FormItem>
      )}
    />
  </form>
</Form>
```

### `Form` — FormProvider 래핑

```typescript
const Form = FormProvider;
```

RHF의 `FormProvider`를 그대로 export. 하위 컴포넌트에서 `useFormContext()`로 폼에 접근할 수 있게 한다.

```tsx
<Form {...form}>
    {' '}
    {/* form = useForm()의 반환값 */}
    {/* 하위에서 useFormContext()로 접근 가능 */}
</Form>
```

### `FormField` — Controller + Context

```typescript
const FormField = <TFieldValues, TName>({ ...props }: ControllerProps<TFieldValues, TName>) => {
    return (
        <FormFieldContext.Provider value={{ name: props.name }}>
            <Controller {...props} />
        </FormFieldContext.Provider>
    );
};
```

RHF의 `Controller`를 감싸면서 `name`을 Context에 저장한다. 하위의 `FormLabel`, `FormMessage` 등이 이 Context에서 필드명을 읽어 에러 상태를 조회한다.

**Controller란?** RHF에서 "controlled component"를 관리하는 컴포넌트. `register()`가 네이티브 input에 ref를 직접 연결한다면, `Controller`는 커스텀 컴포넌트(ImageUpload, SearchableInput 등)에 `field` 객체를 render prop으로 전달한다.

```tsx
<FormField
    control={control} // useForm()에서 가져온 control 객체
    name="title" // 필드 경로
    render={({ field }) => (
        // field = { value, onChange, onBlur, ref, name }
        <Input {...field} />
    )}
/>
```

### `useFormField` — 필드 상태 조회 훅

```typescript
const useFormField = () => {
    const fieldContext = React.useContext(FormFieldContext); // name
    const itemContext = React.useContext(FormItemContext); // id
    const { getFieldState, formState } = useFormContext(); // RHF

    const fieldState = getFieldState(fieldContext.name, formState);

    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState, // error, isDirty, isTouched, invalid
    };
};
```

**2개의 Context를 조합:**

- `FormFieldContext` → Controller가 관리하는 필드의 `name`
- `FormItemContext` → `useId()`로 생성된 고유 `id`

이 조합으로 `getFieldState(name, formState)`를 호출하여 해당 필드의 에러, dirty, touched 상태를 가져온다.

### `FormLabel` — 에러 시 스타일 변경

```typescript
const FormLabel = ({ className, ...props }) => {
    const { error, formItemId } = useFormField();
    return (
        <Label
            className={cn(error && 'text-destructive', className)}
            htmlFor={formItemId}
            {...props}
        />
    );
};
```

에러가 있으면 라벨 색상이 빨간색으로 변한다. `htmlFor`로 입력과 라벨을 연결.

### `FormControl` — a11y 속성 주입

```typescript
const FormControl = ({ ...props }) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
    return (
        <Slot
            id={formItemId}
            aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
            aria-invalid={!!error}
            {...props}
        />
    );
};
```

**Radix `Slot`**: 자식 컴포넌트에 props를 "투과"시킨다. `<FormControl><Input /></FormControl>`에서 `Slot`의 `id`, `aria-*` 속성이 `<Input>`에 직접 주입된다.

### `FormMessage` — 에러 메시지 표시

```typescript
const FormMessage = ({ className, children, ...props }) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message ?? '') : children;

    if (!body) return null;

    return (
        <p id={formMessageId} className={cn('text-[0.8rem] font-medium text-destructive', className)}>
            {body}
        </p>
    );
};
```

에러가 있으면 `error.message`를 표시. 없으면 `children`을 표시 (커스텀 메시지). 둘 다 없으면 렌더링하지 않음.

---

## 4. 팩토리 훅 (useCreateEntryForm)

📁 `hooks/use-create-entry-form.ts`

Event, Mixset, Link 생성 폼의 **공통 로직을 하나의 제네릭 훅으로 추출**.

### 인터페이스

```typescript
export interface CreateEntryFormConfig<T extends FieldValues> {
    type: EntryType; // 'event' | 'mixset' | 'link'
    publishable?: boolean; // publish/private 토글 활성화
    defaultValues: DefaultValues<T>; // 초기값
    toEntry: (formData: T) => ContentEntry; // 폼 데이터 → 도메인 객체 변환
    errorFieldMap?: Record<string, Path<T>>; // 서버 에러 키워드 → 필드 매핑
}
```

### 훅 반환값

```typescript
return {
    form, // UseFormReturn<T> — <Form {...form}>에 spread
    publishOption, // 'publish' | 'private' | null
    canCreate, // boolean — 제출 버튼 활성화
    errors, // FieldErrors<T>
    isSubmitting, // boolean — 제출 중 로딩
    handleCancel, // () => void — 폼 리셋 + 뷰 전환
    handlePublishOptionChange, // ((PublishOption) => void) | undefined
    handleSubmit, // (e) => Promise<void> — form onSubmit에 바인딩
};
```

### 내부 흐름

```
1. useForm<T>() 초기화 (resolver, mode, defaultValues)
          ↓
2. watch() → draftSchema.safeParse → canCreate 판정
          ↓
3. 사용자 입력 + blur → zodResolver 검증 → FormMessage에 에러 표시
          ↓
4. Submit 클릭 → handleSubmit(onSubmit) 실행
          ↓
5. onSubmit:
   a. clearErrors('root')
   b. pageId 확인 (없으면 root 에러)
   c. toEntry(formData) → ContentEntry 변환
   d. createEntryMutation.mutateAsync() 호출
   e. 성공: setView + toast
   f. 실패: errorFieldMap 매칭 → setError (필드 or root)
```

### Config에서 파생하는 값들

```typescript
const { create: draftSchema, view: publishSchema } = ENTRY_SCHEMAS[type];
const { label } = ENTRY_TYPE_CONFIG[type];
```

`type` 문자열 하나로 스키마와 라벨을 기존 Config 레지스트리에서 조회한다. 훅이 직접 스키마를 받지 않고 `type`만 받는 이유: **스키마 선택의 단일 소스를 `ENTRY_SCHEMAS`로 유지.**

---

## 5. 폼 설정 객체 (entryFormConfig)

📁 `config/entryFormConfig.ts`

### EVENT_FORM_CONFIG

```typescript
export const EVENT_FORM_CONFIG: CreateEntryFormConfig<CreateEventData> = {
    type: 'event',
    publishable: true, // publish/private 토글 활성화
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
            ...createEmptyEntry('event'), // id, type, position 등 기본값
            ...formData, // 폼 데이터 병합
            title: formData.title.trim(),
            date: formData.date || new Date().toISOString().split('T')[0],
            description: formData.description?.trim() || '',
        }) as EventEntry,
    errorFieldMap: { title: 'title', poster: 'posterUrl' },
};
```

### MIXSET_FORM_CONFIG

```typescript
export const MIXSET_FORM_CONFIG: CreateEntryFormConfig<CreateMixsetFormData> = {
    type: 'mixset',
    // publishable 생략 → false → publish 토글 없음
    defaultValues: { title: '', coverUrl: '', url: '' },
    toEntry: (formData) =>
        ({
            ...createEmptyEntry('mixset'),
            title: formData.title.trim(),
            coverUrl: formData.coverUrl || '',
            url: formData.url || '',
        }) as MixsetEntry,
    errorFieldMap: { title: 'title' },
};
```

**`toEntry` 함수의 역할**: RHF가 관리하는 폼 데이터(flat object)를 도메인 객체(`ContentEntry`)로 변환한다. `createEmptyEntry(type)`이 `id`, `type`, `position` 등 폼에 없는 필드를 채워준다.

**`errorFieldMap`의 역할**: 서버 에러 메시지에 특정 키워드가 포함되면, 해당 폼 필드에 에러를 인라인 표시한다.

```
서버 에러: "poster upload failed"
              ↓ "poster" 키워드 매칭
errorFieldMap: { poster: 'posterUrl' }
              ↓
setError('posterUrl', { type: 'server', message: '...' })
              ↓
<FormMessage>에서 posterUrl 필드 아래에 에러 표시
```

---

## 6. 폼 컴포넌트 (CreateEventForm / CreateMixsetForm)

### CreateEventForm

📁 `ContentPanel/CreateEventForm.tsx`

```tsx
export default function CreateEventForm() {
    // 1. 훅에서 모든 로직 + 폼 객체를 받는다
    const {
        form,
        publishOption,
        canCreate,
        errors,
        isSubmitting,
        handleCancel,
        handlePublishOptionChange,
        handleSubmit,
    } = useCreateEntryForm(EVENT_FORM_CONFIG);

    const { control } = form;

    return (
        // 2. FormProvider로 폼 컨텍스트 주입
        <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 3. Root 에러 (서버 에러 등) */}
                {errors.root && (
                    <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                        {errors.root.message}
                    </div>
                )}

                {/* 4. 각 필드 — FormField + render prop */}
                <FormField
                    control={control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Enter event title" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* 커스텀 컴포넌트도 동일 패턴 */}
                <FormField
                    control={control}
                    name="posterUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Poster *</FormLabel>
                            <FormControl>
                                <ImageUpload
                                    value={field.value}
                                    onChange={field.onChange}
                                    aspectRatio="poster"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* 5. Publish 옵션 (이벤트만) */}
                <OptionSelector
                    options={PUBLISH_OPTIONS}
                    value={publishOption!}
                    onChange={handlePublishOptionChange!}
                />

                {/* 6. 제출 버튼 — canCreate + isSubmitting으로 제어 */}
                <Button type="submit" disabled={!canCreate || isSubmitting}>
                    {isSubmitting && <Loader2 className="animate-spin" />}
                    Create Event
                </Button>
            </form>
        </Form>
    );
}
```

**컴포넌트의 책임**: 순수 UI. 로직 없음. 훅이 반환한 값을 JSX에 바인딩만 한다.

### CreateMixsetForm과의 차이

|             | Event                                                 | Mixset                  |
| ----------- | ----------------------------------------------------- | ----------------------- |
| 필드 수     | 6개 (title, poster, date, venue, lineup, description) | 3개 (title, cover, url) |
| publishable | `true` (publish/private 선택)                         | `false` (항상 private)  |
| 커스텀 입력 | `SearchableInput`, `TagSearchInput`                   | `ImageUpload`           |

두 폼은 **동일한 훅**(`useCreateEntryForm`)을 사용하고, **config만 다르다**. 훅의 `hasPublishOption` 분기가 publish UI를 자동으로 켜고 끈다.

---

## 7. RHF 핵심 API 해설

### `useForm<T>(options)`

📁 `hooks/use-create-entry-form.ts:58-68`

```typescript
const form = useForm<T>({
    resolver: zodResolver(draftSchema),
    mode: 'onTouched',
    defaultValues,
});
```

| 옵션            | 값                    | 설명                      |
| --------------- | --------------------- | ------------------------- |
| `resolver`      | `zodResolver(schema)` | 외부 검증 라이브러리 연결 |
| `mode`          | `'onTouched'`         | 검증 시점                 |
| `defaultValues` | `{ title: '', ... }`  | 초기값                    |

### mode 옵션 비교

| mode              | 첫 검증 시점       | 이후 재검증         |
| ----------------- | ------------------ | ------------------- |
| `'onSubmit'`      | submit             | submit              |
| `'onBlur'`        | blur               | blur                |
| `'onChange'`      | 매 입력마다        | 매 입력마다         |
| **`'onTouched'`** | **blur (첫 터치)** | **onChange (이후)** |
| `'all'`           | blur + onChange    | blur + onChange     |

`'onTouched'`는 **사용자가 필드를 한 번 만져본 후부터** 검증을 시작한다. 빈 폼에서 아직 건드리지 않은 필드에 에러가 뜨지 않는다.

### `watch()`

```typescript
const formValues = watch(); // 모든 필드의 현재 값 반환
const canCreate = draftSchema.safeParse(formValues).success;
```

`watch()`는 모든 필드를 구독하므로 **어떤 필드든 변경되면 리렌더가 발생**한다. 이 프로젝트에서는 `canCreate` 실시간 판정을 위해 사용. 필드 수가 3~7개로 적어서 성능 이슈 없음.

### `handleSubmit(onSubmit)`

```typescript
// 훅 내부
const onSubmit = async (formData: T) => {
    /* ... */
};

// 반환
return { handleSubmit: handleSubmit(onSubmit) };
```

`handleSubmit`은 **RHF가 검증을 먼저 수행**한 뒤, 통과하면 `onSubmit`을 호출한다. 실패하면 `onSubmit`을 호출하지 않고 에러를 `formState.errors`에 설정.

```
사용자 Submit → handleSubmit 실행
                 ↓
              resolver(values) → zodResolver(schema)(values)
                 ↓                    ↓
              검증 성공            검증 실패
                 ↓                    ↓
           onSubmit(formData)   formState.errors 업데이트
                                  (FormMessage에 표시)
```

### `setError(name, error)`

```typescript
// 특정 필드에 에러 설정
setError('posterUrl', { type: 'server', message: 'Upload failed' });

// root 에러 (전역)
setError('root', { type: 'server', message: 'Network error' });
```

서버 응답 에러를 폼 필드에 매핑할 때 사용. `type: 'server'`는 RHF의 기본 타입이 아닌 커스텀 타입으로, 이후 재검증 시 자동으로 클리어되지 않는다.

### `trigger()`

```typescript
const handlePublishOptionChange = (value: PublishOption) => {
    setPublishOption(value);
    trigger(); // 폼 전체 재검증 강제 실행
};
```

publish/private 전환 시 resolver가 사용하는 스키마가 바뀌므로, `trigger()`로 강제 재검증한다. 그래야 새 스키마 기준의 에러가 즉시 반영된다.

### `reset()`

```typescript
const handleCancel = () => {
    reset(); // 폼을 defaultValues로 리셋
    if (hasPublishOption) setPublishOption('private'); // publish 상태도 리셋
    setView({ kind: 'page' }); // 뷰 전환
};
```

`reset()`은 모든 필드를 `defaultValues`로 되돌리고, `errors`, `isDirty`, `isSubmitted` 등 모든 상태를 초기화한다.

### `getValues()`

```typescript
const result = publishSchema.safeParse(form.getValues());
```

`watch()`와 달리 **구독하지 않는 1회성 조회**. 리렌더를 유발하지 않는다. publish 전환 시 현재 값을 검증하는 용도로 사용.

---

## 8. 검증 흐름 — zodResolver 연동

### 정적 resolver (Mixset, Link)

```typescript
resolver: zodResolver(draftSchema),
```

항상 같은 스키마로 검증.

### 동적 resolver (Event)

📁 `hooks/use-create-entry-form.ts:59-64`

```typescript
resolver: hasPublishOption
    ? (values, context, options) => {
          const schema =
              publishOptionRef.current === 'publish' ? publishSchema : draftSchema;
          return zodResolver(schema)(values, context, options);
      }
    : zodResolver(draftSchema),
```

**왜 `publishOptionRef`를 쓰나?**

```
useForm({ resolver: ... }) ← 초기 렌더 시 한 번 설정

만약 publishOption (state)를 직접 참조하면:
  → resolver 클로저가 초기값 'private'를 캡처
  → state가 'publish'로 바뀌어도 resolver는 여전히 'private' 참조
  → draftSchema만 계속 사용 (버그)

useRef로 해결:
  → publishOptionRef.current는 항상 최신 값
  → resolver 실행 시점에 최신 publishOption을 참조
```

### 검증 타이밍 종합

```
필드 최초 blur  →  onTouched 모드 발동  →  resolver(values)
                                            ↓
                                    zodResolver(schema)(values)
                                            ↓
                                    schema.safeParse(values)
                                            ↓
                                    성공: errors 클리어
                                    실패: errors 업데이트 → FormMessage 표시

이후 onChange   →  즉시 재검증 (touched된 필드만)

Submit 클릭     →  handleSubmit → resolver(전체 values)
                                    ↓
                            성공: onSubmit 실행
                            실패: errors 업데이트
```

### `canCreate` — submit 버튼 활성화 판정

```typescript
const formValues = watch();
const canCreate = draftSchema.safeParse(formValues).success;
```

RHF의 `formState.isValid`를 쓰지 않고 **Zod `safeParse`를 직접 호출**하는 이유:

- `formState.isValid`는 resolver의 결과에 의존 — publish 모드에서는 publishSchema 기준
- `canCreate`는 항상 **draftSchema** 기준이어야 함 (최소 조건만 충족하면 저장 가능)
- 따라서 resolver와 독립적으로 draftSchema를 직접 검증

---

## 9. 에러 처리 패턴

### 클라이언트 검증 에러

```
zodResolver → schema.safeParse 실패
  ↓
formState.errors = {
    title: { type: 'too_small', message: '제목은 2자 이상이어야 합니다' },
    posterUrl: { type: 'too_small', message: '포스터 이미지가 필요합니다' },
}
  ↓
<FormMessage />가 해당 필드 아래에 에러 표시
```

### 서버 에러 — 필드 매핑

📁 `hooks/use-create-entry-form.ts:140-153`

```typescript
} catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    // errorFieldMap에서 키워드 매칭
    const matchedEntry = Object.entries(errorFieldMap).find(([keyword]) =>
        message.includes(keyword)
    );

    if (matchedEntry) {
        setError(matchedEntry[1] as Path<T>, { type: 'server', message });
    } else {
        setError('root', { type: 'server', message });
        toast({ variant: 'destructive', title: 'Creation failed', description: message });
    }
}
```

```
서버 에러 메시지: "poster upload failed"
       ↓
errorFieldMap: { poster: 'posterUrl' }
       ↓ "poster" 키워드 포함
setError('posterUrl', { type: 'server', message })
       ↓
posterUrl 필드 아래에 에러 인라인 표시
```

```
서버 에러 메시지: "Internal server error"
       ↓
errorFieldMap: { poster: 'posterUrl' }
       ↓ 매칭 없음
setError('root', { type: 'server', message })
       ↓
errors.root.message → 폼 상단 에러 배너
+ toast 알림
```

### Root 에러 표시

```tsx
{
    errors.root && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{errors.root.message}</div>
    );
}
```

`root`는 RHF의 예약된 에러 키로, 특정 필드에 속하지 않는 전역 에러를 담는다.

---

## 10. RHF를 쓰지 않는 곳 — Editor 패턴

### EntryDetailView — 디바운스 자동 저장

📁 `ContentPanel/EntryDetailView.tsx`

```typescript
const [localEntry, setLocalEntry] = useState<ContentEntry>(entry);

const handleUpdate = (updates: Partial<ContentEntry>) => {
    const updated = { ...localEntry, ...updates } as ContentEntry;
    setLocalEntry(updated);
    debouncedSave(updated, Object.keys(updates));
};
```

### EventEditor — 인라인 편집 컴포넌트

📁 `ContentPanel/editors/EventEditor.tsx`

```tsx
<EditableField
    value={entry.title}
    onSave={(value) => onUpdate({ title: value })}
    placeholder="제목 없음"
/>

<EditableDateField
    value={entry.date}
    onSave={(value) => onUpdate({ date: value })}
/>
```

각 `EditableField`가 더블클릭 → 편집 → Enter/blur로 `onUpdate`를 호출한다. `onUpdate`가 `handleUpdate`를 거쳐 디바운스된 후 mutation으로 서버에 저장.

### form-field.tsx — 비RHF 폼 필드 컴포넌트

📁 `components/ui/form-field.tsx`

```typescript
export function FormField({ label, required, helper, error, children }: FormFieldProps) {
    return (
        <div className="space-y-2">
            <label>{label} {required && <span className="text-red-500">*</span>}</label>
            {children}
            {helper && !error && <p>{helper}</p>}
            {error && <p className="text-red-500">{error}</p>}
        </div>
    );
}
```

RHF와 무관한 단순 래퍼. `error`를 prop으로 직접 받아 표시한다. RHF를 사용하지 않는 폼(예: CreateVenueModal)에서 사용.

> 주의: `components/ui/form.tsx`의 `FormField`(RHF Controller 래핑)와 이름이 같다. import 경로로 구분.

---

## 11. API 정리

### useForm 반환값 중 사용하는 것

| API                      | 사용처               | 용도                          |
| ------------------------ | -------------------- | ----------------------------- |
| `handleSubmit`           | `useCreateEntryForm` | 검증 → onSubmit 호출          |
| `watch()`                | `useCreateEntryForm` | 실시간 canCreate 판정         |
| `reset()`                | `useCreateEntryForm` | 취소 시 폼 초기화             |
| `setError()`             | `useCreateEntryForm` | 서버 에러를 필드에 매핑       |
| `clearErrors()`          | `useCreateEntryForm` | submit 전 이전 에러 클리어    |
| `trigger()`              | `useCreateEntryForm` | publish 전환 시 강제 재검증   |
| `getValues()`            | `useCreateEntryForm` | publish 전환 시 1회성 값 조회 |
| `formState.errors`       | `useCreateEntryForm` | 에러 객체 반환                |
| `formState.isSubmitting` | `useCreateEntryForm` | 로딩 상태 반환                |
| `control`                | `CreateEventForm` 등 | FormField에 전달              |

### 사용하지 않는 RHF API

| API                 | 설명                 | 미사용 이유                                 |
| ------------------- | -------------------- | ------------------------------------------- |
| `register()`        | ref 기반 입력 연결   | Controller 패턴 사용 (커스텀 컴포넌트)      |
| `useFieldArray()`   | 동적 배열 필드       | 편집은 `useArrayField` 커스텀 훅 사용       |
| `formState.isValid` | 전체 폼 유효성       | canCreate는 draftSchema.safeParse 직접 사용 |
| `formState.isDirty` | 변경 여부            | 사용 안 함                                  |
| `setValue()`        | 프로그래밍적 값 설정 | Controller의 field.onChange 사용            |

---

## 12. 개선 포인트 & 메모

### 현재 잘 된 점

- **팩토리 훅 패턴**: 3개 폼 타입의 공통 로직을 `useCreateEntryForm`으로 통합 — config만 바꾸면 새 폼 타입 추가 가능
- **관심사 분리**: Config(설정) / Hook(로직) / Component(UI) 3계층 분리
- **동적 스키마 교체**: `publishOptionRef`로 resolver 클로저 문제를 해결
- **서버 에러 매핑**: `errorFieldMap`으로 서버 에러를 적절한 필드에 인라인 표시
- **Create/Edit 전략 분리**: UX 모델에 맞는 상태 관리 방식 선택

### 향후 검토할 점

1. **`watch()` 전체 구독**
    - `const formValues = watch()`는 모든 필드 변경 시 리렌더
    - 현재 필드 수가 적어서 괜찮지만, 필드가 많아지면 `watch('title')` 등 개별 구독 검토
    - 또는 `canCreate`를 `formState.isValid`로 대체할 수 있는지 검토

2. **Link 타입 폼 없음**
    - `ENTRY_SCHEMAS`에 `link` 스키마가 있지만, `CreateLinkForm` 컴포넌트와 `LINK_FORM_CONFIG`가 없음
    - 추가 필요 시 config + 컴포넌트만 만들면 훅은 재사용 가능

3. **FormField 이름 충돌**
    - `components/ui/form.tsx`의 `FormField` (RHF Controller 래핑)
    - `components/ui/form-field.tsx`의 `FormField` (단순 래퍼)
    - 같은 이름이라 import 시 혼동 가능 — 네이밍 차별화 검토

4. **Editor에서의 검증 부재**
    - Create는 Zod로 검증하지만, Edit(EntryDetailView)는 검증 없이 자동 저장
    - 필수 필드를 빈 값으로 저장할 수 있음 — 서버 사이드 검증으로 커버되는지 확인 필요
