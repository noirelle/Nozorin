
import { Request, Response } from 'express';
import { userService } from './user.service';
import { getRedisClient } from '../../core/config/redis.config';

// Add userId to Request type definition (no longer used, but kept for reference if needed elsewhere or remove completely)


export const userController = {
    async getMe(req: Request, res: Response) {
        try {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);

            const sid = cookies['nz_sid'];
            if (!sid) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Retrieve session using service (handles Redis + Memory fallback)
            const userId = await userService.getSession(sid);

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const userProfile = await userService.getUserProfile(userId);

            if (!userProfile) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.json(userProfile);

        } catch (error) {
            console.error('[USER] Get me error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
};
