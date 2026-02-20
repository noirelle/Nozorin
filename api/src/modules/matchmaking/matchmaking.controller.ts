import { Request, Response } from 'express';
import { matchmakingService } from './matchmaking.service';
import { userService } from '../user/user.service';
import { io } from '../../server';
import { successResponse, errorResponse } from '../../core/utils/response.util';
import { getUserFromRequest } from '../../core/middleware/auth.middleware';

export const matchmakingController = {
    async joinQueue(req: Request, res: Response) {
        const authUserId = (req as any).user.id; // From valid token
        const { userId, mode, preferences, session, requestId } = req.body;

        // Verify userId matches token
        if (userId !== authUserId) {
            return res.status(403).json(errorResponse('User ID mismatch'));
        }

        if (mode !== 'voice') {
            return res.status(400).json(errorResponse('Invalid mode. Only "voice" is supported.'));
        }

        try {
            // Use connectionId from session if provided, otherwise fallback to system record
            // But we must verify if that connectionId actually belongs to the user to prevent spoofing?
            // `userService.getSocketId` is the source of truth for the *current* active socket.
            // If they differ, it might be a stale session object from client. 
            // We should trust `userService` for the actual socket, but we can store `session.peerId`.

            const systemSocketId = userService.getSocketId(authUserId);
            if (!systemSocketId) {
                return res.status(400).json(errorResponse('User is not connected to socket (server record).'));
            }

            // Optional: check if session.connectionId matches systemSocketId
            if (session?.connectionId && session.connectionId !== systemSocketId) {
                // console.warn calling with different socket id
            }

            const queueData = await matchmakingService.joinQueue(io, systemSocketId, {
                mode,
                preferredCountry: preferences?.region, // Mapping region to preferredCountry for now? Or keep separate?
                preferences,
                peerId: session?.peerId,
                requestId
            });

            return res.status(200).json(successResponse(queueData, 'Joined queue successfully'));
        } catch (error: any) {
            if (error.message === 'ALREADY_IN_QUEUE') {
                return res.status(409).json({
                    success: false,
                    status: 'error',
                    message: 'You are already in the queue',
                    data: null,
                    error: {
                        code: 'ALREADY_IN_QUEUE'
                    }
                });
            }
            console.error('[MATCH] Join queue error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    },

    async leaveQueue(req: Request, res: Response) {
        // Custom Authentication
        const user = await getUserFromRequest(req);

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Failed to leave matchmaking queue',
                error: 'Token expired or invalid session'
            });
        }

        const userId = user.id;

        try {
            const socketId = userService.getSocketId(userId);
            if (!socketId) {
                // If no socket, we can't clean up socket-based queue easily, but queue relies on socketId.
                // It might be already cleaned up by disconnect handler.
                return res.status(200).json(successResponse(null, 'Not connected, queue leaved (assumed)'));
            }

            await matchmakingService.leaveQueue(io, socketId);

            return res.status(200).json(successResponse(null, 'Left queue successfully'));
        } catch (error: any) {
            console.error('[MATCH] Leave queue error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    }
};
