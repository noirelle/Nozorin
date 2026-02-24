import { Router, Request, Response } from 'express';
import { userService } from '../../shared/services/user.service';
import { presenceStore } from './presence.store';
import { statsService } from '../../shared/services/stats.service';

const router = Router();

/** GET /internal/status/global — returns overall stats */
router.get('/global', (_req: Request, res: Response) => {
    res.json(statsService.getStats());
});

/** GET /internal/status/:userId — returns user online status and count */
router.get('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const status = await userService.getUserStatus(userId);
        res.json({ userId, status, onlineCount: presenceStore.count() });
    } catch {
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

export default router;
