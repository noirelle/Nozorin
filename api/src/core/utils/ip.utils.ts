import { Request } from 'express';
import { IncomingMessage } from 'http';
import * as geoip from 'geoip-lite';
import { getName } from 'country-list';

export interface GeoInfo {
    country?: string;
    country_name?: string;
}

export const getGeoInfo = (ip: string): GeoInfo | null => {
    const cleanIp = ip.replace('::ffff:', '');

    // Check for local/private IPs
    if (
        cleanIp === '::1' ||
        cleanIp === '127.0.0.1' ||
        cleanIp.includes('127.0.0.1') ||
        cleanIp.startsWith('192.168.') ||
        cleanIp.startsWith('10.') ||
        (cleanIp.startsWith('172.') &&
            parseInt(cleanIp.split('.')[1], 10) >= 16 &&
            parseInt(cleanIp.split('.')[1], 10) <= 31)
    ) {
        return null;
    }

    try {
        const geo = geoip.lookup(cleanIp);
        if (geo && geo.country) {
            return {
                country: geo.country,
                country_name: getName(geo.country) || undefined
            };
        }
    } catch (e) {
        console.error(`[GEO] Error fetching geo info for ${cleanIp}:`, e);
    }
    return null;
};

/**
 * Extracts the true client IP address from a request.
 * Handles extensive proxy headers (Cloudflare, Nginx, etc.) and falls back to socket address.
 * 
 * @param req Express Request or Node.js IncomingMessage
 * @returns The client's IP address or empty string if not found
 */
export const getClientIp = (req: Request | IncomingMessage): string => {
    const headers = (req as Request).headers || (req as IncomingMessage).headers;

    // Standard proxy header (often a comma-separated list)
    // The first IP in the list is the original client IP
    const xForwardedFor = headers['x-forwarded-for'];
    if (xForwardedFor) {
        const ips = Array.isArray(xForwardedFor) ? xForwardedFor : xForwardedFor.split(',');
        const clientIp = ips[0].trim();
        if (clientIp) return clientIp;
    }

    // Cloudflare specific
    const cfConnectingIp = headers['cf-connecting-ip'];
    if (cfConnectingIp && !Array.isArray(cfConnectingIp)) {
        return cfConnectingIp;
    }

    // Nginx real ip
    const xRealIp = headers['x-real-ip'];
    if (xRealIp && !Array.isArray(xRealIp)) {
        return xRealIp;
    }

    // Fallback to socket address
    const socketDetails = (req as Request).socket || (req as IncomingMessage).socket;
    if (socketDetails && socketDetails.remoteAddress) {
        // Handle IPv6 mapped IPv4 addresses
        return socketDetails.remoteAddress.replace('::ffff:', '');
    }

    return '';
};
