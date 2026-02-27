import { handleUploadAvatar, handleDeleteAvatar } from '@/lib/api/handlers/user.handlers';
import { withAuth } from '@/lib/api';

export const POST = withAuth<{ id: string }>(async (request, context) => {
    return handleUploadAvatar(request, context);
});

export const DELETE = withAuth<{ id: string }>(async (request, context) => {
    return handleDeleteAvatar(request, context);
});
