
import { Socket } from 'socket.io';
import { userMediaState } from './users';

export const handleMediaEvents = (socket: Socket) => {
    // Toggle Mute
    socket.on('toggle-mute', (data: { target: string, isMuted: boolean }) => {
        const { target, isMuted } = data;
        // console.log(`[MEDIA] ${socket.id} toggled mute: ${isMuted}`);

        // Update stored state
        const currentState = userMediaState.get(socket.id) || { isMuted: false };
        userMediaState.set(socket.id, { ...currentState, isMuted });

        socket.to(target).emit('partner-mute-state', {
            partnerId: socket.id,
            isMuted
        });
    });

    // Update Media State
    socket.on('update-media-state', (data: { isMuted?: boolean }) => {
        const currentState = userMediaState.get(socket.id) || { isMuted: false };
        userMediaState.set(socket.id, { ...currentState, ...data });
        // console.log(`[MEDIA] ${socket.id} updated state:`, data);
    });
};
