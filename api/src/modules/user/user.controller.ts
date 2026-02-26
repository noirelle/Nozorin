import { Request, Response } from 'express';
import { userService } from './user.service';
import { successResponse, errorResponse } from '../../core/utils/response.util';

export const userController = {
    async getMe(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).user?.userId;

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
    },
};
