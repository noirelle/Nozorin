import { useAuthStore } from '../../../stores/useAuthStore';

// Module-level promise to deduplicate refresh requests
let refreshPromise: Promise<{ token: string | null; status: number } | null> | null = null;

export const handleTokenRefresh = async (): Promise<{ token: string | null; status: number } | null> => {
    // Deduplicate refresh requests
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
            const status = refreshRes.status;

            if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                const newToken = refreshData.data?.token || refreshData.token || null;

                if (newToken) {
                    // Update store
                    useAuthStore.getState().setToken(newToken);
                }

                return { token: newToken, status };
            }
            return { token: null, status };
        } catch (e) {
            console.error('[API] Refresh request failed:', e);
            return { token: null, status: 0 };
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

export const handleAuthError = (status?: number) => {
    // Only logout on definitive auth failures (401 or 403)
    // Avoid logging out on transient 5xx or network errors (status 0)
    if (status === 401 || status === 403) {
        console.warn(`[API] Auth error (${status}), redirecting to login`);
        useAuthStore.getState().logout();
    } else {
        console.warn(`[API] Transient error (${status || 'unknown'}), skipping logout to preserve session`);
    }
};
