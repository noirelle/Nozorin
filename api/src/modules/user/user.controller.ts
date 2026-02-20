import { Request, Response } from 'express';
import { userService } from './user.service';
import { successResponse, errorResponse } from '../../core/utils/response.util';

export const userController = {
    async getMe(req: Request, res: Response) {
        try {
            const cookieHeader = req.headers.cookie;
            if (!cookieHeader) {
                return res.status(401).json(errorResponse('Unauthorized', 'No cookies found'));
            }

            const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);

            const sid = cookies['nz_sid'];
            if (!sid) {
                return res.status(401).json(errorResponse('Unauthorized', 'Session ID missing'));
            }

            // Retrieve session using service (handles Redis + Memory fallback)
            const userId = await userService.getSession(sid);

            if (!userId) {
                return res.status(401).json(errorResponse('Unauthorized', 'Invalid session'));
            }

            const userProfile = await userService.getUserProfile(userId);

            if (!userProfile) {
                return res.status(404).json(errorResponse('User not found'));
            }

            // Cache in Redis now that user is active
            await userService.cacheUserProfile(userProfile);

            return res.json(successResponse(userProfile, 'User retrieved successfully'));

        } catch (error) {
            console.error('[USER] Get me error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    }
};
