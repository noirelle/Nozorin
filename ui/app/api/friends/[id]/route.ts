import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { friends } from '@/lib/api/endpoints/friends';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => friends.removeFriend(id, headers));
}
