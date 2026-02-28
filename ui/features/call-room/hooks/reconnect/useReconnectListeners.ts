import { useSocketEvent, SocketEvents } from '../../../../lib/socket';

interface UseReconnectListenersProps {
    handleIdentified: () => void;
    clearImmediately: () => void;
    clearWithMinDelay: () => void;
    handleRejoinFailed: (data: { reason: string }) => void;
    handlePartnerReconnected: (data: { new_socket_id: string; new_user_id: string }) => void;
}

export const useReconnectListeners = ({
    handleIdentified,
    clearImmediately,
    clearWithMinDelay,
    handleRejoinFailed,
    handlePartnerReconnected,
}: UseReconnectListenersProps) => {
    useSocketEvent(SocketEvents.IDENTIFY_SUCCESS, handleIdentified);
    useSocketEvent(SocketEvents.REJOIN_SUCCESS, clearImmediately);
    useSocketEvent(SocketEvents.REJOIN_FAILED, handleRejoinFailed);
    useSocketEvent(SocketEvents.CALL_ENDED, clearImmediately);
    useSocketEvent(SocketEvents.PARTNER_RECONNECTED, handlePartnerReconnected);
};
