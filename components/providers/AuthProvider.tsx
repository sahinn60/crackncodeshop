'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/axios';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (!token) return;

    // Decode payload without verifying (verification happens server-side)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Check expiry
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        logout();
        return;
      }
      // Fetch fresh user data to confirm token is still valid
      apiClient.get('/auth/me').then(({ data }) => {
        setAuth(data.user, token);
      }).catch(() => logout());
    } catch {
      logout();
    }
  }, [setAuth, logout]);

  return <>{children}</>;
}
