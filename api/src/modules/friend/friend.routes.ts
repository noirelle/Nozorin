import { Router } from 'express';
import { friendController } from './friend.controller';
import { authenticateToken } from '../../core/middleware/auth.middleware';

const router = Router();

router.get('/', authenticateToken, friendController.getFriends);
router.get('/requests', authenticateToken, friendController.getReceivedRequests);
router.get('/sent', authenticateToken, friendController.getSentRequests);
router.post('/:friend_id/request', authenticateToken, friendController.sendRequest);
router.post('/:request_id/accept', authenticateToken, friendController.acceptRequest);
router.post('/:request_id/decline', authenticateToken, friendController.declineRequest);
router.get('/:friend_id/status', authenticateToken, friendController.getStatus);
router.delete('/:friend_id', authenticateToken, friendController.removeFriend);

export default router;
