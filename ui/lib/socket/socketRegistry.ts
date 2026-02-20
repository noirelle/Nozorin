'use client';

import { useEffect } from 'react';
import { getSocketClient } from './socketClient';
import { SocketEventName } from './socketEvents';

/**
 * Declaratively subscribe to a socket event.
 * Registers the handler on mount and cleans it up on unmount or when
 * dependencies change. The component never needs a raw Socket reference.
 */
export function useSocketEvent<T = unknown>(
    event: SocketEventName,
    handler: (data: T) => void
): void {
    useEffect(() => {
        const socket = getSocketClient();
        if (!socket) return;

        socket.on(event, handler as (...args: unknown[]) => void);

        return () => {
            socket.off(event, handler as (...args: unknown[]) => void);
        };
    }, [event, handler]);
}
