import { Router } from 'express';
import { matchmakingController } from './matchmaking.controller';
import { authenticateToken } from '../../core/middleware/auth.middleware';

const router = Router();

router.post('/join', authenticateToken, matchmakingController.joinQueue);
router.post('/leave', matchmakingController.leaveQueue);

export default router;
