import { useState } from 'react';

export const useCallDurationState = () => {
    const [seconds, setSeconds] = useState(0);
    return { seconds, setSeconds };
};
