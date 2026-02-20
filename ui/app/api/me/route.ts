import { NextResponse } from 'next/server';
import { api } from '../../../lib/api';
import { getProxyHeaders } from '../../../lib/api';
import { successResponse, errorResponse } from '../../../lib/api/core/response';

export async function GET(req: Request) {
    try {
        const headers = getProxyHeaders(req);

        const { error, data, status } = await api.get<{ id: string }>('/api/me', { headers });

        if (error) {
            return errorResponse(error, null, status || 500);
        }

        return successResponse(data, 'User retrieved successfully');
    } catch (error) {
        console.error('[API Proxy] me fetch error:', error);
        return errorResponse('Internal server proxy error', error, 500);
    }
}
