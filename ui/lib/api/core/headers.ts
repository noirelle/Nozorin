/**
 * Helper to extract and value-check headers that should be proxied from Next.js to Backend.
 * @param req NextRequest or Request
 */
export const getProxyHeaders = (req: Request): HeadersInit => {
    const headers: HeadersInit = {};

    // Forward real IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
        headers['x-forwarded-for'] = forwardedFor;
    }

    // Forward real IP fallback (e.g. from Cloudflare)
    const realIp = req.headers.get('x-real-ip');
    if (realIp) {
        headers['x-real-ip'] = realIp;
    }

    // Forward connecting IP (Cloudflare)
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
        headers['cf-connecting-ip'] = cfConnectingIp;
    }

    // Forward User-Agent for device detection
    const userAgent = req.headers.get('user-agent');
    if (userAgent) {
        headers['user-agent'] = userAgent;
    }

    // Forward Auth (or extract from cookie)
    const auth = req.headers.get('authorization');
    if (auth) {
        headers['authorization'] = auth;
    } else {
        // Fallback: Extract from cookie
        const cookie = req.headers.get('cookie');
        if (cookie) {
            const match = cookie.match(/nz_token=([^;]+)/);
            if (match && match[1]) {
                headers['authorization'] = `Bearer ${match[1]}`;
            }
        }
    }

    // Forward Cookies (critical for session)
    const cookie = req.headers.get('cookie');
    if (cookie) {
        headers['cookie'] = cookie;
    }

    return headers;
};
