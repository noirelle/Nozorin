export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    status: number;
    headers?: Headers;
}

/**
 * Gets the base API URL depending on the environment (server-side vs client-side).
 * - Server-side: Prioritizes INTERNAL_API_URL for container-to-container communication.
 * - Client-side: Uses NEXT_PUBLIC_API_URL for browser-to-server communication.
 */
export const getBaseApiUrl = (): string => {
    // If we're on the server
    if (typeof window === 'undefined') {
        // 1. Prioritize explicit internal URL
        if (process.env.INTERNAL_API_URL) return process.env.INTERNAL_API_URL;

        // 2. If NEXT_PUBLIC_API_URL is set and is NOT localhost, use it (likely production)
        const publicUrl = process.env.NEXT_PUBLIC_API_URL;
        if (publicUrl && !publicUrl.includes('localhost') && !publicUrl.includes('127.0.0.1')) {
            return publicUrl;
        }

        // 3. Fallback: In Docker Compose, the API service is reachable at http://api:3001
        return 'http://api:3001';
    }

    // If we're on the client
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

// Module-level promise to deduplicate refresh requests
let refreshPromise: Promise<string | null> | null = null;

export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    // If it's a relative URL, we let the browser handle it relative to the origin.
    // If it's an absolute path without a domain, and we're on the client, it stays the same.
    // If we're on the server and it's relative, we should likely prefix it with the base URL.

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

    try {
        const response = await fetch(url, {
            credentials: 'include',
            ...options,
            headers,
        });

        let data: any = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        }

        if (!response.ok) {
            // Interceptor for 401 Unauthorized - Attempt Refresh
            if (response.status === 401 && !endpoint.includes('/refresh') && !endpoint.includes('/login') && typeof window !== 'undefined') {
                try {
                    console.log('[API] 401 detected, attempting token refresh...');

                    let newToken: string | null = null;

                    // Deduplicate refresh requests
                    if (!refreshPromise) {
                        refreshPromise = (async () => {
                            try {
                                const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
                                if (refreshRes.ok) {
                                    const refreshData = await refreshRes.json();
                                    return refreshData.token || null;
                                }
                                return null;
                            } catch (e) {
                                console.error('[API] Refresh request failed:', e);
                                return null;
                            } finally {
                                // Keep promise briefly to allow parallel requests to share it, but clear it eventually? 
                                // Actually better to clear it immediately after resolution so subsequent 401s (e.g. 1 hour later) can refresh again.
                                refreshPromise = null;
                            }
                        })();
                    }

                    newToken = await refreshPromise;

                    if (newToken) {
                        console.log('[API] Token refresh successful, retrying request...');
                        // Update store
                        const { useAuthStore } = await import('../stores/useAuthStore');
                        useAuthStore.getState().setToken(newToken);

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

                        // Handle retry response
                        let retryData: any = null;
                        const retryContentType = retryResponse.headers.get('content-type');
                        if (retryContentType && retryContentType.includes('application/json')) {
                            retryData = await retryResponse.json();
                        }

                        if (retryResponse.ok) {
                            return {
                                error: null,
                                data: retryData as T,
                                status: retryResponse.status,
                                headers: retryResponse.headers
                            };
                        }
                    } else {
                        console.warn('[API] Refresh failed, redirecting to login');
                        // Optional: trigger logout
                        const { useAuthStore } = await import('../stores/useAuthStore');
                        useAuthStore.getState().logout();
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

export const api = {
    get: <T>(endpoint: string, options: RequestInit = {}) =>
        apiRequest<T>(endpoint, { ...options, method: 'GET' }),

    post: <T, R = any>(endpoint: string, body: R, options: RequestInit = {}) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(body),
        }),

    put: <T, R = any>(endpoint: string, body: R, options: RequestInit = {}) =>
        apiRequest<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
        }),

    delete: <T>(endpoint: string, options: RequestInit = {}) =>
        apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
