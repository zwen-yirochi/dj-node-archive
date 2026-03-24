import { withAuth } from '@/lib/api';
import { handleDeleteAvatar, handleUploadAvatar } from '@/lib/api/handlers/user.handlers';

export const POST = withAuth<{ id: string }>(async (request, context) => {
    return handleUploadAvatar(request, context);
});

export const DELETE = withAuth<{ id: string }>(async (request, context) => {
    return handleDeleteAvatar(request, context);
});
