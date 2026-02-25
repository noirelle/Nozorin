import { io, Socket } from 'socket.io-client';
import { SocketEvents } from './socketEvents';

let _socket: Socket | null = null;
let last_identified_socket_id: string | null = null;

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
            last_identified_socket_id = _socket?.id || null;
            console.log('[Socket] Identified successfully:', last_identified_socket_id);
        });

        _socket.on('disconnect', () => {
            last_identified_socket_id = null;
        });
    }

    if (token !== undefined) {
        const has_changed = (window as any)._lastSocketToken !== token;
        if (has_changed) {
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
    last_identified_socket_id = null;
    (window as any)._lastSocketToken = null;
}

/** Check if the current socket is identified with the server. */
export function isSocketIdentified(): boolean {
    return !!_socket?.connected && last_identified_socket_id === _socket.id;
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
export async function waitForSocketConnection(timeout_ms = 10000): Promise<boolean> {
    const s = getSocketClient();
    if (!s) return false;

    const token = (s.auth as any)?.token;
    const is_identified = last_identified_socket_id === s.id;

    // Fast path: fully ready
    if (s.connected && (!token || is_identified)) {
        return true;
    }

    // Ensure it's active
    if (!s.active) s.connect();

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            cleanup();
            console.warn('[Socket] Connection/Identification timed out after', timeout_ms, 'ms');
            resolve(false);
        }, timeout_ms);

        const cleanup = () => {
            clearTimeout(timeout);
            s.off('connect', on_connect);
            s.off('connect_error', on_error);
            s.off(SocketEvents.IDENTIFY_SUCCESS, on_identify);
            s.off(SocketEvents.TOKEN_UPDATED, on_identify);
            s.off(SocketEvents.AUTH_ERROR, on_error);
        };

        const on_identify = () => {
            cleanup();
            resolve(true);
        };

        const on_connect = () => {
            if (token && last_identified_socket_id !== s.id) {
                // Wait for identification
            } else {
                cleanup();
                resolve(true);
            }
        };

        const on_error = (err: any) => {
            cleanup();
            console.error('[Socket] Connection/Auth error:', err);
            resolve(false);
        };

        // If we are already connected but not identified, we just need to wait for on_identify
        if (!s.connected) {
            s.once('connect', on_connect);
        } else if (token && !is_identified) {
            console.log('[Socket] Waiting for identification on active connection...');
            s.emit(SocketEvents.USER_IDENTIFY, { token });
        }

        s.once('connect_error', on_error);
        s.once(SocketEvents.AUTH_ERROR, on_error);
        s.once(SocketEvents.IDENTIFY_SUCCESS, on_identify);
        s.once(SocketEvents.TOKEN_UPDATED, on_identify);
    });
}
