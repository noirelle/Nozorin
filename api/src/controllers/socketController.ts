
import { Socket, Server } from 'socket.io';
import { getGeoInfo } from '../utils/geo';
import { User } from '../types';

let chatQueue: User[] = [];
let videoQueue: User[] = [];
let activeCalls = new Map<string, string>(); // socketId -> partnerId
let userMediaState = new Map<string, { isMuted: boolean, isCameraOff: boolean }>(); // socketId -> media state

// Helper to remove user from all queues
const removeUserFromQueues = (socketId: string) => {
    chatQueue = chatQueue.filter((u) => u.id !== socketId);
    videoQueue = videoQueue.filter((u) => u.id !== socketId);
};

export const handleSocketConnection = (io: Server, socket: Socket) => {
    console.log(`[CONNECT] User connected: ${socket.id}`);

    const clientIp =
        socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    const geo = getGeoInfo(
        Array.isArray(clientIp) ? clientIp[0] : clientIp
    );
    const country = geo.name;
    const countryCode = geo.code;

    console.log(`[CONNECT] ${socket.id} from ${country} (${countryCode})`);

    // Initialize user media state (unmuted, camera on by default)
    userMediaState.set(socket.id, { isMuted: false, isCameraOff: false });

    // JOIN QUEUE (Searching for match)
    socket.on('find-match', (data: { mode: 'chat' | 'video' }) => {
        const mode = data.mode;

        // Ensure not already in a call - if so, end it
        const existingPartnerId = activeCalls.get(socket.id);
        if (existingPartnerId) {
            console.log(`[MATCH] Ending existing call with ${existingPartnerId} before searching`);
            io.to(existingPartnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(existingPartnerId);
            activeCalls.delete(socket.id);
        }

        removeUserFromQueues(socket.id); // Ensure not in multiple queues

        console.log(`[MATCH] User ${socket.id} looking for ${mode} match`);

        let targetQueue = mode === 'chat' ? chatQueue : videoQueue;

        if (targetQueue.length > 0) {
            // Found someone waiting!
            const partner = targetQueue.shift(); // Get the first person waiting

            if (partner && partner.id !== socket.id) {
                const roomId = `room-${partner.id}-${socket.id}`;

                // Track the active connection
                activeCalls.set(socket.id, partner.id);
                activeCalls.set(partner.id, socket.id);

                // Join both users to the room
                socket.join(roomId);

                console.log(`[MATCH] ✓ Matched ${socket.id} with ${partner.id} in ${mode} mode`);

                // Get media states
                // waitingUser (partner) and joiningUser (socket)
                const joiningUserMediaState = userMediaState.get(socket.id) || { isMuted: false, isCameraOff: false };
                const waitingUserMediaState = userMediaState.get(partner.id) || { isMuted: false, isCameraOff: false };

                // Notify Waiting User - they will be the offerer
                io.to(partner.id).emit('match-found', {
                    role: 'offerer', // Initiator of WebRTC offer
                    partnerId: socket.id,
                    partnerCountry: country,
                    partnerCountryCode: countryCode,
                    partnerIsMuted: joiningUserMediaState.isMuted,
                    partnerIsCameraOff: joiningUserMediaState.isCameraOff,
                    roomId,
                    mode,
                });

                // Notify Joining User (Self) - they will be the answerer
                socket.emit('match-found', {
                    role: 'answerer', // Receiver of WebRTC offer
                    partnerId: partner.id,
                    partnerCountry: partner.country,
                    partnerCountryCode: partner.countryCode,
                    partnerIsMuted: waitingUserMediaState.isMuted,
                    partnerIsCameraOff: waitingUserMediaState.isCameraOff,
                    roomId,
                    mode,
                });

                console.log(`[MATCH] Queue sizes - Chat: ${chatQueue.length}, Video: ${videoQueue.length}`);
                return;
            }
        }

        // No match found -> Add to queue
        const user: User = { id: socket.id, country, countryCode, mode };
        if (mode === 'chat') {
            chatQueue.push(user);
        } else {
            videoQueue.push(user);
        }

        console.log(`[MATCH] User ${socket.id} added to ${mode} queue. Position: ${targetQueue.length}`);
        socket.emit('waiting-for-match', { position: targetQueue.length });
    });

    // Signaling Events
    socket.on('offer', (data) => {
        const { target, sdp } = data;
        console.log(`[SIGNAL] Forwarding offer from ${socket.id} to ${target}`);
        io.to(target).emit('offer', { sdp, callerId: socket.id });
    });

    socket.on('answer', (data) => {
        const { target, sdp } = data;
        console.log(`[SIGNAL] Forwarding answer from ${socket.id} to ${target}`);
        io.to(target).emit('answer', { sdp, callerId: socket.id });
    });

    socket.on('ice-candidate', (data) => {
        const { target, candidate } = data;
        console.log(`[SIGNAL] Forwarding ICE candidate from ${socket.id} to ${target}`);
        io.to(target).emit('ice-candidate', { candidate, senderId: socket.id });
    });

    // Text Chat Message
    socket.on('send-message', (data) => {
        const { target, message } = data;
        console.log(`[MESSAGE] ${socket.id} -> ${target}: ${message.substring(0, 50)}...`);
        io.to(target).emit('receive-message', {
            senderId: socket.id,
            message,
            timestamp: new Date().toISOString()
        });
    });

    // Media State Changes - Broadcast to partner
    socket.on('toggle-mute', (data: { target: string, isMuted: boolean }) => {
        const { target, isMuted } = data;
        console.log(`[MEDIA] ${socket.id} toggled mute: ${isMuted}`);

        // Update stored state
        const currentState = userMediaState.get(socket.id) || { isMuted: false, isCameraOff: false };
        userMediaState.set(socket.id, { ...currentState, isMuted });

        io.to(target).emit('partner-mute-state', {
            partnerId: socket.id,
            isMuted
        });
    });

    socket.on('toggle-camera', (data: { target: string, isCameraOff: boolean }) => {
        const { target, isCameraOff } = data;
        console.log(`[MEDIA] ${socket.id} toggled camera: ${isCameraOff}`);

        // Update stored state
        const currentState = userMediaState.get(socket.id) || { isMuted: false, isCameraOff: false };
        userMediaState.set(socket.id, { ...currentState, isCameraOff });

        io.to(target).emit('partner-camera-state', {
            partnerId: socket.id,
            isCameraOff
        });
    });

    socket.on('update-media-state', (data: { isMuted?: boolean, isCameraOff?: boolean }) => {
        const currentState = userMediaState.get(socket.id) || { isMuted: false, isCameraOff: false };
        userMediaState.set(socket.id, { ...currentState, ...data });
        console.log(`[MEDIA] ${socket.id} updated state:`, data);
    });

    // Signal Strength / Reconnecting Logic
    socket.on('signal-strength', (data: { target: string, strength: 'good' | 'fair' | 'poor' | 'reconnecting' }) => {
        const { target, strength } = data;
        // console.log(`[SIGNAL] ${socket.id} signal strength: ${strength}`);
        io.to(target).emit('partner-signal-strength', {
            partnerId: socket.id,
            strength
        });
    });

    // Stop searching (cancel finding a match)
    socket.on('stop-searching', () => {
        console.log(`[STOP] User ${socket.id} stopped searching`);
        removeUserFromQueues(socket.id);
        console.log(`[STOP] Queue after stop - Chat: ${chatQueue.length}, Video: ${videoQueue.length}`);
    });

    // End Call / Next Match / Skip
    socket.on('end-call', (data?: { target?: string }) => {
        console.log(`User ${socket.id} ending call`);

        // Get partner ID from either the data or the active calls map
        let partnerId = data?.target || activeCalls.get(socket.id);

        if (partnerId) {
            console.log(`Notifying partner ${partnerId} that call ended`);
            io.to(partnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(partnerId);
            activeCalls.delete(socket.id);
        } else {
            // Just remove from active calls if no partner
            activeCalls.delete(socket.id);
        }

        // Remove self from queues
        removeUserFromQueues(socket.id);

        console.log(`Active calls after end: ${activeCalls.size}, Queue - Chat: ${chatQueue.length}, Video: ${videoQueue.length}`);
    });

    socket.on('disconnect', () => {
        console.log(`[DISCONNECT] User ${socket.id} disconnected`);

        const partnerId = activeCalls.get(socket.id);
        if (partnerId) {
            console.log(`[DISCONNECT] Notifying partner ${partnerId}`);
            io.to(partnerId).emit('call-ended', { by: 'disconnect' });
            activeCalls.delete(partnerId);
        }
        activeCalls.delete(socket.id);

        removeUserFromQueues(socket.id);

        // Clean up media state
        userMediaState.delete(socket.id);

        console.log(`[DISCONNECT] Cleanup complete. Active calls: ${activeCalls.size}, Queue - Chat: ${chatQueue.length}, Video: ${videoQueue.length}`);
    });
};
