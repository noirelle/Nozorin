
import { Request, Response } from 'express';
import { callService } from './call.service';
import { successResponse, errorResponse } from '../../core/utils/response.util';

export const callController = {
    async requestCall(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).user?.userId;
            const { target_user_id, mode } = req.body;

            if (!target_user_id) {
                return res.status(400).json(errorResponse('target_user_id is required'));
            }

            const result = await callService.requestCall(userId, target_user_id, mode || 'voice');
            return res.json(successResponse(result, 'Call requested'));
        } catch (error: any) {
            console.error('[CALL-API] Request error:', error.message);
            return res.status(error.message === 'User is offline' ? 404 : 400).json(errorResponse(error.message));
        }
    },

    async respondToCall(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id || (req as any).user?.userId;
            const { target_user_id, accepted, mode } = req.body;

            if (!target_user_id) {
                return res.status(400).json(errorResponse('target_user_id is required'));
            }

            const result = await callService.respondToCall(userId, target_user_id, !!accepted, mode || 'voice');
            return res.json(successResponse(result, accepted ? 'Call accepted' : 'Call declined'));
        } catch (error: any) {
            console.error('[CALL-API] Respond error:', error.message);
            return res.status(400).json(errorResponse(error.message));
        }
    }
};
