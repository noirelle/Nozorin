
import { Socket, Server } from 'socket.io';
import { getGeoInfo } from '../utils/geo';
import { User } from '../types';

let chatQueue: User[] = [];
let videoQueue: User[] = [];
let activeCalls = new Map<string, string>(); // socketId -> partnerId

// Helper to remove user from all queues
const removeUserFromQueues = (socketId: string) => {
    chatQueue = chatQueue.filter((u) => u.id !== socketId);
    videoQueue = videoQueue.filter((u) => u.id !== socketId);
};

export const handleSocketConnection = (io: Server, socket: Socket) => {
    console.log('User connected:', socket.id);

    const clientIp =
        socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    const geo = getGeoInfo(
        Array.isArray(clientIp) ? clientIp[0] : clientIp
    );
    const country = geo.name;
    const countryCode = geo.code;

    console.log(`User ${socket.id} connects from ${country} (${countryCode})`);

    // JOIN QUEUE (Searching for match)
    socket.on('find-match', (data: { mode: 'chat' | 'video' }) => {
        const mode = data.mode;
        removeUserFromQueues(socket.id); // Ensure not in multiple queues

        console.log(`User ${socket.id} looking for ${mode} match`);

        let targetQueue = mode === 'chat' ? chatQueue : videoQueue;

        if (targetQueue.length > 0) {
            // Create a match
            const partner = targetQueue.shift(); // Get the first person waiting

            if (partner) {
                const roomId = `room-${partner.id}-${socket.id}`;

                // Track the active connection
                activeCalls.set(socket.id, partner.id);
                activeCalls.set(partner.id, socket.id);

                // Join both users to the room
                socket.join(roomId);
                // Note: partner is already waiting, we need to notify them to join or just acknowledge match
                // Since we can't force partner socket to join remotely easily in this logic flow without looking up socket instance
                // We will emit to them directly using io.to(partner.id)

                // Notify Partner (waiting user)
                io.to(partner.id).emit('match-found', {
                    role: 'offerer', // Initiator of WebRTC offer
                    partnerId: socket.id,
                    partnerCountry: country,
                    partnerCountryCode: countryCode,
                    roomId,
                    mode,
                });

                // Notify Self (active user)
                socket.emit('match-found', {
                    role: 'answerer', // Receiver of WebRTC offer
                    partnerId: partner.id,
                    partnerCountry: partner.country,
                    partnerCountryCode: partner.countryCode,
                    roomId,
                    mode,
                });

                console.log(
                    `Matched ${socket.id} with ${partner.id} in ${mode} mode`
                );
                return; // Done
            }
        }

        // No match found -> Add to queue
        const user: User = { id: socket.id, country, countryCode, mode };
        if (mode === 'chat') {
            chatQueue.push(user);
        } else {
            videoQueue.push(user);
        }

        socket.emit('waiting-for-match', { position: targetQueue.length + 1 });
        console.log(
            `User ${socket.id} added to ${mode} queue. Queue lengths - Chat: ${chatQueue.length}, Video: ${videoQueue.length}`
        );
    });

    // Signaling Events
    socket.on('offer', (data) => {
        const { target, sdp } = data;
        io.to(target).emit('offer', { sdp, callerId: socket.id });
    });

    socket.on('answer', (data) => {
        const { target, sdp } = data;
        io.to(target).emit('answer', { sdp, callerId: socket.id });
    });

    socket.on('ice-candidate', (data) => {
        const { target, candidate } = data;
        io.to(target).emit('ice-candidate', { candidate, senderId: socket.id });
    });

    // Text Chat Message
    socket.on('send-message', (data) => {
        const { target, message } = data;
        io.to(target).emit('receive-message', {
            senderId: socket.id,
            message,
            timestamp: new Date().toISOString()
        });
    });

    // End Call / Next Match / Skip
    socket.on('end-call', () => {
        const partnerId = activeCalls.get(socket.id);

        if (partnerId) {
            io.to(partnerId).emit('call-ended', { by: socket.id });
            activeCalls.delete(partnerId);
        }

        activeCalls.delete(socket.id);

        // Remove self from queues if disconnected or skipping
        removeUserFromQueues(socket.id);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        const partnerId = activeCalls.get(socket.id);
        if (partnerId) {
            io.to(partnerId).emit('call-ended', { by: 'disconnect' });
            activeCalls.delete(partnerId);
        }
        activeCalls.delete(socket.id);

        removeUserFromQueues(socket.id);
    });
};
