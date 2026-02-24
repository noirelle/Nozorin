import { Router, Request, Response } from 'express';
import { friendsService } from './friends.service';

const router = Router();

/**
 * POST /internal/friends/request
 * Notify user about a received friend request
 */
router.post('/request', (req: Request, res: Response) => {
    const { userId, senderProfile } = req.body;
    if (!userId || !senderProfile) return res.status(400).json({ error: 'userId and senderProfile required' });

    friendsService.notifyFriendRequest(userId, senderProfile);
    res.json({ notified: true });
});

/**
 * POST /internal/friends/accept
 * Notify user that their friend request was accepted
 */
router.post('/accept', (req: Request, res: Response) => {
    const { userId, requestId, friendProfile } = req.body;
    if (!userId || !requestId || !friendProfile) return res.status(400).json({ error: 'userId, requestId and friendProfile required' });

    friendsService.notifyRequestAccepted(userId, requestId, friendProfile);
    res.json({ notified: true });
});

/**
 * POST /internal/friends/decline
 * Notify user that their friend request was declined
 */
router.post('/decline', (req: Request, res: Response) => {
    const { userId, requestId } = req.body;
    if (!userId || !requestId) return res.status(400).json({ error: 'userId and requestId required' });

    friendsService.notifyRequestDeclined(userId, requestId);
    res.json({ notified: true });
});

/**
 * POST /internal/friends/remove
 * Notify user that they were removed from a friend list
 */
router.post('/remove', (req: Request, res: Response) => {
    const { userId, friendId } = req.body;
    if (!userId || !friendId) return res.status(400).json({ error: 'userId and friendId required' });

    friendsService.notifyFriendRemoved(userId, friendId);
    res.json({ notified: true });
});

/**
 * POST /internal/friends/status
 * Check online status for a list of friend IDs
 */
router.post('/status', async (req: Request, res: Response) => {
    const { friendIds } = req.body as { friendIds: string[] };
    if (!friendIds || !Array.isArray(friendIds)) {
        return res.status(400).json({ error: 'friendIds array required' });
    }

    const onlineUsers = friendIds.filter(id => friendsService.isUserOnline(id));
    res.json({ onlineUsers });
});

export default router;
