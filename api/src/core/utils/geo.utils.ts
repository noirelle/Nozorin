import IPLocate from 'node-iplocate';

export interface LookupResponse {
    ip: string;
    country?: string;
    country_code?: string;
    is_eu: boolean;
    city?: string;
    continent?: string;
    latitude?: number;
    longitude?: number;
    time_zone?: string;
    postal_code?: string;
    subdivision?: string;
    currency_code?: string;
    calling_code?: string;
    network?: string;
    asn?: ASN;
    privacy: Privacy;
    company?: Company;
    hosting?: Hosting;
    abuse?: Abuse;
}

interface ASN {
    asn: string;
    name: string;
    domain: string;
    route: string;
    type: string;
}

interface Privacy {
    vpn: boolean;
    proxy: boolean;
    tor: boolean;
    relay: boolean;
    hosting: boolean;
    service: string;
}

interface Company {
    name: string;
    domain: string;
    type: string;
}

interface Hosting {
    provider?: string;
    domain?: string;
    network?: string;
    region?: string;
    service?: string;
}

interface Abuse {
    address?: string;
    country?: string;
    email?: string;
    name?: string;
    network?: string;
    phone?: string;
}

export const getGeoInfo = async (ip: string): Promise<LookupResponse | null> => {
    const cleanIp = ip.replace('::ffff:', '');

    // Check for local/private IPs
    if (
        cleanIp === '::1' ||
        cleanIp === '127.0.0.1' ||
        cleanIp.includes('127.0.0.1') ||
        cleanIp.startsWith('192.168.') ||
        cleanIp.startsWith('10.') ||
        // 172.16.0.0 - 172.31.255.255
        (cleanIp.startsWith('172.') &&
            parseInt(cleanIp.split('.')[1], 10) >= 16 &&
            parseInt(cleanIp.split('.')[1], 10) <= 31)
    ) {
        return null; // Local IP has no geo info
    }

    try {
        const client = new IPLocate(process.env.IPLOCATE_API_KEY || '');
        const response = await client.lookup(cleanIp);

        // node-iplocate returns the response directly
        // We verify if it has basic info or success indicator (implicit via content)
        if (response && response.ip) {
            // Cast to our interface if needed, or rely on compatibility

            return response as unknown as LookupResponse;

        }

        console.warn(`[GEO] node-iplocate returned partial/empty response for ${cleanIp}`);
        return null;

    } catch (e) {
        console.error(`[GEO] Error fetching geo info regarding ${cleanIp}:`, e);
        return null;
    }
};
