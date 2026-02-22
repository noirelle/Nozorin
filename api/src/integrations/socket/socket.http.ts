
import { SocketResponse, InternalHeaders } from './socket.types';

const SOCKET_SERVICE_URL = process.env.SOCKET_SERVICE_URL || 'http://nozorin_realtime:3002';
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || '';

export class SocketHttpClient {
    protected baseUrl: string;
    protected headers: InternalHeaders;

    constructor() {
        // Ensure standard /internal prefix for all authenticated socket calls
        this.baseUrl = SOCKET_SERVICE_URL.endsWith('/')
            ? `${SOCKET_SERVICE_URL}internal`
            : `${SOCKET_SERVICE_URL}/internal`;

        this.headers = {
            'Content-Type': 'application/json',
            'x-internal-secret': INTERNAL_SECRET,
        };
    }

    protected async post<T>(path: string, body: any): Promise<SocketResponse<T>> {
        const url = `${this.baseUrl}${path}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.headers as any,
                body: JSON.stringify(body),
            });

            const data = await response.json() as any;

            if (!response.ok) {
                return {
                    success: false,
                    data: null as any,
                    error: data.error || 'Socket service error',
                    message: data.message
                };
            }

            return {
                success: true,
                data,
                message: data.message
            };
        } catch (error: any) {
            console.error(`[SOCKET_HTTP] POST ${url} error:`, error);
            return {
                success: false,
                data: null as any,
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message
            };
        }
    }

    protected async get<T>(path: string): Promise<SocketResponse<T>> {
        const url = `${this.baseUrl}${path}`;
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers as any,
            });

            const data = await response.json() as any;

            if (!response.ok) {
                return {
                    success: false,
                    data: null as any,
                    error: data.error || 'Socket service error',
                    message: data.message
                };
            }

            return {
                success: true,
                data,
                message: data.message
            };
        } catch (error: any) {
            console.error(`[SOCKET_HTTP] GET ${url} error:`, error);
            return {
                success: false,
                data: null as any,
                error: 'INTERNAL_SERVER_ERROR',
                message: error.message
            };
        }
    }
}

export const socketHttpClient = new SocketHttpClient();
