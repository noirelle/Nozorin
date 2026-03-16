import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { admin } from '@/lib/api/endpoints/admin';

export async function POST(req: Request) {
    const { password } = await req.json();
    const headers = getProxyHeaders(req);

    return handleApiRequest(() => admin.login(password, headers as any));
}
