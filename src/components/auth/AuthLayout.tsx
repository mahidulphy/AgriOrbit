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
    window.location.hash = '#/dashboard';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] flex flex-col justify-between relative selection:bg-[#22C55E] selection:text-black">
      {/* Top Header Bar */}
      <header className="relative z-20 px-6 py-5 flex items-center justify-between max-w-6xl w-full mx-auto">
        <button
          onClick={goHome}
          className="flex items-center gap-2 text-xs font-mono text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
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
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4">
              <Wordmark />
            </div>
            <h1 className="font-display text-2xl font-semibold text-[#FAFAFA] tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-[#737373] mt-1.5 max-w-sm">
              {subtitle}
            </p>
          </div>

          {/* Unconfigured Notice */}
          {!isConfigured && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-xs space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lang === 'en' ? 'Supabase Credentials Pending' : 'ডাটাবেজ সংযোগ বাকি'}</span>
              </div>
              <p className="leading-relaxed text-[#A3A3A3]">
                {lang === 'en'
                  ? 'To connect live Google OAuth & email auth, add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.'
                  : 'লাইভ গুগল ও ইমেইল অথেনটিকেশন চালু করতে .env.local ফাইলে VITE_SUPABASE_URL এবং VITE_SUPABASE_ANON_KEY যুক্ত করুন।'}
              </p>
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={handleContinueGuest}
                  className="font-mono text-xs font-medium text-[#FAFAFA] underline cursor-pointer hover:text-[#22C55E]"
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
              className="mb-5 p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs flex items-start gap-2.5 animate-fadeIn"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0 mt-1.5" />
              <p className="leading-relaxed text-[#FAFAFA]">{success}</p>
            </div>
          )}

          {/* Card Surface */}
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 sm:p-7 shadow-none">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-4 text-center text-xs text-[#737373] font-mono space-y-1">
        <div className="flex items-center justify-center gap-3">
          <a href="#/privacy" className="hover:text-[#FAFAFA] transition-colors underline underline-offset-4">
            {lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
          </a>
          <span>·</span>
          <a href="#/terms" className="hover:text-[#FAFAFA] transition-colors underline underline-offset-4">
            {lang === 'bn' ? 'শর্তাবলী' : 'Terms & Conditions'}
          </a>
        </div>
        <p className="text-[11px] text-[#737373]">AgriOrbit</p>
      </footer>
    </div>
  );
};
