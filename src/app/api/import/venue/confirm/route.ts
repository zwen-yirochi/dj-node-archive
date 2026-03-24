// app/api/import/venue/confirm/route.ts
import { handleVenueImportConfirm } from '@/lib/api/handlers/import.handlers';
import { withAuth } from '@/lib/api/withAuth';

export const POST = withAuth(async (request, context) => {
    return handleVenueImportConfirm(request, context);
});
