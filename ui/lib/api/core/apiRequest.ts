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

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    logRequest(url, options);

    try {
        const response = await fetch(url, {
            credentials: 'include',
            ...options,
            headers,
        });

        logResponse(url, response.status);


        let data: any = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const json = await response.json();

            // Check if it's a standard response
            if (isStandardApiResponse(json)) {
                if (json.status === 'success') {
                    data = json.data;
                    return {
                        error: null,
                        data: data as T,
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
                // Fallback for non-standard responses (e.g. legacy or 3rd party)
                data = json;
            }
        }

        if (!response.ok) {
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

                        let retryData: any = null;
                        let retryMessage: string | undefined;

                        const retryContentType = retryResponse.headers.get('content-type');
                        if (retryContentType && retryContentType.includes('application/json')) {
                            const retryJson = await retryResponse.json();
                            if (isStandardApiResponse(retryJson)) {
                                if (retryJson.status === 'success') {
                                    retryData = retryJson.data;
                                    retryMessage = retryJson.message;
                                } else {
                                    return {
                                        error: retryJson.message || retryJson.error || 'Unknown API error',
                                        data: null,
                                        status: retryResponse.status,
                                        headers: retryResponse.headers,
                                        message: retryJson.message
                                    };
                                }
                            } else {
                                retryData = retryJson;
                            }
                        }

                        if (retryResponse.ok) {
                            return {
                                error: null,
                                data: retryData as T,
                                status: retryResponse.status,
                                headers: retryResponse.headers,
                                message: retryMessage
                            };
                        }
                    } else if (!endpoint.includes('/matchmaking/leave')) {
                        handleAuthError();
                    }
                } catch (refreshErr) {
                    console.error('[API] Error during refresh:', refreshErr);
                }
            }

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
