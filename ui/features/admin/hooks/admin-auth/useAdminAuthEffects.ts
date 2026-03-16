import { useEffect } from 'react';
import { useAdminStore } from '@/stores/useAdminStore';
import { connectSocket, disconnectSocket, updateSocketAuth } from '@/lib/socket';

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

    // 2. Manage Admin Socket Connection
    useEffect(() => {
        if (isAdminAuthenticated && adminToken) {
            updateSocketAuth(adminToken);
            connectSocket();
        }

        return () => {
            // Only disconnect if we are actually unmounting the admin context 
            // or if authentication is lost.
            if (!isAdminAuthenticated) {
                disconnectSocket();
            }
        };
    }, [isAdminAuthenticated, adminToken]);

    // 3. Automatic token refresh logic is now handled reactively in apiRequest interceptors
};
