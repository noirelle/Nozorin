/**
 * Utility for browser detection and capabilities
 */

export const isInAppBrowser = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    return (
        ua.indexOf('FBAN') > -1 || 
        ua.indexOf('FBAV') > -1 ||
        ua.indexOf('Instagram') > -1 ||
        ua.indexOf('Messenger') > -1 ||
        ua.indexOf('FB_IAB') > -1 ||
        ua.indexOf('Threads') > -1 ||
        ua.indexOf('Twitter') > -1 ||
        ua.indexOf('Line') > -1 ||
        ua.indexOf('TikTok') > -1 ||
        ua.indexOf('Snapchat') > -1 ||
        ua.indexOf('WhatsApp') > -1
    );
};

export const isIOS = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isFacebookApp = (): boolean => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    return ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1;
};

export const getInAppBrowserName = (): string | null => {
    if (typeof window === 'undefined') return null;
    const ua = navigator.userAgent;
    
    if (ua.indexOf('FBAN') > -1 || ua.indexOf('FBAV') > -1) return 'Facebook';
    if (ua.indexOf('Instagram') > -1) return 'Instagram';
    if (ua.indexOf('Threads') > -1) return 'Threads';
    if (ua.indexOf('TikTok') > -1) return 'TikTok';
    if (ua.indexOf('Messenger') > -1) return 'Messenger';
    if (ua.indexOf('Twitter') > -1) return 'Twitter';
    if (ua.indexOf('Line') > -1) return 'Line';
    if (ua.indexOf('Snapchat') > -1) return 'Snapchat';
    if (ua.indexOf('WhatsApp') > -1) return 'WhatsApp';
    
    return 'In-App';
};
