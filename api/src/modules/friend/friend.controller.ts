import { Request, Response } from 'express';
import { friendService } from './friend.service';
import { successResponse, errorResponse } from '../../core/utils/response.util';

export const friendController = {
    /**
     * Send a friend request
     */
    async sendRequest(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const { receiverId } = req.body;

        if (!receiverId) {
            return res.status(400).json(errorResponse('receiverId is required'));
        }

        try {
            const request = await friendService.sendRequest(userId, receiverId);
            return res.status(201).json(successResponse(request, 'Friend request sent'));
        } catch (error: any) {
            console.error('[FRIEND] Error sending request:', error.message);
            return res.status(400).json(errorResponse(error.message));
        }
    },

    /**
     * Accept a friend request
     */
    async acceptRequest(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json(errorResponse('requestId is required'));
        }

        try {
            const { request } = await friendService.acceptRequest(userId, requestId);
            return res.status(200).json(successResponse({ request }, 'Friend request accepted'));
        } catch (error: any) {
            console.error('[FRIEND] Error accepting request:', error.message);
            return res.status(400).json(errorResponse(error.message));
        }
    },

    /**
     * Decline a friend request
     */
    async declineRequest(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json(errorResponse('requestId is required'));
        }

        try {
            const request = await friendService.declineRequest(userId, requestId);
            return res.status(200).json(successResponse({ request }, 'Friend request declined'));
        } catch (error: any) {
            console.error('[FRIEND] Error declining request:', error.message);
            return res.status(400).json(errorResponse(error.message));
        }
    },

    /**
     * Remove a friend
     */
    async removeFriend(req: Request, res: Response) {
        const userId = (req as any).user.id;
        const { friendId } = req.body;

        if (!friendId) {
            return res.status(400).json(errorResponse('friendId is required'));
        }

        try {
            const success = await friendService.removeFriend(userId, friendId);
            if (success) {
                return res.status(200).json(successResponse(null, 'Friend removed'));
            } else {
                return res.status(404).json(errorResponse('Friendship not found'));
            }
        } catch (error: any) {
            console.error('[FRIEND] Error removing friend:', error.message);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    },

    /**
     * List all friends
     */
    async getFriends(req: Request, res: Response) {
        const userId = (req as any).user.id;

        try {
            const friends = await friendService.getFriends(userId);
            return res.status(200).json(successResponse(friends, 'Friends retrieved successfully'));
        } catch (error: any) {
            console.error('[FRIEND] Error getting friends:', error.message);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    },

    /**
     * Get pending requests
     */
    async getPendingRequests(req: Request, res: Response) {
        const userId = (req as any).user.id;

        try {
            const requests = await friendService.getPendingRequests(userId);
            return res.status(200).json(successResponse(requests, 'Pending requests retrieved successfully'));
        } catch (error: any) {
            console.error('[FRIEND] Error getting pending requests:', error.message);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    }
};
