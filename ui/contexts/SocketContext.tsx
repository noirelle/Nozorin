'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getSocketClient, disconnectSocket } from '@/lib/socket/core/socketClient';
import { SocketEvents } from '@/lib/socket/core/socketEvents';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    isIdentified: boolean;
    error: Error | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { token, isChecked } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isIdentified, setIsIdentified] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Only attempt socket connection once auth has been verified
        if (!isChecked) return;

        // Clean up any existing connection if token is cleared (logout)
        if (!token) {
            disconnectSocket();
            setSocket(null);
            setIsConnected(false);
            setIsIdentified(false);
            return;
        }

        // We have a token, initialize or update the socket
        const s = getSocketClient(token);
        if (!s) return;

        setSocket(s);

        const onConnect = () => {
            setIsConnected(true);
            setError(null);
        };

        const onDisconnect = () => {
            setIsConnected(false);
            setIsIdentified(false);
        };

        const onIdentifySuccess = () => {
            setIsIdentified(true);
            setError(null);
        };

        const onConnectError = (err: Error) => {
            setError(err);
            setIsConnected(false);
            setIsIdentified(false);
        };

        s.on('connect', onConnect);
        s.on('disconnect', onDisconnect);
        s.on('connect_error', onConnectError);
        s.on(SocketEvents.IDENTIFY_SUCCESS, onIdentifySuccess);
        s.on(SocketEvents.AUTH_ERROR, onConnectError);

        // Sync initial state
        setIsConnected(s.connected);

        // Connect if not already connecting
        if (!s.connected && !s.active) {
            s.connect();
        }

        return () => {
            s.off('connect', onConnect);
            s.off('disconnect', onDisconnect);
            s.off('connect_error', onConnectError);
            s.off(SocketEvents.IDENTIFY_SUCCESS, onIdentifySuccess);
            s.off(SocketEvents.AUTH_ERROR, onConnectError);
        };
    }, [token, isChecked]);

    return (
        <SocketContext.Provider value={{ socket, isConnected, isIdentified, error }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
