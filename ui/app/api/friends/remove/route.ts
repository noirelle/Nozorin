import { getProxyHeaders, handleApiRequest } from '@/lib/api/index';
import { friends } from '@/lib/api/endpoints/friends';

export async function DELETE(req: Request) {
    const headers = getProxyHeaders(req);
    const { searchParams } = new URL(req.url);
    const friendId = searchParams.get('friendId');

    if (!friendId) {
        return new Response(JSON.stringify({ error: 'Friend ID required' }), { status: 400 });
    }

    return handleApiRequest(() => friends.removeFriend(friendId, headers));
}
