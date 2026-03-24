import { withAuth } from '@/lib/api';
import { handleUpdateProfile } from '@/lib/api/handlers/user.handlers';

export const PATCH = withAuth<{ id: string }>(async (request, context) => {
    return handleUpdateProfile(request, context);
});
