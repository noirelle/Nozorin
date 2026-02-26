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

    async registerUser(req: Request, res: Response) {
        const { userId } = req.params;
        await userService.registerUser(userId);
        return res.json({ success: true });
    },

    async getUserStatus(req: Request, res: Response) {
        const { userId } = req.params;
        const status = await userService.getUserStatus(userId);
        return res.json(status);
    },

    async getUserStatuses(req: Request, res: Response) {
        const { userIds } = req.body;
        const statuses = await userService.getUserStatuses(userIds);
        return res.json(statuses);
    },

    async isUserRegistered(req: Request, res: Response) {
        const { userId } = req.params;
        const exists = await userService.isUserRegistered(userId);
        return res.json({ exists });
    },

    async getUserProfile(req: Request, res: Response) {
        const { userId } = req.params;
        const profile = await userService.getUserProfile(userId);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        return res.json(profile);
    },

    async deactivateUser(req: Request, res: Response) {
        const { userId } = req.params;
        await userService.deactivateUser(userId);
        return res.json({ success: true });
    }
};
