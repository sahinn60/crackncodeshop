'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { validateLogin } from '@/lib/validate';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { login, isLoading, error } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const validate = (data = { email, password }) => {
    const errs = validateLogin(data);
    const map: Record<string, string> = {};
    errs.forEach(e => { map[e.field] = e.message; });
    setFieldErrors(map);
    return errs.length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched(t => ({ ...t, [field]: true }));
    validate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validate()) return;
    const ok = await login(email, password);
    if (ok) {
      const { user } = useAuthStore.getState();
      router.push(user?.role === 'ADMIN' ? '/admin' : (next || '/'));
    }
  };

  const inputClass = (field: string) =>
    `block w-full rounded-xl border px-4 py-3 text-sm bg-white text-dark placeholder-gray-400 transition-all outline-none focus:ring-2 ${
      touched[field] && fieldErrors[field]
        ? 'border-red-400 focus:ring-red-200'
        : touched[field] && !fieldErrors[field]
        ? 'border-green-400 focus:ring-green-200'
        : 'border-gray-200 focus:ring-primary/20 focus:border-primary'
    }`;

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary/5 px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
          {/* Top accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-red-400 to-orange-400" />

          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <LogIn className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-dark">Welcome back</h1>
              <p className="mt-1 text-sm text-gray-500">
                Don't have an account?{' '}
                <Link href="/register" className="font-semibold text-primary hover:underline">Sign up free</Link>
              </p>
            </div>

            {/* Server error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
              >
                <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={inputClass('email')}
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (touched.email) validate({ email: e.target.value, password }); }}
                  onBlur={() => handleBlur('email')}
                />
                {touched.email && fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-dark">Password</label>
                  <Link href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={inputClass('password') + ' pr-11'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (touched.password) validate({ email, password: e.target.value }); }}
                    onBlur={() => handleBlur('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {touched.password && fieldErrors.password && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-[#E62828] text-white rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98] mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Secured with 256-bit encryption
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
