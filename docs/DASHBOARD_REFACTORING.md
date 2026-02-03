# Dashboard 도메인 리팩토링 계획

> `/src/app/dashboard` 대상 코드 품질 개선 계획서

## 현황 분석

### 디렉토리 구조

```
/src/app/dashboard/
├── page.tsx                    # Server - 진입점
├── layout.tsx                  # Server - 인증 체크
├── EditorClient.tsx            # Client - 메인 오케스트레이터
├── components/
│   ├── PreviewPanel.tsx        # iPhone 프리뷰
│   ├── Header.tsx              # ❌ 미사용
│   ├── ProfileEditor.tsx       # ❌ 미사용 (BioDesignPanel과 중복)
│   ├── DashboardSidebar.tsx    # ❓ TreeSidebar로 대체됨
│   ├── Sidebar.tsx             # ❓ 미사용
│   ├── AddComponentModal.tsx   # 컴포넌트 추가 모달
│   ├── AddComponentMenu.tsx    # ❓ 미사용
│   ├── ComponentEditor.tsx     # ❓ EditMode로 대체됨
│   ├── ComponentDetail.tsx     # ❓ ViewMode로 대체됨
│   ├── ComponentList.tsx       # ❓ TreeSidebar로 대체됨
│   ├── SortableComponentCard.tsx # ❓ TreeItem으로 대체됨
│   ├── ContentPanel/
│   │   ├── index.tsx           # 뷰/편집/바이오/페이지 모드 라우터
│   │   ├── ViewMode.tsx        # 읽기 전용 디스플레이
│   │   ├── BioDesignPanel.tsx  # 프로필 및 헤더 스타일링
│   │   ├── PageListView.tsx    # 페이지 가시성 및 순서 관리
│   │   ├── EmptyState.tsx      # 빈 상태 플레이스홀더
│   │   └── EditMode/
│   │       ├── index.tsx       # 에디터 라우터
│   │       ├── ShowEditor.tsx  # 이벤트 에디터
│   │       ├── LinkEditor.tsx  # 링크 에디터
│   │       └── MixsetEditor.tsx # 믹스셋 에디터
│   └── TreeSidebar/
│       ├── index.tsx           # 드래그앤드롭 사이드바
│       ├── ViewSection.tsx     # 드롭 가능 영역
│       ├── TreeItem.tsx        # 개별 컴포넌트 아이템
│       ├── SectionItem.tsx     # 섹션 헤더
│       └── AccountSection.tsx  # 사용자 정보 섹션
└── hooks/
    ├── useComponentOperations.ts # ❓ EditorClient와 중복
    ├── useEditorData.ts          # ❓ 사용 여부 확인 필요
    └── useDragAndDrop.ts
```

---

## 피드백 검토 결과

### 1. Preview Panel 위치 이동

| 항목 | 내용 |
|------|------|
| **피드백** | layout 또는 page로 옮겨 SSR/서버 액션 활용 |
| **판정** | ⚠️ 부분 동의 |
| **이유** | `refreshKey`가 클라이언트 상태(Zustand)에 의존하여 Server Component로 완전 이동 시 상태 감지 불가 |
| **대안** | `layout.tsx`에 배치하되 Client Component로 유지, username만 props로 전달 |

### 2. EditMode/ViewMode 아이콘 중앙 상수화

| 항목 | 내용 |
|------|------|
| **피드백** | 아이콘 정의 중앙 상수화 |
| **판정** | ✅ 매우 적절 |
| **현황** | 3곳 이상에서 동일 코드 중복 |

**중복 위치:**

| 파일 | 중복 코드 |
|------|----------|
| `ViewMode.tsx:36-45` | `iconComponents` |
| `LinkEditor.tsx:11-20` | `iconComponents` |
| `TreeItem.tsx:39-55` | `typeConfig` |
| `PageListView.tsx:37-56` | `typeConfig` |

**해결:** `src/constants/componentIcons.ts` 생성

### 3. Dropdown shadcn UI 디자인 일관성

| 항목 | 내용 |
|------|------|
| **피드백** | 잘 되고 있음 |
| **판정** | ✅ 확인됨 |

### 4. BioDesign 패널 API Next.js 방식 전환

| 항목 | 내용 |
|------|------|
| **피드백** | React API를 Next.js 방식으로 통합/분리 |
| **판정** | ✅ 적절 |
| **현황 문제점** | fetch 직접 호출, Supabase storage 직접 접근, debounce 없음 |

**현재 패턴:**
```typescript
// BioDesignPanel.tsx - 현재
await fetch(`/api/users/${user.id}`, {
  method: 'PATCH',
  body: JSON.stringify({ [field]: value }),
});
```

**권장 패턴:**
```typescript
// actions/user.ts - Server Action
'use server'
export async function updateUserProfile(userId: string, data: Partial<User>) {
  // validation + supabase update
}
```

### 5. React Hook Form 도입

| 항목 | 내용 |
|------|------|
| **피드백** | 폼 형태와 API 사용량 증가로 도입 시점 |
| **판정** | ✅ 적절한 타이밍 |

**대상 컴포넌트:**
- `ShowEditor.tsx` - 태그 입력, 날짜, URL 등 복잡한 폼
- `LinkEditor.tsx` - URL 유효성 검사 필요
- `MixsetEditor.tsx` - 동적 트랙리스트 + URL 검증
- `BioDesignPanel.tsx` - 프로필 수정

**권장:** Zod + React Hook Form 조합

### 6. ViewMode 컴포넌트 분리

| 항목 | 내용 |
|------|------|
| **피드백** | UI 작업 속도와 유지보수성 향상을 위해 분리 |
| **판정** | ✅ 적절 |
| **현황** | `ShowDetail`, `MixsetDetail`, `LinkDetail`이 같은 파일 내 존재 |

**해결:** 각각 별도 파일로 분리
```
ContentPanel/
└── ViewMode/
    ├── index.tsx
    ├── ShowDetail.tsx
    ├── MixsetDetail.tsx
    └── LinkDetail.tsx
```

### 7. 안쓰는 컴포넌트 정리

| 항목 | 내용 |
|------|------|
| **피드백** | 미사용 컴포넌트 정리 및 재활용 |
| **판정** | ✅ 매우 적절 |

**삭제 대상:**

| 파일 | 상태 | 비고 |
|------|------|------|
| `Header.tsx` | ❌ 삭제 | 미사용 |
| `ProfileEditor.tsx` | ❌ 삭제 | BioDesignPanel과 중복 |
| `DashboardSidebar.tsx` | ❓ 확인 필요 | TreeSidebar로 대체 |
| `Sidebar.tsx` | ❓ 확인 필요 | 미사용 |
| `AddComponentMenu.tsx` | ❓ 확인 필요 | AddComponentModal로 대체 |
| `ComponentEditor.tsx` | ❓ 확인 필요 | EditMode로 대체 |
| `ComponentDetail.tsx` | ❓ 확인 필요 | ViewMode로 대체 |
| `ComponentList.tsx` | ❓ 확인 필요 | TreeSidebar로 대체 |
| `SortableComponentCard.tsx` | ❓ 확인 필요 | TreeItem으로 대체 |

---

## 추가 발견 리팩토링 포인트

### 🔴 HIGH Priority

#### 8. `eventToComponent` 함수 중복
- `EditorClient.tsx:85-97`
- `useComponentOperations.ts:18-30`
- **해결:** `src/lib/transformers.ts`로 추출

#### 9. 이미지 업로드 로직 중복
- `BioDesignPanel.tsx`와 `ProfileEditor.tsx`에 동일 코드
- 5MB 검증, 파일 타입 체크, Supabase storage 업로드
- **해결:** `src/lib/upload.ts` 또는 커스텀 훅으로 추출

#### 10. 에러 핸들링 부재
- 현재: `console.error`만 사용
- 사용자 피드백 없음
- **해결:** Toast 또는 Error boundary 도입

### 🟡 MEDIUM Priority

#### 11. deprecated `useEditorStore` 사용 중
- `BioDesignPanel.tsx`, `PreviewPanel.tsx` 등에서 사용
- **해결:** 개별 store로 마이그레이션
  - `useComponentStore`
  - `useUIStore`
  - `useUserStore`

#### 12. hooks 폴더 정리
- `useComponentOperations.ts` - EditorClient와 중복
- `useEditorData.ts` - 사용 여부 확인 필요
- **해결:** 삭제 또는 통합

#### 13. API 응답 타입 안전성
- fetch 호출 시 응답 타입 검증 없음
- **해결:** Zod로 런타임 검증 추가

### 🟢 LOW Priority

#### 14. 성능 최적화
- `ViewMode.tsx` 내부 함수 정의 → 컴포넌트 외부로 이동
- `typeConfig` 객체 → 상수로 분리 후 재사용

#### 15. 타입 정의 개선
- `ComponentData` union type 더 strict하게
- `icon` 필드를 `string` → union literal로

---

## 작업 순서

### 1단계: 정리 ✅ 완료
- [x] 미사용 컴포넌트 삭제 (12개 파일)
  - [x] `Header.tsx`
  - [x] `ProfileEditor.tsx`
  - [x] `DashboardSidebar.tsx`, `Sidebar.tsx`
  - [x] `AddComponentMenu.tsx`, `ComponentEditor.tsx`, `ComponentDetail.tsx`
  - [x] `ComponentList.tsx`, `SortableComponentCard.tsx`
  - [x] `hooks/` 폴더 전체 (useComponentOperations, useEditorData, useDragAndDrop)
- [x] 중복 코드 통합
  - [x] 아이콘 설정 → `src/constants/componentConfig.ts`
  - [x] `eventToComponent`, `createEmptyComponent` → `src/lib/transformers.ts`
  - [x] 이미지 업로드 → ProfileEditor 삭제로 중복 해소
- [x] deprecated store 마이그레이션
  - [x] `PreviewPanel.tsx` → `useUserStore`, `useComponentStore` 사용

### 2단계: 구조 개선
- [ ] ViewMode 내부 컴포넌트 분리
  - [ ] `ShowDetail.tsx`
  - [ ] `MixsetDetail.tsx`
  - [ ] `LinkDetail.tsx`
- [ ] BioDesignPanel 코드 분리 및 Server Action 전환
- [ ] 상수/타입 중앙화
  - [ ] `src/constants/`
  - [ ] `src/types/`

### 3단계: 품질 향상
- [ ] React Hook Form + Zod 도입
  - [ ] `ShowEditor.tsx`
  - [ ] `LinkEditor.tsx`
  - [ ] `MixsetEditor.tsx`
  - [ ] `BioDesignPanel.tsx`
- [ ] 에러 핸들링 UX 개선 (Toast 도입)
- [ ] debounce 추가 (`BioDesignPanel`)

---

## 참고

- 작성일: 2026-02-03
- 대상 브랜치: `dev`
- 관련 스택: Next.js 16, TypeScript, Tailwind, Zustand, Supabase
