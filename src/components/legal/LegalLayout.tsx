import React from 'react';
import { ArrowLeft, Shield, FileText, Globe } from 'lucide-react';
import { useLang } from '../../lang';
import { BrandLogo } from '../common/BrandLogo';

interface LegalLayoutProps {
  activeDoc: 'privacy' | 'terms';
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  activeDoc,
  titleEn,
  titleBn,
  subtitleEn,
  subtitleBn,
  lastUpdated,
  children,
}) => {
  const { lang, setLang } = useLang();
  const isBn = lang === 'bn';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-editorial selection:bg-[#22C55E]/20 selection:text-[#22C55E]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#262626] text-xs font-mono text-[#A3A3A3] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#FAFAFA]" />
              <span>{isBn ? 'হোমে ফিরুন' : 'Back to Home'}</span>
            </a>
            <BrandLogo />
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <button
              onClick={() => setLang(isBn ? 'en' : 'bn')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#262626] text-xs font-mono text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
              title="Toggle English / বাংলা"
            >
              <Globe className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{isBn ? 'English' : 'বাংলা'}</span>
            </button>

            <a
              href="#/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-black font-mono font-semibold text-xs transition-colors rounded-lg"
            >
              <span>{isBn ? 'আমার জমি যাচাই' : 'Analyze Field'}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Document Switcher Tabs */}
        <div className="flex items-center gap-3 p-1 rounded-lg bg-[#141414] border border-[#262626] w-fit mb-8 text-xs font-mono">
          <a
            href="#/privacy"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeDoc === 'privacy'
                ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 font-semibold'
                : 'text-[#737373] hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</span>
          </a>

          <a
            href="#/terms"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeDoc === 'terms'
                ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 font-semibold'
                : 'text-[#737373] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isBn ? 'শর্তাবলী ও নিয়মাবলী' : 'Terms & Conditions'}</span>
          </a>
        </div>

        {/* Hero Header */}
        <div className="mb-10 pb-8 border-b border-[#262626]">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-[#262626] text-[11px] font-mono text-[#FAFAFA] mb-3">
            <span>NASA Space Apps 2026</span>
            <span className="text-white/30">·</span>
            <span>{lastUpdated}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            {isBn ? titleBn : titleEn}
          </h1>
          <p className="text-sm sm:text-base text-[#737373] leading-relaxed max-w-2xl">
            {isBn ? subtitleBn : subtitleEn}
          </p>
        </div>

        {/* Document Content Card */}
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 sm:p-10 space-y-8 text-sm text-[#A3A3A3] leading-relaxed">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262626] bg-[#0A0A0A] py-8 text-center text-xs font-mono text-[#737373]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-white font-bold">AgriOrbit</span>
            <span>·</span>
            <a href="#/privacy" className="hover:text-white transition-colors">
              {isBn ? 'গোপনীয়তা' : 'Privacy'}
            </a>
            <span>·</span>
            <a href="#/terms" className="hover:text-white transition-colors">
              {isBn ? 'শর্তাবলী' : 'Terms'}
            </a>
          </div>

          <p className="text-[#737373]">
            © 2026 Team Bay of Orbits · NASA Earth Observations for Bangladesh Agriculture
          </p>
        </div>
      </footer>
    </div>
  );
};
