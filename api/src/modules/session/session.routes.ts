import { Router } from 'express';
import { sessionController } from './session.controller';
import { authenticateToken } from '../../core/middleware/auth.middleware';

const router = Router();

router.get('/history/:userId', sessionController.getHistory);
router.delete('/history/:userId', sessionController.deleteHistory);
router.get('/current', authenticateToken, sessionController.getCurrentSession);
router.get('/call', authenticateToken, sessionController.getActiveCall);

export default router;
