import { Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { userMediaState } from './media.store';
import { logger } from '../../core/logger';

export const register = (_io: unknown, socket: Socket): void => {
    // Initialize media state on connect
    userMediaState.set(socket.id, { isMuted: false });

    socket.on(SocketEvents.TOGGLE_MUTE, (data: { target: string; isMuted: boolean }) => {
        const { target, isMuted } = data;
        const current = userMediaState.get(socket.id) || { isMuted: false };
        userMediaState.set(socket.id, { ...current, isMuted });
        logger.debug({ socketId: socket.id, isMuted }, '[MEDIA] Mute toggled');
        socket.to(target).emit(SocketEvents.PARTNER_MUTE_STATE, { partnerId: socket.id, isMuted });
    });

    socket.on(SocketEvents.UPDATE_MEDIA_STATE, (data: { isMuted?: boolean }) => {
        const current = userMediaState.get(socket.id) || { isMuted: false };
        userMediaState.set(socket.id, { ...current, ...data });
    });
};
