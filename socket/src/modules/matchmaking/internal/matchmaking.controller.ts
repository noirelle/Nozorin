import { Router, Request, Response } from 'express';
import { voiceQueue, voiceBuckets, removeUserFromQueues } from '../matchmaking.store';
import { activeCalls } from '../../call/call.store';
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
        preferences?: { selectedCountry?: string; language?: string; minRating?: number };
        peerId?: string;
        requestId?: string;
    };

    if (!userId) return res.status(400).json({ error: 'userId required' });

    const socketId = userService.getSocketId(userId);
    if (!socketId) {
        console.warn(`[MATCHMAKING-CONTROLLER] Join failed: User ${userId.substring(0, 8)} is not mapped to any socketId. isJoiningRef.current: ${requestId}`);
        return res.status(400).json({ error: 'User is not connected to the realtime service' });
    }

    // Already queued with the SAME socketId?
    const existingUser = voiceQueue.find(u => u.id === socketId);
    if (existingUser) {
        return res.json({ queued: true, queueLength: voiceQueue.length, alreadyQueued: true });
    }

    // Note: If they are in queue with a DIFFERENT socketId (e.g. after reconnect),
    // matchmakingService.joinQueue will handle replacing the old entry by userId.

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
