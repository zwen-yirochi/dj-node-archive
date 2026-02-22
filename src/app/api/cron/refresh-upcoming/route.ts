import { handleRefreshUpcomingEvents } from '@/lib/api/handlers/cron.handlers';

export const maxDuration = 300; // 5분 (Vercel Pro)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    return handleRefreshUpcomingEvents(request);
}
