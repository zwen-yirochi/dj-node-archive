# Layer Architecture Guide

**Purpose:** Next.js App Router 4-layer architecture reference for code generation and review

**Stack:** Next.js 16 · TypeScript · Supabase · TanStack Query · Zustand

---

## Architecture Overview

```
Client Layer (UI/State)
    ↓ HTTP Request
Route Layer (Endpoints)
    ↓ Function Call
Handler Layer (Business Logic)
    ↓ Database Operations
Database Layer (Queries)
```

**Core Principles:**

- Single Responsibility per layer
- Unidirectional dependency flow
- Result<T> type for explicit error handling
- TanStack Query for server state, Zustand for UI state only

---

## Layer Definitions

### 1. Client Layer

**Location:** `app/`, `components/`, `hooks/`, `stores/`

**Responsibilities:**

- UI rendering and user interactions
- Server state caching (TanStack Query)
- UI state management (Zustand)
- Form validation (React Hook Form)

**State Management 원칙:**

| 종류                          | 관리 주체      | 예시                            |
| ----------------------------- | -------------- | ------------------------------- |
| Server state (CRUD, 캐싱)     | TanStack Query | entries, user profile           |
| UI state (선택, 토글, 시그널) | Zustand        | selectedEntryId, previewVersion |

#### SSR Hydration Pattern

서버 컴포넌트에서 데이터를 가져오고 `initialData`로 TanStack Query 캐시를 시딩한다:

```typescript
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
    const result = await getEditorData(authUser.id);
    return <StoreInitializer initialData={result.data} />;
}
```

```typescript
// components/StoreInitializer.tsx (Client Component)
export default function StoreInitializer({ initialData }: { initialData: EditorData }) {
    useEditorData(initialData); // TanStack Query 캐시에 SSR 데이터 시딩
    // ... Zustand UI store 초기화
    return null;
}
```

#### Query Provider 설정

Dashboard layout에서 `QueryClientProvider`를 래핑한다:

```typescript
// components/providers/QueryProvider.tsx
'use client';
export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },
                },
            })
    );
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

#### Query Hook Pattern

```typescript
// hooks/use-{domain}.ts
export function useEditorData(initialData?: EditorData) {
    return useQuery({
        queryKey: entryKeys.all,
        queryFn: fetchEditorData,
        initialData,
        initialDataUpdatedAt: initialData ? Date.now() : undefined,
        staleTime: 5 * 60 * 1000,
    });
}
```

> **주의:** `initialDataUpdatedAt: Date.now()`을 반드시 설정한다.
> 미설정 시 `dataUpdatedAt=0`으로 취급되어 항상 stale → 즉시 background refetch가 트리거된다.

#### Mutation Hook Pattern (Optimistic Updates)

```typescript
// hooks/use-{domain}.ts
export function useUpdateResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await fetch(`/api/resources/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(`Failed: ${res.status}`);
        },
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: resourceKeys.all });
            const previous = queryClient.getQueryData(resourceKeys.all);
            // 낙관적 업데이트
            queryClient.setQueryData(resourceKeys.all, (old) => ({
                ...old,
                items: old.items.map((item) => (item.id === id ? { ...item, ...data } : item)),
            }));
            return { previous };
        },
        onError: (_err, _vars, context) => {
            // 롤백
            if (context?.previous) {
                queryClient.setQueryData(resourceKeys.all, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: resourceKeys.all });
        },
    });
}
```

#### API 함수 작성 규칙

API 응답은 `successResponse`가 `{ success: true, data: T }` 형태로 래핑하므로, 클라이언트에서 `json.data`로 언래핑해야 한다:

```typescript
// ✅ CORRECT - 직접 fetch + json.data 언래핑
async function fetchResources(): Promise<Resource[]> {
    const res = await fetch('/api/resources');
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data; // { success: true, data: T } 에서 data 추출
}

// ❌ WRONG - apiFetch 사용 시 이중 래핑 발생
async function fetchResources(): Promise<Resource[]> {
    const result = await apiFetch('/api/resources', { method: 'GET' });
    return result.data; // ← { success: true, data: T } (이중 래핑!)
}
```

> **주의:** TanStack Query의 `queryFn`/`mutationFn`에서는 `apiFetch`를 사용하지 않는다.
> `apiFetch`는 자체적으로 `{ success, data }` 래핑을 하기 때문에, `successResponse`의 래핑과 충돌한다.

#### Zustand Store Pattern (UI State Only)

```typescript
// stores/{domain}UIStore.ts
export const useDashboardUIStore = create<DashboardUIState>((set, get) => ({
    previewVersion: 0,
    newlyCreatedIds: new Set<string>(),
    triggerPreviewRefresh: () => set((s) => ({ previewVersion: s.previewVersion + 1 })),
    // ... UI-only actions
}));
```

**Rules:**

- ✅ Use TanStack Query for server data (queries + mutations)
- ✅ Use Zustand for UI state only (selection, toggles, signals)
- ✅ Use `initialData` + `initialDataUpdatedAt` for SSR hydration
- ✅ Use optimistic updates with `onMutate` → `onError` rollback → `onSettled` invalidate
- ✅ Use direct `fetch` + `json.data` in API functions
- ❌ NO direct database access
- ❌ NO authentication/authorization logic
- ❌ NO business logic in components
- ❌ NO `apiFetch` in TanStack Query hooks (이중 래핑 문제)
- ❌ NO server state in Zustand stores

---

### 2. Route Layer

**Location:** `app/api/**/route.ts`

**Responsibilities:**

- Define HTTP endpoints
- Apply authentication middleware
- Delegate to handlers (thin layer)

**Pattern:**

```typescript
// app/api/resources/[id]/route.ts
import { withAuth } from '@/lib/api';
import { handleUpdateResource } from '@/lib/api/handlers';

export const PATCH = withAuth<{ id: string }>(async (request, context) => {
    return handleUpdateResource(request, context, context.params.id);
});
```

**Response Format:**

모든 API 응답은 response helper를 통해 통일된 형태로 반환한다:

```typescript
// 성공: { success: true, data: T }
successResponse(data, 201);

// 실패: { success: false, error: { code, message } }
validationErrorResponse(field); // 400
forbiddenResponse(); // 403
notFoundResponse(resource); // 404
internalErrorResponse(message); // 500
```

**Rules:**

- ✅ Keep extremely thin (1-3 lines per handler)
- ✅ Only call handlers
- ❌ NO data parsing (handler's job)
- ❌ NO business logic
- ❌ NO database access

---

### 3. Handler Layer

**Location:** `lib/api/handlers/{domain}.handlers.ts`

**Responsibilities:**

- Parse and validate request data
- Verify ownership/permissions
- Execute business logic
- Call database queries
- Generate responses

**Pattern:**

```typescript
// lib/api/handlers/resource.handlers.ts
export async function handleCreateResource(request: Request, { user }: AuthContext) {
    // 1. Parse data
    const body = await request.json();
    const { parentId, resource } = body;

    // 2. Validate
    if (!parentId || !resource) {
        return validationErrorResponse('parentId와 resource');
    }

    // 3. Verify ownership
    const ownership = await verifyParentOwnership(parentId, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found'
            ? notFoundResponse('부모 리소스')
            : forbiddenResponse();
    }

    // 4. Business logic (e.g., calculate position)
    const maxPosResult = await getMaxPosition(parentId);
    if (!isSuccess(maxPosResult)) {
        return internalErrorResponse(maxPosResult.error.message);
    }
    const position = maxPosResult.data + 1;

    // 5. Transform data
    const dbData = mapToDatabase(resource, position);

    // 6. Database operation
    const result = await createResource(resource.id, dbData);
    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    // 7. Return response
    return successResponse(result.data, 201);
}
```

**Processing Flow:**

```
Parse → Validate → Verify Ownership → Business Logic →
Transform → Database → Response
```

**Rules:**

- ✅ Handle ALL error cases
- ✅ Use Result<T> for safety
- ✅ Use response helper functions
- ✅ Verify ownership before mutations
- ❌ NO raw SQL (use query functions)
- ❌ NO client-specific logic

---

### 4. Database Layer

**Location:** `lib/db/queries/{domain}.queries.ts`

**Responsibilities:**

- Execute Supabase queries
- Return Result<T> type
- Handle database errors

**Pattern:**

```typescript
// lib/db/queries/resource.queries.ts
import type { Result } from '@/types/result';
import { createClient } from '@/lib/supabase/server';

export async function createResource(
    id: string,
    data: { parent_id: string; type: string; position: number; data: any }
): Promise<Result<Resource>> {
    const supabase = await createClient();

    const { data: resource, error } = await supabase
        .from('resources')
        .insert({ id, ...data })
        .select()
        .single();

    if (error) {
        return {
            success: false,
            error: { code: 'DATABASE_ERROR', message: error.message },
        };
    }

    return { success: true, data: resource };
}
```

**Result Type:**

```typescript
// types/result.ts
export type Result<T, E = AppError> = { success: true; data: T } | { success: false; error: E };

export interface AppError {
    code: ErrorCode;
    message: string;
    cause?: unknown;
}

export function isSuccess<T, E>(result: Result<T, E>): result is { success: true; data: T } {
    return result.success === true;
}

export function success<T>(data: T): { success: true; data: T } {
    return { success: true, data };
}

export function failure<E>(error: E): { success: false; error: E } {
    return { success: false, error };
}
```

**Rules:**

- ✅ ALWAYS return Result<T>
- ✅ Use Supabase generated types
- ✅ Include detailed error info
- ❌ NO business logic
- ❌ NO authentication/authorization

---

## Folder Structure

```
project-root/
├── app/
│   ├── api/                          # Route Layer
│   │   └── {domain}/
│   │       ├── route.ts
│   │       └── [id]/route.ts
│   ├── dashboard/                    # Dashboard Feature
│   │   ├── page.tsx                  # SSR data fetch
│   │   ├── layout.tsx                # QueryProvider 래핑
│   │   └── components/
│   │       └── StoreInitializer.tsx  # SSR → TanStack Query hydration
│   └── (pages)/                      # Client Layer - Pages
│
├── components/                       # Client Layer - UI
│   ├── providers/
│   │   └── QueryProvider.tsx         # TanStack Query provider
│   ├── ui/                           # Shadcn components
│   └── features/                     # Feature components
│
├── hooks/                            # Client Layer - Data
│   └── use-{domain}.ts              # TanStack Query hooks
│
├── stores/                           # Client Layer - UI State
│   ├── uiStore.ts                    # UI state (selection, panels)
│   └── contentEntryStore.ts          # Dashboard UI signals (previewVersion)
│
├── lib/
│   ├── api/                          # Handler Layer
│   │   ├── handlers/
│   │   │   └── {domain}.handlers.ts
│   │   ├── withAuth.ts               # Auth middleware
│   │   ├── responses.ts              # Response helpers
│   │   ├── ownership.ts              # Ownership checks
│   │   └── fetch-utils.ts            # apiFetch (legacy, Zustand 전용)
│   │
│   └── db/                           # Database Layer
│       └── queries/
│           └── {domain}.queries.ts
│
└── types/
    ├── domain.ts                     # Business types (camelCase)
    ├── result.ts                     # Result type (success/failure)
    └── supabase.ts                   # DB types (snake_case)
```

---

## Data Flow Example

**Scenario:** Update a resource

```
1. User submits form
   ↓
2. [Client] useUpdateResource.mutate({ id, data })
   ↓
3. [Client] onMutate: 낙관적 캐시 업데이트 (이전 상태 백업)
   ↓
4. [Client] fetch('/api/resources/123', { PATCH, body })
   ↓
5. [Route] withAuth verifies authentication
   ↓
6. [Route] handleUpdateResource(request, context, id)
   ↓
7. [Handler] Parse request.json()
   ↓
8. [Handler] verifyResourceOwnership(id, user.id)
   ↓
9. [Handler] Transform data with mapper
   ↓
10. [Handler] updateResource(id, data)
    ↓
11. [Database] Execute Supabase UPDATE
    ↓
12. [Database] Return Result<Resource>
    ↓
13. [Handler] Generate successResponse(data)
    ↓
14. [Route] Return Response { success: true, data: T }
    ↓
15. [Client] onSettled: invalidateQueries → background refetch
    ↓
16. [Client] UI auto-updates with fresh data
    (에러 시: onError → 캐시 롤백 to 이전 상태)
```

---

## Dependency Rules

### Allowed Dependencies

```
Client → Route (HTTP)
Route → Handler (function call)
Handler → Database (function call)
Handler → Mappers (data transformation)
Handler → Verification (ownership checks)
```

### Forbidden Dependencies

```
Database → Handler (reverse dependency)
Route → Database (skip handler layer)
Client → Database (direct access)
Database → Business logic
```

### Anti-Pattern Examples

```typescript
// ❌ WRONG - Route accessing database directly
export const GET = async () => {
    const supabase = await createClient();
    const { data } = await supabase.from('resources').select();
    return NextResponse.json(data);
};

// ✅ CORRECT - Route delegates to handler
export const GET = withAuth(async (request, context) => {
    return handleGetResources(request, context);
});
```

```typescript
// ❌ WRONG - apiFetch in TanStack Query (이중 래핑)
async function fetchResources() {
    const result = await apiFetch('/api/resources', { method: 'GET' });
    return result.data; // { success: true, data: T } ← 이중 래핑!
}

// ✅ CORRECT - 직접 fetch + json.data
async function fetchResources() {
    const res = await fetch('/api/resources');
    if (!res.ok) throw new Error(`Failed: ${res.status}`);
    const json = await res.json();
    return json.data;
}
```

---

## Code Generation Checklist

When generating new features:

**Database Layer:**

- [ ] Create query function in `lib/db/queries/{domain}.queries.ts`
- [ ] Return Result<T> type (`success`/`failure` helpers)
- [ ] Use Supabase typed queries
- [ ] Handle errors with detailed messages

**Handler Layer:**

- [ ] Create handler in `lib/api/handlers/{domain}.handlers.ts`
- [ ] Parse and validate request data
- [ ] Verify ownership/permissions
- [ ] Execute business logic
- [ ] Call database queries
- [ ] Use response helpers
- [ ] Handle ALL error cases

**Route Layer:**

- [ ] Create route in `app/api/{domain}/route.ts`
- [ ] Apply withAuth middleware
- [ ] Call handler (1-3 lines)
- [ ] Keep it thin

**Client Layer:**

- [ ] Create hook in `hooks/use-{domain}.ts`
- [ ] Define query keys (`const resourceKeys = { all: [...], detail: (id) => [...] }`)
- [ ] Write API functions with direct `fetch` + `json.data` 언래핑
- [ ] Use `useQuery` with `initialData` + `initialDataUpdatedAt` for SSR hydration
- [ ] Use `useMutation` with optimistic updates (`onMutate` → `onError` → `onSettled`)
- [ ] Handle loading/error states
- [ ] Zustand stores for UI state only

---

## Best Practices

### Error Handling

```typescript
// ✅ Explicit Result handling (Handler/Database)
const result = await createResource(...);
if (!isSuccess(result)) {
    return internalErrorResponse(result.error.message);
}
const resource = result.data;

// ❌ Try-catch for database operations
try {
    const resource = await createResource(...);
} catch (error) {
    // Only for unexpected errors
}
```

### Type Safety

```typescript
// ✅ Typed Result
function getUser(id: string): Promise<Result<User>>;

// ❌ Any or unknown
function getUser(id: string): Promise<any>;
```

### Response Consistency

```typescript
// ✅ Use helpers (returns { success: true/false, data/error })
return successResponse(data);
return notFoundResponse('리소스');

// ❌ Manual responses
return NextResponse.json(data);
return new Response('Not found', { status: 404 });
```

### Business Logic Location

```typescript
// ❌ WRONG - Business logic in database layer
export async function createResource(...) {
    const maxPos = await getMaxPosition(); // Handler's job
    const position = maxPos + 1;
}

// ✅ CORRECT - Business logic in handler
export async function handleCreateResource(...) {
    const maxPosResult = await getMaxPosition(parentId);
    const position = maxPosResult.data + 1;
}
```

### Caching Strategy

```typescript
// ✅ TanStack Query with SSR hydration
export function useEditorData(initialData?: EditorData) {
    return useQuery({
        queryKey: entryKeys.all,
        queryFn: fetchEditorData,
        initialData,
        initialDataUpdatedAt: initialData ? Date.now() : undefined,
        staleTime: 5 * 60 * 1000,
    });
}

// ❌ Manual state management
const [data, setData] = useState(null);
useEffect(() => {
    fetch('/api/resources')
        .then((r) => r.json())
        .then(setData);
}, []);

// ❌ Zustand for server state
const useStore = create((set) => ({
    entries: [],
    fetchEntries: async () => {
        const result = await apiFetch('/api/entries');
        set({ entries: result.data });
    },
}));
```

---

## Common Patterns

### Ownership Verification

```typescript
// lib/api/ownership.ts
export async function verifyResourceOwnership(
    resourceId: string,
    userId: string
): Promise<OwnershipResult> {
    const result = await getResourceOwner(resourceId);

    if (!isSuccess(result)) {
        return { ok: false, reason: 'not_found' };
    }

    if (result.data.user_id !== userId) {
        return { ok: false, reason: 'forbidden' };
    }

    return { ok: true };
}

// Usage in handler
const ownership = await verifyResourceOwnership(id, user.id);
if (!ownership.ok) {
    return ownership.reason === 'not_found' ? notFoundResponse('리소스') : forbiddenResponse();
}
```

### Position Management

```typescript
// Get max position for new item
const maxPosResult = await getMaxPosition(parentId);
if (!isSuccess(maxPosResult)) {
    return internalErrorResponse(maxPosResult.error.message);
}
const newPosition = maxPosResult.data + 1;
```

### Data Transformation

```typescript
// lib/mappers.ts
export function mapToDatabase(resource: ClientResource, position: number): DatabaseResource {
    return {
        type: resource.type,
        position,
        data: {
            // camelCase → snake_case
        },
    };
}

export function mapFromDatabase(dbResource: DatabaseResource): ClientResource {
    return {
        id: dbResource.id,
        type: dbResource.type,
        // snake_case → camelCase
    };
}
```

---

## Quick Reference

### Layer Responsibilities

| Layer    | What It Does                              | What It Doesn't Do             |
| -------- | ----------------------------------------- | ------------------------------ |
| Client   | UI, TanStack Query, Zustand (UI only)     | Business logic, DB access      |
| Route    | Endpoint definition, withAuth             | Parsing, validation, DB access |
| Handler  | Validation, business logic, orchestration | UI logic, raw SQL              |
| Database | Supabase queries, Result<T>               | Business logic, auth checks    |

### File Naming Conventions

- Queries: `{domain}.queries.ts`
- Handlers: `{domain}.handlers.ts`
- Hooks: `use-{domain}.ts`
- Stores: `{domain}Store.ts` (UI state only)
- Mappers: `mappers.ts` or `{domain}.mappers.ts`

### Import Patterns

```typescript
// Handler imports

// Client imports (TanStack Query hooks)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Result } from '@/types/result';
import { successResponse, verifyOwnership } from '@/lib/api';
import { createResource, getMaxPosition } from '@/lib/db/queries';
import { mapToDatabase } from '@/lib/mappers';
// Database imports
import { createClient } from '@/lib/supabase/server';
// Client imports (Zustand - UI state only)
import { useDashboardUIStore } from '@/stores/contentEntryStore';
import { useUIStore } from '@/stores/uiStore';
```

---

## Code Generation Template

When generating a new feature with domain name `{DOMAIN}`:

1. **Database:** `lib/db/queries/{DOMAIN}.queries.ts`
2. **Handlers:** `lib/api/handlers/{DOMAIN}.handlers.ts`
3. **Routes:** `app/api/{DOMAIN}/route.ts` and `app/api/{DOMAIN}/[id]/route.ts`
4. **Client Hook:** `hooks/use-{DOMAIN}.ts`

Follow patterns shown in this document for each layer.

---

**End of Architecture Guide**

_For questions or improvements, discuss with the team._
