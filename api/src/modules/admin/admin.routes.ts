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

export default router;
