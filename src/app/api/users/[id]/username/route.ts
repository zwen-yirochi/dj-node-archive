import { withAuth } from '@/lib/api';
import { handleUpdateUsername } from '@/lib/api/handlers/user.handlers';

export const PATCH = withAuth<{ id: string }>(async (request, context) => {
    return handleUpdateUsername(request, context);
});
