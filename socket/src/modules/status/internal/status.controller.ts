import { Router, Request, Response } from 'express';
import { userService } from '../../../shared/services/user.service';
import { statusStore } from '../status.store';

const router = Router();

/** GET /internal/status/:userId — returns user online status and count */
router.get('/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const status = await userService.getUserStatus(userId);
        res.json({ userId, status, onlineCount: statusStore.count() });
    } catch {
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

export default router;
