import { Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { logger } from '../../core/logger';

export const register = (_io: unknown, socket: Socket): void => {
    socket.on(SocketEvents.SEND_MESSAGE, (data: { target: string; message: string }) => {
        const { target, message } = data;
        logger.debug({ socketId: socket.id, target }, '[CHAT] Message sent');
        socket.to(target).emit(SocketEvents.RECEIVE_MESSAGE, {
            sender_id: socket.id,
            message,
            timestamp: new Date().toISOString(),
        });
    });
};
