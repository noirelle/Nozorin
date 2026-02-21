import { Socket } from 'socket.io';
import { SocketEvents } from '../socket.events';

export const handleChatEvents = (socket: Socket) => {
    socket.on(SocketEvents.SEND_MESSAGE, (data: { target: string; message: string }) => {
        const { target, message } = data;

        socket.to(target).emit(SocketEvents.RECEIVE_MESSAGE, {
            senderId: socket.id,
            message,
            timestamp: new Date().toISOString(),
        });
    });
};
