import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, setOnTokenRefreshed } from '@/lib/axios';

export interface User {
  id: string; name: string; email: string;
  role: 'USER' | 'ADMIN' | 'SUB_ADMIN';
  permissions?: string[];
  avatarUrl?: string; bio?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  updateProfile: (data: Partial<Pick<User, 'name' | 'avatarUrl' | 'bio'>>) => Promise<boolean>;
  logout: () => void;
}

function setTokenCookie(token: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `auth-token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict${secure}`;
}

function clearCookies() {
  document.cookie = 'auth-token=; path=/; max-age=0';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, token: null, isAuthenticated: false, isLoading: false, error: null,

      setAuth: (user, token, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-token', token);
          if (refreshToken) localStorage.setItem('refresh-token', refreshToken);
          setTokenCookie(token);
        }
        set({ user, token, isAuthenticated: true, error: null });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await apiClient.post('/auth/login', { email, password });
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth-token', data.accessToken);
            localStorage.setItem('refresh-token', data.refreshToken);
            setTokenCookie(data.accessToken);
          }
          set({ user: data.user, token: data.accessToken, isAuthenticated: true, isLoading: false });
          return true;
        } catch (err: any) {
          set({ error: err.response?.data?.error || 'Login failed', isLoading: false });
          return false;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await apiClient.post('/auth/register', { name, email, password });
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth-token', data.accessToken);
            localStorage.setItem('refresh-token', data.refreshToken);
            setTokenCookie(data.accessToken);
          }
          set({ user: data.user, token: data.accessToken, isAuthenticated: true, isLoading: false });
          return true;
        } catch (err: any) {
          set({ error: err.response?.data?.error || 'Registration failed', isLoading: false });
          return false;
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          const refreshToken = localStorage.getItem('refresh-token');
          if (refreshToken) apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
          localStorage.removeItem('auth-token');
          localStorage.removeItem('refresh-token');
          clearCookies();
        }
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateProfile: async (data) => {
        try {
          const { data: updated } = await apiClient.put('/user', data);
          set(state => ({ user: state.user ? { ...state.user, ...updated } : null }));
          return true;
        } catch { return false; }
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) }
  )
);

// Sync store when token refresh returns fresh user data
setOnTokenRefreshed((user, token, refreshToken) => {
  useAuthStore.getState().setAuth(user, token, refreshToken);
});
