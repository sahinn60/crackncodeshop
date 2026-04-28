import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Allow auth store to register itself for sync after token refresh
let onTokenRefreshed: ((user: any, token: string, refreshToken: string) => void) | null = null;
export function setOnTokenRefreshed(cb: typeof onTokenRefreshed) { onTokenRefreshed = cb; }

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-token');
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let queue: ((token: string) => void)[] = [];

apiClient.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    const isAuthRoute = original.url?.includes('/auth/');
    if (err.response?.status !== 401 || original._retry || isAuthRoute) return Promise.reject(err);

    if (isRefreshing) {
      return new Promise(resolve => {
        queue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refresh-token');
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      localStorage.setItem('auth-token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refresh-token', data.refreshToken);
      document.cookie = `auth-token=${data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;

      // Sync Zustand store with fresh user data from refresh
      if (data.user && onTokenRefreshed) {
        onTokenRefreshed(data.user, data.accessToken, data.refreshToken);
      }

      queue.forEach(cb => cb(data.accessToken));
      queue = [];

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(original);
    } catch {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      document.cookie = 'auth-token=; path=/; max-age=0';
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);
