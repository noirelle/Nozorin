import { Router, Request, Response } from 'express';
import { voiceQueue, voiceBuckets, activeCalls, removeUserFromQueues } from '../matchmaking.store';
import { userService } from '../../../shared/services/user.service';
import * as matchmakingService from '../matchmaking.service';

const router = Router();

/**
 * POST /internal/queue/join
 * Body: { userId, mode, preferences?, peerId?, requestId? }
 * Resolves socketId from this service's own in-memory registry.
 */
router.post('/join', async (req: Request, res: Response) => {
    const { userId, mode, preferences, peerId, requestId } = req.body as {
        userId: string;
        mode: string;
        preferences?: { region?: string; language?: string; minRating?: number };
        peerId?: string;
        requestId?: string;
    };

    if (!userId) return res.status(400).json({ error: 'userId required' });

    const socketId = userService.getSocketId(userId);
    if (!socketId) {
        return res.status(400).json({ error: 'User is not connected to the realtime service' });
    }

    // Already queued?
    if (voiceQueue.some(u => u.id === socketId)) {
        return res.status(409).json({ error: 'ALREADY_IN_QUEUE' });
    }

    await matchmakingService.joinQueue(null, {
        socketId,
        userId,
        mode: mode as 'voice',
        preferences,
        peerId,
        requestId,
    });

    res.json({ queued: true, queueLength: voiceQueue.length });
});

/**
 * POST /internal/queue/leave
 * Body: { userId }
 */
router.post('/leave', (req: Request, res: Response) => {
    const { userId } = req.body as { userId: string };
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const socketId = userService.getSocketId(userId);
    if (socketId) {
        removeUserFromQueues(socketId);
    }

    res.json({ left: true });
});

/** GET /internal/queue/status */
router.get('/status', (_req: Request, res: Response) => {
    res.json({ queueLength: voiceQueue.length, activeCalls: activeCalls.size });
});

export default router;
