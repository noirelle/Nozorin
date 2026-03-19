import { Request, Response } from 'express';
import { generateUserToken, generateRefreshToken, verifyRefreshToken } from '../../core/utils/jwt.utils';
import { successResponse, errorResponse } from '../../core/utils/response.util';
import { AppDataSource } from '../../core/config/database.config';
import { User } from '../user/user.entity';
import { CallHistory } from '../session/history.entity';
import { Friend } from '../friend/friend.entity';
import { FriendRequest } from '../friend/friend-request.entity';
import { getRedisClient } from '../../core/config/redis.config';
import { adminClient } from '../../integrations/socket/admin/admin.client';
import { userService } from '../user/user.service';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_PANEL_PASSWORD;

/** Helper to clear all Redis keys related to a user */
async function clearUserFullCache(userId: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) return;
    try {
        await redis.del(
            `user:${userId}`,
            `user:exists:${userId}`,
            `temp_user:${userId}`
        );
    } catch (error) {
        console.error(`[ADMIN] Redis cleanup error for user ${userId}:`, error);
    }
}

export const adminController = {
    async login(req: Request, res: Response) {
        try {
            const { password } = req.body;

            if (!ADMIN_PASSWORD) {
                console.error('[ADMIN] ADMIN_PANEL_PASSWORD is not set in environment');
                return res.status(500).json(errorResponse('Server configuration error'));
            }

            if (password !== ADMIN_PASSWORD) {
                return res.status(401).json(errorResponse('Invalid admin credentials'));
            }

            // Generate Admin Access Token (15m)
            const token = generateUserToken('admin-user', 'admin');

            // Generate Admin Refresh Token (7d)
            const refreshToken = generateRefreshToken('admin-user');

            // Set refresh token cookie
            res.cookie('nz_admin_refresh_token', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7d
            });

            return res.status(200).json(successResponse({
                token,
                expiresIn: '15m'
            }, 'Admin login successful'));

        } catch (error) {
            console.error('[ADMIN] Login error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    },

    async refresh(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies['nz_admin_refresh_token'];

            if (!refreshToken) {
                return res.status(401).json(errorResponse('Refresh token missing'));
            }

            const payload = verifyRefreshToken(refreshToken);
            if (!payload || !payload.userId) {
                return res.status(403).json(errorResponse('Invalid refresh token'));
            }

            // We use a static ID for the admin user
            if (payload.userId !== 'admin-user') {
                return res.status(403).json(errorResponse('Invalid token payload'));
            }

            // Generate new access token
            const newToken = generateUserToken('admin-user', 'admin');

            return res.status(200).json(successResponse({
                token: newToken,
                expiresIn: '15m'
            }, 'Token refreshed successfully'));

        } catch (error) {
            console.error('[ADMIN] Refresh token error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    },

    async logout(req: Request, res: Response) {
        res.clearCookie('nz_admin_refresh_token');
        return res.status(200).json(successResponse(null, 'Logged out successfully'));
    },

    async getStats(req: Request, res: Response) {
        try {
            const result = await AppDataSource.query(`
                SELECT 
                    COUNT(*) as totalUsers,
                    SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) as totalFemales,
                    SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) as totalMales,
                    SUM(CASE WHEN is_claimed = true THEN 1 ELSE 0 END) as totalClaimed
                FROM users
            `);

            const stats = result[0];

            return res.status(200).json(successResponse({
                totalUsers: Number(stats.totalUsers) || 0,
                totalFemales: Number(stats.totalFemales) || 0,
                totalMales: Number(stats.totalMales) || 0,
                totalClaimed: Number(stats.totalClaimed) || 0
            }, 'Statistics fetched successfully'));

        } catch (error) {
            console.error('[ADMIN] Get stats error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    },

    async listUsers(req: Request, res: Response) {
        try {
            const { page = 1, limit = 10, gender, is_claimed, search, active_since } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);

            const queryBuilder = AppDataSource.getRepository(User).createQueryBuilder('user');

            if (gender && gender !== 'all') {
                queryBuilder.andWhere('user.gender = :gender', { gender });
            }

            if (is_claimed !== undefined && is_claimed !== 'all') {
                queryBuilder.andWhere('user.is_claimed = :isClaimed', { isClaimed: is_claimed === 'true' });
            }

            if (search) {
                queryBuilder.andWhere('user.username LIKE :search', { search: `%${search}%` });
            }
            
            const zombieCutoff = Date.now() - (15 * 60 * 1000); // 15 mins

            if (active_since) {
                const hours = Number(active_since);
                if (!isNaN(hours)) {
                    const cutoffTime = Date.now() - (hours * 3600000);
                    queryBuilder.andWhere('(user.last_active_at > :cutoffTime OR (user.is_online = true AND user.last_active_at > :zombieCutoff))', { 
                        cutoffTime,
                        zombieCutoff
                    });
                }
            }

            // Efficiently get counts via subqueries
            queryBuilder
                .addSelect(subQuery => {
                    return subQuery
                        .select('COUNT(f.id)', 'friendCount')
                        .from('friends', 'f')
                        .where('f.user_id = user.id');
                }, 'friendCount')
                .addSelect(subQuery => {
                    return subQuery
                        .select('COUNT(h.id)', 'historyCount')
                        .from('call_history', 'h')
                        .where('h.user_id = user.id');
                }, 'historyCount');

            const total = await queryBuilder.getCount();
            const rawResults = await queryBuilder
                // Primary sort: Truly online users (is_online = true AND not a zombie)
                .orderBy(`CASE WHEN user.is_online = true AND user.last_active_at > ${zombieCutoff} THEN 1 ELSE 0 END`, 'DESC')
                // Secondary sort: Most recently active
                .addOrderBy('user.last_active_at', 'DESC')
                .skip(skip)
                .take(take)
                .getRawAndEntities();

            // Fetch real-time status from Redis if available
            const userIds = rawResults.entities.map(u => u.id);
            const userStatuses = await userService.getUserStatuses(userIds);

            const usersWithStats = rawResults.entities.map((user, index) => ({
                ...user,
                friendCount: Number(rawResults.raw[index].friendCount) || 0,
                historyCount: Number(rawResults.raw[index].historyCount) || 0,
                last_active_at: Number(user.last_active_at),
                is_online: userStatuses[user.id]?.is_online ?? false
            }));

            return res.status(200).json(successResponse({
                users: usersWithStats,
                total,
                page: Number(page),
                limit: Number(limit)
            }, 'Users fetched successfully'));

        } catch (error) {
            console.error('[ADMIN] List users error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    },

    async getUserDetails(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            const user = await AppDataSource.getRepository(User).findOneBy({ id: userId });
            if (!user) {
                return res.status(404).json(errorResponse('User not found'));
            }

            // Fetch recent match history (limit 10)
            const [history, historyCount] = await AppDataSource.getRepository(CallHistory).findAndCount({
                where: { user_id: userId },
                order: { created_at: 'DESC' },
                take: 10
            });

            // Fetch friends (limit 10)
            const [friends, friendCount] = await AppDataSource.getRepository(Friend).findAndCount({
                where: { user_id: userId },
                order: { created_at: 'DESC' },
                take: 10
            });

            // Get real-time status
            const status = await userService.getUserStatus(userId);

            const userDetails = {
                ...user,
                last_active_at: Number(user.last_active_at),
                created_at: Number(user.created_at),
                is_online: status.is_online,
                history: history.map(h => ({ ...h, created_at: Number(h.created_at) })),
                friends: friends.map(f => ({ ...f, created_at: Number(f.created_at) })),
                historyCount,
                friendCount
            };

            return res.status(200).json(successResponse(userDetails, 'User details fetched successfully'));

        } catch (error) {
            console.error('[ADMIN] Get user details error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    },

    async updateUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const { username, gender } = req.body;

            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOneBy({ id: userId });

            if (!user) {
                return res.status(404).json(errorResponse('User not found'));
            }

            // Update allowed fields
            if (username) user.username = username;
            if (gender) user.gender = gender;

            await userRepository.save(user);

            // Clear ALL Redis status caches & profile cache
            await clearUserFullCache(userId);

            // Notify user and friends about the profile change
            try {
                await adminClient.updateUserProfile(userId, user);
            } catch (err) {
                console.error('[ADMIN] Failed to notify socket service of profile update:', err);
            }

            return res.status(200).json(successResponse(user, 'User updated successfully'));
        } catch (error) {
            console.error('[ADMIN] Update user error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    },

    async deleteUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;

            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOneBy({ id: userId });

            if (!user) {
                return res.status(404).json(errorResponse('User not found'));
            }

            // 1. Notify friends before deleting from DB
            try {
                await adminClient.notifyUserDeleted(userId);
            } catch (err) {
                console.error('[ADMIN] Failed to notify friends of user deletion:', err);
            }

            // 2. Manual Cleanup of related records to avoid constraint errors
            try {
                // Delete Call History
                await AppDataSource.getRepository(CallHistory).delete({ user_id: userId });
                
                // Delete Friendships (both sides)
                await AppDataSource.getRepository(Friend).delete([
                    { user_id: userId },
                    { friend_id: userId }
                ]);

                // Delete Friend Requests (both sides)
                await AppDataSource.getRepository(FriendRequest).delete([
                    { sender_id: userId },
                    { receiver_id: userId }
                ]);

            } catch (err) {
                console.error('[ADMIN] Manual cleanup failed during user deletion:', err);
                // We continue anyway, as userRepository.remove(user) might still work or give more specific error
            }

            // 3. Delete from DB
            await userRepository.remove(user);

            // 4. Thorough Redis cleanup
            await clearUserFullCache(userId);

            // 5. Force disconnect from Socket Service
            try {
                await adminClient.disconnectUser(userId);
            } catch (err) {
                console.error('[ADMIN] Failed to notify socket service of user deletion:', err);
            }

            return res.status(200).json(successResponse(null, 'User deleted successfully'));
        } catch (error) {
            console.error('[ADMIN] Delete user error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    },

    async deleteCallHistory(req: Request, res: Response) {
        try {
            const { historyId } = req.params;
            const historyRepo = AppDataSource.getRepository(CallHistory);
            
            const history = await historyRepo.findOneBy({ id: historyId });
            if (!history) {
                return res.status(404).json(errorResponse('History record not found'));
            }

            await historyRepo.remove(history);
            return res.status(200).json(successResponse(null, 'History record deleted successfully'));
        } catch (error) {
            console.error('[ADMIN] Delete history error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    },

    async deleteFriend(req: Request, res: Response) {
        try {
            const { friendId } = req.params;
            const friendRepo = AppDataSource.getRepository(Friend);

            const friend = await friendRepo.findOneBy({ id: friendId });
            if (!friend) {
                return res.status(404).json(errorResponse('Friend record not found'));
            }

            const { user_id, friend_id } = friend;

            await friendRepo.remove(friend);

            // Notify both users via socket
            try {
                await Promise.all([
                    adminClient.notifyFriendRemoved(user_id, friend_id),
                    adminClient.notifyFriendRemoved(friend_id, user_id)
                ]);
            } catch (err) {
                console.error('[ADMIN] Failed to notify users of friend removal:', err);
            }

            return res.status(200).json(successResponse(null, 'Friendship removed successfully'));
        } catch (error) {
            console.error('[ADMIN] Delete friend error:', error);
            return res.status(500).json(errorResponse('Internal server error', error));
        }
    }
};
