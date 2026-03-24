// app/api/import/artist/preview/route.ts
import { handleArtistImportPreview } from '@/lib/api/handlers/import.handlers';
import { withAuth } from '@/lib/api/withAuth';

export const POST = withAuth(async (request, context) => {
    return handleArtistImportPreview(request, context);
});
