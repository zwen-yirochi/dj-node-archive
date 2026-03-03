# Profile Links Feature Design

## Overview

사용자 프로필에 소셜/플랫폼 링크를 리스트로 관리하는 기능.
기존 `users.instagram`/`users.soundcloud` 개별 칼럼을 `pages.links` JSONB 배열로 통합.

## Decisions

| 항목        | 결정                                                     |
| ----------- | -------------------------------------------------------- |
| 링크 레벨   | 프로필 레벨 (헤더/Bio 영역)                              |
| 저장 방식   | `pages.links` JSONB 배열                                 |
| 기존 필드   | `users.instagram`/`soundcloud` 제거, 데이터 마이그레이션 |
| 대시보드 UI | 리스트 + `+ 링크 추가` 버튼 (collapsible section)        |
| 추가 흐름   | 인라인 Popover (플랫폼 프리셋 + 커스텀)                  |
| 검증        | Zod + RHF (기존 프로젝트 패턴 적용)                      |

## Data Structure

### DB (snake_case)

```sql
-- pages.links JSONB DEFAULT '[]'
[
  { "type": "instagram", "url": "https://instagram.com/username" },
  { "type": "spotify", "url": "https://open.spotify.com/artist/..." },
  { "type": "custom", "url": "https://example.com", "label": "My Site" }
]
```

### TypeScript Types

```typescript
// database.ts
export interface ProfileLinkData {
    type: string;
    url: string;
    label?: string; // custom 타입만
}

// Page에 추가
export interface Page {
    // ...existing
    links?: ProfileLinkData[];
}

// domain.ts
export type ProfileLinkType =
    | 'instagram'
    | 'bandcamp'
    | 'spotify'
    | 'apple_music'
    | 'soundcloud'
    | 'region'
    | 'custom';

export interface ProfileLink {
    type: ProfileLinkType;
    url: string;
    label?: string;
}

// Page에 추가
export interface Page {
    // ...existing
    links: ProfileLink[];
}
```

### Platform Config (client-side)

```typescript
// config/profileLinksConfig.ts
export const PLATFORM_PRESETS: Record<
    ProfileLinkType,
    {
        label: string;
        placeholder: string; // URL 입력 플레이스홀더
        urlPattern?: RegExp; // 선택적 URL 패턴 검증
    }
> = {
    instagram: { label: 'Instagram', placeholder: 'https://instagram.com/...' },
    bandcamp: { label: 'Bandcamp', placeholder: 'https://__.bandcamp.com' },
    spotify: { label: 'Spotify', placeholder: 'https://open.spotify.com/...' },
    apple_music: { label: 'Apple Music', placeholder: 'https://music.apple.com/...' },
    soundcloud: { label: 'SoundCloud', placeholder: 'https://soundcloud.com/...' },
    region: { label: 'Region', placeholder: 'URL' },
    custom: { label: 'Custom Link', placeholder: 'https://...' },
};
```

## Zod Schemas

```typescript
// lib/validations/profile-link.schemas.ts
export const profileLinkSchema = z
    .object({
        type: z.enum([
            'instagram',
            'bandcamp',
            'spotify',
            'apple_music',
            'soundcloud',
            'region',
            'custom',
        ]),
        url: z.string().url('Invalid URL'),
        label: z.string().max(50).optional(),
    })
    .refine((data) => data.type !== 'custom' || (data.label && data.label.trim().length > 0), {
        message: 'Label is required for custom links',
        path: ['label'],
    });

export const profileLinksArraySchema = z.array(profileLinkSchema).max(20);

export type ProfileLinkFormData = z.infer<typeof profileLinkSchema>;
```

Server-side (page handler):

```typescript
// updatePageSchema에 links 추가
const updatePageSchema = z.object({
    // ...existing fields
    links: profileLinksArraySchema.optional(),
});
```

## Migration

```sql
-- 1. pages에 links 칼럼 추가
ALTER TABLE pages ADD COLUMN links JSONB DEFAULT '[]';

-- 2. 기존 데이터 마이그레이션 (users → pages)
UPDATE pages p
SET links = (
  SELECT jsonb_agg(link ORDER BY link->>'type')
  FROM (
    SELECT jsonb_build_object('type', 'instagram', 'url', 'https://instagram.com/' || u.instagram) AS link
    FROM users u WHERE u.id = p.user_id AND u.instagram IS NOT NULL AND u.instagram != ''
    UNION ALL
    SELECT jsonb_build_object('type', 'soundcloud', 'url', 'https://soundcloud.com/' || u.soundcloud)
    FROM users u WHERE u.id = p.user_id AND u.soundcloud IS NOT NULL AND u.soundcloud != ''
  ) sub
)
WHERE EXISTS (
  SELECT 1 FROM users u
  WHERE u.id = p.user_id
  AND (u.instagram IS NOT NULL AND u.instagram != '' OR u.soundcloud IS NOT NULL AND u.soundcloud != '')
);

-- 3. users 테이블에서 기존 칼럼 제거
ALTER TABLE users DROP COLUMN instagram;
ALTER TABLE users DROP COLUMN soundcloud;
```

## Layer Changes

### Database Layer

- `page.queries.ts`: `updatePageLinks(pageId, links)` 추가

### Handler Layer

- `page.handlers.ts`: 기존 PATCH handler에 `links` 필드 지원 추가
- Zod validation: `profileLinksArraySchema`로 서버 검증

### Route Layer

- 기존 `PATCH /api/pages/[id]` 사용 (변경 없음)

### Client Layer

- `use-page.ts`: `updateLinks` mutation 추가 (optimistic update)
- `LinksSection.tsx`: 새 컴포넌트 (BioDesignPanel 내 collapsible section)
    - 링크 리스트 렌더링
    - Popover로 플랫폼 선택
    - RHF + Zod로 URL 입력 검증
    - debounced save

### Type Layer

- `database.ts`: Page에 `links` 추가, User에서 `instagram`/`soundcloud` 제거
- `domain.ts`: 동일 변경 + `ProfileLink`, `ProfileLinkType` 추가
- `mappers.ts`: User/Page 매퍼 업데이트

### Public Page

- `SocialLinks` 컴포넌트: `page.links` 배열 기반으로 리팩토링
- 모든 헤더에서 `user.instagram`/`soundcloud` 대신 `page.links` 전달
- `HeaderProps`에 `links` 추가

## Dashboard UI

```
BioDesignPanel
├── Profile (기존, collapsible)
│   ├── Avatar + Name
│   └── Bio
├── Links (새 섹션, collapsible)
│   ├── 링크 리스트
│   │   └── 각 행: [플랫폼 라벨] [URL 미리보기] [x 삭제]
│   └── [+ 링크 추가] → Popover
│       ├── 프리셋: IG, BC, Spotify, AM, SC, Region
│       └── 커스텀 링크
└── Header Style (기존)
```

### 추가 흐름

1. `+ 링크 추가` 클릭 → Popover 오픈
2. 플랫폼 선택 → 리스트에 행 추가, URL 입력 필드에 포커스
3. 커스텀 선택 → label + URL 모두 입력
4. URL 입력 시 RHF + Zod로 실시간 검증
5. 유효한 URL 입력 완료 → debounced save로 서버 동기화

### 삭제 흐름

- x 버튼 → 즉시 리스트에서 제거 + 서버 동기화

## Public Page Rendering

```typescript
// Before (하드코딩)
<SocialLinks instagram={user.instagram} soundcloud={user.soundcloud} />

// After (배열 기반)
<SocialLinks links={page.links} />
```

`SocialLinks`는 `PLATFORM_PRESETS`의 label을 사용하여 `ExternalLinks`에 전달.
