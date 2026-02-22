import { IncomingMessage } from 'http';

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
