import { NextResponse } from 'next/server';
import { api } from '../../../../lib/api';
import { AnonymousLoginRequest } from '../../../../types/api';

export async function POST(req: Request) {
    try {
        const body: AnonymousLoginRequest = await req.json();
        const { chatIdentityId } = body;

        const { error, data, status, headers } = await api.post('/api/anonymous', {
            chatIdentityId
        });

        if (error) {
            return NextResponse.json({ error }, { status: status || 500 });
        }

        const response = NextResponse.json(data);

        // Forward cookies from backend to client
        const cookies = headers?.get('set-cookie');
        if (cookies) {
            response.headers.set('set-cookie', cookies);
        }

        return response;
    } catch (error) {
        console.error('Anonymous login API error:', error);
        return NextResponse.json(
            { error: 'Internal server error during anonymous login' },
            { status: 500 }
        );
    }
}
