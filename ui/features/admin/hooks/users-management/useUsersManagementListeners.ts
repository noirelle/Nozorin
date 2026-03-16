'use client';

import { useCallback, useEffect } from 'react';
import { useSocketEvent, SocketEvents, getSocketClient } from '@/lib/socket';
import { UseUsersManagementStateReturn } from '../types';
import { useAdminStore } from '@/stores/useAdminStore';

interface UseUsersManagementListenersProps {
    setUsers: UseUsersManagementStateReturn['setUsers'];
}

export const useUsersManagementListeners = ({ setUsers }: UseUsersManagementListenersProps) => {
    const adminToken = useAdminStore(state => state.adminToken);

    // 1. Join Admin Room on connection
    useEffect(() => {
        if (!adminToken) return;

        const socket = getSocketClient(adminToken);
        if (!socket) return;

        const handleConnect = () => {
            socket.emit(SocketEvents.JOIN_ADMIN_ROOM);
        };

        if (socket.connected) {
            handleConnect();
        }

        socket.on('connect', handleConnect);
        return () => {
            socket.off('connect', handleConnect);
        };
    }, [adminToken]);

    // 2. Listen for User Activity
    const handleUserActive = useCallback((data: { user_id: string; last_active_at: number }) => {
        setUsers(currentUsers => {
            const userIndex = currentUsers.findIndex(u => u.id === data.user_id);
            if (userIndex === -1) return currentUsers;

            const updatedUsers = [...currentUsers];
            updatedUsers[userIndex] = {
                ...updatedUsers[userIndex],
                last_active_at: data.last_active_at
            };

            // Re-sort: Online users first (by last_active_at DESC)
            return updatedUsers.sort((a, b) => b.last_active_at - a.last_active_at);
        });
    }, [setUsers]);

    useSocketEvent(SocketEvents.ADMIN_USER_ACTIVE as any, handleUserActive);
};
