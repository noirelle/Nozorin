import { useSocketEvent, SocketEvents } from '../../../../lib/socket';

interface UseReconnectListenersProps {
    handleIdentified: () => void;
    clearImmediately: () => void;
    clearWithMinDelay: () => void;
}

export const useReconnectListeners = ({
    handleIdentified,
    clearImmediately,
    clearWithMinDelay,
}: UseReconnectListenersProps) => {
    useSocketEvent(SocketEvents.IDENTIFY_SUCCESS, handleIdentified);
    useSocketEvent(SocketEvents.REJOIN_SUCCESS, clearImmediately);
    useSocketEvent(SocketEvents.REJOIN_FAILED, clearWithMinDelay);
    useSocketEvent(SocketEvents.CALL_ENDED, clearWithMinDelay);
};
