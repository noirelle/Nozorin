
import { Socket } from 'socket.io';

export const handleChatEvents = (socket: Socket) => {
    // Text Chat Message
    socket.on('send-message', (data: { target: string; message: string }) => {
        const { target, message } = data;

        socket.to(target).emit('receive-message', {
            senderId: socket.id,
            message,
            timestamp: new Date().toISOString()
        });
    });
};
