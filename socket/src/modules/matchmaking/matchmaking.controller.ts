import { Router, Request, Response } from 'express';
import { voiceQueue, voiceBuckets, removeUserFromQueues } from './matchmaking.store';
import { activeCalls } from '../call/call.store';
import { userService } from '../../shared/services/user.service';
import * as matchmakingService from './matchmaking.service';

const router = Router();

/**
 * POST /internal/queue/join
 * Body: { userId, mode, preferences?, peerId?, requestId? }
 * Resolves socketId from this service's own in-memory registry.
 */
router.post('/join', async (req: Request, res: Response) => {
    const { user_id: userId, mode, preferences, peer_id: peerId, request_id: requestId } = req.body as {
        user_id: string;
        mode: string;
        preferences?: { selected_country?: string; language?: string; min_rating?: number };
        peer_id?: string;
        request_id?: string;
    };

    if (!userId) return res.status(400).json({ error: 'user_id required' });

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
        user_id: userId,
        mode: mode as 'voice',
        preferences,
        peer_id: peerId,
        request_id: requestId,
    });

    res.json({ queued: true, queueLength: voiceQueue.length });
});

/**
 * POST /internal/queue/leave
 * Body: { user_id }
 */
router.post('/leave', (req: Request, res: Response) => {
    const { user_id: userId } = req.body as { user_id: string };
    if (!userId) return res.status(400).json({ error: 'user_id required' });

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
