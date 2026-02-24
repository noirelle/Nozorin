import { getProxyHeaders, handleApiRequest } from '@/lib/api/index';
import { session } from '@/lib/api/endpoints/session';

export async function GET(
    req: Request,
    { params }: { params: { userId: string } }
) {
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => session.getStats(params.userId, headers));
}
