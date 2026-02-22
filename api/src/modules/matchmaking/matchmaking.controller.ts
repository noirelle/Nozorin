import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../core/utils/response.util';
import { matchmakingService } from './matchmaking.service';
import { getUserFromRequest } from '../../core/middleware/auth.middleware';

export const matchmakingController = {
    async joinQueue(req: Request, res: Response) {
        const authUserId = (req as any).user.id;
        const { userId, mode, preferences, session, requestId } = req.body;

        if (userId !== authUserId) {
            return res.status(403).json(errorResponse('User ID mismatch'));
        }

        if (mode !== 'voice') {
            return res.status(400).json(errorResponse('Invalid mode. Only "voice" is supported.'));
        }

        try {
            const socketResponse = await matchmakingService.joinQueue({
                userId: authUserId,
                mode,
                preferences,
                peerId: session?.peerId,
                requestId,
            });

            if (!socketResponse.success) {
                if (socketResponse.error === 'ALREADY_IN_QUEUE') {
                    return res.status(409).json({
                        success: false,
                        status: 'error',
                        message: 'You are already in the queue',
                        data: null,
                        error: { code: 'ALREADY_IN_QUEUE' }
                    });
                }
                return res.status(400).json(errorResponse(socketResponse.error || 'Socket service error'));
            }

            return res.status(200).json(successResponse(socketResponse.data, 'Joined queue successfully'));
        } catch (error: any) {
            console.error('[MATCH] Join queue error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    },

    async leaveQueue(req: Request, res: Response) {
        try {
            const user = await getUserFromRequest(req);

            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Failed to leave matchmaking queue',
                    error: 'Token expired or invalid session'
                });
            }

            const socketResponse = await matchmakingService.leaveQueue({ userId: user.id });

            if (!socketResponse.success) {
                return res.status(400).json(errorResponse(socketResponse.error || 'Socket service error'));
            }

            return res.status(200).json(successResponse(null, 'Left queue successfully'));
        } catch (error: any) {
            console.error('[MATCH] Leave queue error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    }
};
