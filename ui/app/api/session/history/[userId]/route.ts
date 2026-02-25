import { getProxyHeaders, handleApiRequest } from '@/lib/api/index';
import { session } from '@/lib/api/endpoints/session';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => session.getHistory(userId, headers));
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => session.deleteHistory(userId, headers));
}
