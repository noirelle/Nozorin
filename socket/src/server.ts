import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { bootstrapSocket } from './socket';
import internalRouter from './internal/router';
import { setIo } from './internal/emit.controller';
import { logger } from './core/logger';
import { initRedis } from './core/config/redis.config';

// Initialize Redis
initRedis();

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'nozorin_realtime' });
});

app.use('/internal', internalRouter);

bootstrapSocket(io);
setIo(io);


const PORT = parseInt(process.env.PORT || '3002', 10);
httpServer.listen(PORT, () => {
    logger.info({ port: PORT }, '[SERVER] nozorin_realtime listening');
});
