import { io, Socket } from "socket.io-client";

let getSocket: Socket | null = null;

export function socket() {
    if (typeof window === "undefined") return null;

    if (!getSocket) {
        const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL!;
        getSocket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ["websocket"],
            secure: SOCKET_URL.startsWith("https"),
        });
    }

    return getSocket;
}
