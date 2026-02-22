import { io, Socket } from 'socket.io-client';

let _socket: Socket | null = null;
let lastIdentifiedSocketId: string | null = null;

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

        _socket.on('identify-success', () => {
            lastIdentifiedSocketId = _socket?.id || null;
            console.log('[Socket] Identified successfully:', lastIdentifiedSocketId);
        });

        _socket.on('disconnect', () => {
            lastIdentifiedSocketId = null;
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
    lastIdentifiedSocketId = null;
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

/**
 * Returns a promise that resolves when the socket is connected (and identified if token exists).
 * If already connected and identified, resolves immediately.
 */
export async function waitForSocketConnection(timeoutMs = 10000): Promise<boolean> {
    const s = getSocketClient();
    if (!s) return false;

    const hasToken = s.auth && (s.auth as any).token;

    // Fast path: already connected and (if needed) identified
    if (s.connected) {
        if (!hasToken || lastIdentifiedSocketId === s.id) {
            return true;
        }
        console.log('[Socket] Connected but identification pending, waiting...');
    }

    // Ensure it's trying to connect
    if (!s.active) s.connect();

    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            s.off('connect', onConnect);
            s.off('connect_error', onError);
            s.off('identify-success', onIdentify);
            console.warn('[Socket] Connection/Identification timed out after', timeoutMs, 'ms');
            resolve(false);
        }, timeoutMs);

        const onIdentify = () => {
            clearTimeout(timeout);
            s.off('connect', onConnect);
            s.off('connect_error', onError);
            resolve(true);
        };

        const onConnect = () => {
            // If we have a token, we must also wait for identify-success (if it hasn't happened yet)
            if (hasToken && lastIdentifiedSocketId !== s.id) {
                s.once('identify-success', onIdentify);
            } else {
                clearTimeout(timeout);
                s.off('connect_error', onError);
                s.off('identify-success', onIdentify);
                resolve(true);
            }
        };

        const onError = (err: any) => {
            clearTimeout(timeout);
            s.off('connect', onConnect);
            s.off('identify-success', onIdentify);
            console.error('[Socket] Connection error:', err);
            resolve(false);
        };

        s.once('connect', onConnect);
        s.once('connect_error', onError);
    });
}
