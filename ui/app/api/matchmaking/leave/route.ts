import { NextRequest } from 'next/server';
import { api, getProxyHeaders } from '@/lib/api';
import { createProxyResponse } from '@/lib/api/core/proxy';

export async function POST(req: NextRequest) {
    const headers = getProxyHeaders(req);

    const res = await api.post('/api/matchmaking/leave', {}, { headers });
    return createProxyResponse(res);
}
