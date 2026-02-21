import { Socket } from 'socket.io';
import { SocketEvents } from '../socket.events';

export const handleSignalingEvents = (socket: Socket) => {
    socket.on(SocketEvents.OFFER, (data) => {
        const { target, sdp } = data;
        socket.to(target).emit(SocketEvents.OFFER, { sdp, callerId: socket.id });
    });

    socket.on(SocketEvents.ANSWER, (data) => {
        const { target, sdp } = data;
        socket.to(target).emit(SocketEvents.ANSWER, { sdp, callerId: socket.id });
    });

    socket.on(SocketEvents.ICE_CANDIDATE, (data) => {
        const { target, candidate } = data;
        socket.to(target).emit(SocketEvents.ICE_CANDIDATE, { candidate, senderId: socket.id });
    });

    socket.on(SocketEvents.SIGNAL_STRENGTH, (data: { target: string; strength: 'good' | 'fair' | 'poor' | 'reconnecting' }) => {
        const { target, strength } = data;
        socket.to(target).emit(SocketEvents.PARTNER_SIGNAL_STRENGTH, {
            partnerId: socket.id,
            strength,
        });
    });
};
