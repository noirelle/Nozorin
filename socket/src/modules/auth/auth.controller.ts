import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { authService } from './auth.service';

export const register = (io: Server, socket: Socket): void => {
    socket.on(SocketEvents.USER_IDENTIFY, async (data: { token: string }) => {
        await authService.identify(io, socket, data.token);
    });

    socket.on(SocketEvents.UPDATE_TOKEN, async (data: { token: string }) => {
        await authService.updateToken(socket, data.token);
    });

    socket.on(SocketEvents.FORCE_RECONNECT, async (data: { token: string }) => {
        await authService.forceReconnect(io, socket, data.token);
    });
};
