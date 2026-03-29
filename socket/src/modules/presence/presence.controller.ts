import { Router, Request, Response } from 'express';
import { userService } from '../../shared/services/user.service';
import { statsService } from '../../shared/services/stats.service';
import { presenceService } from './presence.service';

const router = Router();

/** GET /internal/status/global — returns overall stats */
router.get('/global', async (req: Request, res: Response) => {
    const stats = statsService.getStats();
    // Get the global deduplicated count from the live socket pool
    const io = req.app.get('io');
    const globalCount = presenceService.calculateOnlineCount(io);
    res.json({ ...stats, people_online: globalCount });
});

/** GET /internal/status/:userId — returns user online status and count */
router.get('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const status = await userService.getUserStatus(userId);
        const io = req.app.get('io');
        const onlineCount = presenceService.calculateOnlineCount(io); // Use global deduplicated count
        res.json({ userId, status, onlineCount });
    } catch {
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

export default router;
