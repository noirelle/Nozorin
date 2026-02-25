import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { friends } from '@/lib/api/endpoints/friends';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => friends.removeFriend(params.id, headers));
}
