import React from 'react';
import type { Language } from '../../types';

interface AppFooterProps {
  language: Language;
  userName?: string;
  onOpenHowItWorks?: () => void;
  onOpenLogin?: () => void;
}

export const AGRIORBIT_TAGLINE = 'NASA observes. AgriOrbit explains. Farmers decide.';

export const AppFooter: React.FC<AppFooterProps> = ({
  language,
  userName,
}) => (
  <footer className="mt-auto border-t border-white/10 bg-[#050B14] py-10 px-4 sm:px-6 lg:px-8 text-xs text-[#8FA3B8] font-editorial">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
        <span className="font-display font-bold text-white text-base tracking-tight">AGRIORBIT</span>
        <span className="text-[#8FA3B8]/50 hidden sm:inline">|</span>
        <span className="text-[11px] font-mono">
          NASA Earth Observations for Bangladesh Agriculture
        </span>
        <span className="text-[#8FA3B8]/50 hidden sm:inline">|</span>
        <span className="text-[11px]">Team: Bay of Orbits</span>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono">
        {userName && (
          <span className="text-slate-400 hidden lg:inline mr-2">
            {language === 'en' ? 'Farmer:' : 'কৃষক:'} <strong className="text-white">{userName}</strong> ·
          </span>
        )}
        <a href="#/privacy" className="hover:text-[#00E5FF] transition-colors">
          {language === 'en' ? 'Privacy Policy' : 'গোপনীয়তা নীতি'}
        </a>
        <span className="text-white/20">·</span>
        <a href="#/terms" className="hover:text-[#B8FF3D] transition-colors">
          {language === 'en' ? 'Terms & Conditions' : 'শর্তাবলী'}
        </a>
        <span className="text-white/20">·</span>
        <a href="#top" className="hover:text-white transition-colors">
          {language === 'en' ? 'Back to top ↑' : 'উপরে যান ↑'}
        </a>
      </div>
    </div>
  </footer>
);
