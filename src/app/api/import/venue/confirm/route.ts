// app/api/import/venue/confirm/route.ts
import { withAuth } from '@/lib/api/withAuth';
import { handleVenueImportConfirm } from '@/lib/api/handlers/import.handlers';

export const POST = withAuth(async (request, context) => {
    return handleVenueImportConfirm(request, context);
});
