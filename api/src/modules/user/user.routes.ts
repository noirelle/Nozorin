
import { Router } from 'express';
import { userController } from './user.controller';
import { authenticateToken } from '../../core/middleware/auth.middleware';

const router = Router();

router.get('/me', authenticateToken, userController.getMe);

// Internal routes for Socket service
router.post('/users/:userId/register', userController.registerUser);
router.get('/users/:userId/status', userController.getUserStatus);
router.post('/users/statuses', userController.getUserStatuses);
router.get('/users/:userId/exists', userController.isUserRegistered);
router.get('/users/:userId/profile', userController.getUserProfile);
router.post('/users/:userId/deactivate', userController.deactivateUser);

export default router;
