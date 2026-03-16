import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { admin } from '@/lib/api/endpoints/admin';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => admin.getUserDetails(userId, headers as any));
}
