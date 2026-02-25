import { getProxyHeaders, handleApiRequest } from '@/lib/api/index';
import { session } from '@/lib/api/endpoints/session';

export async function GET(
    req: Request,
    { params }: { params: { userId: string } }
) {
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => session.getHistory(params.userId, headers));
}

export async function DELETE(
    req: Request,
    { params }: { params: { userId: string } }
) {
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => session.deleteHistory(params.userId, headers));
}
