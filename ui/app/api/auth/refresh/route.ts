import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { auth } from '@/lib/api/endpoints/auth';

export async function POST(req: Request) {
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => auth.refreshToken(headers));
}
