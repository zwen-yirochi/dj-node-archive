# PR #96 코드 리뷰

> **Branch**: `refactor/error-boundary-suspense` → `dev`
> **Scope**: 97 files changed, +5,677 / -5,557 (40 commits)
> **리뷰 일자**: 2026-02-28

---

## 개요

대시보드 전반을 5개 Phase로 나눠 리팩토링한 대규모 PR.

| Phase | 내용                                                                            |
| ----- | ------------------------------------------------------------------------------- |
| 1     | Error Boundary + Suspense (`react-error-boundary` + `useSuspenseQuery`)         |
| 2     | 스토어 통합 — Zustand 3개 → 1개 UI 스토어 + TanStack Query(서버 상태)           |
| 3     | 컴포넌트 분해 — `InlineEditMode`(733줄) → 타입별 에디터, `BioDesignPanel` → 3개 |
| 4     | API 4-layer 준수 — 모든 route를 `withAuth` + handler 위임으로 슬림화            |
| 5     | Config-driven 아키텍처 — 폼 팩토리 훅, 메뉴/필드/스키마 레지스트리              |

아키텍처 방향은 전반적으로 우수. 아래는 구체적 발견 사항.

---

## 버그 및 이슈

### 심각도: 높음

#### 1. 통합 검색 라우트에서 `query.length > 100` 검증 제거

- **파일**: `src/app/api/(public)/search/route.ts`
- **내용**: 기존 코드에 있던 `query.length > 100` 체크가 삭제되고 `query.length < 2`만 남음
- **영향**: 무제한 길이의 검색어가 DB에 도달하여 성능 저하 또는 DoS 가능
- **권장**: max length 체크 복원 (200~500 정도라도)

#### 2. `durationMinutes` falsy 체크로 값 `0` 유실

- **파일**: `src/lib/mappers.ts`
- **코드**: `duration_minutes: mixsetEntry.durationMinutes || undefined`
- **문제**: `durationMinutes`가 `0`이면 `||`에 의해 `undefined`로 변환됨
- **수정**: `|| undefined` → `?? undefined`

#### 3. 아바타 업로드 시 레이스 컨디션

- **파일**: `src/lib/api/handlers/user.handlers.ts` (`handleUploadAvatar`)
- **문제**: 기존 아바타 파일을 **삭제한 후** 새 파일을 업로드함. 업로드 실패 시 사용자는 아바타를 잃고 DB에는 삭제된 URL이 남음
- **권장**: 새 파일 업로드 성공 후 기존 파일 삭제, 또는 트랜잭션 처리

#### 4. `handleUpdatePage`에 입력 검증 없음

- **파일**: `src/lib/api/handlers/page.handlers.ts`
- **문제**: `body.theme`과 `body.is_public`이 `request.json()`에서 바로 DB로 전달됨. Zod 스키마 검증 없음
- **영향**: `theme`에 임의 콘텐츠 저장 가능, `is_public`에 비-boolean 값 가능
- **권장**: Zod 스키마 추가

### 심각도: 중간

#### 5. `snapshotRef.current!` 비-null 단언

- **파일**: `src/app/dashboard/hooks/optimistic-mutation.ts`
- **코드**: `config.triggersPreview(params, snapshotRef.current!)`
- **문제**: `onMutate`에서 snapshot을 설정하지 못한 경우(캐시가 비어있을 때) 런타임 에러 발생 가능

#### 6. `useArrayField`에서 렌더 중 ref 변경

- **파일**: `src/app/dashboard/hooks/use-array-field.ts`
- **문제**: `while` 루프와 `keysRef.current.length = items.length` 트렁케이션이 렌더 중 실행됨. 외부에서 items가 변경되면 key-item 불일치 가능. Concurrent Mode에서 불안정
- **권장**: `useMemo` 또는 `useEffect`로 이동

#### 7. 검색 라우트에서 `parseInt` → `NaN` 전파

- **파일**: `src/app/api/(public)/search/*.ts`
- **문제**: try-catch 제거 후, `parseInt(searchParams.get('limit'))`가 `NaN` 생성 가능. `Math.max(1, NaN)` → `NaN`이 DB 쿼리의 offset/limit으로 전달됨
- **권장**: `parseInt` 결과에 `|| defaultValue` 폴백 추가

#### 8. `CreateEventForm`에서 `publishOption!` 비-null 단언

- **파일**: `src/app/dashboard/components/ContentPanel/CreateEventForm.tsx`
- **문제**: 현재 `publishable: true` config에서는 안전하나, 비-publishable config으로 재사용 시 런타임 크래시
- **권장**: 타입 가드 또는 조건부 렌더링

#### 9. Root ErrorBoundary 제거

- **파일**: `src/app/layout.tsx`
- **문제**: 글로벌 `ErrorBoundary` 제거됨. 대시보드 layout에만 존재. 랜딩, 디스커버리, 베뉴 상세, 유저 프로필 페이지에는 에러 바운더리 없음
- **영향**: 해당 페이지에서 미처리 에러 발생 시 화이트 스크린
- **권장**: root layout에 최소한의 에러 바운더리 유지

### 심각도: 낮음

#### 10. 기타

- `handleDeleteAvatar`가 사용하지 않는 `request` 파라미터를 받음
- 8개 mutation이 단일 `snapshotRef`를 공유 — 빠른 연속 mutation 시 snapshot 덮어쓰기 가능
- `handleListVenues`에 auth context 파라미터 없음 (의도적 공개 API일 수 있으나 핸들러 시그니처 불일치)

---

## 보안

### 1. `.passthrough()`로 알 수 없는 필드 통과

- **파일**: `src/lib/validations/entry.schemas.ts`
- **문제**: `createEntryRequestSchema`의 `entry` 객체에 `.passthrough()` 사용. `__proto__`, `constructor` 등 프로토타입 오염 키가 검증을 통과하여 downstream에서 spread됨
- **권장**: handler에서 알 수 없는 필드 strip 처리, 또는 `.strict()` 사용

### 2. 아바타 파일 확장자를 클라이언트 입력에서 추출

- **파일**: `user.handlers.ts`
- **문제**: `file.name.split('.').pop()`으로 확장자 추출. MIME 타입 검증은 있으나 spoofable. magic-byte 검증 없음
- **영향**: `exploit.svg` (JS 포함 가능)가 이미지 MIME으로 위장하여 업로드 가능

### 3. 아바타 경로 추출의 문자열 split 의존

- **파일**: `user.handlers.ts`
- **코드**: `avatar_url.split('/avatars/')[1]`
- **문제**: 이전에 저장된 `avatar_url`이 조작된 경우, `avatars` 버킷 내 의도하지 않은 파일 삭제 가능

### 4. Venue 핸들러에서 URL 필드 미검증

- **파일**: `venue.handlers.ts`
- **문제**: `website`, `instagram`, `google_maps_url`이 trim만 되고 URL 형식 검증 없음
- **영향**: `javascript:` URL 등 악성 콘텐츠가 저장 후 링크로 렌더링될 수 있음

### 5. DB 에러 메시지가 클라이언트에 노출

- **위치**: 다수의 핸들러
- **문제**: `result.error.message`가 `internalErrorResponse()`에 직접 전달됨. 테이블명, 컬럼명, 제약조건명 등 내부 정보 유출 가능
- **권장**: 프로덕션에서는 제네릭 에러 메시지 반환, 원본은 서버 로그에만 기록

### 6. `request.json()` try-catch 없음

- **위치**: `artists/route.ts` 등
- **문제**: 잘못된 JSON body 시 `request.json()`이 throw. `withAuth`가 이를 catch하는지 확인 필요

---

## 코드 품질 — 긍정적

| 항목                                                   | 설명                                                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **ContentView 식별 유니언**                            | `activePanel` + `selectedEntryId` + `createPanelType` 3개 필드 → 단일 `ContentView` 유니언. 불가능한 상태 조합 원천 차단 |
| **`makeOptimisticMutation` 팩토리**                    | 8개 mutation의 cancel→snapshot→update→rollback→invalidate 보일러플레이트를 선언적 config로 통합                          |
| **`useSuspenseQuery` 전환**                            | `data?.` 옵셔널 체이닝 전면 제거, 적절한 Suspense 경계 구현                                                              |
| **`z.infer<typeof schema>` 폼 타입**                   | 스키마-타입 불일치(drift) 원천 차단                                                                                      |
| **콜백 ref 기반 preview refresh**                      | `previewVersion` 카운터 대비 단순하고 불필요한 re-render 제거                                                            |
| **Config-driven 아키텍처**                             | `FORM_REGISTRY`, `EDITOR_REGISTRY`, `EDITOR_MENU_CONFIG` — 새 엔트리 타입 추가 시 config 추가만으로 충분                 |
| **`QueryErrorResetBoundary` + `react-error-boundary`** | retry 시 쿼리 캐시 에러 상태도 함께 클리어                                                                               |
| **서버사이드 아바타 업로드**                           | 클라이언트 Supabase Storage SDK 직접 호출 → 서버 핸들러로 이동 (파일 검증 포함)                                          |
| **`verifyUserOwnership`**                              | auth UUID → app user UUID 매핑으로 기존 인증/ID 불일치 버그 수정                                                         |
| **의사결정 문서**                                      | `FORM_FACTORY_DECISIONS.md` 등 "왜"를 기록한 문서 우수                                                                   |

---

## 코드 품질 — 개선 제안

### 1. PR 범위

97개 파일, 5개 Phase를 한 PR에 담는 것은 리뷰가 매우 어려움. 향후에는 Phase 단위로 PR 분리 권장.

### 2. 테스트 부재

3개 스토어 삭제, 전체 mutation 재작성, `useQuery` → `useSuspenseQuery` 전환 — 회귀 위험이 높은 변경이지만 테스트 커버리지 없음.

### 3. `EntryMapperInput` 타입 약화

```typescript
type EntryMapperInput = ContentEntry | ({ type: ContentEntry['type'] } & Record<string, unknown>);
```

`Record<string, unknown>`이 Zod `.passthrough()` 결과를 수용하기 위해 추가됨. switch 내부의 `as EventEntry` 캐스트가 실제 shape과 맞지 않으면 `undefined` 값이 DB에 기록됨.

### 4. `useArrayField`가 mutable ref 노출

`keys: keysRef.current` — 소비자가 직접 배열을 변경할 수 있음. spread 복사본(`[...keysRef.current]`) 반환 권장.

### 5. 한국어/영어 혼용

Zod 에러 메시지, 주석, 검증 문자열에서 언어가 혼재. 일관성 필요.

### 6. `HeaderStyleSection`이 미연결 상태

선택된 헤더 스타일이 `useState`만 사용하고 mutation/persistence에 연결되지 않음. 미완성 기능으로 보임.

### 7. `TreeSidebar`에서 빈 엔트리 시 영구 스켈레톤

`if (entries.length === 0) return <TreeSidebarSkeleton />` — 새 사용자(엔트리 0개)가 로딩 스켈레톤만 계속 봄. 빈 상태(Empty State) UI 필요.

### 8. 검색 라우트에서 콘솔 에러 로깅 제거

기존 `console.error(...)` 삭제됨. `internalErrorResponse`에 서버사이드 로깅이 포함되는지 확인 필요.

---

## 결론

아키텍처 방향은 우수함 — 식별 유니언, config-driven 설계, Suspense/ErrorBoundary 합성, 깔끔한 상태 분리. 머지 전 아래 항목 우선 처리 권장:

1. **`handleUpdatePage` 입력 검증 추가** (Zod 스키마)
2. **검색 라우트 `query.length > 100` 복원**
3. **아바타 업로드 순서 수정** (업로드 성공 후 기존 파일 삭제)
4. **`durationMinutes` `||` → `??` 수정**
5. **Root layout ErrorBoundary 최소 유지**
