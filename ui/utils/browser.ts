/**
 * Utility for browser detection and capabilities
 */

export const isInAppBrowser = (userAgent?: string | null): boolean => {
    const ua = userAgent || (typeof window !== 'undefined' ? navigator.userAgent || navigator.vendor || (window as any).opera : '');
    if (!ua) return false;
    
    // Facebook App (iOS and Android)
    if (ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1) return true;
    
    // Instagram App
    if (ua.indexOf('Instagram') > -1) return true;
    
    // Messenger App
    if (ua.indexOf('Messenger') > -1 || ua.indexOf('FB_IAB') > -1) return true;
    
    // Other common in-app browsers
    if (ua.indexOf('Threads') > -1 || ua.indexOf('Twitter') > -1 || ua.indexOf('Line') > -1) return true;
    
    // TikTok
    if (ua.indexOf('TikTok') > -1) return true;

    return false;
};

export const isIOS = (userAgent?: string | null): boolean => {
    const ua = userAgent || (typeof window !== 'undefined' ? navigator.userAgent : '');
    if (!ua) return false;
    return /iPad|iPhone|iPod/.test(ua) || (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isFacebookApp = (userAgent?: string | null): boolean => {
    const ua = userAgent || (typeof window !== 'undefined' ? navigator.userAgent || navigator.vendor || (window as any).opera : '');
    if (!ua) return false;
    return ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1;
};

export const getInAppBrowserName = (userAgent?: string | null): string | null => {
    const ua = userAgent || (typeof window !== 'undefined' ? navigator.userAgent : '');
    if (!ua) return null;
    
    if (ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1) return 'Facebook';
    if (ua.indexOf('Instagram') > -1) return 'Instagram';
    if (ua.indexOf('Threads') > -1) return 'Threads';
    if (ua.indexOf('TikTok') > -1) return 'TikTok';
    if (ua.indexOf('Messenger') > -1) return 'Messenger';
    
    return null;
};
