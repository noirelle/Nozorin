import { io, Socket } from "socket.io-client";

let getSocket: Socket | null = null;

export function socket() {
    if (typeof window === "undefined") return null;

    if (!getSocket) {
        const SOCKET_URL = window.location.origin.replace(":3000", ":3001");

        getSocket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ["websocket"],
            secure: true,
        });
    }

    return getSocket;
}
