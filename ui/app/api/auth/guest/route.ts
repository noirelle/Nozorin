import { NextResponse } from 'next/server';
import { api } from '../../../../lib/api';
import { GuestRegistrationRequest } from '../../../../types/api';

export async function POST(req: Request) {
    try {
        const body: GuestRegistrationRequest = await req.json();
        const { username, gender, agreed, sessionId, footprint, deviceId } = body;

        // Extract client IP
        const forwardedFor = req.headers.get('x-forwarded-for');
        let ip = '';
        if (forwardedFor) {
            ip = forwardedFor.split(',')[0].trim();
        }

        const headers = new Headers();
        if (ip) {
            headers.set('x-forwarded-for', ip);
        }

        const { error, data, status, headers: responseHeaders } = await api.post('/api/guest', {
            username, gender, agreed, sessionId, footprint, deviceId
        }, {
            headers: Object.fromEntries(headers.entries())
        });

        if (error) {
            return NextResponse.json({ error }, { status: status || 500 });
        }

        const response = NextResponse.json(data);

        // Forward cookies from backend to client
        const cookies = responseHeaders?.get('set-cookie');
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
