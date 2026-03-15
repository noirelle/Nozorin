import { Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { activeCalls } from '../call/call.store';

export const register = (io: any, socket: Socket): void => {
    socket.on(SocketEvents.OFFER, (data: { target: string; sdp: unknown }) => {
        const info = activeCalls.get(socket.id);
        if (info?.partner_user_id) {
            socket.to(`user:${info.partner_user_id}`).emit(SocketEvents.OFFER, { sdp: data.sdp, caller_id: socket.id });
        } else {
            socket.to(data.target).emit(SocketEvents.OFFER, { sdp: data.sdp, caller_id: socket.id });
        }
    });

    socket.on(SocketEvents.ANSWER, (data: { target: string; sdp: unknown }) => {
        const info = activeCalls.get(socket.id);
        if (info?.partner_user_id) {
            socket.to(`user:${info.partner_user_id}`).emit(SocketEvents.ANSWER, { sdp: data.sdp, caller_id: socket.id });
        } else {
            socket.to(data.target).emit(SocketEvents.ANSWER, { sdp: data.sdp, caller_id: socket.id });
        }
    });

    socket.on(SocketEvents.ICE_CANDIDATE, (data: { target: string; candidate: unknown }) => {
        const info = activeCalls.get(socket.id);
        if (info?.partner_user_id) {
            socket.to(`user:${info.partner_user_id}`).emit(SocketEvents.ICE_CANDIDATE, { candidate: data.candidate, sender_id: socket.id });
        } else {
            socket.to(data.target).emit(SocketEvents.ICE_CANDIDATE, { candidate: data.candidate, sender_id: socket.id });
        }
    });

    socket.on(SocketEvents.SIGNAL_STRENGTH, (data: { target: string; strength: 'good' | 'fair' | 'poor' | 'reconnecting' }) => {
        socket.to(data.target).emit(SocketEvents.PARTNER_SIGNAL_STRENGTH, { partner_id: socket.id, strength: data.strength });
    });
};
