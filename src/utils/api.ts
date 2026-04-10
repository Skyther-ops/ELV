import ky, { KyInstance } from 'ky';

const apiUrl = new URL((import.meta?.env?.VITE_API_BASE_URL as string) || 'http://localhost:3000');
const devApiBaseHost = apiUrl.hostname;
const PORT = Number(import.meta.env.VITE_PORT) || 3000;
const devApiBaseUrl = `${apiUrl.protocol}//${devApiBaseHost}:${PORT}`;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

let globalHeaders: Record<string, string> = {};

const baseApi: KyInstance = ky.create({
    prefixUrl: `${API_BASE_URL}/api`,
});

export const setGlobalHeaders = (headers: Record<string, string>) => {
	globalHeaders = { ...globalHeaders, ...headers };
};

export const removeGlobalHeaders = (headerKeys: string[]) => {
	headerKeys.forEach((key) => {
		delete globalHeaders[key];
	});
};

export const getGlobalHeaders = () => {
	return globalHeaders;
};

// Create a proxy/wrapper around baseApi to safely inject headers
const withHeaders = (options: Record<string, any> = {}) => {
    return {
        ...options,
        headers: {
            ...globalHeaders,
            ...options.headers,
        }
    };
};

export const api = {
    get: (url: string | Request | URL, options?: Record<string, any>) => baseApi.get(url, withHeaders(options)),
    post: (url: string | Request | URL, options?: Record<string, any>) => baseApi.post(url, withHeaders(options)),
    put: (url: string | Request | URL, options?: Record<string, any>) => baseApi.put(url, withHeaders(options)),
    delete: (url: string | Request | URL, options?: Record<string, any>) => baseApi.delete(url, withHeaders(options)),
    patch: (url: string | Request | URL, options?: Record<string, any>) => baseApi.patch(url, withHeaders(options)),
    head: (url: string | Request | URL, options?: Record<string, any>) => baseApi.head(url, withHeaders(options)),
    extend: (options: any) => baseApi.extend(options),
} as any as KyInstance;

export default api;
