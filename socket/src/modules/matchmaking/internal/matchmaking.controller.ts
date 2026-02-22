import { Router, Request, Response } from 'express';
import { voiceQueue, voiceBuckets, activeCalls, removeUserFromQueues } from '../matchmaking.store';
import { userService } from '../../../shared/services/user.service';

const router = Router();

/**
 * POST /internal/queue/join
 * Body: { userId, mode, preferences?, peerId?, requestId? }
 * Resolves socketId from this service's own in-memory registry.
 */
router.post('/join', (req: Request, res: Response) => {
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

    const entry = {
        id: socketId,
        userId,
        username: '',
        avatar: '',
        gender: '',
        country: '',
        countryCode: '',
        mode: mode as 'voice',
        preferredCountry: preferences?.region,
        preferences,
        peerId,
        requestId,
        joinedAt: Date.now(),
        state: 'FINDING' as const,
    };

    voiceQueue.push(entry);

    // Also push into country bucket if we have geo info
    if (entry.countryCode) {
        const bucket = voiceBuckets.get(entry.countryCode) ?? [];
        bucket.push(entry);
        voiceBuckets.set(entry.countryCode, bucket);
    }

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
