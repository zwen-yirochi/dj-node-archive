// app/api/venues/route.ts
import { withAuth } from '@/lib/api';
import { handleCreateVenue, handleListVenues } from '@/lib/api/handlers/venue.handlers';

export const POST = withAuth(async (request, context) => {
    return handleCreateVenue(request, context);
});

export async function GET() {
    return handleListVenues();
}
