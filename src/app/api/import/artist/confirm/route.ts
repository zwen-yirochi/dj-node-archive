// app/api/import/artist/confirm/route.ts
import { handleArtistImportConfirm } from '@/lib/api/handlers/import.handlers';
import { withAuth } from '@/lib/api/withAuth';

export const POST = withAuth(async (request, context) => {
    return handleArtistImportConfirm(request, context);
});
