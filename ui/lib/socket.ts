import { io, Socket } from "socket.io-client";

let getSocket: Socket | null = null;

export function socket(token?: string | null) {
    if (typeof window === "undefined") return null;

    if (!getSocket) {
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!;
        getSocket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ["websocket"],
            secure: SOCKET_URL.startsWith("https"),
            auth: token ? { token } : {}, // Initial auth
        });
    } else if (token !== undefined) {
        // Update auth for existing socket (reconnection will use this)
        // If token is null, we send empty object or null
        getSocket.auth = token ? { token } : {};
    }

    return getSocket;
}
