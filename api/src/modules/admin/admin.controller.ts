import { Request, Response } from 'express';
import { generateUserToken, generateRefreshToken, verifyRefreshToken } from '../../core/utils/jwt.utils';
import { successResponse, errorResponse } from '../../core/utils/response.util';
import { AppDataSource } from '../../core/config/database.config';
import { User } from '../user/user.entity';
import { CallHistory } from '../session/history.entity';
import { Friend } from '../friend/friend.entity';
import { getRedisClient } from '../../core/config/redis.config';

const ADMIN_PASSWORD = process.env.ADMIN_PANEL_PASSWORD;

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
            
            if (active_since) {
                const hours = Number(active_since);
                if (!isNaN(hours)) {
                    const cutoffTime = Date.now() - (hours * 3600000);
                    queryBuilder.andWhere('user.last_active_at > :cutoffTime', { cutoffTime });
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
                .orderBy('user.last_active_at', 'DESC')
                .skip(skip)
                .take(take)
                .getRawAndEntities();

            // Fetch real-time status from Redis if available
            const userIds = rawResults.entities.map(u => u.id);
            const redis = getRedisClient();
            let onlineStatuses: Record<string, boolean> = {};

            if (redis && userIds.length > 0) {
                try {
                    const keys = userIds.map(id => `user:status:${id}`);
                    const statuses = await redis.mget(...keys);
                    userIds.forEach((id, index) => {
                        const statusJson = statuses[index];
                        if (statusJson) {
                            try {
                                const status = JSON.parse(statusJson);
                                onlineStatuses[id] = !!status.is_online;
                            } catch (e) {
                                onlineStatuses[id] = false;
                            }
                        } else {
                            onlineStatuses[id] = false;
                        }
                    });
                } catch (error) {
                    console.error('[ADMIN] Redis error fetching statuses:', error);
                }
            }

            const usersWithStats = rawResults.entities.map((user, index) => ({
                ...user,
                friendCount: Number(rawResults.raw[index].friendCount) || 0,
                historyCount: Number(rawResults.raw[index].historyCount) || 0,
                last_active_at: Number(user.last_active_at),
                is_online: onlineStatuses[user.id] ?? false
            })).sort((a, b) => {
                if (a.is_online === b.is_online) {
                    return b.last_active_at - a.last_active_at;
                }
                return a.is_online ? -1 : 1;
            });

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
            const redis = getRedisClient();
            let isOnline = false;
            if (redis) {
                const statusJson = await redis.get(`user:status:${userId}`);
                if (statusJson) {
                    try {
                        const status = JSON.parse(statusJson);
                        isOnline = !!status.is_online;
                    } catch (e) {}
                }
            }

            const userDetails = {
                ...user,
                last_active_at: Number(user.last_active_at),
                created_at: Number(user.created_at),
                is_online: isOnline,
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
    }
};
