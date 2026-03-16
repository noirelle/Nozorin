import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { admin } from '@/lib/api/endpoints/admin';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const params = {
        page: Number(searchParams.get('page') || 1),
        limit: Number(searchParams.get('limit') || 10),
        gender: searchParams.get('gender') || undefined,
        is_claimed: searchParams.get('is_claimed') || undefined,
        search: searchParams.get('search') || undefined,
        active_since: searchParams.get('active_since') || undefined
    };

    const headers = getProxyHeaders(req);
    return handleApiRequest(() => admin.listUsers(params, headers as any));
}
