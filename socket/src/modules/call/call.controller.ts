import { Server, Socket } from 'socket.io';
import { SocketEvents } from '../../socket/socket.events';
import { userService } from '../../shared/services/user.service';
import { logger } from '../../core/logger';
import { activeCalls, reconnectingUsers, waitingForPartner } from './call.store';
import { callService } from './call.service';
import { CallDisconnectReason } from '../../shared/types/socket.types';
import { getRedisClient } from '../../core/config/redis.config';

export const register = (io: Server, socket: Socket): void => {
    socket.on(SocketEvents.END_CALL, async (data: { target: string | null, reason?: CallDisconnectReason }, callback?: (ack: any) => void) => {
        const success = await callService.handleEndCall(io, socket.id, data);
        if (callback) callback({ success });
    });

    socket.on(SocketEvents.REJOIN_CALL, async (data: { room_id?: string }) => {
        const userId = userService.getUserId(socket.id);
        if (!userId) {
            socket.emit(SocketEvents.REJOIN_FAILED, { reason: 'user-not-identified' });
            return;
        }

        // Check in-memory first, then fall back to Redis
        let rejoinInfo = reconnectingUsers.get(userId);
        if (!rejoinInfo) {
            rejoinInfo = (await callService.getActiveCall(userId)) as any;
            if (rejoinInfo) {
                reconnectingUsers.set(userId, rejoinInfo);
                logger.info({ userId }, '[CALL] Restored rejoin info from Redis fallback');
            }
        }
        if (!rejoinInfo) {
            socket.emit(SocketEvents.REJOIN_FAILED, { reason: 'no-rejoin-session' });
            socket.emit(SocketEvents.CALL_ENDED, { reason: 'no-rejoin-session' });
            return;
        }

        if (Date.now() > rejoinInfo.expires_at) {
            reconnectingUsers.delete(userId);
            waitingForPartner.delete(userId);
            socket.emit(SocketEvents.REJOIN_FAILED, { reason: 'session-expired' });
            socket.emit(SocketEvents.CALL_ENDED, { reason: 'session-expired' });
            return;
        }

        // Single synchronous check — no polling loop
        let currentPartnerSocketId = userService.getSocketId(rejoinInfo.partner_user_id);

        if (!currentPartnerSocketId && rejoinInfo.partner_user_id !== 'unknown') {
            // Partner not yet identified. Register ourselves as waiting and tell the
            // client to stand by. When the partner's REJOIN_CALL handler runs it will
            // find this entry and resolve us immediately — no polling needed.
            waitingForPartner.set(rejoinInfo.partner_user_id, socket.id);

            // Also update the partner's rejoin entry so they know our new socket ID
            const partnerRejoin = reconnectingUsers.get(rejoinInfo.partner_user_id);
            if (partnerRejoin) {
                partnerRejoin.partner_socket_id = socket.id;
                reconnectingUsers.set(rejoinInfo.partner_user_id, partnerRejoin);
                const redis = getRedisClient();
                if (redis) {
                    await redis.set(`call:reconnect:${rejoinInfo.partner_user_id}`, JSON.stringify(partnerRejoin), 'EX', 30);
                }
            }

            logger.info({ userId, partnerUserId: rejoinInfo.partner_user_id }, '[CALL] Partner not ready yet — registered in waitingForPartner');
            socket.emit(SocketEvents.REJOIN_FAILED, { reason: 'partner-not-ready' });
            return;
        }

        // Guard: if the partner is already in a new call with a DIFFERENT user, the session is stale
        // Compare by user ID, not socket ID, because sockets change on refresh
        const partnerActiveCall = activeCalls.get(currentPartnerSocketId!);
        if (partnerActiveCall && partnerActiveCall.partner_id !== socket.id) {
            const partnerCurrentPartnerUserId = userService.getUserId(partnerActiveCall.partner_id);
            if (partnerCurrentPartnerUserId && partnerCurrentPartnerUserId !== userId) {
                logger.info({ userId, partnerSocketId: currentPartnerSocketId, partnerCurrentPartnerUserId },
                    '[CALL] Partner already in a new call with a different user — rejoin session is stale');
                reconnectingUsers.delete(userId);
                waitingForPartner.delete(userId);
                const redis = getRedisClient();
                if (redis) await redis.del(`call:reconnect:${userId}`);
                socket.emit(SocketEvents.REJOIN_FAILED, { reason: 'session-expired' });
                socket.emit(SocketEvents.CALL_ENDED, { reason: 'session-expired' });
                return;
            }
            // Same user, different socket (refresh) — continue normally
        }

        const startTime = rejoinInfo.start_time;

        // Guard: if the partner's concurrent REJOIN handler already set up activeCalls for us,
        // just clean up and return. The user already received PARTNER_RECONNECTED from the
        // other handler, which handles WebRTC setup. Emitting REJOIN_SUCCESS here would cause
        // the client to call closePeerConnection() and destroy the connection just established.
        const existingCall = activeCalls.get(socket.id);
        if (existingCall && existingCall.partner_id === currentPartnerSocketId) {
            reconnectingUsers.delete(userId);
            waitingForPartner.delete(userId);
            const redis = getRedisClient();
            if (redis) await redis.del(`call:reconnect:${userId}`);
            logger.info({ socketId: socket.id, user_id: userId }, '[CALL] Concurrent rejoin detected — already set up by partner handler, skipping');
            return;
        }

        const oldSocketId = [...activeCalls.entries()].find(
            ([k, v]) => v.partner_id === currentPartnerSocketId
        )?.[0];

        if (oldSocketId) {
            activeCalls.delete(oldSocketId);
        }

        activeCalls.set(socket.id, { partner_id: currentPartnerSocketId!, start_time: startTime, last_seen: Date.now(), is_offerer: rejoinInfo.is_offerer, room_id: rejoinInfo.room_id });
        activeCalls.set(currentPartnerSocketId!, { partner_id: socket.id, start_time: startTime, last_seen: Date.now(), is_offerer: !rejoinInfo.is_offerer, room_id: rejoinInfo.room_id });
        reconnectingUsers.delete(userId);
        waitingForPartner.delete(userId);

        // Also clean up partner's reconnect entry if they had one
        if (rejoinInfo.partner_user_id !== 'unknown') {
            reconnectingUsers.delete(rejoinInfo.partner_user_id);
            waitingForPartner.delete(rejoinInfo.partner_user_id);
            const redis = getRedisClient();
            if (redis) await redis.del(`call:reconnect:${rejoinInfo.partner_user_id}`);
        }

        const partnerProfile = await userService.getUserProfile(rejoinInfo.partner_user_id);

        let friendshipStatus = 'none';
        if (userId && rejoinInfo.partner_user_id && rejoinInfo.partner_user_id !== 'unknown') {
            friendshipStatus = await userService.getFriendshipStatus(userId, rejoinInfo.partner_user_id);
        }

        socket.emit(SocketEvents.REJOIN_SUCCESS, {
            partner_id: currentPartnerSocketId,
            partner_user_id: rejoinInfo.partner_user_id,
            partner_username: partnerProfile?.username,
            partner_avatar: partnerProfile?.avatar,
            partner_gender: partnerProfile?.gender,
            partner_country_name: partnerProfile?.country_name,
            partner_country: partnerProfile?.country,
            friendship_status: friendshipStatus,
            room_id: rejoinInfo.room_id,
            role: rejoinInfo.is_offerer ? 'offerer' : 'answerer'
        });

        let reverseStatus = friendshipStatus;
        if (friendshipStatus === 'pending_sent') reverseStatus = 'pending_received';
        else if (friendshipStatus === 'pending_received') reverseStatus = 'pending_sent';

        const userProfile = await userService.getUserProfile(userId);

        io.to(currentPartnerSocketId!).emit(SocketEvents.PARTNER_RECONNECTED, {
            new_socket_id: socket.id,
            new_user_id: userId,
            partner_username: userProfile?.username,
            partner_avatar: userProfile?.avatar,
            partner_gender: userProfile?.gender,
            partner_country_name: userProfile?.country_name,
            partner_country: userProfile?.country,
            friendship_status: reverseStatus,
            your_role: rejoinInfo.is_offerer ? 'answerer' : 'offerer'
        });

        logger.info({ socketId: socket.id, user_id: userId, partner_id: currentPartnerSocketId }, '[CALL] Call rejoined successfully');

        // ── Event-driven resolution for the waiting side ──────────────────────
        // If our partner was already registered in waitingForPartner (i.e., they
        // arrived first and got 'partner-not-ready'), resolve them now immediately
        // without waiting for a client retry.
        const waitingSocketId = waitingForPartner.get(userId);
        if (waitingSocketId) {
            waitingForPartner.delete(userId);
            const waitingUserId = userService.getUserId(waitingSocketId);
            if (waitingUserId) {
                let waitingRejoinInfo = reconnectingUsers.get(waitingUserId);
                if (!waitingRejoinInfo) {
                    waitingRejoinInfo = (await callService.getActiveCall(waitingUserId)) as any;
                }

                if (waitingRejoinInfo && Date.now() <= waitingRejoinInfo.expires_at) {
                    // Set up activeCalls for the waiting user (they haven't gone through
                    // the success path yet — their entry may already be set from above if
                    // we used their socket ID, but set it cleanly regardless)
                    activeCalls.set(waitingSocketId, { partner_id: socket.id, start_time: startTime, last_seen: Date.now(), is_offerer: !rejoinInfo.is_offerer, room_id: rejoinInfo.room_id });
                    activeCalls.set(socket.id, { partner_id: waitingSocketId, start_time: startTime, last_seen: Date.now(), is_offerer: rejoinInfo.is_offerer, room_id: rejoinInfo.room_id });

                    reconnectingUsers.delete(waitingUserId);

                    const waitingPartnerProfile = await userService.getUserProfile(userId);

                    let waitingFriendshipStatus = 'none';
                    if (waitingUserId && userId && userId !== 'unknown') {
                        waitingFriendshipStatus = await userService.getFriendshipStatus(waitingUserId, userId);
                    }

                    io.to(waitingSocketId).emit(SocketEvents.REJOIN_SUCCESS, {
                        partner_id: socket.id,
                        partner_user_id: userId,
                        partner_username: waitingPartnerProfile?.username,
                        partner_avatar: waitingPartnerProfile?.avatar,
                        partner_gender: waitingPartnerProfile?.gender,
                        partner_country_name: waitingPartnerProfile?.country_name,
                        partner_country: waitingPartnerProfile?.country,
                        friendship_status: waitingFriendshipStatus,
                        room_id: waitingRejoinInfo.room_id,
                        role: waitingRejoinInfo.is_offerer ? 'offerer' : 'answerer'
                    });

                    let waitingReverseStatus = waitingFriendshipStatus;
                    if (waitingFriendshipStatus === 'pending_sent') waitingReverseStatus = 'pending_received';
                    else if (waitingFriendshipStatus === 'pending_received') waitingReverseStatus = 'pending_sent';

                    const waitingUserProfile = await userService.getUserProfile(waitingUserId);

                    // Also send PARTNER_RECONNECTED to the side that just completed
                    // so it knows the waiting user is resolved too
                    socket.emit(SocketEvents.PARTNER_RECONNECTED, {
                        new_socket_id: waitingSocketId,
                        new_user_id: waitingUserId,
                        partner_username: waitingUserProfile?.username,
                        partner_avatar: waitingUserProfile?.avatar,
                        partner_gender: waitingUserProfile?.gender,
                        partner_country_name: waitingUserProfile?.country_name,
                        partner_country: waitingUserProfile?.country,
                        friendship_status: waitingReverseStatus,
                        your_role: rejoinInfo.is_offerer ? 'answerer' : 'offerer'
                    });

                    logger.info({ waitingSocketId, waitingUserId, resolvedBySocketId: socket.id }, '[CALL] Proactively resolved waiting user via waitingForPartner');
                }
            }
        }
    });

    socket.on(SocketEvents.CANCEL_RECONNECT, async () => {
        const userId = userService.getUserId(socket.id);
        if (userId) {
            const info = reconnectingUsers.get(userId);
            if (info) {
                // Notify partner at their last known socket (may be stale, that's OK)
                io.to(info.partner_socket_id).emit(SocketEvents.CALL_ENDED, { reason: 'partner-cancelled' });
                activeCalls.delete(info.partner_socket_id);

                // Clean up BOTH sides' reconnecting entries
                reconnectingUsers.delete(userId);
                waitingForPartner.delete(userId);
                const redis = getRedisClient();
                if (redis) await redis.del(`call:reconnect:${userId}`);

                // Also clean up the partner's reconnecting entry by user ID
                if (info.partner_user_id && info.partner_user_id !== 'unknown') {
                    reconnectingUsers.delete(info.partner_user_id);
                    waitingForPartner.delete(info.partner_user_id);
                    if (redis) await redis.del(`call:reconnect:${info.partner_user_id}`);
                }
            }
            logger.info({ socketId: socket.id, user_id: userId }, '[CALL] Reconnection cancelled');
        }
    });

    socket.on(SocketEvents.PING, () => {
        callService.handlePing(socket.id);
        socket.emit(SocketEvents.PONG);
    });
};


