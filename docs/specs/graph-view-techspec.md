# Graph View — Technical Specification

> Backlink-based Local Graph Discovery
> 2026.02.21 | Status: Draft

---

## 1. Overview

백링크 기반의 로컬 그래프 뷰를 통해 엔티티(Event, Venue, Artist, Entry) 간의 관계를 시각적으로 탐색할 수 있는 디스커버리 기능. Obsidian의 로컬 그래프 뷰를 참고하되, 웹 환경에 최적화된 인터랙션을 구현한다.

### 1.1 Core Concept

- 항상 하나의 **중심 노드(Center Node)**가 존재하며, 해당 노드와 연결된 이웃만 표시
- 노드 더블클릭으로 중심을 전환하면 스코프가 변경되며 **소프트 전환** (공통 노드 유지, 새 노드 페이드인)
- **depth 2** (2-hop): 직접 연결 + 친구의 친구까지 표시
- **weight** 기반으로 연결 강도를 시각적으로 구분 (엣지 굵기/투명도)

### 1.2 Scope

글로벌 그래프 뷰는 수만 노드 규모에서 실용성이 낮아 **제외**. 로컬 그래프 뷰만 구현하며, 한 번에 표시되는 노드는 수십~수백 개 수준이다.

---

## 2. Decisions

| 항목             | 결정                   | 근거                                        |
| ---------------- | ---------------------- | ------------------------------------------- |
| Graph Type       | Local Graph Only       | Global view impractical at 10K+ nodes       |
| Rendering        | Sigma.js + Graphology  | WebGL rendering, graph algorithms built-in  |
| Layout           | ForceAtlas2            | Obsidian-like force-directed layout         |
| Transition       | Soft Transition        | Shared nodes persist, new nodes fade in     |
| Default Depth    | depth 2 (2-hop)        | Direct + friend-of-friend for discovery     |
| Node Integration | Direct UNION query     | No Materialized View needed for local scope |
| Weight           | 1~10 scale per context | Edge thickness/opacity varies by strength   |
| Data Freshness   | Real-time (per query)  | Local graph queries live DB directly        |
| Clustering       | None                   | Display all nodes as-is                     |

---

## 3. Tech Stack

### 3.1 Frontend

- Next.js + React (App Router)
- `@react-sigma/core` — Sigma.js React binding
- `graphology` — Graph data structure and algorithms
- `graphology-layout-forceatlas2` — Force-directed layout
- `sigma` — WebGL graph renderer
- TanStack Query — Data fetching and caching

### 3.2 Backend

- Supabase (PostgreSQL)
- RPC function: `get_local_graph()` with recursive CTE
- Next.js API Routes

---

## 4. Database Schema

### 4.1 mentions Table (Edges)

엔티티 간의 관계를 저장하는 테이블. 그래프의 엣지 역할을 한다.

```sql
CREATE TABLE mentions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id   UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id   UUID NOT NULL,
  context     TEXT NOT NULL,
  weight      SMALLINT NOT NULL DEFAULT 5,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_type, source_id, target_type, target_id, context)
);
```

### 4.2 Weight Mapping

context 값에 따라 자동으로 weight가 설정된다.

| context               | weight | 설명                                    |
| --------------------- | ------ | --------------------------------------- |
| `venue_id`            | 9      | Structural relationship (Event → Venue) |
| `lineup`              | 8      | Official participation (Event → Artist) |
| `event_reference`     | 7      | Direct reference (Entry → Event)        |
| `description_mention` | 3      | Weak mention (tagged in description)    |

```typescript
const WEIGHT_MAP: Record<string, number> = {
    venue_id: 9,
    lineup: 8,
    event_reference: 7,
    description_mention: 3,
};
```

### 4.3 Indexes

```sql
CREATE INDEX idx_mentions_source ON mentions(source_type, source_id);
CREATE INDEX idx_mentions_target ON mentions(target_type, target_id);
CREATE INDEX idx_mentions_weight ON mentions(weight DESC);
```

### 4.4 Node Query

로컬 그래프에서는 Materialized View 없이 관련 노드만 직접 UNION 조회. `get_local_graph()` RPC 함수 내부에서 재귀 CTE로 이웃 엣지를 수집한 뒤, 관련 노드 ID로 각 테이블을 UNION 조회하는 방식이다.

### 4.5 RPC Function

```sql
CREATE OR REPLACE FUNCTION get_local_graph(center_id UUID, max_depth INT DEFAULT 2)
RETURNS JSON AS $$
WITH RECURSIVE hop AS (
  SELECT
    m.id AS edge_id,
    m.source_id, m.source_type,
    m.target_id, m.target_type,
    m.weight, m.context,
    1 AS depth
  FROM mentions m
  WHERE m.source_id = center_id OR m.target_id = center_id

  UNION ALL

  SELECT
    m.id AS edge_id,
    m.source_id, m.source_type,
    m.target_id, m.target_type,
    m.weight, m.context,
    h.depth + 1
  FROM mentions m
  JOIN hop h ON (
    m.source_id IN (h.source_id, h.target_id)
    OR m.target_id IN (h.source_id, h.target_id)
  )
  WHERE h.depth < max_depth
    AND m.id != h.edge_id
),
node_ids AS (
  SELECT DISTINCT id FROM (
    SELECT source_id AS id FROM hop
    UNION SELECT target_id AS id FROM hop
    UNION SELECT center_id AS id
  ) sub
),
nodes AS (
  SELECT id, 'event'::TEXT AS type, title AS label,
         jsonb_build_object('date', date) AS metadata
  FROM events WHERE id IN (SELECT id FROM node_ids)
  UNION ALL
  SELECT id, 'venue', name,
         jsonb_build_object('location', location)
  FROM venues WHERE id IN (SELECT id FROM node_ids)
  UNION ALL
  SELECT id, 'artist', name,
         jsonb_build_object('genre', genre)
  FROM artists WHERE id IN (SELECT id FROM node_ids)
  UNION ALL
  SELECT id, 'entry', SUBSTRING(content, 1, 50),
         jsonb_build_object('user_id', user_id)
  FROM entries WHERE id IN (SELECT id FROM node_ids)
)
SELECT json_build_object(
  'center_id', center_id,
  'nodes', (SELECT COALESCE(json_agg(row_to_json(n)), '[]') FROM nodes n),
  'edges', (
    SELECT COALESCE(json_agg(DISTINCT jsonb_build_object(
      'id', edge_id,
      'source_id', source_id,
      'target_id', target_id,
      'weight', weight,
      'context', context
    )), '[]')
    FROM hop
  )
);
$$ LANGUAGE sql;
```

---

## 5. API Endpoints

### 5.1 GET /api/graph/explore

중심 노드 기준 로컬 그래프 데이터를 반환.

- **Parameters**: `nodeId` (required), `depth` (optional, default: 2, max: 3)
- **Response**: `{ center_id, nodes[], edges[] }`

내부적으로 Supabase RPC `get_local_graph()`를 호출하며, 재귀 CTE로 N-hop 이웃을 탐색한다.

```typescript
// app/api/graph/explore/route.ts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');
    const depth = Math.min(Number(searchParams.get('depth') || 2), 3);

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_local_graph', {
        center_id: nodeId,
        max_depth: depth,
    });

    return Response.json(data);
}
```

### 5.2 GET /api/graph/search

노드 검색 (그래프 진입점 선택용).

- **Parameters**: `q` (required, min 2 chars), `type` (optional filter)
- **Response**: `{ results: [{ id, label, type }] }`

events, venues, artists 테이블을 병렬로 ILIKE 검색하여 상위 결과를 반환.

---

## 6. Frontend Architecture

### 6.1 Component Structure

```
components/graph/
  GraphView.tsx            # dynamic import wrapper (SSR bypass)
  GraphCanvas.tsx          # Sigma rendering + soft transition
  GraphSearch.tsx          # Search input + autocomplete
  GraphControls.tsx        # Zoom, type filter toggles
  NodeDetail.tsx           # Side panel (backlinks list)
  hooks/
    useGraphExplore.ts     # TanStack Query data fetching
    useGraphTransition.ts  # Soft transition logic
```

### 6.2 SSR Bypass

Sigma.js는 WebGL 기반이므로 서버에서 실행 불가. Next.js `dynamic(() => import(...), { ssr: false })`로 클라이언트 전용 로드.

### 6.3 Soft Transition Flow

중심 노드가 변경될 때의 전환 과정:

1. **Fade out** (300ms): 새 스코프에 없는 노드를 투명하게 처리
2. **Remove + Add**: 사라진 노드/엣지 제거, 새 노드를 중심 근처에 투명 상태로 추가
3. **Layout**: ForceAtlas2로 새 노드 위치 계산. 기존 노드는 원래 위치 70% + 새 위치 30% 블렌드
4. **Animate** (500ms): `animateNodes()`로 모든 노드를 목표 위치로 부드럽게 이동
5. **Camera** (500ms): 새 중심 노드로 카메라 이동

### 6.4 Interaction Model

| Action            | Result                                                |
| ----------------- | ----------------------------------------------------- |
| Single click      | Select node → show detail side panel with backlinks   |
| Double click      | Navigate → set as new center, trigger soft transition |
| Hover             | Highlight node + immediate neighbors, dim unrelated   |
| Click empty space | Deselect                                              |

### 6.5 Visual Encoding

| Element        | Encoding    | Detail                                                                  |
| -------------- | ----------- | ----------------------------------------------------------------------- |
| Node Color     | Type-based  | Event: `#f59e0b`, Venue: `#3b82f6`, Artist: `#ec4899`, Entry: `#6b7280` |
| Node Size      | Degree      | `log2(degree + 1) * 4`, min 3                                           |
| Edge Thickness | Weight      | `weight / 5`, min 0.5                                                   |
| Edge Opacity   | Weight      | `0.05 + (weight / 10) * 0.3`                                            |
| Center Node    | Highlighted | Sigma built-in highlight ring                                           |

---

## 7. Entry Points

### 7.1 Dedicated Discovery Page (`/discover`)

전용 디스커버리 페이지에서 검색을 통해 그래프에 진입. 초기 상태는 검색 입력 UI만 표시되며, 노드를 선택하면 해당 노드 중심의 로컬 그래프가 펼쳐진다.

### 7.2 Detail Page Button

기존 Event, Venue, Artist 상세 페이지에 **"그래프로 보기"** 버튼을 배치. 클릭 시 해당 엔티티를 중심 노드로 하는 그래프 뷰로 이동 (`/discover?center={id}`).

---

## 8. Performance Considerations

| 항목               | 예상치                        | 비고                            |
| ------------------ | ----------------------------- | ------------------------------- |
| Payload size       | 수 KB ~ 수십 KB               | depth 2, 수십~수백 노드         |
| Memory             | 수 MB 이하                    | 모바일에서도 문제 없음          |
| Layout computation | 수십 ms                       | ForceAtlas2 iterations 50~80    |
| Query response     | 수십 ms                       | 재귀 CTE + source/target 인덱스 |
| Caching            | TanStack Query staleTime 1min | 별도 서버 캐시 불필요           |

---

## 9. Open Questions

- **모바일 UI**: 사이드패널 대신 바텀시트? 터치 인터랙션(더블탭 vs 롱프레스)?
- **URL 상태**: `/discover?center={id}&depth=2` 형태로 공유 가능한 URL 지원 여부
- **히스토리**: 탐색 경로를 뒤로가기로 되돌릴 수 있는 네비게이션 히스토리
- **빈 상태**: 연결이 없는 노드(고립 노드)의 그래프 뷰 처리
- **검색 고도화**: 현재 ILIKE 기반 → Full-text search나 trigram 인덱스로 확장 여부
