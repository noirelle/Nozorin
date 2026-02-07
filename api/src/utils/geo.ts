
import geoip from 'geoip-lite';

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const getGeoInfo = (ip: string): { code: string; name: string } => {
    // Check for local/private IPs
    if (
        ip === '::1' ||
        ip === '127.0.0.1' ||
        ip.includes('127.0.0.1') ||
        ip.startsWith('192.168.') ||
        ip.startsWith('10.') ||
        ip.startsWith('172.')
    ) {
        return { code: 'UN', name: 'Unknown (Local)' };
    }

    const cleanIp = ip.replace('::ffff:', '');
    const geo = geoip.lookup(cleanIp);

    if (geo && geo.country) {
        try {
            const name = countryNames.of(geo.country) || geo.country;
            return { code: geo.country, name };
        } catch (e) {
            return { code: geo.country, name: geo.country };
        }
    }

    return { code: 'UN', name: 'Unknown' };
};
