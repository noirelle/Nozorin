import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { admin } from '@/lib/api/endpoints/admin';

export async function POST(req: Request) {
    const headers = getProxyHeaders(req);

    return handleApiRequest(() => admin.logout(headers as any));
}
