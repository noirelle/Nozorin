'use client';

import { useCallback, useEffect } from 'react';
import { useSocketEvent, SocketEvents, getSocketClient } from '@/lib/socket';
import { UseUsersManagementStateReturn } from '../types';
import { useAdminStore } from '@/stores/useAdminStore';

interface UseUsersManagementListenersProps {
    setUsers: UseUsersManagementStateReturn['setUsers'];
    fetchUsers: (force?: boolean) => Promise<void>;
}

export const useUsersManagementListeners = ({ setUsers, fetchUsers }: UseUsersManagementListenersProps) => {
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
    const handleUserActive = useCallback((data: { 
        user_id: string; 
        last_active_at: number; 
        is_online: boolean;
        profile?: any;
    }) => {
        setUsers(currentUsers => {
            const userIndex = currentUsers.findIndex(u => u.id === data.user_id);
            
            // If user not found and they are coming online, append them if we have profile data
            if (userIndex === -1) {
                if (data.is_online && data.profile) {
                    const newUser = {
                        ...data.profile,
                        is_online: true,
                        last_active_at: data.last_active_at,
                        friendCount: data.profile.friendCount || 0,
                        historyCount: data.profile.historyCount || 0
                    };
                    return [newUser, ...currentUsers].slice(0, 50); // Keep local list manageable
                }
                return currentUsers;
            }

            const updatedUsers = [...currentUsers];
            updatedUsers[userIndex] = {
                ...updatedUsers[userIndex],
                last_active_at: data.last_active_at,
                is_online: data.is_online
            };

            // Re-sort: Online users first, then by last_active_at DESC
            return updatedUsers.sort((a, b) => {
                if (a.is_online === b.is_online) {
                    return b.last_active_at - a.last_active_at;
                }
                return a.is_online ? -1 : 1;
            });
        });
    }, [setUsers]);

    useSocketEvent(SocketEvents.ADMIN_USER_ACTIVE as any, handleUserActive);

    // 3. Periodic refetch to reconcile against server-authoritative state
    useEffect(() => {
        const interval = setInterval(() => {
            fetchUsers(true);
        }, 30 * 1000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [fetchUsers]);

    // 4. Immediate refetch on socket reconnect (catches missed events during disconnection)
    useEffect(() => {
        if (!adminToken) return;

        const socket = getSocketClient(adminToken);
        if (!socket) return;

        const handleReconnectRefetch = () => {
            fetchUsers(true);
        };

        socket.on('connect', handleReconnectRefetch);

        return () => {
            socket.off('connect', handleReconnectRefetch);
        };
    }, [adminToken, fetchUsers]);
};
