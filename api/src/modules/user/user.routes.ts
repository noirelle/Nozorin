
import { Router } from 'express';
import { userController } from './user.controller';
import { authenticateToken } from '../../core/middleware/auth.middleware';

const router = Router();

router.get('/me', userController.getMe);

export default router;
