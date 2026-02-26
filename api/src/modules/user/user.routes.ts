
import { Router } from 'express';
import { userController } from './user.controller';
import { authenticateToken } from '../../core/middleware/auth.middleware';

const router = Router();


// Routes for authenticated users
router.get('/me', authenticateToken, userController.getMe);

export default router;
