'use client';

import React from 'react';
import { usePresenceTick } from '@/hooks/usePresenceTick';
import { formatTimeAgo, formatFullTimeAgo } from '@/utils/time';

interface TimeAgoProps {
    timestamp: number | string | Date;
    full?: boolean;
    className?: string;
    prefix?: string;
    suffix?: string;
}

/**
 * A self-updating component for relative timestamps.
 * Uses usePresenceTick internally to avoid re-rendering entire parent layouts.
 */
export const TimeAgo: React.FC<TimeAgoProps> = ({ 
    timestamp, 
    full = false, 
    className = "", 
    prefix = "", 
    suffix = "" 
}) => {
    // This hook triggers a re-render of ONLY this small component every minute
    usePresenceTick();

    const ts = timestamp instanceof Date ? timestamp.getTime() : timestamp;

    const formatted = full 
        ? formatFullTimeAgo(ts as any) 
        : formatTimeAgo(ts as any);

    return (
        <span className={className}>
            {prefix}{formatted}{suffix}
        </span>
    );
};
