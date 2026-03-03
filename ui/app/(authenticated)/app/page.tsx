'use client';

import { DesktopHomeLayout } from '@/features/explore/components/DesktopHomeLayout';
import { MobileHomeLayout } from '@/features/explore/components/MobileHomeLayout';
import { useIsMobile } from '@/hooks';

export default function AppPage() {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <MobileHomeLayout />;
    }

    return <DesktopHomeLayout />;
}

