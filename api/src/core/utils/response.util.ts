
export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message: string;
    error?: string;
    data?: T;
}

export const successResponse = <T>(data: T, message: string = 'Success'): ApiResponse<T> => {
    return {
        status: 'success',
        message,
        data
    };
};

export const errorResponse = (message: string, error?: string | any): ApiResponse<null> => {
    return {
        status: 'error',
        message,
        error: error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Unknown error')
    };
};
