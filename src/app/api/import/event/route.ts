// app/api/import/event/route.ts
import { handleSingleEventImport } from '@/lib/api/handlers/import.handlers';
import { withAuth } from '@/lib/api/withAuth';

export const POST = withAuth(async (request, context) => {
    return handleSingleEventImport(request, context);
});
