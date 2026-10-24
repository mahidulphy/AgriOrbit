import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../lang';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const { lang } = useLang();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError(
        lang === 'en'
          ? 'Please enter your registered email address.'
          : 'অনুগ্রহ করে নিবন্ধিত ইমেইল ঠিকানা প্রদান করুন।'
      );
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(
          lang === 'en'
            ? 'Password recovery instructions have been sent to your email.'
            : 'পাসওয়ার্ড পুনরুদ্ধারের নির্দেশনা আপনার ইমেইলে পাঠানো হয়েছে।'
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={lang === 'en' ? 'Reset Your Password' : 'পাসওয়ার্ড পুনরুদ্ধার'}
      subtitle={
        lang === 'en'
          ? 'Enter your account email and we will send you a secure link to reset your password.'
          : 'আপনার ইমেইল লিখুন এবং আমরা পাসওয়ার্ড পুনরায় নির্ধারণের লিঙ্ক পাঠাব।'
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
            {lang === 'en' ? 'Reset Link Dispatched' : 'লিঙ্ক পাঠানো হয়েছে'}
          </h3>
          <p className="text-xs text-[#A3A3A3] leading-relaxed max-w-sm mx-auto">
            {lang === 'en'
              ? `We've sent a password reset email to ${email}. Follow the link in the message to select a new password.`
              : `${email} ঠিকানায় বার্তা পাঠানো হয়েছে। নতুন পাসওয়ার্ড সেট করতে লিঙ্কে ক্লিক করুন।`}
          </p>
          <div className="pt-2">
            <a
              href="#/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-[#FAFAFA] font-mono text-xs cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'en' ? 'Return to Login' : 'লগইনে ফিরে যান'}</span>
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reset-email"
              className="block text-xs font-mono text-[#A3A3A3] font-medium mb-1.5"
            >
              {lang === 'en' ? 'Registered Email Address' : 'নিবন্ধিত ইমেইল ঠিকানা'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reset-email"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <>
                <span>{lang === 'en' ? 'Send Password Reset Link' : 'রিসেট লিঙ্ক পাঠান'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-3 border-t border-[#262626] text-center">
            <a
              href="#/login"
              className="text-[#737373] hover:text-[#FAFAFA] text-xs font-mono inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Back to Sign In' : 'লগইনে ফিরে যান'}</span>
            </a>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
