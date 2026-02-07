import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import geoip from 'geoip-lite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity in this demo
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
    res.send('Video Chat API is running');
});

interface User {
    id: string;
    country: string;
}

// Simple queue for matching
let waitingQueue: User[] = [];

// Helper to get country from IP
const getCountryScale = (ip: string): string => {
    // Handle local development IP
    if (ip === '::1' || ip === '127.0.0.1') {
        return 'Local Dev (US)'; // Mock for local testing
    }

    // Handle ::ffff: prefix if present
    const cleanIp = ip.replace('::ffff:', '');
    const geo = geoip.lookup(cleanIp);
    return geo ? geo.country : 'Unknown';
};

io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);

    // Determine country on connection
    const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    const country = getCountryScale(Array.isArray(clientIp) ? clientIp[0] : clientIp);

    console.log(`User ${socket.id} connects from ${country}`);

    // When user wants to find a match
    socket.on('find-match', () => {
        // Check if there is someone in the queue
        if (waitingQueue.length > 0) {
            // Prevent matching with self
            const partnerIndex = waitingQueue.findIndex(u => u.id !== socket.id);

            if (partnerIndex !== -1) {
                const partner = waitingQueue.splice(partnerIndex, 1)[0];

                const roomId = `room-${partner.id}-${socket.id}`;

                socket.join(roomId);
                // Make partner join room remotely/or just notify them
                // Actually, Socket.io mandates socket to join. We can't force remote? 
                // We can just emit 'match-found' to both with the roomId and they join/start signaling.
                // It's easier if we coordinate via signaling directly.

                // Notify both users
                io.to(partner.id).emit('match-found', {
                    role: 'offerer', // One must initiate
                    partnerId: socket.id,
                    partnerCountry: country,
                    roomId
                });

                socket.emit('match-found', {
                    role: 'answerer', // The other listens
                    partnerId: partner.id,
                    partnerCountry: partner.country,
                    roomId
                });

                console.log(`Matched ${socket.id} with ${partner.id}`);
                return;
            }
        }

        // No match found, add to queue
        // Remove if already in queue to avoid duplicates
        waitingQueue = waitingQueue.filter(u => u.id !== socket.id);
        waitingQueue.push({ id: socket.id, country });
        socket.emit('waiting-for-match');
        console.log(`User ${socket.id} added to queue. Queue length: ${waitingQueue.length}`);
    });

    // Signaling: Relay Offer
    socket.on('offer', (data) => {
        const { target, sdp } = data; // target is partnerId
        io.to(target).emit('offer', { sdp, callerId: socket.id });
    });

    // Signaling: Relay Answer
    socket.on('answer', (data) => {
        const { target, sdp } = data;
        io.to(target).emit('answer', { sdp, callerId: socket.id });
    });

    // Signaling: Relay ICE Candidate
    socket.on('ice-candidate', (data) => {
        const { target, candidate } = data;
        io.to(target).emit('ice-candidate', { candidate, senderId: socket.id });
    });

    // Signaling: End Call / Next Match
    socket.on('end-call', (data) => {
        const { target } = data;
        if (target) {
            io.to(target).emit('call-ended');
        }
        // Also remove from queue if they were searching
        waitingQueue = waitingQueue.filter(u => u.id !== socket.id);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        waitingQueue = waitingQueue.filter(u => u.id !== socket.id);
        // Ideally notify partner if in active call - complex state tracking needed for that
        // Client handling 'connection closed' on WebRTC is usually enough or heartbeat
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
