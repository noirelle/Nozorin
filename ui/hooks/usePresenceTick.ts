import { useState, useEffect } from 'react';

/**
 * A simple hook that triggers a re-render every minute.
 * Used to keep "time ago" labels (e.g., "5 minutes ago") updated in real-time.
 */
export const usePresenceTick = (intervalMs: number = 60000) => {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setTick(prev => prev + 1);
        }, intervalMs);

        return () => clearInterval(timer);
    }, [intervalMs]);

    return tick;
};
