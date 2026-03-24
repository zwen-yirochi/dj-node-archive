import { handleUpdateSections } from '@/lib/api/handlers/section.handlers';
import { withAuth } from '@/lib/api/withAuth';

export const PATCH = withAuth<{ id: string }>(async (request, context) => {
    return handleUpdateSections(request, context, context.params.id);
});
