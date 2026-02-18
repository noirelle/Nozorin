import { NextResponse } from 'next/server';
import { api, getProxyHeaders } from '@/lib/api';

export async function GET(req: Request) {
    try {
        const headers = getProxyHeaders(req);

        const { error, data, status } = await api.get('/api/friends/pending', { headers });

        if (error) {
            return NextResponse.json({ error }, { status: status || 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('[API Proxy] pending requests fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server proxy error' },
            { status: 500 }
        );
    }
}
