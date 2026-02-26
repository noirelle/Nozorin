import { useAuthStore } from '../../../stores/useAuthStore';
import { ApiResponse, StandardApiResponse } from './types';
import { getBaseApiUrl } from './config';
import { handleTokenRefresh, handleAuthError } from './auth';
import { logRequest, logResponse } from '../middleware/logging';

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (!endpoint.startsWith('http')) {
        // On the server, we MUST have a full URL (to hit the backend service)
        if (typeof window === 'undefined') {
            const baseUrl = getBaseApiUrl();
            const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
            url = `${cleanBase}${cleanEndpoint}`;
        } else {
            // On the client, relative URLs should stay relative to hit Next.js routes
            url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        }
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Normalize and merge provided headers
    if (options.headers) {
        const providedHeaders = options.headers as Record<string, string>;
        Object.keys(providedHeaders).forEach(key => {
            headers[key] = providedHeaders[key];
        });
    }

    // Automatically attach Authorization header if on client and token exists
    if (typeof window !== 'undefined') {
        const token = useAuthStore.getState().token || localStorage.getItem('nz_token');
        // Only attach if not already present (case-insensitive check)
        const hasAuth = Object.keys(headers).some(k => k.toLowerCase() === 'authorization');
        if (token && !hasAuth) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    logRequest(url, options);

    try {
        let response: Response | undefined;
        let lastError: any;
        const maxRetries = 5;
        const baseDelay = 1000;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                response = await fetch(url, {
                    credentials: 'include',
                    ...options,
                    headers,
                });
                break; // Break loop on successful connection (even if HTTP 4xx/5xx)
            } catch (err: any) {
                lastError = err;
                const isNetworkError = err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed');
                // Only retry on the server-side for network errors, to let Docker containers spin up
                if (attempt === maxRetries - 1 || (!isNetworkError && typeof window !== 'undefined')) {
                    throw err;
                }
                const delay = baseDelay * Math.pow(1.5, attempt);
                console.warn(`[API] Network error (${err.cause?.code || err.message}). Retrying in ${Math.round(delay)}ms (Attempt ${attempt + 1}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        if (!response) {
            throw lastError || new Error('Fetch failed completely.');
        }

        logResponse(url, response.status);

        // Interceptor for 401 Unauthorized - Attempt Refresh
        if (response.status === 401 && !endpoint.includes('/refresh') && !endpoint.includes('/login') && typeof window !== 'undefined') {
            try {
                console.log('[API] 401 detected, attempting token refresh...');
                const newToken = await handleTokenRefresh();

                if (newToken) {
                    console.log('[API] Token refresh successful, retrying request...');

                    // Retry original request with new token
                    const retryHeaders = {
                        ...headers,
                        'Authorization': `Bearer ${newToken}`
                    };

                    const retryResponse = await fetch(url, {
                        credentials: 'include',
                        ...options,
                        headers: retryHeaders
                    });

                    // Replace original response with retry response
                    response = retryResponse;
                    logResponse(url, response.status);
                } else if (!endpoint.includes('/matchmaking/leave')) {
                    handleAuthError();
                }
            } catch (refreshErr) {
                console.error('[API] Error during refresh:', refreshErr);
            }
        }

        let data: any = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const json = await response.json();

            // Check if it's a standard response
            if (isStandardApiResponse(json)) {
                if (json.status === 'success') {
                    return {
                        error: null,
                        data: json.data as T,
                        status: response.status,
                        headers: response.headers,
                        message: json.message
                    };
                } else {
                    // It's an error response from the API
                    return {
                        error: json.message || json.error || 'Unknown API error',
                        data: null,
                        status: response.status,
                        headers: response.headers,
                        message: json.message
                    };
                }
            } else {
                // Fallback for non-standard responses
                data = json;
            }
        }

        if (!response.ok) {
            return {
                error: (data && data.error) || `Request failed with status ${response.status}`,
                data: null,
                status: response.status,
                headers: response.headers,
            };
        }

        return {
            error: null,
            data: data as T,
            status: response.status,
            headers: response.headers
        };
    } catch (error) {
        console.error(`API request error (${url}):`, error);
        return {
            error: 'Network error or invalid response',
            data: null,
            status: 500,
        };
    }
}

function isStandardApiResponse(data: any): data is StandardApiResponse {
    return data && typeof data === 'object' && 'status' in data && ('message' in data || 'error' in data);
}
