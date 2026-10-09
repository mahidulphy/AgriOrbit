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
  onOpenHowItWorks,
  onOpenLogin,
}) => (
  <footer className="mt-auto border-t border-white/10 bg-[#050B14] py-12 px-4 sm:px-6 lg:px-8 text-xs text-[#8FA3B8] font-editorial">
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

      {userName ? (
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#8FA3B8]">
          <span>
            {language === 'en' ? 'Active Farmer:' : 'সক্রিয় কৃষক:'} <strong className="text-white">{userName}</strong>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-6 text-xs">
          {onOpenHowItWorks && (
            <button onClick={onOpenHowItWorks} className="hover:text-white transition-colors cursor-pointer">
              {language === 'en' ? 'How It Works' : 'এটি কীভাবে কাজ করে'}
            </button>
          )}
          {onOpenLogin && (
            <button onClick={onOpenLogin} className="hover:text-white transition-colors cursor-pointer">
              {language === 'en' ? 'Sign In' : 'লগইন'}
            </button>
          )}
          <a href="#top" className="hover:text-[#B8FF3D] transition-colors">
            {language === 'en' ? 'Back to top ↑' : 'উপরে যান ↑'}
          </a>
        </div>
      )}
    </div>
  </footer>
);
