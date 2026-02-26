
import { callClient } from '../../integrations/socket/call/call.client';
import { userService } from '../user/user.service';
import { friendService } from '../friend/friend.service';

class CallService {
    /**
     * Request a direct call to another user
     */
    async requestCall(callerUserId: string, targetUserId: string, mode: 'voice' | 'video') {
        // 1. Check if target exists and is online
        const targetStatus = await userService.getUserStatus(targetUserId);
        if (!targetStatus.is_online) {
            throw new Error('User is offline');
        }

        // 2. Check friendship status (optional policy: only friends can call)
        const friendshipStatus = await friendService.getFriendshipStatus(callerUserId, targetUserId);
        if (friendshipStatus !== 'friends') {
            throw new Error('You can only call users who are on your friends list');
        }

        // 3. Signal the socket service to notify the target
        const response = await callClient.requestCall({
            caller_user_id: callerUserId,
            target_user_id: targetUserId,
            mode
        });

        if (!response.success) {
            throw new Error(response.message || 'Failed to initiate call');
        }

        return { success: true, message: 'Call initiated' };
    }

    /**
     * Respond (accept or decline) to an incoming call
     */
    async respondToCall(responderUserId: string, targetUserId: string, accepted: boolean, mode: 'voice' | 'video') {
        const response = await callClient.respondToCall({
            caller_user_id: targetUserId, // The original caller
            target_user_id: responderUserId, // The responder
            accepted,
            mode
        });

        if (!response.success) {
            throw new Error(response.message || 'Failed to respond to call');
        }

        return { success: true, accepted };
    }
}

export const callService = new CallService();
