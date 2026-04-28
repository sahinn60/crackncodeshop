'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

function ResetContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Invalid or missing reset link.</p>
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">Request a new one</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary/5 px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-red-400 to-orange-400" />
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10">
            {success ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 mb-4">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-dark">Password reset!</h1>
                <p className="mt-2 text-sm text-gray-500">Your password has been updated successfully.</p>
                <Link href="/login"
                  className="inline-block mt-6 px-6 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-[#E62828] transition-colors">
                  Sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                    <Lock className="h-7 w-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-dark">Set new password</h1>
                  <p className="mt-1 text-sm text-gray-500">Enter your new password below.</p>
                </div>

                {error && (
                  <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">New password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="block w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm bg-white text-dark placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">Confirm password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white text-dark placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <Button type="submit" disabled={loading}
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-[#E62828] text-white rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Resetting...
                      </span>
                    ) : 'Reset password'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetContent /></Suspense>;
}
