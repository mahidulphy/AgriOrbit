import React, { type ReactNode } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Wordmark } from '../ui/ui';
import { LanguageToggle } from '../dashboard/LanguageToggle';
import { useLang } from '../../lang';
import { useAuth } from '../../contexts/AuthContext';
import { goHome } from '../../lib/nav';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  error?: string | null;
  success?: string | null;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  error,
  success,
}) => {
  const { lang, setLang } = useLang();
  const { isConfigured, setAsGuest } = useAuth();

  const handleContinueGuest = () => {
    setAsGuest();
    window.location.hash = '#/analyze/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col justify-between relative overflow-hidden font-editorial selection:bg-[#B8FF3D]/30 selection:text-[#B8FF3D]">
      {/* Background Atmosphere */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00E5FF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-[#B8FF3D]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 px-6 py-5 flex items-center justify-between max-w-7xl w-full mx-auto">
        <button
          onClick={goHome}
          className="flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#00E5FF]" />
          <span>{lang === 'en' ? 'Back to AgriOrbit' : 'মূল পাতায় ফিরে যান'}</span>
        </button>

        <div className="flex items-center gap-4">
          <LanguageToggle language={lang} onLanguageChange={setLang} size="sm" showIcon={false} />
        </div>
      </header>

      {/* Main Authentication Card Workspace */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-3">
              <Wordmark />
            </div>
            <span className="text-[11px] font-mono text-[#00E5FF] uppercase font-bold tracking-widest block mb-2">
              {lang === 'en'
                ? 'NASA Earth Observations × Bangladesh Agriculture'
                : 'নাসা উপগ্রহ পর্যবেক্ষণ × বাংলাদেশ কৃষি'}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-sm">
              {subtitle}
            </p>
          </div>

          {/* Unconfigured Notice (if environment credentials are not yet set) */}
          {!isConfigured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lang === 'en' ? 'Supabase Credentials Pending' : 'সুভাব্যাস কনফিগারেশন বাকি'}</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                {lang === 'en'
                  ? 'To connect live Google OAuth & email auth, add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.'
                  : 'লাইভ গুগল ও ইমেইল অথেনটিকেশন চালু করতে .env.local ফাইলে VITE_SUPABASE_URL এবং VITE_SUPABASE_ANON_KEY যুক্ত করুন।'}
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleContinueGuest}
                  className="font-mono text-xs font-bold text-[#B8FF3D] underline cursor-pointer hover:text-white"
                >
                  {lang === 'en' ? 'Explore AgriOrbit as Guest →' : 'গেস্ট হিসেবে এখনই অ্যাপ দেখুন →'}
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-2xl bg-[#FF5C5C]/15 border border-[#FF5C5C]/40 text-[#FF5C5C] text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div
              role="status"
              className="mb-6 p-4 rounded-2xl bg-[#B8FF3D]/15 border border-[#B8FF3D]/40 text-[#B8FF3D] text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <div className="w-2 h-2 rounded-full bg-[#B8FF3D] shrink-0 mt-1.5" />
              <p className="leading-relaxed text-slate-200">{success}</p>
            </div>
          )}

          {/* Card Surface */}
          <div className="bg-[#0B1626] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-xs text-slate-400 font-mono space-y-1">
        <div className="flex items-center justify-center gap-3">
          <a href="#/privacy" className="hover:text-[#00E5FF] transition-colors underline underline-offset-4">
            {lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
          </a>
          <span>·</span>
          <a href="#/terms" className="hover:text-[#B8FF3D] transition-colors underline underline-offset-4">
            {lang === 'bn' ? 'শর্তাবলী' : 'Terms & Conditions'}
          </a>
        </div>
        <p className="text-[11px] text-slate-400">AgriOrbit · NASA Space Apps Challenge 2026</p>
      </footer>
    </div>
  );
};
