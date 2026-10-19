import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { GoogleButton } from './GoogleButton';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../lang';

export const LoginPage: React.FC = () => {
  const { signInWithEmail, setAsGuest } = useAuth();
  const { lang } = useLang();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract redirect target if provided in query string or hash
  const getRedirectTarget = () => {
    try {
      const hash = window.location.hash;
      const queryIdx = hash.indexOf('?');
      if (queryIdx !== -1) {
        const params = new URLSearchParams(hash.substring(queryIdx));
        const redirect = params.get('redirect');
        if (redirect) return redirect;
      }
    } catch (e) {
      // fallback
    }
    return '#/analyze/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(
        lang === 'en'
          ? 'Please enter both your email address and password.'
          : 'অনুগ্রহ করে আপনার ইমেইল এবং পাসওয়ার্ড প্রদান করুন।'
      );
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await signInWithEmail(email, password);
      if (signInError) {
        setError(signInError.message);
      } else {
        window.location.hash = getRedirectTarget();
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = () => {
    setAsGuest();
    window.location.hash = getRedirectTarget();
  };

  return (
    <AuthLayout
      title={lang === 'en' ? 'Welcome to AgriOrbit' : 'এগ্রিঅরবিটে স্বাগতম'}
      subtitle={
        lang === 'en'
          ? 'Sign in to access your satellite field observations, crop plans, and decision advisories.'
          : 'উপগ্রহ পর্যবেক্ষণ, ফসলের পরিক্রমা ও সিদ্ধান্ত গ্রহণের জন্য প্রবেশ করুন।'
      }
      error={error}
    >
      <div className="space-y-6">
        {/* Google OAuth Button */}
        <GoogleButton onError={(msg) => setError(msg)} />

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#0B1626] px-3 text-[11px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
            {lang === 'en' ? 'or continue with email' : 'অথবা ইমেইল দিয়ে প্রবেশ করুন'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-mono text-slate-300 font-medium mb-1.5"
            >
              {lang === 'en' ? 'Email Address' : 'ইমেইল ঠিকানা'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === 'en' ? 'farmer@agriorbit.com' : 'farmer@agriorbit.com'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050B14] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="text-xs font-mono text-slate-300 font-medium"
              >
                {lang === 'en' ? 'Password' : 'পাসওয়ার্ড'}
              </label>
              <a
                href="#/forgot-password"
                className="text-xs text-[#00E5FF] hover:underline font-mono"
              >
                {lang === 'en' ? 'Forgot password?' : 'পাসওয়ার্ড ভুলে গেছেন?'}
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#050B14] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-sm transition-all duration-200 shadow-lg shadow-[#B8FF3D]/20 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#050B14]" />
            ) : (
              <>
                <span>{lang === 'en' ? 'Sign In to Dashboard' : 'ড্যাশবোর্ডে প্রবেশ করুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Links & Guest Mode */}
        <div className="pt-4 border-t border-white/10 flex flex-col gap-3 text-center text-xs">
          <p className="text-slate-300">
            {lang === 'en' ? "Don't have an account?" : 'নতুন খামারী?'}{' '}
            <a
              href="#/signup"
              className="text-[#B8FF3D] hover:underline font-semibold ml-1 font-mono"
            >
              {lang === 'en' ? 'Create Account' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
            </a>
          </p>

          <div>
            <button
              type="button"
              onClick={handleGuestAccess}
              className="text-slate-400 hover:text-slate-200 text-xs font-mono underline transition-colors cursor-pointer"
            >
              {lang === 'en' ? 'Continue as Guest (Demo Mode)' : 'গেস্ট হিসেবে চালিয়ে যান (ডেমো)'}
            </button>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};
