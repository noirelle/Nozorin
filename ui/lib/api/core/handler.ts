import { createProxyResponse } from './proxy';
import { ApiResponse } from './types';

export const handleApiRequest = async <T>(
    fn: () => Promise<ApiResponse<T>>
): Promise<Response> => {
    try {
        const result = await fn();
        return createProxyResponse(result);
    } catch (err: any) {
        console.error('[API Handler] Error:', err);
        const status = err?.response?.status || 500;
        const message = err?.response?.data?.error || err?.message || 'Internal server error';

        return createProxyResponse({
            error: message,
            status,
            data: null
        } as ApiResponse<T>, status);
    }
};
