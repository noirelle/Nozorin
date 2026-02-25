import { Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { userMediaState } from './media.store';
import { logger } from '../../core/logger';

export const register = (_io: unknown, socket: Socket): void => {
    // Initialize media state on connect
    userMediaState.set(socket.id, { is_muted: false });

    socket.on(SocketEvents.TOGGLE_MUTE, (data: { target: string; is_muted: boolean }) => {
        const { target, is_muted: isMuted } = data;
        const current = userMediaState.get(socket.id) || { is_muted: false };
        userMediaState.set(socket.id, { ...current, is_muted: isMuted });
        logger.debug({ socketId: socket.id, is_muted: isMuted }, '[MEDIA] Mute toggled');
        socket.to(target).emit(SocketEvents.PARTNER_MUTE_STATE, { partner_id: socket.id, is_muted: isMuted });
    });

    socket.on(SocketEvents.UPDATE_MEDIA_STATE, (data: { is_muted?: boolean }) => {
        const current = userMediaState.get(socket.id) || { is_muted: false };
        userMediaState.set(socket.id, { ...current, ...data });
    });
};
