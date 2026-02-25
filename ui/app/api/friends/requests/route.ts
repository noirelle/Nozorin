import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { friends } from '@/lib/api/endpoints/friends';

export async function GET(req: Request) {
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => friends.getRequests(headers));
}
