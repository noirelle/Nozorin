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

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;
    const body = await req.json();
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => admin.updateUser(userId, body, headers as any));
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;
    const headers = getProxyHeaders(req);
    return handleApiRequest(() => admin.deleteUser(userId, headers as any));
}
