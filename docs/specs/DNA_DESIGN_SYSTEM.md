# DNA Design System

> DNA는 일반적인 UI 컴포넌트 라이브러리가 아닌, **페이지 전체를 아트워크로 다루는 시각 언어 시스템**이다.

---

## 계층 구조

```
Layer 1. Visual DNA       토큰 + 미학 규칙 (위반하면 "DNA답지 않게" 됨)
Layer 2. Texture           DNA다움을 만드는 미학적 컴포넌트
Layer 3. Data Display      데이터를 DNA 미학으로 표현하는 형식
Layer 4. Page Composition  페이지를 "작곡"하는 구조 규칙
```

---

## Layer 1: Visual DNA — 미학 규칙

### 서체 규칙

```
Space Mono (mono-alt)       → "이건 중요하다"  제목, 로고, 숫자 강조
JetBrains Mono (mono-main)  → "이건 정보다"   본문, 라벨, 입력
다른 폰트                    → 절대 사용 금지
```

### 서체 스케일

**Heading (복합 클래스, globals.css)**

| 클래스                | Mobile | Desktop | 용도             |
| --------------------- | ------ | ------- | ---------------- |
| `dna-heading-hero`    | 32px   | 56px    | 랜딩 히어로 전용 |
| `dna-heading-page`    | 24px   | 40px    | 페이지 제목      |
| `dna-heading-section` | 20px   | 28px    | 섹션 제목        |

모든 heading: `font-mono-alt font-bold uppercase leading-none tracking-dna-tight`

**Text (Tailwind 토큰)**

| 토큰           | 크기 | 용도                     |
| -------------- | ---- | ------------------------ |
| `dna-system`   | 8px  | 시스템 라벨, 최소 텍스트 |
| `dna-label`    | 9px  | 라벨, 뱃지               |
| `dna-ui`       | 10px | 버튼, 네비게이션, 푸터   |
| `dna-meta-val` | 11px | 메타데이터 값            |
| `dna-body`     | 12px | 본문 텍스트              |
| `dna-item`     | 13px | 리스트 아이템            |

### Letter Spacing

| 토큰         | 값    | 용도                             |
| ------------ | ----- | -------------------------------- |
| `dna-tight`  | -1px  | heading 전용 (타이트할수록 중요) |
| `dna-input`  | 0.3px | 입력 필드                        |
| `dna-detail` | 0.5px | 유저네임, 베뉴코드 등 상세       |
| `dna-system` | 1px   | 시스템 라벨                      |
| `dna-meta`   | 1.5px | 메타데이터 테이블                |
| `dna-btn`    | 2px   | 버튼, 미디엄 라벨                |
| `dna-label`  | 2.5px | 섹션 헤더, 강조 라벨             |

**규칙:** 글자가 작아질수록 tracking이 넓어진다.

### 잉크 계층 (5단계)

이 순서를 절대 깨지 않는다.

```
ink        #1a1a1e   "가장 중요한 것"      제목, 핵심 텍스트
ink-mid    #4a4a52   "읽어야 하는 것"      본문, 설명
ink-light  #7a7a86   "참고할 것"          라벨, 메타데이터
ink-ghost  #a0a0ac   "구조를 보여주는 것"   border, 구분선
ink-faint  #c0c0c8   "거의 안 보이는 것"   최약 border, 배경 구분
```

악센트 색상은 2개만 사용:

- `accent-blue` `#2255aa` — 링크, 베뉴 참조
- `accent-red` `#c0392b` — 필수 필드 표시

### 보더 문법

3종류의 border, 각각 의미가 다르다.

```
dashed ─ ─ ─   "페이지 구조"      TopNav, Footer, AsciiDivider
dotted · · ·   "콘텐츠 관계"      MetaTable 행, Timeline, SectionLabel
solid  ───     "콘텐츠 경계"      이미지 프레임, 입력 필드, 태그, 뱃지
```

### 간격

```
dna-gutter:  32px   페이지 좌우 여백 (모바일 16px)
dna-gap:     40px   섹션 간 수직 간격
max-w-dna:   1080px 페이지 최대 너비
```

### Anti-patterns

- **NO** 그라디언트, 그림자, 블러
- **NO** 둥근 모서리 (border-radius)
- **NO** 산세리프 폰트 혼용
- **NO** 아이콘 라이브러리 (텍스트/ASCII로 대체)
- **NO** 컬러 배경 (dna-bg 계열만)
- **NO** CSS 트랜지션/애니메이션 (hover 상태 변환 제외)

---

## Layer 2: Texture — DNA다움을 만드는 컴포넌트

이 컴포넌트들을 빼면 페이지가 DNA가 아니게 된다.

### AsciiDivider

섹션을 구분하고 레이블을 부여한다. 페이지당 2~5개 사용.

```
/- - - - - - - - - - - - - - - - - - - - - - - - -\
|                   SECTION NAME                    |
\- - - - - - - - - - - - - - - - - - - - - - - - -/
```

- 81자 폭의 ASCII 프레임
- 텍스트 중앙 정렬
- 색상: `text-dna-ink-ghost`
- 역할: 콘텐츠 카테고리 전환을 시각적으로 선언

### AsciiBox

중요한 콘텐츠를 프레이밍한다.

```
/- - - - - - - - - - - - - -\
|- - - - - - - - - - - - - - -|
| {content}                    |
|- - - - - - - - - - - - - - -|
\- - - - - - - - - - - - - -/
```

- 내부 패딩: `px-7 py-5`
- 용도: 피처 카드, 빈 상태 표시, 콜아웃

### ImageFrame

사진을 "아카이브 자료"로 변환한다.

- 비율: `aspect-[4/5]`
- 이미지 처리: `grayscale-[85%]` + `mix-blend-multiply` + 밝기/대비 보정
- 듀오톤 오버레이: blue→red 그라디언트 (135°)
- 코너 마크: 4모서리에 L자형 border (12px)
- 하단 메타 바: 좌/우 라벨

### PathBar

페이지에 "파일시스템 안에 있다"는 메타포를 부여한다.

```
root / nodes / username                    node type: artist
```

- 좌: 경로, 우: 메타데이터
- 데스크톱 전용 (`hidden md:block`)
- 색상: `text-dna-label text-dna-ink-light`

### NoiseOverlay (layout.tsx)

미세한 그레인 텍스처로 디지털→아날로그 촉감을 부여한다.

- SVG fractal noise, 0.025 opacity
- 고정 위치, 상호작용 없음 (`pointer-events-none`)
- 의식적으로 보이지 않지만 제거하면 느껴진다

---

## Layer 3: Data Display — 데이터 표현 형식

정보를 DNA 미학으로 보여주는 6가지 형식.

### MetaTable

키-값 2열 테이블. 모든 상세 페이지에서 사용.

```
TITLE ·········· Event Name
DATE  ·········· 2025.01.15
VENUE ·········· Club ABC
```

- 키 너비: `w-[140px]`
- 행 구분: `border-dotted border-dna-ink-faint`
- 키: `text-dna-label uppercase tracking-dna-meta text-dna-ink-light`
- 값: `text-dna-meta-val text-dna-ink`

### StatsRow

핵심 숫자를 강조하는 그리드.

```
┌────────┬────────┬────────┬────────┐
│   12   │    4   │    2   │   18   │
│ EVENTS │ VENUES │ OTHER  │ TOTAL  │
└────────┴────────┴────────┴────────┘
```

- 숫자: `font-mono-alt text-2xl font-bold`
- 라벨: `text-dna-system uppercase tracking-dna-btn`
- 셀 구분: `gap-px` (1px 간격으로 border 효과)

### Timeline

세로 점선으로 시간순 흐름을 표현.

```
* 2025.01.15 // WED
│ Event Title
│ @ Venue Name
│
+ 2024.12.20 // FRI
│ Another Event
│ @ Another Venue
```

- 좌측 border: `border-l border-dashed border-dna-ink-ghost`
- 첫 항목 마커: `*` (bold), 나머지: `+` (light)
- 데스크톱 전용 (모바일은 EntryCard로 대체)

### NodeItem

검색 결과, 라인업 등 인덱싱된 항목.

```
01  [VEN]  Club ABC           Seoul, KR    →
02  [ART]  DJ Name            Artist       →
```

- 인덱스: 2자리 zero-pad
- 타입 뱃지: 3글자 약어 (bordered box)
- hover: 이름에 underline
- 행 구분: `border-b border-dotted border-dna-ink-faint`

### EntryCard

썸네일 + 메타데이터 가로 행. 모바일 리스트용.

```
┌──────┐  Title of Entry
│ img  │  [EVT] Detail Text
│      │  2025.01.15
└──────┘
```

- 썸네일: `64×80px` (mobile), `70×90px` (desktop)
- 타입 뱃지: `text-dna-system uppercase`
- 행 구분: `border-b border-dotted border-dna-ink-faint`

### TagCluster

토글 가능한 필터/태그 그룹.

- 활성: `bg-dna-ink text-dna-bg` (반전)
- 비활성: `border-dna-ink-faint text-dna-ink-mid`
- 패딩: `px-2.5 py-1`

---

## Layer 4: Page Composition — 페이지 작곡 규칙

### 구조 리듬

모든 DNA 페이지가 따르는 순서:

```
┌─ TopNav ──────────────────────────────────┐
│  logo (mono-alt) | nav links | version    │
├─ PathBar (desktop only) ──────────────────┤
│  경로 (left)              | 메타 (right)   │
╞═══════════════════════════════════════════╡
│                                           │
│  HEADER ZONE                              │
│  ├─ 라벨 + 점선 구분자                      │
│  ├─ h1 (dna-heading-page)                 │
│  ├─ 부가 정보 (메타텍스트)                   │
│  └─ [액션 버튼 / 링크]                      │
│                                           │
│  [StatsRow] (선택)                         │
│  [MetaTable 2열 그리드] (선택)              │
│                                           │
├─ AsciiDivider "SECTION NAME" ─────────────┤
│                                           │
│  CONTENT ZONE (반복)                       │
│  ├─ SectionLabel                          │
│  └─ Data Display 컴포넌트들                 │
│                                           │
├─ AsciiDivider ────────────────────────────┤
│  ... 추가 섹션 반복 ...                     │
├─ Footer ──────────────────────────────────┤
│  메타 (left)    | ASCII art (right)       │
│  ─────── 하단 정보 ──────────              │
└───────────────────────────────────────────┘
```

### 반응형 변환 규칙

```
Desktop                      Mobile
────────                     ──────
PathBar 보임                  PathBar 숨김
2열 MetaTable 그리드           1열 스택
Timeline + Card 그리드         EntryCard 리스트만
nav links 보임                nav links 숨김
제목 40px                     제목 24px
gutter 32px                  gutter 16px (px-4)
```

### 데이터 포맷 규칙

```
날짜:      YYYY.MM.DD // DAY     (2025.01.15 // WED)
베뉴코드:  VN-{4자리대문자}        (VN-CLBA)
타입뱃지:  3글자 약어              (ART, EVT, VEN, MIX, LNK)
카운터:    {숫자} {라벨}           (4 ARTISTS)
빈 상태:   // NO {대상}           (// NO POSTER)
인덱스:    2자리 zero-pad         (01, 02, 03)
```

### 인터랙션 규칙

```
링크:    dotted underline (기본) → solid underline (hover)
버튼:    transparent fill (기본) → solid fill (hover)
입력:    bg-white/40 (기본) → bg-white/60 (focus)
태그:    border only (기본) → 반전 fill (active)
```

---

## 컴포넌트 분류 맵

```
src/components/dna/

  Texture (미학)           Data Display (데이터)
  ──────────               ─────────────────
  AsciiDivider             MetaTable
  AsciiBox                 StatsRow
  ImageFrame               Timeline
  PathBar                  NodeItem
                           EntryCard (pages 내)
                           TagCluster
                           FreqGraph

  Chrome (페이지 프레임)    Input (인터랙션)
  ────────────────         ──────────────
  TopNav                   Button
  Footer                   InputField
  SectionLabel             UploadSlot
```

---

## 새 페이지 만들기 체크리스트

1. `TopNav` + `Footer` 배치
2. `PathBar`에 경로와 메타정보 설정
3. Header zone에 `dna-heading-page` 적용
4. 주요 섹션마다 `AsciiDivider` 배치
5. 데이터는 Layer 3 컴포넌트 중 적절한 것 선택
6. 잉크 계층 5단계 준수
7. 보더 문법 3종류 준수
8. 반응형 변환 규칙 적용
9. 데이터 포맷 규칙 적용
