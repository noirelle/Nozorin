import { NextResponse } from 'next/server';
import { api } from '@/lib/api';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        const cookieHeader = req.headers.get('cookie');

        if (!authHeader) {
            return NextResponse.json(
                { error: 'No authorization header provided' },
                { status: 401 }
            );
        }

        const headers: HeadersInit = {
            'Authorization': authHeader,
        };

        if (cookieHeader) {
            headers['Cookie'] = cookieHeader;
        }

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
