import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { generateUserToken } from '../utils/jwtUtils';
import { CreateUserDto } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from '../config/redis';

export const authController = {
    async guestLogin(req: Request, res: Response) {
        console.log('[AUTH] guestLogin request received');
        try {
            const { gender, agreed, sessionId, footprint } = req.body;

            // robust IP extraction
            const xForwardedFor = req.headers['x-forwarded-for'];
            let ip = '';
            if (Array.isArray(xForwardedFor)) {
                ip = xForwardedFor[0];
            } else {
                ip = (xForwardedFor as string) || req.socket.remoteAddress || '';
            }
            // clean up if comma separated
            const cleanIp = (ip.split(',')[0] || '').trim();

            console.log(`[AUTH] Extracted IP: ${cleanIp}`);

            if (!cleanIp) {
                console.warn('[AUTH] Cannot determine IP');
                return res.status(400).json({ error: 'Cannot determine IP address' });
            }

            // Create or retrieve guest user
            const createUserDto: CreateUserDto = {
                gender,
                agreed,
                ip: cleanIp,
                sessionId,
                footprint
            };

            const user = await userService.createGuestUser(createUserDto);
            console.log(`[AUTH] Guest user created: ${user?.id}`);

            return res.status(200).json({
                user,
                is_new: Date.now() - (user.created_at || 0) < 5000
            });

        } catch (error) {
            console.error('[AUTH] Guest login error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async tokenLogin(req: Request, res: Response) {
        try {
            const { chatIdentityId } = req.body;

            if (!chatIdentityId) {
                return res.status(400).json({ error: 'Missing chatIdentityId' });
            }

            let user = await userService.getUserProfile(chatIdentityId);

            // If not found in main storage, check temp cache
            if (!user) {
                user = userService.getTempUser(chatIdentityId) || null;
                if (user) {
                    // It's a new guest user confirming their session. Now save them for real.
                    await userService.saveUserProfile(user);

                    // Also save IP mapping and footprint if needed?
                    // Ideally we should have passed IP/footprint to saveUserProfile or stored it in tempUser
                    // For now, saveUserProfile saves basic profile.
                    // We might need to handle IP mapping separately or add it to saveUserProfile logic if critical.
                }
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Generate JWT with 24h expiry
            const token = generateUserToken(user.id, '24h');

            // Generate session ID
            const sid = uuidv4();

            // Store session in Redis
            // Store session (Redis with fallback)
            await userService.saveSession(sid, user.id, 24 * 60 * 60);

            // Set cookie
            res.cookie('nz_sid', sid, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 // 24h
            });

            // Generate a short request ID
            const requestId = Math.random().toString(36).substring(2, 10);

            return res.status(201).json({
                userId: user.id,
                token,
                expiresIn: '24h',
                chatIdentityLinked: true,
                requestId,
                profile: {
                    username: user.username,
                    displayName: user.username || 'Guest',
                    avatar: user.avatar,
                    country: user.country || null,
                    city: user.city || null,
                    timezone: user.timezone || null
                }
            });
        } catch (error) {
            console.error('[AUTH] Token login error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
};
