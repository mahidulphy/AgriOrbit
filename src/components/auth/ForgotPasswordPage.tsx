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
          <div className="w-12 h-12 rounded-full bg-[#00E5FF]/20 border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-lg text-white">
            {lang === 'en' ? 'Reset Link Dispatched' : 'লিঙ্ক পাঠানো হয়েছে'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            {lang === 'en'
              ? `We've sent a password reset email to ${email}. Follow the link in the message to select a new password.`
              : `${email} ঠিকানায় বার্তা পাঠানো হয়েছে। নতুন পাসওয়ার্ড সেট করতে লিঙ্কে ক্লিক করুন।`}
          </p>
          <div className="pt-2">
            <a
              href="#/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-mono text-xs cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#00E5FF]" />
              <span>{lang === 'en' ? 'Return to Login' : 'লগইনে ফিরে যান'}</span>
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="reset-email"
              className="block text-xs font-mono text-slate-300 font-medium mb-1.5"
            >
              {lang === 'en' ? 'Registered Email Address' : 'নিবন্ধিত ইমেইল ঠিকানা'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="reset-email"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#050B14] font-bold text-sm transition-all duration-200 shadow-lg shadow-[#00E5FF]/20 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#050B14]" />
            ) : (
              <>
                <span>{lang === 'en' ? 'Send Reset Link' : 'রিসেট লিঙ্ক পাঠান'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <a
              href="#/login"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>{lang === 'en' ? 'Remember password? Back to Login' : 'পাসওয়ার্ড মনে আছে? ফিরে যান'}</span>
            </a>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
