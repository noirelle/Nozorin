import { getProxyHeaders, handleApiRequest } from '@/lib/api/index';
import { call } from '@/lib/api/index';

export async function POST(req: Request) {
    const headers = getProxyHeaders(req);
    const body = await req.json();
    return handleApiRequest(() => call.respond(body, headers));
}
