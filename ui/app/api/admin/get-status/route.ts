import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { admin } from '@/lib/api/endpoints/admin';

export async function GET(req: Request) {
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => admin.getStats(headers as any));
}
