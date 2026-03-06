# Field-Based Schema Validation 설계

> 상태: Draft — 다음 작업 참조용

## 문제

1. Zod atom이 `entry.schemas.ts` 안에 `const`로 묻혀있음 (export 안 됨)
2. entry schema가 먼저 정의되고, fieldSchemas가 같은 atom을 다시 꺼내 쓰는 역방향 구조
3. FieldSync에 `schema?` 옵션이 있지만 연결 안 됨
4. DetailView마다 FieldSyncConfig를 로컬 선언 → 중복

```
현재 흐름 (entry-first):
entry.schemas.ts 내부에 atom 선언
    → entry schema 조합 (draftEventSchema 등)
    → fieldSchemas로 같은 atom 재노출 (역방향)
    → FieldSync와는 연결 안 됨
```

## 목표

**Field-first**: atom을 독립 파일로 분리, field config와 entry schema 모두 같은 atom에서 조합.

```
제안 흐름 (field-first):
field.atoms.ts (Zod atom 단일 소스)
    ├→ fieldConfigs.ts (저장전략 + schema → FieldSync)
    └→ entry.schemas.ts (entry-level 조합 → draft/publish)
```

## 설계

### Layer 0: Field Schema Atoms (신규 파일)

기존 `entry.schemas.ts`에 묻혀있던 atom을 독립 파일로 추출.
**모든 field validation의 단일 소스.**

```ts
// lib/validations/field.atoms.ts

import { z } from 'zod';

// --- 공유 sub-schema ---
export const venueReferenceSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).trim(),
});

export const artistReferenceSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).trim(),
});

export const tracklistItemSchema = z.object({
    track: z.string(),
    artist: z.string(),
    time: z.string(),
});

// --- 단일값 atom ---
export const titleAtom = z.string().min(1).max(100).trim();
export const dateAtom = z.string(); // loose (draft)
export const dateStrictAtom = z.string().min(1); // strict (publish)
export const urlAtom = z.string(); // loose
export const urlStrictAtom = z.string().url(); // strict
export const descriptionAtom = z.string();
export const iconAtom = z.string().optional();
export const imageUrlsAtom = z.array(z.string().min(1));

// --- 복합값 atom ---
export const lineupAtom = z.array(artistReferenceSchema);
export const tracklistAtom = z.array(tracklistItemSchema);
export const externalLinkAtom = z.object({
    title: z.string().min(1).trim(),
    url: z.string().url(),
});
```

### Layer 1: Field Sync Configs (shared-fields/fieldConfigs.ts)

atom을 import해서 **field UI의 저장 전략 + 검증**을 정의.

```ts
// shared-fields/fieldConfigs.ts
import { z } from 'zod';

import { dateAtom, urlStrictAtom, venueReferenceSchema } from '@/lib/validations/field.atoms';

export const TEXT_FIELD_CONFIG: FieldSyncConfig<string> = {
    debounceMs: 800,
};

export const DATE_FIELD_CONFIG: FieldSyncConfig<string> = {
    immediate: true,
    schema: dateAtom.regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')),
};

export const LINK_FIELD_CONFIG: FieldSyncConfig<string> = {
    immediate: true,
    schema: urlStrictAtom.or(z.literal('')),
};

export const EMBED_FIELD_CONFIG: FieldSyncConfig<string> = {
    debounceMs: 800,
    schema: urlStrictAtom.or(z.literal('')),
};

export const ICON_FIELD_CONFIG: FieldSyncConfig<string> = {
    immediate: true,
};

export const TAG_FIELD_CONFIG: FieldSyncConfig<TagItem[]> = {
    immediate: true,
};

export const VENUE_FIELD_CONFIG: FieldSyncConfig<VenueReference> = {
    debounceMs: 800,
    schema: venueReferenceSchema,
};

export const TRACKLIST_FIELD_CONFIG: FieldSyncConfig<TracklistItem[]> = {
    debounceMs: 800,
};

export const IMAGE_FIELD_CONFIG: FieldSyncConfig<ImageItem[]> = {
    immediate: true,
};
```

### Layer 2: Entry Schemas (entry.schemas.ts — 리팩터)

atom을 import해서 entry-level schema를 **조합만** 함.
자체 atom 선언 제거, fieldSchemas 객체 제거.

```ts
// lib/validations/entry.schemas.ts

import {
    dateAtom,
    dateStrictAtom,
    descriptionAtom,
    externalLinkAtom,
    iconAtom,
    imageUrlsAtom,
    lineupAtom,
    titleAtom,
    tracklistAtom,
    urlAtom,
    urlStrictAtom,
    venueReferenceSchema,
} from './field.atoms';

// --- Event ---
const eventBase = {
    title: titleAtom.min(2, 'Title must be at least 2 characters'),
    imageUrls: imageUrlsAtom.min(1, 'At least one image is required'),
    links: z.array(externalLinkAtom).optional(),
};

export const draftEventSchema = z.object({
    ...eventBase,
    date: dateAtom.default(''),
    venue: venueReferenceSchema.extend({ name: z.string().default('') }).default({ name: '' }),
    lineup: lineupAtom.default([]),
    description: descriptionAtom.default(''),
});

export const publishEventSchema = z.object({
    ...eventBase,
    date: dateStrictAtom,
    venue: venueReferenceSchema,
    lineup: lineupAtom.min(1, 'At least one artist is required'),
    description: descriptionAtom.min(1, 'Description is required').trim(),
});

// --- Mixset ---
export const draftMixsetSchema = z.object({
    title: titleAtom,
    imageUrls: imageUrlsAtom.default([]),
    url: urlStrictAtom,
});

export const publishMixsetSchema = z.object({
    title: titleAtom,
    imageUrls: imageUrlsAtom.min(1),
    url: urlStrictAtom,
});

// --- Link ---
export const draftLinkSchema = z.object({
    title: titleAtom,
    url: urlAtom.min(1).trim(),
    imageUrls: imageUrlsAtom.default([]),
});

export const publishLinkSchema = z.object({
    title: titleAtom,
    url: urlStrictAtom,
    imageUrls: imageUrlsAtom.default([]),
});

// ❌ 삭제: eventFieldSchemas, mixsetFieldSchemas, linkFieldSchemas
//    (Block 삭제됨 + fieldConfigs.ts가 대체)
```

### Layer 3: Entry Field Config (entryFieldConfig.ts — 확장)

기존 `FieldConfig`에 `syncConfig`를 추가하여 fieldConfigs.ts와 연결.

```ts
// config/entryFieldConfig.ts
import {
    DATE_FIELD_CONFIG,
    ICON_FIELD_CONFIG,
    IMAGE_FIELD_CONFIG,
    LINK_FIELD_CONFIG,
    TAG_FIELD_CONFIG,
    TEXT_FIELD_CONFIG,
    TRACKLIST_FIELD_CONFIG,
    VENUE_FIELD_CONFIG,
} from '../components/ContentPanel/shared-fields';

export interface FieldConfig {
    key: string;
    label: string;
    triggersPreview: boolean;
    syncConfig: FieldSyncConfig<unknown>;
}

export const FIELD_CONFIG: Record<EntryType, FieldConfig[]> = {
    event: [
        { key: 'title', label: 'Title', triggersPreview: true, syncConfig: TEXT_FIELD_CONFIG },
        { key: 'date', label: 'Date', triggersPreview: true, syncConfig: DATE_FIELD_CONFIG },
        { key: 'venue', label: 'Venue', triggersPreview: true, syncConfig: VENUE_FIELD_CONFIG },
        {
            key: 'imageUrls',
            label: 'Images',
            triggersPreview: true,
            syncConfig: IMAGE_FIELD_CONFIG,
        },
        { key: 'lineup', label: 'Lineup', triggersPreview: true, syncConfig: TAG_FIELD_CONFIG },
        {
            key: 'description',
            label: 'Description',
            triggersPreview: false,
            syncConfig: TEXT_FIELD_CONFIG,
        },
    ],
    mixset: [
        { key: 'title', label: 'Title', triggersPreview: true, syncConfig: TEXT_FIELD_CONFIG },
        {
            key: 'imageUrls',
            label: 'Images',
            triggersPreview: true,
            syncConfig: IMAGE_FIELD_CONFIG,
        },
        { key: 'url', label: 'URL', triggersPreview: true, syncConfig: LINK_FIELD_CONFIG },
        {
            key: 'tracklist',
            label: 'Tracklist',
            triggersPreview: false,
            syncConfig: TRACKLIST_FIELD_CONFIG,
        },
        {
            key: 'description',
            label: 'Description',
            triggersPreview: false,
            syncConfig: TEXT_FIELD_CONFIG,
        },
    ],
    link: [
        { key: 'title', label: 'Title', triggersPreview: true, syncConfig: TEXT_FIELD_CONFIG },
        { key: 'url', label: 'URL', triggersPreview: true, syncConfig: LINK_FIELD_CONFIG },
        {
            key: 'imageUrls',
            label: 'Images',
            triggersPreview: true,
            syncConfig: IMAGE_FIELD_CONFIG,
        },
        { key: 'icon', label: 'Icon', triggersPreview: true, syncConfig: ICON_FIELD_CONFIG },
        {
            key: 'description',
            label: 'Description',
            triggersPreview: false,
            syncConfig: TEXT_FIELD_CONFIG,
        },
    ],
    custom: [
        { key: 'title', label: 'Title', triggersPreview: true, syncConfig: TEXT_FIELD_CONFIG },
        { key: 'blocks', label: 'Blocks', triggersPreview: true, syncConfig: IMAGE_FIELD_CONFIG },
    ],
};

// entry-level schema는 기존과 동일 (ENTRY_SCHEMAS)
// validateEntry, canCreate, canAddToView 등 헬퍼도 변경 없음
```

## 검증 실패 UX

현재 FieldSync는 schema 실패 시 silent drop (onChange를 호출하지 않음).
개선 필요:

1. **FieldSync에 `onValidationError` 콜백 추가** — caller가 toast 등으로 알림
2. **또는** saveStatus에 `'validation_error'` 상태 추가 → 필드 UI에서 표시

## 최종 구조도

```
lib/validations/field.atoms.ts (Zod atom 단일 소스)
    │
    ├──→ shared-fields/fieldConfigs.ts (field-level: 저장전략 + atom 조합)
    │       │
    │       └──→ config/entryFieldConfig.ts (entry-level: field 목록 + syncConfig 참조)
    │               │
    │               └──→ DetailView (config 선언 0줄, import만)
    │
    └──→ lib/validations/entry.schemas.ts (entry-level: atom 조합 → draft/publish)
            │
            └──→ config/entryFieldConfig.ts (ENTRY_SCHEMAS → validateEntry 등)
```

## DetailView 최종 형태

```tsx
// EventDetailView.tsx — config 선언 0줄
import {
    TEXT_FIELD_CONFIG, DATE_FIELD_CONFIG, VENUE_FIELD_CONFIG,
    TAG_FIELD_CONFIG, IMAGE_FIELD_CONFIG,
} from '../shared-fields';

<FieldSync config={TEXT_FIELD_CONFIG} value={title} onSave={...}>
<FieldSync config={DATE_FIELD_CONFIG} value={date} onSave={...}>
<FieldSync config={VENUE_FIELD_CONFIG} value={venue} onSave={...}>
<FieldSync config={TAG_FIELD_CONFIG} value={toTagItems(entry.lineup)} onSave={...}>
<FieldSync config={IMAGE_FIELD_CONFIG} value={imageItems} onSave={...}>
```

### custom-blocks (EmbedSection 등)

custom-blocks는 FieldSync 없이 직접 필드를 사용하므로 config와 무관.
부모인 BlockWrapper/SectionBlockEditor가 저장을 관리하며,
schema 검증이 필요하면 해당 레이어에서 config를 참조.

## 작업 순서

1. `lib/validations/field.atoms.ts` 생성 — entry.schemas.ts에서 atom 추출
2. `entry.schemas.ts` 리팩터 — atom import로 교체 + fieldSchemas 객체 제거
3. `shared-fields/fieldConfigs.ts` 확장 — atom import해서 field config + schema 정의
4. `entryFieldConfig.ts`에 `syncConfig` 필드 추가
5. 각 DetailView에서 로컬 config → import config로 교체
6. 검증 실패 UX 결정 (silent drop vs 피드백)
7. FieldSync에 실패 피드백 경로 추가
