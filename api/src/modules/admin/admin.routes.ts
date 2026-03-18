import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticateToken } from '../../core/middleware/auth.middleware';
import { isAdmin } from '../../core/middleware/admin.middleware';

const router = Router();

router.post('/login', adminController.login);
router.post('/refresh', adminController.refresh);
router.post('/logout', adminController.logout);

// Protected Admin Routes
router.get('/get-status', authenticateToken, isAdmin, adminController.getStats);
router.get('/users', authenticateToken, isAdmin, adminController.listUsers);
router.get('/users/:userId', authenticateToken, isAdmin, adminController.getUserDetails);
router.patch('/users/:userId', authenticateToken, isAdmin, adminController.updateUser);
router.delete('/users/:userId', authenticateToken, isAdmin, adminController.deleteUser);
router.delete('/history/:historyId', authenticateToken, isAdmin, adminController.deleteCallHistory);
router.delete('/friends/:friendId', authenticateToken, isAdmin, adminController.deleteFriend);

export default router;
