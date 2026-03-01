'use client';

import { useState, useEffect } from 'react';
import { DesktopExploreLayout } from '@/features/explore/components/DesktopExploreLayout';
import { MobileExploreLayout } from '@/features/explore/components/MobileExploreLayout';

export default function ExplorePage() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isMobile) {
        return <MobileExploreLayout />;
    }

    return <DesktopExploreLayout />;
}
