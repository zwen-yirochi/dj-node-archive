// app/api/import/artist/status/route.ts
import { handleArtistMigrationStatus } from '@/lib/api/handlers/import.handlers';
import { withAuth } from '@/lib/api/withAuth';

export const GET = withAuth(async (request, context) => {
    return handleArtistMigrationStatus(request, context);
});
