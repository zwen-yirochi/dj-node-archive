import { handleCheckUsername } from '@/lib/api/handlers/user.handlers';

export async function GET(request: Request) {
    return handleCheckUsername(request);
}
