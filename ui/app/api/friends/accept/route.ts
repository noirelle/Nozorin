import { getProxyHeaders, handleApiRequest } from '@/lib/api/index';
import { friends } from '@/lib/api/endpoints/friends';

export async function POST(req: Request) {
    const headers = getProxyHeaders(req);
    const body = await req.json().catch(() => ({}));
    const { requestId } = body;

    return handleApiRequest(() => friends.acceptRequest(requestId, headers));
}
