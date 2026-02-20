import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { friends } from '@/lib/api/endpoints/friends';

export async function POST(req: Request) {
    const headers = getProxyHeaders(req);
    const body = await req.json().catch(() => ({}));
    const { friendId } = body;

    return handleApiRequest(() => friends.sendRequest(friendId, headers));
}
