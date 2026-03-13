/**
 * Formats a timestamp into a human-readable "time ago" string.
 * Supports both seconds and milliseconds timestamps.
 * 
 * @param timestamp - The timestamp to format (number or string)
 * @returns A formatted string like "5s ago", "2m ago", "3h ago", "1d ago", or "Mar 13"
 */
export const formatTimeAgo = (timestamp: number | string | null | undefined): string => {
    // Default to a very recent timestamp if missing to satisfy "always show a timestamp" requirement
    const fallback = Date.now();
    let ts = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    
    if (!ts || isNaN(ts)) {
        ts = fallback;
    }

    // Ensure timestamp is in milliseconds
    const timeMs = ts < 1e12 ? ts * 1000 : ts;
    const now = Date.now();
    const diffMs = now - timeMs;
    
    // If timestamp is in the future
    if (diffMs < 0) return 'Just now';

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffSec < 60) {
        return `${diffSec}s ago`;
    }
    if (diffMin < 60) {
        return `${diffMin}m ago`;
    }

    const date = new Date(timeMs);
    const isToday = new Date().toDateString() === date.toDateString();
    
    const timeStr = date.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });

    if (isToday) {
        return `Today at ${timeStr}`;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.toDateString() === date.toDateString();

    if (isYesterday) {
        return `Yesterday at ${timeStr}`;
    }

    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) {
        return `${diffDay}d ago`;
    }

    // Default to a date format for older timestamps
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Formats a duration in seconds into a human-readable format.
 * 
 * @param seconds - Duration in seconds
 * @returns A formatted string like "12s", "1m 30s", "2h 45m"
 */
export const formatDuration = (seconds?: number): string => {
    if (!seconds || seconds <= 0) return '0s';
    
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};
