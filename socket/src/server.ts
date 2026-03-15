import 'reflect-metadata';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { bootstrapSocket } from './socket';
import { presenceService } from './modules/presence/presence.service';
import internalRouter from './api/router';
import { logger } from './core/logger';
import { initRedis } from './core/config/redis.config';
import { initDatabase } from './core/config/database.config';
import { callService } from './modules/call/call.service';

const app = express();
const httpServer = createServer(app);
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigins = [
    clientUrl,
    clientUrl.replace('://', '://www.'),
    clientUrl.replace('://www.', '://'),
].filter((url, index, self) => self.indexOf(url) === index);

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
    res.json({ status: 'ok', service: 'nozorin_realtime' });
});

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'nozorin_realtime' });
});

app.use('/internal', internalRouter);

bootstrapSocket(io);
presenceService.startPresenceHeartbeat(io);

const PORT = parseInt(process.env.PORT || '3002', 10);

const startServer = async () => {
    try {
        initRedis();
        await initDatabase();

        httpServer.listen(PORT, () => {
            logger.info({ port: PORT }, '[SERVER] nozorin_realtime listening');
        });

        // Start background cleanup job
        setInterval(() => {
            callService.cleanupExpiredSessions(io);
        }, 10000);
    } catch (err) {
        logger.error({ err }, '[SERVER] Failed to start');
        process.exit(1);
    }
};

startServer();
