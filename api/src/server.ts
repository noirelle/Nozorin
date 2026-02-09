
import http from 'http';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import app from './app';
import { handleSocketConnection } from './socket/connection';

dotenv.config();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Setup socket handlers
// Setup socket handlers
io.on('connection', (socket) => {
    handleSocketConnection(io, socket);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
