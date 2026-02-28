// lib/api/handlers/venue.handlers.ts
import type { AuthContext } from '@/lib/api';
import {
    successResponse,
    internalErrorResponse,
    validationErrorResponse,
    errorResponse,
} from '@/lib/api';
import { createVenue, getAllVenues, isVenueSlugTaken } from '@/lib/db/queries/venue.queries';
import { isSuccess } from '@/types/result';

// ============================================
// Helpers
// ============================================

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(name: string): Promise<string> {
    const base = generateSlug(name);
    let candidate = base;
    let suffix = 0;

    while (true) {
        const result = await isVenueSlugTaken(candidate);
        if (!isSuccess(result)) break; // DB 오류 시 base 그대로 사용 (createVenue에서 재검증)
        if (!result.data) return candidate;

        suffix++;
        candidate = `${base}-${suffix}`;
    }

    return candidate;
}

// ============================================
// Handlers
// ============================================

/**
 * POST /api/venues
 * 새 베뉴 생성
 */
export async function handleCreateVenue(request: Request, { user }: AuthContext) {
    // 1. Parse
    const body = await request.json();
    const { name, city, country, address, instagram, website, google_maps_url } = body;

    // 2. Validate
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return validationErrorResponse('베뉴 이름');
    }

    // 3. Logic — unique slug 생성
    const slug = await generateUniqueSlug(name);

    // 4. Database
    const result = await createVenue({
        name: name.trim(),
        slug,
        city: city?.trim() || undefined,
        country: country?.trim() || undefined,
        address: address?.trim() || undefined,
        instagram: instagram?.trim() || undefined,
        website: website?.trim() || undefined,
        google_maps_url: google_maps_url?.trim() || undefined,
        claimed_by: user.id,
    });

    if (!isSuccess(result)) {
        if (result.error.code === 'CONFLICT') {
            return errorResponse({ code: 'CONFLICT', message: result.error.message, status: 409 });
        }
        return internalErrorResponse(result.error.message);
    }

    // 5. Response
    return successResponse(result.data, 201);
}

/**
 * GET /api/venues
 * 베뉴 목록 조회
 */
export async function handleListVenues() {
    const result = await getAllVenues(100);

    if (!isSuccess(result)) {
        return internalErrorResponse(result.error.message);
    }

    return successResponse(result.data);
}
