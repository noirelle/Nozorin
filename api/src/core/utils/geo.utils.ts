interface IpWhoIsResponse {
    ip: string;
    success: boolean;
    type: string;
    continent: string;
    continent_code: string;
    country: string;
    country_code: string;
    region: string;
    region_code: string;
    city: string;
    latitude: number;
    longitude: number;
    is_eu: boolean;
    postal: string;
    calling_code: string;
    capital: string;
    borders: string;
    flag: {
        img: string;
        emoji: string;
        emoji_unicode: string;
    };
    connection: {
        asn: number;
        org: string;
        isp: string;
        domain: string;
    };
    timezone: {
        id: string;
        abbr: string;
        is_dst: boolean;
        offset: number;
        utc: string;
        current_time: string;
    };
}

export const getGeoInfo = async (ip: string): Promise<{ code: string; name: string }> => {
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

    try {
        const response = await fetch(`http://ipwho.is/${cleanIp}`);

        if (!response.ok) {
            console.warn(`[GEO] Failed to fetch geo info for ${cleanIp}: ${response.statusText}`);
            return { code: 'UN', name: 'Unknown' };
        }

        const data = (await response.json()) as IpWhoIsResponse;

        if (data.success) {
            return { code: data.country_code, name: data.country };
        } else {
            console.warn(`[GEO] ipwho.is returned success:false for ${cleanIp}`);
            return { code: 'UN', name: 'Unknown' };
        }

    } catch (e) {
        console.error(`[GEO] Error fetching geo info regarding ${cleanIp}:`, e);
        return { code: 'UN', name: 'Unknown' };
    }
};
