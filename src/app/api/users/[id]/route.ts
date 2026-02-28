import { handleUpdateProfile } from '@/lib/api/handlers/user.handlers';
import { withAuth } from '@/lib/api';

export const PATCH = withAuth<{ id: string }>(async (request, context) => {
    return handleUpdateProfile(request, context);
});
