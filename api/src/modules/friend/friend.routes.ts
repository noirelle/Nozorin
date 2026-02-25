import { Router } from 'express';
import { friendController } from './friend.controller';
import { authenticateToken } from '../../core/middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, friendController.getFriends);
router.get('/requests', authenticateToken, friendController.getPendingRequests);
router.post('/:friend_id/request', authenticateToken, friendController.sendRequest);
router.post('/:request_id/accept', authenticateToken, friendController.acceptRequest);
router.post('/:request_id/decline', authenticateToken, friendController.declineRequest);
router.delete('/:friend_id', authenticateToken, friendController.removeFriend);

export default router;
