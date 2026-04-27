'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, UserPlus, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { validateRegister, passwordStrength } from '@/lib/validate';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [success, setSuccess] = useState(false);
  const { register, isLoading, error } = useAuthStore();
  const router = useRouter();

  const strength = passwordStrength(password);

  const validate = (data = { name, email, password }) => {
    const errs = validateRegister(data);
    const map: Record<string, string> = {};
    errs.forEach(e => { if (!map[e.field]) map[e.field] = e.message; });
    setFieldErrors(map);
    return errs.length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched(t => ({ ...t, [field]: true }));
    validate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    if (!validate()) return;
    const ok = await register(name, email, password);
    if (ok) {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
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
        <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-red-400 to-orange-400" />

          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <UserPlus className="h-7 w-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-dark">Create your account</h1>
              <p className="mt-1 text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
              </p>
            </div>

            {/* Success message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700"
              >
                <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                Account created successfully! Redirecting to login...
              </motion.div>
            )}

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
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">Full name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  className={inputClass('name')}
                  value={name}
                  onChange={e => { setName(e.target.value); if (touched.name) validate({ name: e.target.value, email, password }); }}
                  onBlur={() => handleBlur('name')}
                />
                {touched.name && fieldErrors.name && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={inputClass('email')}
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (touched.email) validate({ name, email: e.target.value, password }); }}
                  onBlur={() => handleBlur('email')}
                />
                {touched.email && fieldErrors.email && (
                  <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className={inputClass('password') + ' pr-11'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (touched.password) validate({ name, email, password: e.target.value }); }}
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

                {/* Strength meter */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength.score ? strength.color : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Strength: <span className="font-medium">{strength.label}</span></p>
                  </div>
                )}

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
                    Creating account...
                  </span>
                ) : 'Create account'}
              </Button>

              <p className="text-xs text-gray-400 text-center">
                By signing up, you agree to our{' '}
                <Link href="#" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </form>

            <p className="mt-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Secured with 256-bit encryption
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
