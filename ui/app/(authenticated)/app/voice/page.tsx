import { headers } from 'next/headers';
import { VoiceGameRoom } from '@/features/voice-room/components/VoiceGameRoom';
import { BrowserGuard } from '@/components/BrowserGuard';
import { isInAppBrowser } from '@/utils/browser';

export default async function VoicePage() {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent');
    const isRestricted = isInAppBrowser(userAgent);

    if (isRestricted) {
        return <BrowserGuard userAgent={userAgent} />;
    }

    return <VoiceGameRoom />;
}
