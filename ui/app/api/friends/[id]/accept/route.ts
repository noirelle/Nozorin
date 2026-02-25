import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { friends } from '@/lib/api/endpoints/friends';

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => friends.acceptRequest(params.id, headers));
}
