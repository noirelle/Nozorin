import { Request, Response } from 'express';
import { generateUserToken, generateRefreshToken, verifyRefreshToken } from '../../core/utils/jwt.utils';
import { successResponse, errorResponse } from '../../core/utils/response.util';
import { AppDataSource } from '../../core/config/database.config';
import { User } from '../user/user.entity';

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
    }
};
