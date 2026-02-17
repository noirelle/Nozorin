import { Request, Response } from 'express';
import { userService } from '../user/user.service';
import { generateUserToken } from '../../core/utils/jwt.utils';
import { CreateUserDto } from '../../shared/types/user.types';
import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from '../../core/config/redis.config';


export const authController = {
    async guestLogin(req: Request, res: Response) {
        console.log('[AUTH] guestLogin request received');
        try {
            const { gender, agreed, sessionId, footprint, deviceId } = req.body;

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

            // 1. Check for existing unclaimed guest profile to prevent ghosting/spam
            let user = await userService.findExistingGuest(cleanIp, deviceId);

            if (user) {
                console.log(`[AUTH] Reusing existing guest profile: ${user.id}`);
                // Refresh activity on reuse
                user.last_active_at = Date.now();
                // Optionally update device_id if it was null before
                if (deviceId && !user.device_id) user.device_id = deviceId;
                await userService.saveUserProfile(user); // Persist the updated last_active_at and device_id
            } else {
                // 2. Create new guest user if none found
                const createUserDto: CreateUserDto = {
                    gender,
                    agreed,
                    ip: cleanIp,
                    deviceId,
                    sessionId,
                    footprint
                };
                user = await userService.createGuestUser(createUserDto);
                console.log(`[AUTH] New guest user created: ${user.id}`);
            }

            return res.status(200).json({
                user,
                is_new: Date.now() - (user.created_at || 0) < 5000
            });

        } catch (error) {
            console.error('[AUTH] Guest login error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    async anonymousIdentityLogin(req: Request, res: Response) {
        try {
            const { chatIdentityId } = req.body;

            if (!chatIdentityId) {
                return res.status(400).json({ error: 'Missing chatIdentityId' });
            }

            let user = await userService.getUserProfile(chatIdentityId);

            // If not found in main storage, check temp cache
            if (!user) {
                user = userService.getTempUser(chatIdentityId) || null;
            }

            if (user) {
                // Ensure profile is marked as unclaimed and persisted to MySQL
                user.is_claimed = false;
                await userService.saveUserProfile(user);
            }

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Sync with Supabase asynchronously
            // supabaseService.syncProfile({
            //     id: user.id,
            //     username: user.username,
            //     display_name: user.username || 'Guest',
            //     avatar_url: user.avatar,
            //     country: user.country || null,
            //     city: user.city || null,
            //     timezone: user.timezone || null,
            //     is_claimed: false,
            //     is_anonymous: true
            // }).catch(err => console.error('[AUTH] Supabase sync failure:', err));

            // Generate JWT with 24h expiry
            const token = generateUserToken(user.id, '24h');

            // Generate session ID
            const sid = uuidv4();

            await userService.saveSession(sid, user.id, 24 * 60 * 60);

            // Set cookie
            res.cookie('nz_sid', sid, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 // 24h
            });


            const requestId = Math.random().toString(36).substring(2, 10);

            return res.status(201).json({
                id: user.id,
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
