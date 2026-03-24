import { Router, Request, Response } from 'express';
import { userService } from '../../shared/services/user.service';
import { statsService } from '../../shared/services/stats.service';
import { presenceService } from './presence.service';

const router = Router();

/** GET /internal/status/global — returns overall stats */
router.get('/global', async (_req: Request, res: Response) => {
    const stats = statsService.getStats();
    // Overwrite the local people_online count with the global one from Redis
    const globalCount = await presenceService.calculateOnlineCount();
    res.json({ ...stats, people_online: globalCount });
});

/** GET /internal/status/:userId — returns user online status and count */
router.get('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const status = await userService.getUserStatus(userId);
        const onlineCount = await presenceService.calculateOnlineCount(); // Use global deduplicated count
        res.json({ userId, status, onlineCount });
    } catch {
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

export default router;
