import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { friends } from '@/lib/api/endpoints/friends';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => friends.sendRequest(id, headers));
}
