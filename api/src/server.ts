import 'reflect-metadata';
import 'dotenv/config';
import http from 'http';
import { Server, Socket } from 'socket.io';
import app from './app';
import { initDatabase } from './core/config/database.config';
import { bootstrapSocket } from './socket';

// Initialize Database
initDatabase()
    .then(() => {
        // Run initial cleanup on startup
        import('./modules/user/user.service').then(({ userService }) => {
            userService.cleanupGhostUsers(7); // Clean up users older than 7 days
            // Run cleanup every 24 hours
            setInterval(() => userService.cleanupGhostUsers(7), 24 * 60 * 60 * 1000);
        });
    })
    .catch(err => {
        console.error('Failed to initialize database:', err);
    });

const server = http.createServer(app);
export const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    },
    pingInterval: 10000,
    pingTimeout: 5000,
});

bootstrapSocket(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
