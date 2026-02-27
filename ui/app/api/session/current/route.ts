import { getProxyHeaders, handleApiRequest } from '@/lib/api/index';
import { session } from '@/lib/api/endpoints/session';

export async function GET(req: Request) {
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => session.getCurrentSession(headers));
}
