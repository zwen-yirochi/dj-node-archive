# CORTEX Design System Guide

> CORTEX는 일반적인 UI 컴포넌트 라이브러리가 아닌, **페이지 전체를 아트워크로 다루는 시각 언어 시스템**이다.

---

## 1. 일반적인 디자인 시스템 구축 과정

### Phase 1: Design Tokens (원자)

시각 언어의 최소 단위를 정의한다.

| 토큰 종류  | 예시                                                 |
| ---------- | ---------------------------------------------------- |
| Color      | `primary-500`, `neutral-100`                         |
| Typography | font-family, size scale, weight, line-height         |
| Spacing    | 4px 단위 scale (`space-1` = 4px, `space-2` = 8px...) |
| Border     | radius, width, style                                 |
| Shadow     | elevation levels                                     |
| Motion     | duration, easing curves                              |

토큰을 Tailwind config나 CSS custom properties로 코드화한다.

### Phase 2: Primitive Components (원자 컴포넌트)

토큰을 조합한 가장 작은 재사용 단위:

```
Button, Input, Badge, Avatar, Icon, Link, Text, Heading
```

특징:

- 단일 책임 (하나의 역할만)
- variant/size props로 변형
- 자체 레이아웃 없음 (부모가 배치)

### Phase 3: Composite Components (분자 컴포넌트)

원자를 조합한 의미 있는 UI 블록:

```
Card, FormField, Navbar, DataTable, Modal, Dropdown
```

### Phase 4: Patterns / Templates (유기체)

컴포넌트들의 배치 규칙과 레이아웃 패턴:

```
PageHeader, TwoColumnLayout, SidebarNav, HeroSection
```

### Phase 5: Documentation & Governance

- Storybook 등으로 컴포넌트 카탈로그
- 사용 가이드라인, Do/Don't
- 버전 관리, 변경 로그

---

## 2. CORTEX의 문제: "아트워크형 페이지"와 디자인 시스템의 충돌

일반적인 디자인 시스템은 **UI를 레고 블록처럼 조립**하는 것이 목표다. 하지만 CORTEX는:

- 페이지 전체가 하나의 **시각적 작품**으로 기능
- 모노스페이스 + ASCII 아트 + 노이즈 텍스처라는 **통일된 미학**이 핵심
- 컴포넌트 재조합보다 **페이지 단위의 시각적 완결성**이 우선

이건 일반적인 "Atomic Design" 접근과 맞지 않는다. Material UI나 shadcn/ui 같은 범용 시스템과는 근본적으로 다른 문제다.

---

## 3. CORTEX 특화 접근: Visual Language System

### 3-1. 계층 구조 재정의

```
일반 DS                        CORTEX 접근
─────────                      ──────────
Token                          Visual DNA (토큰 + 미학 규칙)
Primitive Component            Texture Component (질감 요소)
Composite Component            Data Display (데이터 표현 형식)
Page Template                  Page Composition (페이지 작곡)
```

### 3-2. Layer 1 — Visual DNA

Tailwind config에 정의된 시각 토큰:

```
cortex.bg / cortex.ink 계열    → 색상 팔레트
font-mono-main / font-mono-alt → 타이포그래피
cortex-gutter / cortex-gap     → 공간 체계
cortex-label / cortex-body     → 텍스트 스케일
```

추가로 정의해야 할 것:

- **ASCII 장식 문법**: `──`, `[ ]`, `+`, `*`, `::` 등의 사용 규칙
- **Border 문법**: dashed vs dotted vs solid의 의미 구분
- **밀도(density) 규칙**: 섹션 간 간격, 요소 간 간격의 리듬

### 3-3. Layer 2 — Texture Components (질감 요소)

CORTEX만의 핵심 계층. 일반 DS에는 없는 **미학적 컴포넌트**:

| 컴포넌트       | 역할                              |
| -------------- | --------------------------------- |
| `AsciiDivider` | 섹션 분리 + 레이블링              |
| `AsciiBox`     | 콘텐츠 프레이밍                   |
| `ImageFrame`   | 이미지에 "시스템 뷰" 느낌 부여    |
| `PathBar`      | 페이지에 "파일시스템" 메타포 부여 |

이 계층이 CORTEX의 정체성을 만든다.

### 3-4. Layer 3 — Data Display (데이터 표현 형식)

정보를 CORTEX 미학으로 렌더링하는 컴포넌트:

| 컴포넌트     | 역할             |
| ------------ | ---------------- |
| `MetaTable`  | 키-값 메타데이터 |
| `StatsRow`   | 수치 요약        |
| `Timeline`   | 시간순 이벤트    |
| `FreqGraph`  | 빈도 시각화      |
| `NodeItem`   | 검색 결과 항목   |
| `TagCluster` | 필터/태그 그룹   |

### 3-5. Layer 4 — Page Composition Rules

CORTEX에서 페이지는 컴포넌트의 합이 아니라 **작곡(composition)**이다. 이 계층은 코드가 아닌 **규칙과 패턴**이다.

**구조 리듬:**

```
모든 CORTEX 페이지는 이 리듬을 따른다:

1. TopNav
2. [PathBar] (optional)
3. Hero/Header zone — 페이지 정체성 선언
4. ── AsciiDivider ──
5. Primary content zone(s) — 핵심 데이터
6. ── AsciiDivider ──
7. Secondary content zone — 부가 정보
8. Footer
```

**밀도 규칙:**

```
섹션 간:         cortex-gap (40px)
섹션 내 블록 간:  24px (space-6)
블록 내 요소 간:  8-12px
텍스트 행 간:     line-height로 제어
```

**반응형 변환 규칙:**

```
Desktop → Mobile 전환 시:
- 2col 그리드 → 1col 스택
- Timeline → EntryCard 리스트
- PathBar → 숨김
- 타이틀 크기 40px → 24px
```

---

## 4. 컴포넌트 분류 체계

### 현재 구조 (`src/components/cortex/`)

16개 컴포넌트를 역할별로 분류:

```typescript
// -- Texture (Visual Identity) --
AsciiDivider; // 섹션 분리 + 레이블
AsciiBox; // 콘텐츠 프레이밍
ImageFrame; // 이미지 시스템 뷰
PathBar; // 파일시스템 메타포

// -- Data Display --
MetaTable; // 키-값 메타데이터
StatsRow; // 수치 요약 그리드
Timeline; // 시간순 이벤트 (desktop)
FreqGraph; // 빈도 시각화
NodeItem; // 검색 결과 항목
TagCluster; // 필터/태그 그룹

// -- Chrome (Page Frame) --
TopNav; // 상단 네비게이션
Footer; // 하단 메타 정보
SectionLabel; // 섹션 제목

// -- Input --
Button; // 액션 버튼 (primary / ghost)
InputField; // 텍스트 입력
UploadSlot; // 파일 업로드
```

### 확장 시 폴더 구조 (선택적)

컴포넌트가 30개 이상으로 늘어날 경우:

```
cortex/
  texture/       ← 미학 전용 요소
  data/          ← 데이터 표현 형식
  chrome/        ← 페이지 프레임
  input/         ← 인터랙션 요소
  layout/        ← 페이지 구조 헬퍼
```

---

## 5. Page Composition 패턴

반복되는 페이지 구조를 추출한 레이아웃 컴포넌트:

```typescript
// cortex/layout/CortexPage.tsx
export function CortexPage({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-cortex px-4 md:px-cortex-gutter">
      {children}
    </main>
  );
}

export function CortexSection({
  label,
  children
}: {
  label?: string;
  children: React.ReactNode
}) {
  return (
    <>
      {label && <AsciiDivider label={label} />}
      <section className="flex flex-col gap-6">
        {children}
      </section>
    </>
  );
}
```

---

## 6. Visual DNA 원칙

### 미학 원칙

1. **모노스페이스 순수성**: 모든 텍스트는 모노스페이스
2. **경계의 명시성**: 모든 영역은 border/divider로 구획
3. **시스템 메타포**: 파일 경로, 노드 ID, 타입 뱃지
4. **최소 색채**: 회색 + 빨강/파랑 악센트만
5. **ASCII 장식**: 장식은 타이포그래피적 수단으로만

### Anti-patterns

- **NO** 그라디언트, 그림자, 블러
- **NO** 둥근 모서리 (border-radius)
- **NO** Sans-serif 폰트 혼용
- **NO** 아이콘 라이브러리 (텍스트/ASCII로 대체)

---

## 7. 요약: 일반 DS vs CORTEX

| 관점        | 일반 DS          | CORTEX 접근                            |
| ----------- | ---------------- | -------------------------------------- |
| 핵심 단위   | 컴포넌트         | 시각 언어 규칙                         |
| 조합 방식   | 블록 쌓기        | 페이지 작곡                            |
| 일관성 원천 | 컴포넌트 재사용  | 토큰 + 미학 원칙 준수                  |
| 문서화 대상 | Props / Variants | 리듬 / 밀도 / 변환 규칙                |
| 확장 방법   | 새 컴포넌트 추가 | 새 페이지 타입의 composition 패턴 정의 |

현재 CORTEX는 이미 올바른 방향으로 가고 있다. 16개 컴포넌트 + Tailwind 토큰 체계가 잘 잡혀 있고, 페이지마다 일관된 미학이 유지되고 있다. 과도한 추상화(Storybook, 복잡한 variant 시스템 등)보다는 **Visual DNA 문서화 + 분류 정리 + Page Composition 패턴 추출** 정도가 이 프로젝트의 성격에 맞는 다음 단계다.
