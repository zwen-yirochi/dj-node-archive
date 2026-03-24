// app/api/import/venue/preview/route.ts
import { handleVenueImportPreview } from '@/lib/api/handlers/import.handlers';
import { withAuth } from '@/lib/api/withAuth';

export const POST = withAuth(async (request, context) => {
    return handleVenueImportPreview(request, context);
});
