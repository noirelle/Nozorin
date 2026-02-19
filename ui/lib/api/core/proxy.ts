import { NextResponse } from 'next/server';
import { ApiResponse } from './types';

export function createProxyResponse<T>(
    result: ApiResponse<T>,
    successStatus: number = 200
): NextResponse {
    const { error, data, status, headers } = result;

    if (error || !data) {
        return NextResponse.json(
            { error: error || 'Request failed' },
            { status: status || 500 }
        );
    }

    const response = NextResponse.json(data, { status: successStatus });

    if (headers) {
        // Handle headers whether they are essentially Headers object, generic HeadersInit, or Record
        // safely checking for 'get' method or index access
        let cookies: string | null | undefined = null;

        if (typeof (headers as any).get === 'function') {
            cookies = (headers as Headers).get('set-cookie');
        } else if (Array.isArray(headers)) {
            // Headers as entries array
            const found = headers.find(([k]) => k.toLowerCase() === 'set-cookie');
            if (found) cookies = found[1];
        } else {
            // Headers as Record
            cookies = (headers as unknown as Record<string, string>)['set-cookie'];
        }

        if (cookies) {
            response.headers.set('set-cookie', cookies);
        }
    }

    return response;
}
