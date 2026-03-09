'use client';

import React from 'react';
import HeroDesktopLayout from './HeroDesktopLayout';
import HeroMobileLayout from './HeroMobileLayout';

export default function Hero({ onJoin }: { onJoin: (mode: 'chat' | 'voice') => void }) {
    return (
        <>
            <HeroMobileLayout onJoin={onJoin} />
            <HeroDesktopLayout onJoin={onJoin} />
        </>
    );
}
