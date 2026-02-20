import { io, Socket } from 'socket.io-client';

let _socket: Socket | null = null;

/**
 * Returns the shared Socket.io instance, creating it on first call.
 * Token is only used during initial construction; use updateSocketAuth to
 * change it for subsequent reconnects.
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
    } else if (token !== undefined) {
        _socket.auth = token ? { token } : {};
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
}

/**
 * Update auth credentials on the existing socket instance.
 * The new token will be picked up on the next reconnect.
 */
export function updateSocketAuth(token: string | null): void {
    if (_socket) {
        _socket.auth = token ? { token } : {};
    }
}
