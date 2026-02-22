import IPLocate from 'node-iplocate';

export interface GeoInfo {
    country?: string;
    country_code?: string;
    city?: string;
}

export const getGeoInfo = async (ip: string): Promise<GeoInfo | null> => {
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
        const client = new IPLocate(process.env.IPLOCATE_API_KEY || '');
        const response = await client.lookup(cleanIp);
        if (response?.ip) return response as GeoInfo;
        return null;
    } catch {
        return null;
    }
};
