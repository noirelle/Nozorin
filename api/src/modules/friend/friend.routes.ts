import { Router } from 'express';
import { friendController } from './friend.controller';
import { authenticateToken } from '../../core/middleware/auth.middleware';

const router = Router();

router.post('/request', authenticateToken, friendController.sendRequest);
router.post('/accept', authenticateToken, friendController.acceptRequest);
router.post('/decline', authenticateToken, friendController.declineRequest);
router.delete('/remove', authenticateToken, friendController.removeFriend);
router.get('/list', authenticateToken, friendController.getFriends);
router.get('/pending', authenticateToken, friendController.getPendingRequests);

export default router;
