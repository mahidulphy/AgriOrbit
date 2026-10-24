import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { GoogleButton } from './GoogleButton';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../lang';

export const SignUpPage: React.FC = () => {
  const { signUpWithEmail } = useAuth();
  const { lang } = useLang();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError(
        lang === 'en'
          ? 'Please enter your email and choose a password.'
          : 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড প্রদান করুন।'
      );
      return;
    }

    if (password.length < 6) {
      setError(
        lang === 'en'
          ? 'Password must be at least 6 characters long.'
          : 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        lang === 'en' ? 'Passwords do not match.' : 'উভয় পাসওয়ার্ড একই হতে হবে।'
      );
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError, user } = await signUpWithEmail(email, password, name);
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess(
          lang === 'en'
            ? 'Account created successfully! We sent an email verification link to your inbox. Please verify your email before logging in.'
            : 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! আপনার ইমেইলে একটি ভেরিফিকেশন লিঙ্ক পাঠানো হয়েছে। লগইন করার আগে অনুগ্রহ করে ইমেইলটি নিশ্চিত করুন।'
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={lang === 'en' ? 'Create AgriOrbit Account' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
      subtitle={
        lang === 'en'
          ? 'Join Bangladeshi farmers using NASA satellite data for climate-resilient crop planning.'
          : 'বদলানো আবহাওয়ায় সঠিক ফসল বেছে নিতে আপনার অ্যাকাউন্ট খুলুন।'
      }
      error={error}
      success={success}
    >
      {success ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#B8FF3D]/20 border border-[#B8FF3D]/40 text-[#B8FF3D] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-white">
            {lang === 'en' ? 'Verification Link Sent' : 'যাচাইকরণ লিঙ্ক পাঠানো হয়েছে'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            {lang === 'en'
              ? `We have dispatched a confirmation email to ${email}. Check your inbox and follow the link to activate your account.`
              : `${email} ঠিকানায় নিশ্চিতকরণ ইমেইল পাঠানো হয়েছে। অ্যাকাউন্ট সক্রিয় করতে ইনবক্স চেক করুন।`}
          </p>
          <div className="pt-2">
            <a
              href="#/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B8FF3D] text-[#050B14] font-bold text-xs shadow-md shadow-[#B8FF3D]/20 cursor-pointer"
            >
              <span>{lang === 'en' ? 'Return to Sign In' : 'লগইন করুন'}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Google OAuth Button */}
          <GoogleButton onError={(msg) => setError(msg)} />

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#0B1626] px-3 text-[11px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
              {lang === 'en' ? 'or continue with email' : 'অথবা ইমেইল দিয়ে খুলুন'}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-mono text-slate-300 font-medium mb-1.5"
              >
                {lang === 'en' ? 'Full Name / Farmer Name' : 'আপনার নাম'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g. Abdul Karim' : 'যেমনঃ আবদুল করিম'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050B14] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-mono text-slate-300 font-medium mb-1.5"
              >
                {lang === 'en' ? 'Email Address' : 'ইমেইল ঠিকানা'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@agriorbit.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050B14] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-mono text-slate-300 font-medium mb-1.5"
              >
                {lang === 'en' ? 'Password (min 6 characters)' : 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-mono text-slate-300 font-medium mb-1.5"
              >
                {lang === 'en' ? 'Confirm Password' : 'পাসওয়ার্ড নিশ্চিত করুন'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050B14] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all"
                />
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
                  <span>{lang === 'en' ? 'Create Account' : 'অ্যাকাউন্ট তৈরি করুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="pt-4 border-t border-white/10 text-center text-xs">
            <p className="text-slate-300">
              {lang === 'en' ? 'Already have an account?' : 'আগে থেকেই অ্যাকাউন্ট আছে?'}{' '}
              <a
                href="#/login"
                className="text-[#00E5FF] hover:underline font-semibold ml-1 font-mono"
              >
                {lang === 'en' ? 'Sign In' : 'লগইন করুন'}
              </a>
            </p>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};
