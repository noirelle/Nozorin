import { NextResponse } from 'next/server';
import { ApiResponse } from './types';
import { successResponse, errorResponse } from './response';

export function createProxyResponse<T>(
    result: ApiResponse<T>,
    successStatus: number = 200
): NextResponse {
    const { error, data, status, headers, message } = result;
    const responseStatus = status || (error ? 500 : successStatus);

    let response: NextResponse;

    if (error) {
        response = errorResponse(message || error, null, responseStatus);
    } else {
        response = successResponse(data, message || 'Success', responseStatus);
    }

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
