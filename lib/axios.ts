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

// Auto-refresh on 401 — with safe concurrency handling
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

function doRefresh(): Promise<string> {
  const refreshToken = localStorage.getItem('refresh-token');
  if (!refreshToken) return Promise.reject(new Error('No refresh token'));

  return axios.post(`${baseURL}/auth/refresh`, { refreshToken })
    .then(({ data }) => {
      localStorage.setItem('auth-token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refresh-token', data.refreshToken);

      // Update cookie for middleware
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `auth-token=${data.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict${secure}`;

      // Sync Zustand store
      if (data.user && onTokenRefreshed) {
        onTokenRefreshed(data.user, data.accessToken, data.refreshToken);
      }

      return data.accessToken;
    });
}

apiClient.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    const isAuthRoute = original.url?.includes('/auth/');

    // Only handle 401, skip auth routes, skip already retried
    if (err.response?.status !== 401 || original._retry || isAuthRoute) {
      return Promise.reject(err);
    }

    original._retry = true;

    try {
      // Single refresh for all concurrent 401s
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = doRefresh().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise!;
      original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch {
      // Don't force redirect — let the component handle auth state
      // Only clear tokens silently
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      document.cookie = 'auth-token=; path=/; max-age=0';
      return Promise.reject(err);
    }
  }
);
