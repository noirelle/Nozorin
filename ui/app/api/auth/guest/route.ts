import { getProxyHeaders, handleApiRequest } from '@/lib/api';
import { auth, GuestRegistrationRequest } from '@/lib/api/endpoints/auth';

export async function POST(req: Request) {
    const body: GuestRegistrationRequest = await req.json();
    const headers = getProxyHeaders(req);

    return handleApiRequest(() => auth.guestRegistration(body, headers));
}
