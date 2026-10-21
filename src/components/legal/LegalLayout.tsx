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
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col font-editorial selection:bg-[#B8FF3D]/30 selection:text-[#B8FF3D]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050B14]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>{isBn ? 'হোমে ফিরুন' : 'Back to Home'}</span>
            </a>
            <BrandLogo />
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switch */}
            <button
              onClick={() => setLang(isBn ? 'en' : 'bn')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Toggle English / বাংলা"
            >
              <Globe className="w-3.5 h-3.5 text-[#B8FF3D]" />
              <span>{isBn ? 'English' : 'বাংলা'}</span>
            </button>

            <a
              href="#/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#B8FF3D] hover:bg-[#a6ec2f] text-black font-mono font-bold text-xs transition-all shadow-md shadow-[#B8FF3D]/20"
            >
              <span>{isBn ? 'মাঠ বিশ্লেষণ' : 'Analyze Field'}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Document Switcher Tabs */}
        <div className="flex items-center gap-3 p-1 rounded-2xl bg-[#0B1626] border border-white/10 w-fit mb-8 text-xs font-mono">
          <a
            href="#/privacy"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeDoc === 'privacy'
                ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isBn ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</span>
          </a>

          <a
            href="#/terms"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeDoc === 'terms'
                ? 'bg-[#B8FF3D]/15 text-[#B8FF3D] border border-[#B8FF3D]/30 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isBn ? 'শর্তাবলী ও নিয়মাবলী' : 'Terms & Conditions'}</span>
          </a>
        </div>

        {/* Hero Header */}
        <div className="mb-10 pb-8 border-b border-white/10">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-[#00E5FF] mb-3">
            <span>NASA Space Apps 2026</span>
            <span className="text-white/30">·</span>
            <span>{lastUpdated}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            {isBn ? titleBn : titleEn}
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            {isBn ? subtitleBn : subtitleEn}
          </p>
        </div>

        {/* Document Content Card */}
        <div className="bg-[#0B1626]/80 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 text-sm text-slate-300 leading-relaxed">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#07101D] py-8 text-center text-xs font-mono text-slate-400">
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

          <p className="text-slate-400">
            © 2026 Team Bay of Orbits · NASA Earth Observations for Bangladesh Agriculture
          </p>
        </div>
      </footer>
    </div>
  );
};
