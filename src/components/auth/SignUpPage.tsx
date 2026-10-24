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
      const { error: signUpError } = await signUpWithEmail(email, password, name);
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
          <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-display font-semibold text-base text-[#FAFAFA]">
            {lang === 'en' ? 'Verification Link Sent' : 'যাচাইকরণ লিঙ্ক পাঠানো হয়েছে'}
          </h3>
          <p className="text-xs text-[#A3A3A3] leading-relaxed max-w-sm mx-auto">
            {lang === 'en'
              ? `We have dispatched a confirmation email to ${email}. Check your inbox and follow the link to activate your account.`
              : `${email} ঠিকানায় নিশ্চিতকরণ ইমেইল পাঠানো হয়েছে। অ্যাকাউন্ট সক্রিয় করতে ইনবক্স চেক করুন।`}
          </p>
          <div className="pt-2">
            <a
              href="#/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22C55E] text-black font-semibold text-xs cursor-pointer"
            >
              <span>{lang === 'en' ? 'Return to Sign In' : 'লগইন করুন'}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Google OAuth Button */}
          <GoogleButton onError={(msg) => setError(msg)} />

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#262626] w-full" />
            <span className="bg-[#141414] px-3 text-[11px] font-mono text-[#737373] uppercase tracking-wider shrink-0">
              {lang === 'en' ? 'or continue with email' : 'অথবা ইমেইল দিয়ে খুলুন'}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-mono text-[#A3A3A3] font-medium mb-1.5"
              >
                {lang === 'en' ? 'Full Name / Farmer Name' : 'আপনার নাম'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'en' ? 'e.g. Abdul Karim' : 'যেমনঃ আবদুল করিম'}
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#FAFAFA] placeholder-[#737373] text-sm focus:outline-none focus:border-[#22C55E] transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-mono text-[#A3A3A3] font-medium mb-1.5"
              >
                {lang === 'en' ? 'Email Address' : 'ইমেইল ঠিকানা'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@agriorbit.com"
                  className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#FAFAFA] placeholder-[#737373] text-sm focus:outline-none focus:border-[#22C55E] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-mono text-[#A3A3A3] font-medium mb-1.5"
              >
                {lang === 'en' ? 'Password (min. 6 characters)' : 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#FAFAFA] placeholder-[#737373] text-sm focus:outline-none focus:border-[#22C55E] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#FAFAFA] p-1 cursor-pointer"
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
                className="block text-xs font-mono text-[#A3A3A3] font-medium mb-1.5"
              >
                {lang === 'en' ? 'Confirm Password' : 'পাসওয়ার্ড নিশ্চিত করুন'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#FAFAFA] placeholder-[#737373] text-sm focus:outline-none focus:border-[#22C55E] transition-colors"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <>
                  <span>{lang === 'en' ? 'Create Account' : 'অ্যাকাউন্ট তৈরি করুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="pt-4 border-t border-[#262626] text-center text-xs">
            <p className="text-[#A3A3A3]">
              {lang === 'en' ? 'Already have an account?' : 'আগে থেকেই অ্যাকাউন্ট আছে?'}{' '}
              <a
                href="#/login"
                className="text-[#FAFAFA] hover:underline font-medium ml-1 font-mono"
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
