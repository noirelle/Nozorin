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

    // 1. Join Admin Room on connection & identification
    useEffect(() => {
        if (!adminToken) return;

        const socket = getSocketClient(adminToken);
        if (!socket) return;

        const handleJoin = () => {
            socket.emit(SocketEvents.JOIN_ADMIN_ROOM);
        };

        // If already connected and likely identified
        if (socket.connected) {
            handleJoin();
        }

        socket.on('connect', handleJoin);
        socket.on(SocketEvents.IDENTIFY_SUCCESS, handleJoin);

        return () => {
            socket.off('connect', handleJoin);
            socket.off(SocketEvents.IDENTIFY_SUCCESS, handleJoin);
        };
    }, [adminToken]);

    // 2. Listen for User Activity
    const handleUserActive = useCallback((data: { user_id: string; last_active_at: number; is_online: boolean }) => {
        setUsers(currentUsers => {
            const userIndex = currentUsers.findIndex(u => u.id === data.user_id);
            if (userIndex === -1) return currentUsers;

            const updatedUsers = [...currentUsers];
            updatedUsers[userIndex] = {
                ...updatedUsers[userIndex],
                last_active_at: data.last_active_at,
                is_online: data.is_online
            };

            // Re-sort: Online users first (by last_active_at DESC)
            return updatedUsers.sort((a, b) => b.last_active_at - a.last_active_at);
        });
    }, [setUsers]);

    useSocketEvent(SocketEvents.ADMIN_USER_ACTIVE as any, handleUserActive);
};
