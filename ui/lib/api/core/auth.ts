import { useAuthStore } from '../../../stores/useAuthStore';

// Module-level promise to deduplicate refresh requests
let refreshPromise: Promise<string | null> | null = null;

export const handleTokenRefresh = async (): Promise<string | null> => {
    // Deduplicate refresh requests
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
            if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                const newToken = refreshData.data?.token || refreshData.token || null;

                if (newToken) {
                    // Update store
                    useAuthStore.getState().setToken(newToken);
                }

                return newToken;
            }
            return null;
        } catch (e) {
            console.error('[API] Refresh request failed:', e);
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

export const handleAuthError = () => {
    console.warn('[API] Refresh failed, redirecting to login');
    useAuthStore.getState().logout();
};
