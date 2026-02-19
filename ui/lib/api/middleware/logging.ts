export const logRequest = (url: string, options: RequestInit) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[API Request] ${options.method || 'GET'} ${url}`);
    }
};

export const logResponse = (url: string, status: number) => {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[API Response] ${status} ${url}`);
    }
};
