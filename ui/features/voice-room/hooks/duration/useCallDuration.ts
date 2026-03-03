import { useEffect } from 'react';
import { useCallDurationState } from './useCallDurationState';

export const useCallDuration = (isConnected: boolean) => {
    const { seconds, setSeconds } = useCallDurationState();

    useEffect(() => {
        if (!isConnected) {
            setSeconds(0);
            return;
        }

        const interval = setInterval(() => {
            setSeconds((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isConnected, setSeconds]);

    const formatDuration = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = s % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return formatDuration(seconds);
};
