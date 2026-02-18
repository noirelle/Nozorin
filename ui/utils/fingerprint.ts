/**
 * Simple browser fingerprinting utility
 * Generates a stable hash based on browser/device characteristics.
 * Note: This is not cryptographic security, but sufficient for guest identity stability.
 */

const getMurmurHash = (key: string, seed: number = 0): number => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < key.length; i++) {
        ch = key.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

export const getBrowserFingerprint = (): string => {
    if (typeof window === 'undefined') return 'server-side';

    try {
        const components = [
            navigator.userAgent,
            navigator.language,
            navigator.hardwareConcurrency || 'unknown',
            // @ts-ignore
            navigator.deviceMemory || 'unknown',
            screen.colorDepth,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            // Canvas Fingerprinting (Basic)
            (() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return 'no-canvas';
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillStyle = '#f60';
                ctx.fillRect(125, 1, 62, 20);
                ctx.fillStyle = '#069';
                ctx.fillText('NozorinFingerprint', 2, 15);
                ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
                ctx.fillText('NozorinFingerprint', 4, 17);
                return canvas.toDataURL();
            })()
        ];

        return getMurmurHash(components.join('|||')).toString(16);
    } catch (e) {
        console.warn('Fingerprint generation failed:', e);
        return 'fallback-' + Math.random().toString(36).substring(2);
    }
};
