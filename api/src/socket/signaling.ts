
import { Socket } from 'socket.io';

export const handleSignalingEvents = (socket: Socket) => {
    // Offer
    socket.on('offer', (data) => {
        const { target, sdp } = data;
        // console.log(`[SIGNAL] Forwarding offer from ${socket.id} to ${target}`);
        socket.to(target).emit('offer', { sdp, callerId: socket.id });
    });

    // Answer
    socket.on('answer', (data) => {
        const { target, sdp } = data;
        // console.log(`[SIGNAL] Forwarding answer from ${socket.id} to ${target}`);
        socket.to(target).emit('answer', { sdp, callerId: socket.id });
    });

    // ICE Candidate
    socket.on('ice-candidate', (data) => {
        const { target, candidate } = data;
        // console.log(`[SIGNAL] Forwarding ICE candidate from ${socket.id} to ${target}`);
        socket.to(target).emit('ice-candidate', { candidate, senderId: socket.id });
    });

    // Signal Strength
    socket.on('signal-strength', (data: { target: string, strength: 'good' | 'fair' | 'poor' | 'reconnecting' }) => {
        const { target, strength } = data;
        socket.to(target).emit('partner-signal-strength', {
            partnerId: socket.id,
            strength
        });
    });
};
