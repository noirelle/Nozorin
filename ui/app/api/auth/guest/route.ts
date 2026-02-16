import { NextResponse } from 'next/server';
import { api } from '../../../../lib/api';
import { GuestRegistrationRequest } from '../../../../types/api';

export async function POST(req: Request) {
    try {
        const body: GuestRegistrationRequest = await req.json();
        const { username, gender, agreed, sessionId, footprint } = body;

        const { error, data, status, headers } = await api.post('/api/guest', {
            username, gender, agreed, sessionId, footprint
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
        console.error('Guest registration API error:', error);
        return NextResponse.json(
            { error: 'Internal server error during guest registration' },
            { status: 500 }
        );
    }
}
