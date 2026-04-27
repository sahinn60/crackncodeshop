'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Key, Lock, Shield } from 'lucide-react';

export default function StaffLoginPage() {
  const [credentialKey, setCredentialKey] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/credential-login', { credentialKey, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-7 w-7 text-violet-600" />
          </div>
          <h1 className="text-2xl font-bold text-dark">Staff Login</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your credential key and password</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 pt-6 pb-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credential Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                required
                value={credentialKey}
                onChange={e => setCredentialKey(e.target.value.toUpperCase())}
                placeholder="SA-XXXXXXXX"
                className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none uppercase tracking-wider"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="block w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 font-semibold">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}
