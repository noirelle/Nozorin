import { useEffect } from 'react';
import { useAdminStore } from '@/stores/useAdminStore';

export const useAdminAuthEffects = () => {
    const adminToken = useAdminStore(state => state.adminToken);
    const isAdminAuthenticated = useAdminStore(state => state.isAdminAuthenticated);
    const isAdminChecked = useAdminStore(state => state.isAdminChecked);
    const setAdminChecked = useAdminStore(state => state.setAdminChecked);

    // 1. Initial mounting check
    useEffect(() => {
        if (!isAdminChecked) {
            setAdminChecked(true);
        }
    }, [isAdminChecked, setAdminChecked]);

    // 2. Automatic token refresh logic is now handled reactively in apiRequest interceptors
};
