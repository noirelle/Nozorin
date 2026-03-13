'use client';

import { useRef, useState } from 'react';

export const useVoiceRoomState = () => {
    const [selectedCountry, setSelectedCountry] = useState('GLOBAL');
    const remoteAudioRef = useRef<HTMLAudioElement>(null);

    return {
        selectedCountry,
        setSelectedCountry,
        remoteAudioRef,
    };
};

export type UseVoiceRoomStateReturn = ReturnType<typeof useVoiceRoomState>;
