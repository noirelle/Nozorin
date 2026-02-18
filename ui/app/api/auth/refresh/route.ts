import { NextResponse } from 'next/server';
import { api } from '../../../../lib/api';

export async function POST(req: Request) {
    try {
        // We don't need body, just the cookie which is handled by the browser/proxy
        const cookieHeader = req.headers.get('cookie');

        const { error, data, status, headers } = await api.post('/api/refresh', {}, {
            headers: {
                'Cookie': cookieHeader || ''
            }
        });

        if (error || !data) {
            return NextResponse.json(
                { error: error || 'Token refresh failed' },
                { status: status || 401 }
            );
        }

        const response = NextResponse.json(data);

        // Forward cookies (if any new ones are set, though usually just the token in body)
        const cookies = headers?.get('set-cookie');
        if (cookies) {
            response.headers.set('set-cookie', cookies);
        }

        return response;
    } catch (error) {
        console.error('Refresh API proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error during refresh' },
            { status: 500 }
        );
    }
}
