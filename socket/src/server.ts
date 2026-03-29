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
import { userService } from './shared/services/user.service';
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

const PORT = parseInt(process.env.PORT || '3002', 10);

const startServer = async () => {
    try {
        initRedis();
        await initDatabase();

        // Startup reconciliation: reset all stale is_online flags from previous process
        await userService.resetAllOnlineStatuses();

        httpServer.listen(PORT, () => {
            logger.info({ port: PORT }, '[SERVER] nozorin_realtime listening');
        });

        // Start background cleanup jobs
        setInterval(() => {
            callService.cleanupExpiredSessions(io);
        }, 10000);

        setInterval(() => {
            userService.cleanupZombieStatuses(io);
        }, 1 * 60 * 1000); // Every minute

        // Presence reconciliation: sweep orphaned socket IDs from in-memory stores every 30s
        setInterval(() => {
            presenceService.reconcilePresenceStore(io);
            userService.reconcileSocketMaps(io);
        }, 30 * 1000); // Every 30 seconds
    } catch (err) {
        logger.error({ err }, '[SERVER] Failed to start');
        process.exit(1);
    }
};

startServer();
