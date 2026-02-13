// app/api/import/venue/preview/route.ts
import { withAuth } from '@/lib/api/withAuth';
import { handleVenueImportPreview } from '@/lib/api/handlers/import.handlers';

export const POST = withAuth(async (request, context) => {
    return handleVenueImportPreview(request, context);
});
