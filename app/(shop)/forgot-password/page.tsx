'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
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
            {sent ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-100 mb-4">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-dark">Check your email</h1>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your inbox and spam folder.
                </p>
                <Link href="/login" className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium text-primary hover:underline">
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-dark">Forgot password?</h1>
                  <p className="mt-1 text-sm text-gray-500">Enter your email and we'll send you a reset link.</p>
                </div>

                {error && (
                  <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-dark mb-1.5">Email address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white text-dark placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <Button type="submit" disabled={loading}
                    className="w-full h-12 text-base font-semibold bg-primary hover:bg-[#E62828] text-white rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : 'Send reset link'}
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
