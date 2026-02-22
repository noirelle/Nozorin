import { io, Socket } from 'socket.io-client';
import { SocketEvents } from './socketEvents';

let _socket: Socket | null = null;
let lastIdentifiedSocketId: string | null = null;

/**
 * Returns the shared Socket.io instance, creating it on first call.
 */
export function getSocketClient(token?: string | null): Socket | null {
    if (typeof window === 'undefined') return null;

    if (!_socket) {
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!;
        _socket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ['websocket'],
            secure: SOCKET_URL.startsWith('https'),
            auth: token ? { token } : {},
        });

        _socket.on(SocketEvents.IDENTIFY_SUCCESS, () => {
            lastIdentifiedSocketId = _socket?.id || null;
            console.log('[Socket] Identified successfully:', lastIdentifiedSocketId);
        });

        _socket.on('disconnect', () => {
            lastIdentifiedSocketId = null;
        });
    }

    if (token !== undefined) {
        const hasChanged = (window as any)._lastSocketToken !== token;
        if (hasChanged) {
            (window as any)._lastSocketToken = token;
            _socket.auth = token ? { token } : {};

            // If already connected, we must proactively update/identify
            if (_socket.connected && token) {
                console.log('[Socket] Token updated on active connection, re-identifying...');
                _socket.emit(SocketEvents.USER_IDENTIFY, { token });
            }
        }
    }

    return _socket;
}

/** Explicitly connect the shared socket. */
export function connectSocket(): void {
    const s = getSocketClient();
    if (s && !s.connected) s.connect();
}

/** Explicitly disconnect the shared socket. */
export function disconnectSocket(): void {
    _socket?.disconnect();
    lastIdentifiedSocketId = null;
    (window as any)._lastSocketToken = null;
}

/** Check if the current socket is identified with the server. */
export function isSocketIdentified(): boolean {
    return !!_socket?.connected && lastIdentifiedSocketId === _socket.id;
}

/**
 * Update auth credentials on the existing socket instance.
 */
export function updateSocketAuth(token: string | null): void {
    getSocketClient(token);
}

/**
 * Returns a promise that resolves when the socket is connected (and identified if token exists).
 */
export async function waitForSocketConnection(timeoutMs = 10000): Promise<boolean> {
    const s = getSocketClient();
    if (!s) return false;

    const token = (s.auth as any)?.token;
    const isIdentified = lastIdentifiedSocketId === s.id;

    // Fast path: fully ready
    if (s.connected && (!token || isIdentified)) {
        return true;
    }

    // Ensure it's active
    if (!s.active) s.connect();

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            cleanup();
            console.warn('[Socket] Connection/Identification timed out after', timeoutMs, 'ms');
            resolve(false);
        }, timeoutMs);

        const cleanup = () => {
            clearTimeout(timeout);
            s.off('connect', onConnect);
            s.off('connect_error', onError);
            s.off(SocketEvents.IDENTIFY_SUCCESS, onIdentify);
            s.off(SocketEvents.TOKEN_UPDATED, onIdentify);
            s.off(SocketEvents.AUTH_ERROR, onError);
        };

        const onIdentify = () => {
            cleanup();
            resolve(true);
        };

        const onConnect = () => {
            if (token && lastIdentifiedSocketId !== s.id) {
                // Wait for identification
            } else {
                cleanup();
                resolve(true);
            }
        };

        const onError = (err: any) => {
            cleanup();
            console.error('[Socket] Connection/Auth error:', err);
            resolve(false);
        };

        // If we are already connected but not identified, we just need to wait for onIdentify
        if (!s.connected) {
            s.once('connect', onConnect);
        } else if (token && !isIdentified) {
            console.log('[Socket] Waiting for identification on active connection...');
            s.emit(SocketEvents.USER_IDENTIFY, { token });
        }

        s.once('connect_error', onError);
        s.once(SocketEvents.AUTH_ERROR, onError);
        s.once(SocketEvents.IDENTIFY_SUCCESS, onIdentify);
        s.once(SocketEvents.TOKEN_UPDATED, onIdentify);
    });
}
