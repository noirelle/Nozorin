import { apiRequest } from '../core/apiRequest';
import { ApiResponse } from '../core/types';

export const withRetry = async <T>(
    fn: () => Promise<ApiResponse<T>>,
    retries = 3,
    delay = 1000
): Promise<ApiResponse<T>> => {
    try {
        const res = await fn();
        if (res.error) {
            throw new Error(res.error);
        }
        return res;
    } catch (error) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, delay));
            return withRetry(fn, retries - 1, delay * 1.5);
        }
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Retry failed',
            status: 500
        };
    }
};
