import { Request, Response } from 'express';
import { friendService } from './friend.service';
import { userService } from '../user/user.service';
import { io } from '../../server';
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
            const senderProfile = await userService.getUserProfile(userId);

            // Notify receiver if online
            const receiverSocketId = userService.getSocketId(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('friend-request-received', {
                    ...request,
                    profile: senderProfile,
                    type: 'received'
                });
                console.log(`[FRIEND] Notified user ${receiverId} of friend request from ${userId} (Socket: ${receiverSocketId})`);
            } else {
                console.log(`[FRIEND] Receiver ${receiverId} is offline, no socket notification sent`);
            }

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
            const { request, senderId } = await friendService.acceptRequest(userId, requestId);

            // Notify sender if online
            const senderSocketId = userService.getSocketId(senderId);
            if (senderSocketId) {
                const receiverProfile = await userService.getUserProfile(userId);
                io.to(senderSocketId).emit('friend-request-accepted', {
                    requestId: request.id,
                    friend: receiverProfile
                });
                console.log(`[FRIEND] Notified user ${senderId} that ${userId} accepted their request`);
            }

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
