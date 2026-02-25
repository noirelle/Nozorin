import { AppDataSource } from '../../core/config/database.config';
import { FriendRequest } from './friend-request.entity';
import { Friend } from './friend.entity';
import { v4 as uuidv4 } from 'uuid';
import { userService } from '../user/user.service';
import { friendsClient } from '../../integrations/socket/friends/friends.client';

class FriendService {
    private requestRepository = AppDataSource.getRepository(FriendRequest);
    private friendRepository = AppDataSource.getRepository(Friend);

    /**
     * Send a friend request
     */
    async sendRequest(senderId: string, receiverId: string) {
        if (senderId === receiverId) {
            throw new Error('Cannot send friend request to yourself');
        }

        // Check if already friends
        const isFriend = await this.friendRepository.findOne({
            where: { user_id: senderId, friend_id: receiverId }
        });
        if (isFriend) {
            throw new Error('Already friends');
        }

        // Check for existing pending request
        const existingRequest = await this.requestRepository.findOne({
            where: [
                { sender_id: senderId, receiver_id: receiverId, status: 'pending' },
                { sender_id: receiverId, receiver_id: senderId, status: 'pending' }
            ]
        });

        if (existingRequest) {
            if (existingRequest.sender_id === senderId) {
                throw new Error('Friend request already sent');
            } else {
                // They already sent a request to us - auto accept or return error
                throw new Error('You already have a pending request from this user');
            }
        }

        const senderProfile = await userService.getUserProfile(senderId);
        const receiverProfile = await userService.getUserProfile(receiverId);

        const request = this.requestRepository.create({
            id: uuidv4(),
            sender_id: senderId,
            receiver_id: receiverId,
            sender_username: senderProfile?.username,
            sender_avatar: senderProfile?.avatar,
            sender_country: senderProfile?.country,
            sender_country_code: senderProfile?.countryCode,
            receiver_username: receiverProfile?.username,
            receiver_avatar: receiverProfile?.avatar,
            receiver_country: receiverProfile?.country,
            receiver_country_code: receiverProfile?.countryCode,
            status: 'pending',
            created_at: Date.now()
        });

        const savedRequest = await this.requestRepository.save(request);

        // Notify receiver via socket service
        await friendsClient.notifyRequest({
            userId: receiverId,
            senderProfile
        });

        return savedRequest;
    }

    /**
     * Accept a friend request
     */
    async acceptRequest(receiverId: string, requestId: string) {
        const request = await this.requestRepository.findOne({
            where: { id: requestId, receiver_id: receiverId, status: 'pending' }
        });

        if (!request) {
            throw new Error('Friend request not found or unauthorized');
        }

        request.status = 'accepted';
        await this.requestRepository.save(request);

        const senderProfile = await userService.getUserProfile(request.sender_id);
        const receiverProfile = await userService.getUserProfile(request.receiver_id);

        // Create bidirectional friend entries
        const friend1 = this.friendRepository.create({
            id: uuidv4(),
            user_id: request.sender_id,
            friend_id: request.receiver_id,
            friend_username: receiverProfile?.username,
            friend_avatar: receiverProfile?.avatar,
            friend_country: receiverProfile?.country,
            friend_country_code: receiverProfile?.countryCode,
            created_at: Date.now()
        });

        const friend2 = this.friendRepository.create({
            id: uuidv4(),
            user_id: request.receiver_id,
            friend_id: request.sender_id,
            friend_username: senderProfile?.username,
            friend_avatar: senderProfile?.avatar,
            friend_country: senderProfile?.country,
            friend_country_code: senderProfile?.countryCode,
            created_at: Date.now()
        });

        await this.friendRepository.save([friend1, friend2]);

        // Notify sender via socket service
        await friendsClient.notifyAccept({
            userId: request.sender_id,
            requestId: request.id,
            friendProfile: receiverProfile
        });

        return { request, senderId: request.sender_id };
    }

    /**
     * Decline a friend request
     */
    async declineRequest(receiverId: string, requestId: string) {
        const request = await this.requestRepository.findOne({
            where: { id: requestId, receiver_id: receiverId, status: 'pending' }
        });

        if (!request) {
            throw new Error('Friend request not found or unauthorized');
        }

        request.status = 'declined';
        const savedRequest = await this.requestRepository.save(request);

        // Notify sender via socket service
        await friendsClient.notifyDecline({
            userId: request.sender_id,
            requestId: request.id
        });

        return savedRequest;
    }

    /**
     * Remove a friend
     */
    async removeFriend(userId: string, friendId: string) {
        // Delete bidirectional entries
        const res1 = await this.friendRepository.delete({ user_id: userId, friend_id: friendId });
        const res2 = await this.friendRepository.delete({ user_id: friendId, friend_id: userId });

        const affected = (res1.affected || 0) > 0 || (res2.affected || 0) > 0;

        if (affected) {
            // Notify the other user via socket service
            await friendsClient.notifyRemove({
                userId: friendId,
                friendId: userId
            });
        }

        return affected;
    }

    /**
     * List all friends for a user
     */
    async getFriends(userId: string) {
        const friends = await this.friendRepository.find({
            where: { user_id: userId }
        });

        const friendIds = friends.map(f => f.friend_id);
        if (friendIds.length === 0) return [];

        const statuses = await userService.getUserStatuses(friendIds);

        return friends.map(friend => ({
            id: friend.friend_id,
            username: friend.friend_username,
            avatar: friend.friend_avatar,
            country: friend.friend_country,
            countryCode: friend.friend_country_code,
            status: statuses[friend.friend_id] || { isOnline: false, lastSeen: 0 }
        }));
    }

    /**
     * Get pending requests for a user
     */
    async getPendingRequests(userId: string) {
        const requests = await this.requestRepository.find({
            where: [
                { receiver_id: userId, status: 'pending' },
                { sender_id: userId, status: 'pending' }
            ],
            order: { created_at: 'DESC' }
        });

        if (requests.length === 0) return [];

        return requests.map((req) => {
            const isSender = req.sender_id === userId;
            return {
                ...req,
                profile: isSender ? {
                    id: req.receiver_id,
                    username: req.receiver_username,
                    avatar: req.receiver_avatar,
                    country: req.receiver_country,
                    countryCode: req.receiver_country_code
                } : {
                    id: req.sender_id,
                    username: req.sender_username,
                    avatar: req.sender_avatar,
                    country: req.sender_country,
                    countryCode: req.sender_country_code
                },
                type: isSender ? 'sent' : 'received'
            };
        });
    }
}

export const friendService = new FriendService();
