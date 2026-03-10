# DJ Node Archive

DJ 씬의 이벤트·베뉴·아티스트를 아카이빙하고, 아티스트가 자신만의 퍼블릭 페이지를 만들 수 있는 플랫폼

<!-- TODO: 스크린샷 추가 -->
<img width="1523" height="1371" alt="Berghain  Panorama Bar  Säule - DJ Node Archive" src="https://github.com/user-attachments/assets/5eda0474-0627-4403-8272-a5dfe38ed417" />


## About

**아카이브.** 이벤트, 베뉴, 아티스트 데이터를 수집하고 관계 그래프로 연결한다.

**퍼블릭 페이지.** 아티스트가 자신의 이력을 편집하고 단일 URL로 공유한다.

## Tech Stack

| 영역         | 기술                    | 용도                           |
| ------------ | ----------------------- | ------------------------------ |
| Framework    | Next.js 16 (App Router) | SSR/ISR + API Routes           |
| Language     | TypeScript (strict)     | 전체                           |
| Database     | Supabase (PostgreSQL)   | 데이터 저장 + Auth + Storage   |
| Server State | TanStack Query 5        | 캐시, 낙관적 업데이트, 무효화  |
| UI State     | Zustand 5               | 대시보드 ContentView 라우팅    |
| Validation   | Zod                     | API 검증 + 2단계 스키마 시스템 |
| Form         | React Hook Form 7       | 엔트리 생성 폼                 |
| DnD          | dnd-kit                 | 사이드바, 페이지뷰, 블록 정렬  |
| Styling      | Tailwind CSS 3.4        | 전체 UI                        |
| Deploy       | Vercel                  | 호스팅                         |

## Features

### Node Wiki — 아카이브 탐색

- **이벤트 아카이브** — 이벤트 상세 페이지 (포스터, 라인업, 베뉴 연결)
- **베뉴 노드** — 베뉴별 이벤트 타임라인, 통계, 외부 링크
- **통합 검색** — 이벤트, 아티스트, 베뉴를 키워드로 검색
- **관계 그래프** — 베뉴-아티스트-이벤트 간 연결을 시각화하는 인터랙티브 그래프
- **이벤트 시리즈** — 동일 베뉴의 반복 이벤트를 시리즈로 묶어 탐색
- **ISR** — 이벤트·베뉴 페이지 5분 주기 재검증

### 퍼블릭 페이지 빌더 — 대시보드

- **3-column 에디터** — TreeSidebar + ContentPanel + iPhone 프리뷰 실시간 편집
- **4종 엔트리 타입** — Event (import/create), Mixset, Link, Custom (블록 기반)
- **드래그 앤 드롭** — 사이드바 ↔ 페이지 추가, 섹션 내 정렬, 블록 정렬
- **Custom Block 에디터** — Header, Rich Text, Image, Embed, Key-Value 5종 블록
- **프로필 편집** — Bio, 아바타, 소셜 링크, 헤더 스타일
- **이벤트 임포트** — 외부 소스에서 이벤트 데이터 검색·임포트
- **Embed 지원** — YouTube, SoundCloud URL 자동 감지 + iframe 프리뷰

## Docs

- [Dashboard Architecture](docs/DASHBOARD_ARCHITECTURE.md) — 컴포넌트 구조, 상태 관리, Mutation 전략

## Project Structure

```
src/
├── app/
│   ├── (dna)/              # Node Wiki (퍼블릭 페이지)
│   │   ├── discover/       # 탐색 허브
│   │   ├── search/         # 이벤트, 아티스트, 베뉴 검색
│   │   ├── event/[id]/     # 이벤트 상세
│   │   ├── venues/[slug]/  # 베뉴 노드 (타임라인 + 그래프)
│   │   └── [user]/         # 유저 퍼블릭 페이지
│   ├── dashboard/          # 페이지 빌더 SPA
│   │   ├── components/     # TreeSidebar, ContentPanel, PreviewPanel
│   │   ├── hooks/          # TanStack Query + Mutation + Field Sync
│   │   └── config/         # Config-driven 시스템
│   └── api/                # Route Layer (withAuth → Handler)
├── lib/
│   ├── api/handlers/       # Handler Layer (비즈니스 로직)
│   └── db/queries/         # Database Layer (Result<T>)
├── components/
│   ├── dna/                # DNA 디자인 시스템 (25+ 컴포넌트)
│   └── graph/              # 관계 그래프 시각화
└── types/                  # Domain (camelCase) + DB (snake_case)
```
