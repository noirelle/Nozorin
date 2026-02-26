import { api } from '../../index';
import type { CallRequest, CallResponse, CallActionResult } from './types';

export type { CallRequest, CallResponse, CallActionResult };

export const call = {
    request: (data: CallRequest, headers?: HeadersInit) =>
        api.post<CallActionResult>('/api/call/request', data, { headers }),

    respond: (data: CallResponse, headers?: HeadersInit) =>
        api.post<CallActionResult>('/api/call/respond', data, { headers }),
};
