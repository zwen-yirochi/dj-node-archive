# Shared-Fields Cleanup & Block Renderer 설계

## 배경

shared-fields 리뷰 결과 다음 문제를 발견:

- custom-blocks Section 5개가 FieldSync를 우회하여 저장 파이프라인 불일치
- alt/caption 미사용 기능 잔존
- editable-field.tsx 레거시 미사용 코드
- VenueField 이중 디바운스
- 디렉토리 구조가 ContentPanel에 묶여 재사용 어려움
- SaveOptions/FieldSyncConfig 역방향 import

## 작업 목록

### 1. Config-driven BlockFieldRenderer

Section 파일 5개(ImageSection, EmbedSection, HeaderSection, RichTextSection, KeyValueSection)를 삭제하고,
`BLOCK_DEFS` config + `BlockFieldRenderer` 단일 컴포넌트로 교체.

**BLOCK_DEFS 구조:**

```ts
interface BlockFieldDef {
    dataKey: string; // block.data 내 키 ('$root'이면 전체 변환)
    component: ComponentType<FieldComponentProps<any>>;
    fieldConfig: FieldSyncConfig<any>;
    props?: Record<string, unknown>;
    toFieldValue?: (data: any) => any; // block data -> field value
    fromFieldValue?: (fieldValue: any) => any; // field value -> block data
}

interface BlockDef {
    icon: LucideIcon;
    label: string;
    fields: BlockFieldDef[];
}
```

**매핑:**

- header: TextField x2 (title, subtitle) — TEXT_FIELD_CONFIG
- richtext: TextField (textarea) — TEXT_FIELD_CONFIG
- image: ImageField (maxCount=1) — IMAGE_FIELD_CONFIG + transform
- embed: EmbedField — URL_FIELD_CONFIG (immediate + URL schema)
- keyvalue: KeyValueField — KEYVALUE_FIELD_CONFIG (신규, debounceMs: 800)

**렌더러:** BlockWrapper > FieldSync > Field, config 순회.

### 2. alt/caption 삭제

- `ImageBlockData`에서 `alt`, `caption` 제거 -> `{ url: string }`
- `ImageItem`에서 `alt`, `caption` 제거 -> `{ id: string; url: string }`
- ImageSection의 변환 로직 단순화 (BlockFieldRenderer의 transform으로 대체)

### 3. editable-field.tsx 삭제

사용처 없음 확인 완료. 파일 삭제.

### 4. VenueField query/onChange 상태 분리

VenueField에서 `query` state가 검색 effect와 free-text onChange 양쪽에서 사용됨.

- 검색: `query` 변경 → 300ms 디바운스 → API 호출
- free-text: `query` 변경 → `onChange({ name: v })` → FieldSync 800ms 디바운스 → 저장

이중 디바운스는 아니지만, `query`가 두 역할을 겸하고 있어 의도 파악이 어려움.
검색용 `searchQuery`와 표시용 `inputValue`를 분리하면 명확해짐.

### 5. 디렉토리 Option A

```
dashboard/components/
  fields/                 <- shared-fields 승격 (ContentPanel 종속 제거)
    types.ts              <- FieldComponentProps + ImageItem + SaveOptions + FieldSyncConfig
    FieldSync.tsx
    image/
    TextField.tsx, DateField.tsx, ...
  ContentPanel/
    detail-views/
    BlockFieldRenderer.tsx  <- 신규 (Section 대체)
    BlockWrapper.tsx        <- custom-blocks에서 이동
    CustomEntryEditor.tsx
```

### 6. 타입 정리

- `SaveOptions`를 `fields/types.ts`로 이동 (detail-views/types.ts에서 제거)
- `FieldSyncConfig`를 `fields/types.ts`로 이동 (FieldSync.tsx에서 제거, export만)
- `ImageItem`, `ImageAspectRatio`는 fields/types.ts 유지
- domain 타입(`VenueReference`, `ArtistReference`, `TracklistItem` 등)은 `src/types/domain.ts` 유지

### 7. KEYVALUE_FIELD_CONFIG 추가

`fieldConfigs.ts`에 `KEYVALUE_FIELD_CONFIG: FieldSyncConfig<{key:string;value:string}[]> = { debounceMs: 800 }` 추가.

### 8. KeyValueField key 안정성 — GitHub 이슈

구현 작업 아님. 이슈만 생성.

## 스코프 외

- 유저 페이지 Field 재사용 (아직 공개 프로필 편집 없음)
- KeyboardSensor, aria-label 등 접근성 개선 (별도 이슈)
- fieldConfigs.ts 순환 의존 해소 (디렉토리 이동으로 자연 해결)
