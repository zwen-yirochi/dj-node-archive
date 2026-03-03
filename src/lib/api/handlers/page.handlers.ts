// lib/api/handlers/page.handlers.ts
import { z } from 'zod';

import { isSuccess } from '@/types/result';
import {
    forbiddenResponse,
    internalErrorResponse,
    notFoundResponse,
    successResponse,
    validationErrorResponse,
    verifyPageOwnership,
    type AuthContext,
} from '@/lib/api';
import { updatePage } from '@/lib/db/queries/page.queries';
import { profileLinksArraySchema } from '@/lib/validations/profile-link.schemas';

const VALID_HEADER_STYLES = ['minimal', 'banner', 'portrait', 'shapes'] as const;

const updatePageSchema = z
    .object({
        theme: z.string().max(50).optional(),
        is_public: z.boolean().optional(),
        header_style: z.enum(VALID_HEADER_STYLES).optional(),
        links: profileLinksArraySchema.optional(),
    })
    .refine(
        (data) =>
            data.theme !== undefined ||
            data.is_public !== undefined ||
            data.header_style !== undefined ||
            data.links !== undefined,
        {
            message: 'theme, is_public, header_style, links 중 하나 이상 필요합니다',
        }
    );

/**
 * PATCH /api/pages/[id]
 * 페이지 업데이트 (테마, 공개 여부)
 */
export async function handleUpdatePage(
    request: Request,
    { user, params }: AuthContext & { params: { id: string } }
) {
    const { id } = params;

    // 1. Verify ownership
    const ownership = await verifyPageOwnership(id, user.id);
    if (!ownership.ok) {
        return ownership.reason === 'not_found' ? notFoundResponse('페이지') : forbiddenResponse();
    }

    // 2. Parse & Validate
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return validationErrorResponse('request body');
    }

    const parsed = updatePageSchema.safeParse(body);
    if (!parsed.success) {
        return validationErrorResponse(parsed.error.issues[0]?.message ?? 'request body');
    }

    const { theme, is_public, header_style, links } = parsed.data;

    // 3. Database
    const result = await updatePage(id, { theme, is_public, header_style, links });
    if (!isSuccess(result)) return internalErrorResponse(result.error.message);

    // 4. Response
    return successResponse(result.data);
}
