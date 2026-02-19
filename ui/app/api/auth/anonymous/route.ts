import { getProxyHeaders, handleApiRequest } from '../../../../lib/api';
import { auth, AnonymousLoginRequest } from '../../../../lib/api/endpoints/auth';

export async function POST(req: Request) {
    const body: AnonymousLoginRequest = await req.json();
    const headers = getProxyHeaders(req);

    return handleApiRequest(() => auth.anonymousLogin(body, headers));
}
