// call-room feature hooks
export { useCallRoom } from '../features/call-room/hooks/useCallRoom';
export { useChat } from '../features/call-room/hooks/useChat';
export { useWebRTC } from '../features/call-room/hooks/useWebRTC';
export { useMatching } from '../features/call-room/hooks/useMatching';

// global hooks
export { useUser } from './useUser';
export { useHistory } from './useHistory';
export { useDirectCall } from './useDirectCall';
export { useFriends } from './useFriends';

// re-exported sub-hook types (unchanged API surface)
export type { CallRoomState } from '../features/call-room/hooks/useCallRoom';
export type { Message } from '../features/call-room/hooks/useChat';
export type { MatchStatus } from '../features/call-room/hooks/useMatching';
export type { SessionRecord, HistoryStats } from './useHistory';

