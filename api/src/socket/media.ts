
import { Socket } from 'socket.io';
import { userMediaState } from './users';

export const handleMediaEvents = (socket: Socket) => {
    // Toggle Mute
    socket.on('toggle-mute', (data: { target: string, isMuted: boolean }) => {
        const { target, isMuted } = data;
        // console.log(`[MEDIA] ${socket.id} toggled mute: ${isMuted}`);

        // Update stored state
        const currentState = userMediaState.get(socket.id) || { isMuted: false, isCameraOff: false };
        userMediaState.set(socket.id, { ...currentState, isMuted });

        socket.to(target).emit('partner-mute-state', {
            partnerId: socket.id,
            isMuted
        });
    });

    // Toggle Camera
    socket.on('toggle-camera', (data: { target: string, isCameraOff: boolean }) => {
        const { target, isCameraOff } = data;
        // console.log(`[MEDIA] ${socket.id} toggled camera: ${isCameraOff}`);

        // Update stored state
        const currentState = userMediaState.get(socket.id) || { isMuted: false, isCameraOff: false };
        userMediaState.set(socket.id, { ...currentState, isCameraOff });

        socket.to(target).emit('partner-camera-state', {
            partnerId: socket.id,
            isCameraOff
        });
    });

    // Update Media State
    socket.on('update-media-state', (data: { isMuted?: boolean, isCameraOff?: boolean }) => {
        const currentState = userMediaState.get(socket.id) || { isMuted: false, isCameraOff: false };
        userMediaState.set(socket.id, { ...currentState, ...data });
        // console.log(`[MEDIA] ${socket.id} updated state:`, data);
    });
};
