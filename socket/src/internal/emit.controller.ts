import { Router, Request, Response } from 'express';
import { userService } from '../shared/services/user.service';

/** This module is resolved at runtime via the IoContainer singleton */
let _ioInstance: import('socket.io').Server | null = null;

export const setIo = (io: import('socket.io').Server): void => {
    _ioInstance = io;
};

const router = Router();

/**
 * POST /internal/emit
 * Body: { socketId?: string, userId?: string, event: string, data: unknown }
 * Emits a socket event to a specific socketId or userId from the API service.
 */
router.post('/emit', (req: Request, res: Response) => {
    let { socketId, userId, event, data } = req.body as {
        socketId?: string;
        userId?: string;
        event: string;
        data: unknown
    };

    if (!event) return res.status(400).json({ error: 'event required' });
    if (!_ioInstance) return res.status(503).json({ error: 'Socket server not ready' });

    // If userId provided but no socketId, resolve it
    if (!socketId && userId) {
        socketId = userService.getSocketId(userId) || undefined;
    }

    if (!socketId) {
        return res.status(404).json({ error: 'No active socket found for recipient' });
    }

    _ioInstance.to(socketId).emit(event, data);
    res.json({ emitted: true });
});

export default router;

