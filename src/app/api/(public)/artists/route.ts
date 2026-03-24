// app/api/artists/route.ts
import { isSuccess } from '@/types/result';
import {
    errorResponse,
    internalErrorResponse,
    successResponse,
    validationErrorResponse,
    withAuth,
} from '@/lib/api';
import { createArtist } from '@/lib/db/queries/artist.queries';

export const POST = withAuth(async (request) => {
    // 1. Parse
    const body = await request.json();
    const { name, slug, instagram, soundcloud } = body;

    // 2. Validate
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return validationErrorResponse('아티스트 이름');
    }

    // 3. Database
    const result = await createArtist({
        name: name.trim(),
        slug,
        instagram: instagram?.trim(),
        soundcloud: soundcloud?.trim(),
    });

    if (!isSuccess(result)) {
        if (result.error.code === 'CONFLICT') {
            return errorResponse({ code: 'CONFLICT', message: result.error.message, status: 409 });
        }
        return internalErrorResponse(result.error.message);
    }

    // 4. Response
    return successResponse(result.data, 201);
});
