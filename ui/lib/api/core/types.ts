
export interface StandardApiResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    error?: string;
    data?: T;
}

export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    status: number;
    headers?: Headers;
    message?: string;
}
