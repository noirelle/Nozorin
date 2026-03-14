import { useSessionContext } from '@/contexts/SessionContext';

export const useSession = () => {
    const context = useSessionContext();

    return {
        sessionId: context.sessionId,
        isVerifyingSession: context.isVerifyingSession,
        initialReconnecting: context.initialReconnecting,
        initialCallData: context.initialCallData,
        getSessionId: () => context.sessionId, // Or keep original if needed, but context has it
        verifyActiveCallSession: context.verifyActiveCallSession,
    };
};
