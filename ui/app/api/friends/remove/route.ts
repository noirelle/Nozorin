import { NextResponse } from 'next/server';
import { api, getProxyHeaders } from '@/lib/api';

export async function DELETE(req: Request) {
    try {
        const headers = getProxyHeaders(req);

        const { error, data, status } = await api.delete('/api/friends/remove', { headers });

        if (error) {
            return NextResponse.json({ error }, { status: status || 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[API Proxy] remove friend error:', error);
        return NextResponse.json(
            { error: 'Internal server proxy error' },
            { status: 500 }
        );
    }
}
