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
- TanStack Query for server state management

---

## Layer Definitions

### 1. Client Layer

**Location:** `app/`, `components/`, `hooks/`, `stores/`

**Responsibilities:**

- UI rendering and user interactions
- Server state caching (TanStack Query)
- UI state management (Zustand)
- Form validation (React Hook Form)

**Pattern:**

```typescript
// hooks/use-{resource}.ts
export function useUpdateResource() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await fetch(`/api/resources/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['resources'] });
        },
    });
}
```

**Rules:**

- ✅ Use TanStack Query for server data
- ✅ Use Zustand for UI state only
- ❌ NO direct database access
- ❌ NO authentication/authorization logic
- ❌ NO business logic in components

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

**Response Helpers:**

```typescript
successResponse(data, (status = 200)); // Success
validationErrorResponse(field); // 400
forbiddenResponse(); // 403
notFoundResponse(resource); // 404
internalErrorResponse(message); // 500
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
import { createClient } from '@/lib/supabase/server';
import type { Result } from '@/types/result';

export async function createResource(
    id: string,
    data: {
        parent_id: string;
        type: string;
        position: number;
        data: any;
    }
): Promise<Result<Resource>> {
    const supabase = await createClient();

    const { data: resource, error } = await supabase
        .from('resources')
        .insert({ id, ...data })
        .select()
        .single();

    if (error) {
        return {
            ok: false,
            error: {
                code: 'DATABASE_ERROR',
                message: error.message,
            },
        };
    }

    return { ok: true, data: resource };
}

export async function getMaxPosition(parentId: string): Promise<Result<number>> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('resources')
        .select('position')
        .eq('parent_id', parentId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        return {
            ok: false,
            error: { code: 'DATABASE_ERROR', message: error.message },
        };
    }

    return { ok: true, data: data?.position ?? 0 };
}
```

**Result Type:**

```typescript
// types/result.ts
export type Result<T, E = AppError> = { ok: true; data: T } | { ok: false; error: E };

export interface AppError {
    code: string;
    message: string;
}

export function isSuccess<T, E>(result: Result<T, E>): result is { ok: true; data: T } {
    return result.ok;
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
│   └── (pages)/                      # Client Layer - Pages
│
├── components/                       # Client Layer - UI
│   ├── ui/                           # Shadcn components
│   └── features/                     # Feature components
│
├── hooks/                            # Client Layer - Data
│   └── use-{domain}.ts               # TanStack Query hooks
│
├── stores/                           # Client Layer - State
│   └── {domain}-store.ts             # Zustand stores
│
├── lib/
│   ├── api/                          # Handler Layer
│   │   ├── handlers/
│   │   │   └── {domain}.handlers.ts
│   │   ├── middleware.ts             # withAuth
│   │   ├── responses.ts              # Response helpers
│   │   └── verification.ts           # Ownership checks
│   │
│   └── db/                           # Database Layer
│       └── queries/
│           └── {domain}.queries.ts
│
└── types/
    ├── domain.ts                     # Business types
    ├── result.ts                     # Result type
    └── supabase.ts                   # DB types
```

---

## Data Flow Example

**Scenario:** Update a resource

```
1. User submits form
   ↓
2. [Client] useUpdateResource.mutate({ id, data })
   ↓
3. [Client] fetch('/api/resources/123', { PATCH, body })
   ↓
4. [Route] withAuth verifies authentication
   ↓
5. [Route] handleUpdateResource(request, context, id)
   ↓
6. [Handler] Parse request.json()
   ↓
7. [Handler] verifyResourceOwnership(id, user.id)
   ↓
8. [Handler] Transform data with mapper
   ↓
9. [Handler] updateResource(id, data)
   ↓
10. [Database] Execute Supabase UPDATE
    ↓
11. [Database] Return Result<Resource>
    ↓
12. [Handler] Generate successResponse(data)
    ↓
13. [Route] Return Response
    ↓
14. [Client] Invalidate queries on success
    ↓
15. [Client] UI auto-updates with fresh data
```

---

## Dependency Rules

### ✅ Allowed Dependencies

```
Client → Route (HTTP)
Route → Handler (function call)
Handler → Database (function call)
Handler → Mappers (data transformation)
Handler → Verification (ownership checks)
```

### ❌ Forbidden Dependencies

```
Database → Handler (reverse dependency)
Route → Database (skip handler layer)
Client → Database (direct access)
Database → Business logic
```

### Anti-Pattern Example

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

---

## Code Generation Checklist

When generating new features:

**Database Layer:**

- [ ] Create query function in `lib/db/queries/{domain}.queries.ts`
- [ ] Return Result<T> type
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
- [ ] Use TanStack Query (useQuery/useMutation)
- [ ] Invalidate queries on success
- [ ] Handle loading/error states

---

## Best Practices

### Error Handling

```typescript
// ✅ Explicit Result handling
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
// ✅ Use helpers
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
    // ...
}

// ✅ CORRECT - Business logic in handler
export async function handleCreateResource(...) {
    const maxPosResult = await getMaxPosition(parentId);
    const position = maxPosResult.data + 1;
    // ...
}
```

### Caching Strategy

```typescript
// ✅ TanStack Query caching
const { data } = useQuery({
    queryKey: ['resources', parentId],
    queryFn: () => fetchResources(parentId),
    staleTime: 5 * 60 * 1000, // 5 minutes
});

// ❌ Manual state management
const [data, setData] = useState(null);
useEffect(() => {
    fetch('/api/resources')
        .then((r) => r.json())
        .then(setData);
}, []);
```

---

## Common Patterns

### Ownership Verification

```typescript
// lib/api/verification.ts
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
// lib/api/mappers/{domain}.mappers.ts
export function mapToDatabase(resource: ClientResource, position: number): DatabaseResource {
    return {
        type: resource.type,
        position,
        data: {
            // Transform client format to DB format
        },
    };
}

export function mapFromDatabase(dbResource: DatabaseResource): ClientResource {
    return {
        id: dbResource.id,
        type: dbResource.type,
        // Transform DB format to client format
    };
}
```

---

## Quick Reference

### Layer Responsibilities

| Layer    | What It Does                              | What It Doesn't Do             |
| -------- | ----------------------------------------- | ------------------------------ |
| Client   | UI, TanStack Query, Zustand               | Business logic, DB access      |
| Route    | Endpoint definition, withAuth             | Parsing, validation, DB access |
| Handler  | Validation, business logic, orchestration | UI logic, raw SQL              |
| Database | Supabase queries, Result<T>               | Business logic, auth checks    |

### File Naming Conventions

- Queries: `{domain}.queries.ts`
- Handlers: `{domain}.handlers.ts`
- Hooks: `use-{domain}.ts`
- Stores: `{domain}-store.ts`
- Mappers: `{domain}.mappers.ts`

### Import Patterns

```typescript
// Handler imports
import { verifyOwnership, successResponse } from '@/lib/api';
import { createResource, getMaxPosition } from '@/lib/db/queries';
import { mapToDatabase } from '@/lib/api/mappers';

// Client imports
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Database imports
import { createClient } from '@/lib/supabase/server';
import type { Result } from '@/types/result';
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
