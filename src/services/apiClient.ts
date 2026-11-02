/**
 * MeasureX Cloudflare Edge API Client
 * Automatically uses HttpOnly cookie sessions
 */

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // Includes HttpOnly __Host-mx_session cookie
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    (error as any).status = res.status;
    (error as any).code = data.error;
    throw error;
  }

  return data as T;
}

export const apiClient = {
  auth: {
    async login(email: string, pass: string) {
      return request<{
        success: boolean;
        user: { id: string; email: string; name: string; role: string; plan: string };
        token?: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
    },

    async register(name: string, email: string, pass: string) {
      return request<{
        success: boolean;
        message: string;
        user: { id: string; email: string; fullName: string; plan: string };
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password: pass }),
      });
    },

    async me() {
      return request<{
        authenticated: boolean;
        user: { id: string; email: string; name: string; role: string; plan: string };
      }>('/auth/me');
    },

    async logout() {
      return request<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      });
    },
  },

  projects: {
    async list() {
      return request<{ projects: any[] }>('/projects');
    },

    async create(title: string, type: string, description?: string, drawingData?: any) {
      return request<{ success: boolean; project: any }>('/projects', {
        method: 'POST',
        body: JSON.stringify({ title, type, description, drawingData }),
      });
    },

    async get(id: string) {
      return request<{ project: any }>(`/projects/${id}`);
    },

    async update(id: string, updates: any) {
      return request<{ success: boolean }>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    async delete(id: string) {
      return request<{ success: boolean }>(`/projects/${id}`, {
        method: 'DELETE',
      });
    },
  },

  measurements: {
    async list() {
      return request<{ measurements: any[] }>('/measurements');
    },

    async create(measurement: any) {
      return request<{ success: boolean; measurement: any }>('/measurements', {
        method: 'POST',
        body: JSON.stringify(measurement),
      });
    },
  },

  storage: {
    async getUploadUrl(filename: string, mimeType: string, sizeBytes: number) {
      return request<{
        success: boolean;
        fileId: string;
        r2Key: string;
        uploadUrl: string;
        expiresInSeconds: number;
      }>('/storage/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename, mimeType, sizeBytes }),
      });
    },
  },

  payments: {
    async createCheckoutSession(plan: 'pro' | 'enterprise', billingCycle: 'monthly' | 'annual') {
      return request<{
        success: boolean;
        checkoutUrl?: string;
        sessionId?: string;
        mode?: string;
        message?: string;
      }>('/payments/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify({ plan, billingCycle }),
      });
    },
  },
};
