/**
 * API utility with authentication support
 */

const API_BASE_URL = 'http://localhost:3001/api';

export async function apiRequest(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = localStorage.getItem('auth_token');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    // If unauthorized, clear token and redirect to login
    if (response.status === 401) {
        localStorage.removeItem('auth_token');
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }

    return response;
}

export async function apiGet(endpoint: string) {
    return apiRequest(endpoint, { method: 'GET' });
}

export async function apiPost(endpoint: string, data?: any) {
    return apiRequest(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
    });
}

export async function apiPut(endpoint: string, data?: any) {
    return apiRequest(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
    });
}

export async function apiPatch(endpoint: string, data?: any) {
    return apiRequest(endpoint, {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
    });
}

export async function apiDelete(endpoint: string) {
    return apiRequest(endpoint, { method: 'DELETE' });
}
