import { useAuthStore } from '../../../stores/useAuthStore';
import { useAdminStore } from '../../../stores/useAdminStore';

// Module-level promises to deduplicate refresh requests
let refreshPromise: Promise<{ token: string | null; status: number } | null> | null = null;
let adminRefreshPromise: Promise<{ token: string | null; status: number } | null> | null = null;

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

export const handleAdminTokenRefresh = async (): Promise<{ token: string | null; status: number } | null> => {
    // Deduplicate refresh requests
    if (adminRefreshPromise) return adminRefreshPromise;

    adminRefreshPromise = (async () => {
        try {
            const refreshRes = await fetch('/api/admin/refresh', { method: 'POST' });
            const status = refreshRes.status;

            if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                const newToken = refreshData.data?.token || refreshData.token || null;

                if (newToken) {
                    // Update admin store
                    useAdminStore.getState().setAdminToken(newToken);
                }

                return { token: newToken, status };
            }
            return { token: null, status };
        } catch (e) {
            console.error('[API] Admin refresh request failed:', e);
            return { token: null, status: 0 };
        } finally {
            adminRefreshPromise = null;
        }
    })();

    return adminRefreshPromise;
};

export const handleAuthError = (status?: number, isAdmin: boolean = false) => {
    // Only logout on definitive auth failures (401 or 403)
    // Avoid logging out on transient 5xx or network errors (status 0)
    if (status === 401 || status === 403) {
        console.warn(`[API] ${isAdmin ? 'Admin ' : ''}Auth error (${status}), redirecting to login`);
        if (isAdmin) {
            useAdminStore.getState().adminLogout();
        } else {
            useAuthStore.getState().logout();
        }
    } else {
        console.warn(`[API] Transient error (${status || 'unknown'}), skipping logout to preserve session`);
    }
};
