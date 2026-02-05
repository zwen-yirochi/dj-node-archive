# Claude Reference

## Stack

Next.js 16 (App Router) · TypeScript · Supabase · TanStack Query · Zustand · Vercel

## 구조

- `src/types/` - 타입 정의
- `src/lib/supabase/` - DB 클라이언트
- `src/stores/` - Zustand 스토어

## Git

`.github/BRANCH_STRATEGY.md` 참조

## API Architecture

4-layer architecture: `Client → Route → Handler → Database`

Full patterns in `/docs/API_LAYER_ARCHITECTURE.md`

## Structure

```
lib/db/queries/        - Database layer (Result<T>)
lib/api/handlers/      - Handler layer (business logic)
app/api/               - Route layer (withAuth)
hooks/                 - Client layer (TanStack Query)
stores/                - Client layer (Zustand)
```

## Rules

### Before generating code:

1. Read `ARCHITECTURE.md` for patterns
2. Identify which layer(s) affected
3. Follow layer responsibilities strictly

### Layer responsibilities:

- **Database**: Queries only, return `Result<T>`
- **Handler**: Parse → Validate → Verify → Logic → DB → Response
- **Route**: Thin (1-3 lines), apply `withAuth`, call handler
- **Client**: TanStack Query for server state, Zustand for UI state

### Always:

- ✅ Use `Result<T>` in database layer
- ✅ Verify ownership in handlers before mutations
- ✅ Use response helpers (`successResponse`, etc.)
- ✅ Keep routes thin

### Never:

- ❌ Put business logic in routes or database
- ❌ Access database directly from routes
- ❌ Skip ownership verification
- ❌ Use try-catch for `Result<T>` operations

## Quick Patterns

**Database:**

```typescript
export async function createX(id: string, data: XData): Promise<Result<X>> {
    const supabase = await createClient();
    const { data: x, error } = await supabase
        .from('xs')
        .insert({ id, ...data })
        .select()
        .single();
    if (error) return { ok: false, error: { code: 'DATABASE_ERROR', message: error.message } };
    return { ok: true, data: x };
}
```

**Handler (7 steps):**

```typescript
export async function handleCreateX(request: Request, { user }: AuthContext) {
    const body = await request.json(); // 1. Parse
    if (!body.parentId) return validationErrorResponse('parentId'); // 2. Validate
    const ownership = await verifyParentOwnership(body.parentId, user.id); // 3. Verify
    if (!ownership.ok) return forbiddenResponse();
    const maxPosResult = await getMaxPosition(body.parentId); // 4. Logic
    if (!isSuccess(maxPosResult)) return internalErrorResponse(maxPosResult.error.message);
    const dbData = mapToDatabase(body.data, maxPosResult.data + 1); // 5. Transform
    const result = await createX(body.id, dbData); // 6. Database
    if (!isSuccess(result)) return internalErrorResponse(result.error.message);
    return successResponse(result.data, 201); // 7. Response
}
```

**Route:**

```typescript
export const POST = withAuth(async (request, context) => {
    return handleCreateX(request, context);
});
```

**Client:**

```typescript
export function useCreateX() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: XData) => {
            const res = await fetch('/api/xs', { method: 'POST', body: JSON.stringify(data) });
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['xs'] }),
    });
}
```

## File Naming

- Queries: `{domain}.queries.ts`
- Handlers: `{domain}.handlers.ts`
- Routes: `app/api/{domain}/route.ts`
- Hooks: `use-{domain}.ts`
