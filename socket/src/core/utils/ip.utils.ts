import { IncomingMessage } from 'http';
import * as geoip from 'geoip-lite';
import { getName } from 'country-list';

export interface GeoInfo {
    country?: string;
    country_name?: string;
}

export const getGeoInfo = (ip: string): GeoInfo | null => {
    const cleanIp = ip.replace('::ffff:', '');

    const isPrivate =
        cleanIp === '::1' ||
        cleanIp === '127.0.0.1' ||
        cleanIp.startsWith('192.168.') ||
        cleanIp.startsWith('10.') ||
        (cleanIp.startsWith('172.') &&
            parseInt(cleanIp.split('.')[1], 10) >= 16 &&
            parseInt(cleanIp.split('.')[1], 10) <= 31);

    if (isPrivate) return null;

    try {
        const geo = geoip.lookup(cleanIp);
        if (geo && geo.country) {
            return {
                country: geo.country,
                country_name: getName(geo.country) || undefined
            };
        }
    } catch (e) {
        console.error(`[GEO] Error fetching geo info:`, e);
    }
    return null;
};

export const getClientIp = (req: IncomingMessage): string => {
    const headers = req.headers;

    const xForwardedFor = headers['x-forwarded-for'];
    if (xForwardedFor) {
        const ips = Array.isArray(xForwardedFor) ? xForwardedFor : xForwardedFor.split(',');
        const clientIp = ips[0].trim();
        if (clientIp) return clientIp;
    }

    const cfConnectingIp = headers['cf-connecting-ip'];
    if (cfConnectingIp && !Array.isArray(cfConnectingIp)) return cfConnectingIp;

    const xRealIp = headers['x-real-ip'];
    if (xRealIp && !Array.isArray(xRealIp)) return xRealIp;

    const socket = req.socket;
    if (socket?.remoteAddress) {
        return socket.remoteAddress.replace('::ffff:', '');
    }

    return '';
};
