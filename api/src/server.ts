
import 'dotenv/config';
import http from 'http';
import { Server, Socket } from 'socket.io';
import app from './app';
import { handleSocketConnection } from './socket/connection';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Setup socket handlers
io.on('connection', (socket) => {
    handleSocketConnection(io, socket);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
