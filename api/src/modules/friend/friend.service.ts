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
            where: { userId: senderId, friendId: receiverId }
        });
        if (isFriend) {
            throw new Error('Already friends');
        }

        // Check for existing pending request
        const existingRequest = await this.requestRepository.findOne({
            where: [
                { senderId, receiverId, status: 'pending' },
                { senderId: receiverId, receiverId: senderId, status: 'pending' }
            ]
        });

        if (existingRequest) {
            if (existingRequest.senderId === senderId) {
                throw new Error('Friend request already sent');
            } else {
                // They already sent a request to us - auto accept or return error
                throw new Error('You already have a pending request from this user');
            }
        }

        const request = this.requestRepository.create({
            id: uuidv4(),
            senderId,
            receiverId,
            status: 'pending',
            created_at: Date.now()
        });

        const savedRequest = await this.requestRepository.save(request);
        const senderProfile = await userService.getUserProfile(senderId);

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
            where: { id: requestId, receiverId, status: 'pending' }
        });

        if (!request) {
            throw new Error('Friend request not found or unauthorized');
        }

        request.status = 'accepted';
        await this.requestRepository.save(request);

        // Create bidirectional friend entries
        const friend1 = this.friendRepository.create({
            id: uuidv4(),
            userId: request.senderId,
            friendId: request.receiverId,
            created_at: Date.now()
        });

        const friend2 = this.friendRepository.create({
            id: uuidv4(),
            userId: request.receiverId,
            friendId: request.senderId,
            created_at: Date.now()
        });

        await this.friendRepository.save([friend1, friend2]);

        const receiverProfile = await userService.getUserProfile(receiverId);

        // Notify sender via socket service
        await friendsClient.notifyAccept({
            userId: request.senderId,
            requestId: request.id,
            friendProfile: receiverProfile
        });

        return { request, senderId: request.senderId };
    }

    /**
     * Decline a friend request
     */
    async declineRequest(receiverId: string, requestId: string) {
        const request = await this.requestRepository.findOne({
            where: { id: requestId, receiverId, status: 'pending' }
        });

        if (!request) {
            throw new Error('Friend request not found or unauthorized');
        }

        request.status = 'declined';
        const savedRequest = await this.requestRepository.save(request);

        // Notify sender via socket service
        await friendsClient.notifyDecline({
            userId: request.senderId,
            requestId: request.id
        });

        return savedRequest;
    }

    /**
     * Remove a friend
     */
    async removeFriend(userId: string, friendId: string) {
        // Delete bidirectional entries
        const res1 = await this.friendRepository.delete({ userId, friendId });
        const res2 = await this.friendRepository.delete({ userId: friendId, friendId: userId });

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
            where: { userId }
        });

        const friendIds = friends.map(f => f.friendId);
        if (friendIds.length === 0) return [];

        const profiles = await Promise.all(
            friendIds.map(id => userService.getUserProfile(id))
        );

        const statuses = await userService.getUserStatuses(friendIds);

        return profiles.filter(p => p !== null).map(profile => ({
            ...profile,
            status: statuses[profile!.id] || { isOnline: false, lastSeen: 0 }
        }));
    }

    /**
     * Get pending requests for a user
     */
    async getPendingRequests(userId: string) {
        const requests = await this.requestRepository.find({
            where: [
                { receiverId: userId, status: 'pending' },
                { senderId: userId, status: 'pending' }
            ],
            order: { created_at: 'DESC' }
        });

        if (requests.length === 0) return [];

        const profiles = await Promise.all(
            requests.map(r => {
                const targetId = r.senderId === userId ? r.receiverId : r.senderId;
                return userService.getUserProfile(targetId);
            })
        );

        return requests.map((req, index) => ({
            ...req,
            profile: profiles[index],
            type: req.senderId === userId ? 'sent' : 'received'
        }));
    }
}

export const friendService = new FriendService();
