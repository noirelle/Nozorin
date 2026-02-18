import { NextResponse } from 'next/server';
import { api, getProxyHeaders } from '@/lib/api';

export async function POST(req: Request) {
    try {
        const headers = getProxyHeaders(req);

        const body = await req.json().catch(() => ({}));
        const { error, data, status } = await api.post('/api/friends/accept', body, { headers });

        if (error) {
            return NextResponse.json({ error }, { status: status || 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[API Proxy] accept request error:', error);
        return NextResponse.json(
            { error: 'Internal server proxy error' },
            { status: 500 }
        );
    }
}
