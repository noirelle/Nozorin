import { Socket } from 'socket.io';
import { SocketEvents } from '../socket.events';
import { userMediaState } from '../store/socket.store';

export const handleMediaEvents = (socket: Socket) => {
    socket.on(SocketEvents.TOGGLE_MUTE, (data: { target: string; isMuted: boolean }) => {
        const { target, isMuted } = data;

        const currentState = userMediaState.get(socket.id) || { isMuted: false };
        userMediaState.set(socket.id, { ...currentState, isMuted });

        socket.to(target).emit(SocketEvents.PARTNER_MUTE_STATE, {
            partnerId: socket.id,
            isMuted,
        });
    });

    socket.on(SocketEvents.UPDATE_MEDIA_STATE, (data: { isMuted?: boolean }) => {
        const currentState = userMediaState.get(socket.id) || { isMuted: false };
        userMediaState.set(socket.id, { ...currentState, ...data });
    });
};
