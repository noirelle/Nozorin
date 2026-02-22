
export interface SocketResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
}

export interface InternalHeaders {
    'Content-Type': string;
    'x-internal-secret': string;
}
